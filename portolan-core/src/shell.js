/**
 * Composition root + browser shell for the Portolan Part-1a clean stack.
 *
 * This is the SINGLE place where concrete adapters are constructed and wired
 * into the use-cases. It owns the browser entry point: it loads the atlas,
 * renders views (annotated overview, behaviour map, dossier) by calling the
 * clean use-cases, and respects the DOM contract (data-portolan-* attributes)
 * so the headless render check and any harness can assert on the output.
 *
 * The shell itself is presentation orchestration — it contains NO domain
 * logic. Graph model building, layout, region profiles, dossier resolution,
 * confidence rules all live in domain/use-cases. The shell decides WHICH view
 * to render and routes the result of a use-case into DOM/SVG.
 *
 * Layer: this sits at the adapters boundary (it constructs adapters and uses
 * the global document/window). It is intentionally a flat orchestrator, not a
 * layered module — the composition root is allowed to see everything.
 */
'use strict';

const { openBehaviourMap } = require('./use-cases/open-behaviour-map');
const { drillToDossier } = require('./use-cases/drill-to-dossier');
const { drillToRegion } = require('./use-cases/drill-to-region');
const { queryAtlas } = require('./use-cases/query-atlas');
const { triangulate, canTriangulate } = require('./use-cases/triangulate');
const { getHypotheses } = require('./use-cases/add-hypothesis');
const { createThemeProvider } = require('./adapters/theme-tokens');
const { createHashNavigator } = require('./adapters/hash-navigator');
const { createSvgGraphRenderer } = require('./adapters/svg-graph-renderer');
const { FAMILY_META } = require('./domain/family-lens');
const { buildRegionProfile } = require('./domain/region-profile');

const FAMILY_ORDER = ['data-systems', 'compute-processing', 'platform-governance', 'packaging-runtime', 'coordination-community', 'integration-services', 'unknown'];
const FAMILY_LABELS = {
  'data-systems': 'Data systems',
  'compute-processing': 'Compute / processing',
  'platform-governance': 'Platform / governance',
  'packaging-runtime': 'Packaging / runtime',
  'coordination-community': 'Coordination / community',
  'integration-services': 'Integration / services',
  unknown: 'Unclassified',
};

/**
 * Create the Portolan app shell, wired to a DOM root element.
 *
 * @param {object} opts - { root: HTMLElement, atlas: object, document?: Document }
 *   `atlas` is the pre-loaded system-map (the shell does not do its own I/O —
 *   the export tool inlines it; a live app would inject an atlas-store adapter).
 * @returns {object} { render(), destroy() }
 */
function createPortolanShell(opts) {
  const root = opts.root;
  const doc = opts.document || (typeof document !== 'undefined' ? document : null);
  const atlas = opts.atlas;
  const theme = createThemeProvider();
  const navigator = createHashNavigator();
  const triangulationEnabled = false; // overlay off by default; admiral toggles

  if (!doc) throw new Error('createPortolanShell requires a document (inject for tests)');
  if (!atlas) throw new Error('createPortolanShell requires a pre-loaded atlas');

  // ---- DOM helpers (presentation only) ----
  function el(tag, attrs) {
    const node = doc.createElement(tag);
    const children = [];
    for (let i = 2; i < arguments.length; i++) children.push(arguments[i]);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') node.className = v;
        else node.setAttribute(k, v);
      }
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      node.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c);
    }
    return node;
  }
  function text(s) { return doc.createTextNode(String(s == null ? '' : s)); }

  // builds a clickable link carrying the DOM contract attributes
  function routeLink(label, route, o) {
    o = o || {};
    const href = route.startsWith('#') ? route : `#${route}`;
    const a = el('a', { class: o.class || 'route-link', href }, text(label));
    a.setAttribute('data-portolan-route', route);
    if (o.id) a.setAttribute('data-portolan-id', o.id);
    if (o.kind) a.setAttribute('data-portolan-kind', o.kind);
    if (o.clickable === false) { a.setAttribute('data-portolan-clickable', 'false'); a.className += ' is-disabled'; }
    else a.setAttribute('data-portolan-clickable', 'true');
    a.addEventListener('click', (ev) => { ev.preventDefault(); navigator.route(route.replace(/^#/, '')); });
    return a;
  }

  // ---- view dispatch ----
  function currentView() {
    const frag = navigator.current();
    const head = frag.split('/')[0] || 'overview';
    return head;
  }

  function render() {
    root.innerHTML = '';
    root.appendChild(renderTopbar());
    const main = el('main', { class: 'workspace' });
    const view = currentView();
    if (view === 'overview') renderOverview(main);
    else if (view === 'map') renderMap(main);
    else if (view === 'dossier') renderDossierView(main);
    else if (view === 'components') renderComponentsList(main);
    else renderOverview(main); // fallback
    root.appendChild(main);
  }

  function renderTopbar() {
    const topbar = el('header', { class: 'topbar' });
    topbar.appendChild(el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, text('Portolan'))));
    const nav = el('nav', { class: 'nav' });
    for (const v of ['overview', 'map', 'components']) {
      const cls = currentView() === v ? 'nav-item is-active' : 'nav-item';
      const a = el('a', { class: cls, href: `#/${v}` }, text(v.charAt(0).toUpperCase() + v.slice(1)));
      a.addEventListener('click', (ev) => { ev.preventDefault(); navigator.route('/' + v); });
      nav.appendChild(a);
    }
    topbar.appendChild(nav);
    return topbar;
  }

  // ---- Overview: annotated summary (NOT an undifferentiated graph) ----
  function renderOverview(main) {
    const t = (atlas.target) || {};
    const comps = (atlas.objects && atlas.objects.components) || [];
    const rels = (atlas.objects && atlas.objects.relationships) || [];
    const surfaces = (atlas.objects && atlas.objects.surfaces) || [];
    const findings = (atlas.objects && atlas.objects.findings) || [];
    const unknowns = (atlas.objects && atlas.objects.unknowns) || [];
    const fams = ((atlas.c4 && atlas.c4.families) || []);
    const panel = el('section', { class: 'panel overview-panel' });

    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('PORTOLAN ATLAS')));
    panel.appendChild(el('h1', { class: 'panel-title hero-title' }, text(t.display_name || 'Portolan target')));
    if (t.root) panel.appendChild(el('p', { class: 'muted target-root' }, text(t.root)));
    panel.appendChild(el('p', { class: 'hero-read' },
      text(`${comps.length} units across ${fams.length} families, ${rels.length} declared dependencies. `),
      routeLink('Open the behaviour map →', '/map', { class: 'cta-primary' })));

    // metric strip
    const grid = el('div', { class: 'hero-grid' });
    grid.appendChild(metricCard('Units', String(comps.length), 'Landscape units'));
    grid.appendChild(metricCard('Relationships', String(rels.length), 'Declared dependencies'));
    grid.appendChild(metricCard('Surfaces', String(surfaces.length), 'Docs, CI, trackers'));
    grid.appendChild(metricCard('Findings', String(findings.length), 'Risks and signals'));
    grid.appendChild(metricCard('Unknowns', String(unknowns.length), 'Honest gaps'));
    panel.appendChild(grid);

    // family distribution bar
    panel.appendChild(el('div', { class: 'section-kicker' }, text('LANDSCAPE COMPOSITION BY FAMILY')));
    const distBar = el('div', { class: 'dist-bar', role: 'img', 'aria-label': 'Unit distribution by family' });
    const distLegend = el('div', { class: 'dist-legend' });
    for (const f of fams) {
      const count = (f.component_ids || []).length;
      const seg = el('div', { class: 'dist-seg', style: `flex-grow:${count}`, title: `${f.display_name}: ${count}` });
      distBar.appendChild(seg);
      distLegend.appendChild(el('span', { class: 'dist-leg-item' }, text(`${f.display_name} · ${count}`)));
    }
    panel.appendChild(distBar);
    panel.appendChild(distLegend);

    // most connected units
    panel.appendChild(el('div', { class: 'section-kicker' }, text('MOST CONNECTED UNITS')));
    const ranked = [...comps].sort((a, b) => ((b.relationship_ids || []).length) - ((a.relationship_ids || []).length)).slice(0, 8);
    const compGrid = el('div', { class: 'route-button-grid' });
    for (const c of ranked) compGrid.appendChild(unitCard(c));
    panel.appendChild(compGrid);

    // Triangulation overlay panel (charter 08 Part-1b)
    panel.appendChild(renderTriangulationPanel());

    main.appendChild(panel);
  }

  function renderTriangulationPanel() {
    const wrap = el('div', { class: 'triangulation-panel' });
    wrap.appendChild(el('div', { class: 'section-kicker' }, text('TRIANGULATION')));
    if (!canTriangulate(atlas)) {
      // Honest absence: behaviour-only atlas
      wrap.appendChild(el('p', { class: 'muted triangulation-absent' },
        text('No intentions or representations ingested — this is a behaviour-only atlas. Triangulation is unavailable; this is a valid complete result.')));
      return wrap;
    }
    const result = triangulate(atlas);
    if (result.conflicts.length === 0) {
      wrap.appendChild(el('p', { class: 'muted' },
        text(`${getHypotheses(atlas).length} agent hypotheses present; no triangulation conflicts detected. The three truths agree.`)));
      return wrap;
    }
    wrap.appendChild(el('p', { class: 'triangulation-summary' },
      text(`${result.conflicts.length} triangulation conflict(s) found across ${Object.keys(result.byUnit).length} unit(s). Where intentions/representations disagree with behaviour, the units are highlighted below.`)));
    const conflictList = el('div', { class: 'route-button-grid' });
    for (const unitId of Object.keys(result.byUnit)) {
      const unitConflicts = result.byUnit[unitId];
      const comp = (atlas.objects.components || []).find(c => c.id === unitId);
      const label = comp ? (comp.display_name || comp.id) : unitId;
      const card = el('div', { class: 'card triangulation-conflict-card' });
      card.appendChild(routeLink(label, comp ? comp.route : '#/overview', { id: unitId, kind: 'component', class: 'card-title' }));
      card.appendChild(el('span', { class: 'badge badge-conflict' }, text(unitConflicts.length + ' conflict' + (unitConflicts.length === 1 ? '' : 's'))));
      for (const c of unitConflicts.slice(0, 3)) {
        card.appendChild(el('p', { class: 'muted card-reason' }, text(c.claim + ' (' + c.confidence + ')')));
      }
      conflictList.appendChild(card);
    }
    wrap.appendChild(conflictList);
    return wrap;
  }

  function metricCard(label, value, sub) {
    return el('div', { class: 'metric-card' },
      el('div', { class: 'metric-label' }, text(label)),
      el('div', { class: 'metric-value' }, text(value)),
      el('div', { class: 'metric-sub muted' }, text(sub || '')));
  }

  function unitCard(c) {
    const card = el('div', { class: 'card unit-card' });
    card.appendChild(routeLink(c.display_name || c.id, c.route, { id: c.id, kind: 'component', class: 'card-title' }));
    const meta = el('div', { class: 'card-meta' });
    const fam = c.c4_family || 'unknown';
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(FAMILY_LABELS[fam] || fam)));
    const relCount = (c.relationship_ids || []).length;
    if (relCount > 0) meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(relCount + ' rel')));
    card.appendChild(meta);
    return card;
  }

  // ---- Map: behaviour map via clean use-case + SVG renderer adapter ----
  function renderMap(main) {
    const panel = el('section', { class: 'panel map-panel' });
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Behaviour map')));
    panel.appendChild(el('p', { class: 'muted map-intro' },
      text('Each node is a landscape unit; lines are declared dependencies. Size shows connectivity, colour shows family. Click a unit to open its dossier.')));

    // legend
    const legend = el('div', { class: 'graph-legend' });
    for (const fam of FAMILY_ORDER) {
      const col = theme.resolve().families[fam] || theme.resolve().families.unknown;
      legend.appendChild(el('div', { class: 'legend-item' },
        el('span', { class: 'legend-swatch', style: `background:${col.main}` }),
        el('span', { class: 'legend-label' }, text(FAMILY_LABELS[fam] || fam))));
    }
    panel.appendChild(legend);

    // graph model via clean use-case
    const model = openBehaviourMap(atlas);
    const canvas = el('div', { class: 'map-canvas graph-stage', 'data-testid': 'portolan-map' });
    panel.appendChild(canvas);

    // SVG renderer adapter (constructed against this canvas)
    const renderer = createSvgGraphRenderer(canvas, { document: doc });
    renderer.render(model, theme.resolve());
    // wire abstract events -> navigation
    renderer.onEvent((ev) => {
      if (ev.type === 'node-click') {
        const node = model.nodes.find(n => n.id === ev.id);
        if (node && node.route) navigator.route(node.route.replace(/^#/, ''));
      } else if (ev.type === 'edge-click') {
        const edge = model.edges.find(e => e.id === ev.id);
        if (edge && edge.route) navigator.route(edge.route.replace(/^#/, ''));
      }
    });

    main.appendChild(panel);
    // store renderer for destroy
    panel._renderer = renderer;
  }

  // ---- Dossier: clean use-case resolution ----
  function renderDossierView(main) {
    const frag = navigator.current();
    const parts = frag.split('/').filter(Boolean);
    // expect /dossier/<kind>/<id>
    let kind = '', id = '';
    if (parts[0] === 'dossier' && parts[1] && parts[2]) {
      kind = parts[1];
      id = parts.slice(2).join('/');
    }
    const data = drillToDossier(atlas, id, kind);
    const panel = el('section', { class: 'panel dossier-panel' });
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Object not found')));
      panel.appendChild(el('p', { class: 'muted' }, text(`No object with id "${id}".`)));
      panel.appendChild(routeLink('← Back', '/overview', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    panel.appendChild(el('h1', { class: 'panel-title' }, text(data.object.display_name || data.object.label || data.object.id)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-quiet' }, text(`kind: ${data.kind}`))));
    const fam = data.object.c4_family;
    if (fam) panel.appendChild(el('p', { class: 'prose' }, text(`C4 family: ${FAMILY_LABELS[fam] || fam}`)));
    if (data.object.why_present) panel.appendChild(dossierSection('Why present', data.object.why_present));
    if (data.object.role) panel.appendChild(dossierSection('Role', data.object.role));

    // region profile link if this is a family
    if (kind === 'c4-family' && data.object.component_ids) {
      panel.appendChild(dossierSection('Region profile', `${data.object.component_ids.length} members`));
    }

    // related objects
    if (data.related.surfaces.length) panel.appendChild(refList('Surfaces', data.related.surfaces));
    if (data.related.relationships.length) panel.appendChild(refList('Relationships', data.related.relationships));
    if (data.related.findings.length) panel.appendChild(refList('Findings', data.related.findings));
    if (data.related.unknowns.length) panel.appendChild(refList('Unknowns', data.related.unknowns));

    panel.appendChild(routeLink('← Back', '/overview', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function dossierSection(label, body) {
    return el('div', { class: 'dossier-section' },
      el('div', { class: 'section-kicker' }, text(label.toUpperCase())),
      el('p', { class: 'prose' }, text(body)));
  }
  function refList(label, items) {
    const sec = el('div', { class: 'ref-list' });
    sec.appendChild(el('div', { class: 'section-kicker' }, text(label.toUpperCase())));
    const grid = el('div', { class: 'route-button-grid' });
    for (const it of items) {
      const lbl = it.object.display_name || it.object.label || it.object.summary || it.object.id;
      grid.appendChild(routeLink(lbl, it.object.route, { id: it.object.id, kind: it.kind, class: 'chip' }));
    }
    sec.appendChild(grid);
    return sec;
  }

  // ---- Components list ----
  function renderComponentsList(main) {
    const comps = (atlas.objects && atlas.objects.components) || [];
    const panel = el('section', { class: 'panel components-panel' });
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Units')));
    panel.appendChild(el('p', { class: 'muted' }, text(`${comps.length} landscape units`)));
    const grid = el('div', { class: 'component-grid' });
    for (const c of comps) grid.appendChild(unitCard(c));
    panel.appendChild(grid);
    main.appendChild(panel);
  }

  // ---- lifecycle ----
  const offRoute = navigator.onRouteChange(() => render());

  return {
    render,
    destroy() {
      offRoute();
      // destroy any active graph renderer
      const panel = root.querySelector('.map-panel');
      if (panel && panel._renderer) panel._renderer.destroy();
    },
    // expose internals for the headless render check
    _internals: { theme, navigator, openBehaviourMap: () => openBehaviourMap(atlas) },
  };
}

module.exports = { createPortolanShell, FAMILY_LABELS };
