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
const { buildNavViewModel } = require('./domain/nav-atlas-viewmodel');
const { stageLabel } = require('./domain/atlas-reading');
const { openNavigationRoute } = require('./use-cases/open-navigation-route');
const { openCoverageSubject } = require('./use-cases/open-coverage-subject');
const { openFinding } = require('./use-cases/open-finding');
const { openUnknownProbe } = require('./use-cases/open-unknown-probe');
const { openReceipt } = require('./use-cases/open-receipt');

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
  const navAtlas = opts.navAtlas || null;
  const theme = createThemeProvider();
  const navigator = createHashNavigator();
  const triangulationEnabled = false; // overlay off by default; admiral toggles

  if (!doc) throw new Error('createPortolanShell requires a document (inject for tests)');
  if (!atlas) throw new Error('createPortolanShell requires a pre-loaded atlas');

  // Build the navigation view-model once (routes/coverage/findings/probes/receipt).
  const navVm = navAtlas ? buildNavViewModel(navAtlas) : null;

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
  // When a nav-atlas is present the FIRST screen is the system walkthrough, not
  // the graph (captain-atlas 15 §1). The graph is demoted to a secondary "Fleet"
  // map (§9). `currentView()` maps the bare '/overview' hash to 'walkthrough'
  // when navVm exists so the default route is the walkthrough.
  function currentView() {
    const frag = navigator.current();
    const head = frag.split('/')[0] || 'overview';
    if (head === 'overview' && navVm) return 'walkthrough';
    if (head === 'map') return 'fleet';
    return head;
  }

  function render() {
    root.innerHTML = '';
    root.appendChild(renderTopbar());
    const main = el('main', { class: 'workspace' });
    const frag = navigator.current();
    // nav-atlas single-item dossiers: /route/<id>, /coverage/<id>, /finding/<id>,
    // /probe/<id> (singular). Checked first because they share the prefix with
    // nothing else and need the full id (which may contain '/'). decode
    // defensively — a malformed percent-encoding in a hand-edited hash must not
    // crash render().
    const decode = (s) => { try { return decodeURIComponent(s); } catch { return s; } };
    if (frag.startsWith('route/')) renderRouteDossier(main, decode(frag.slice('route/'.length)));
    else if (frag.startsWith('coverage/')) renderCoverageDossier(main, decode(frag.slice('coverage/'.length)));
    else if (frag.startsWith('finding/')) renderFindingDossier(main, decode(frag.slice('finding/'.length)));
    else if (frag.startsWith('probe/')) renderUnknownProbeDossier(main, decode(frag.slice('probe/'.length)));
    else {
      const view = currentView();
      if (view === 'walkthrough') renderWalkthrough(main);
      else if (view === 'overview') renderOverview(main);
      else if (view === 'fleet') renderMap(main);
      else if (view === 'map') renderMap(main);
      else if (view === 'dossier') renderDossierView(main);
      else if (view === 'components') renderComponentsList(main);
      else if (view === 'routes') renderRoutesView(main);
      else if (view === 'coverage') renderCoverageView(main);
      else if (view === 'findings') renderFindingsView(main);
      else if (view === 'unknowns') renderUnknownsView(main);
      else if (view === 'receipt') renderReceiptView(main);
      else if (navVm) renderWalkthrough(main); // fallback to walkthrough when nav exists
      else renderOverview(main); // fallback
    }
    root.appendChild(main);
  }

  function renderTopbar() {
    const topbar = el('header', { class: 'topbar' });
    topbar.appendChild(el('div', { class: 'brand' }, el('span', { class: 'brand-mark' }, text('Portolan'))));
    const nav = el('nav', { class: 'nav' });
    // When a nav-atlas exists, the primary tabs are reading surfaces; the graph
    // is reframed as a secondary "Fleet" map (§9). It carries a stable marker so
    // the harness can prove it is not the default.
    let tabs;
    if (navVm) {
      tabs = [
        { id: 'overview', label: 'Walkthrough', view: 'walkthrough' },
        { id: 'routes', label: 'Journeys', view: 'routes' },
        { id: 'coverage', label: 'Coverage', view: 'coverage' },
        { id: 'findings', label: 'Findings', view: 'findings' },
        { id: 'unknowns', label: 'Probes', view: 'unknowns' },
        { id: 'receipt', label: 'Receipt', view: 'receipt' },
        { id: 'map', label: 'Fleet', view: 'fleet', secondary: true },
      ];
    } else {
      tabs = [
        { id: 'overview', label: 'Overview', view: 'overview' },
        { id: 'map', label: 'Map', view: 'map' },
        { id: 'components', label: 'Components', view: 'components' },
      ];
    }
    for (const t of tabs) {
      const cls = (currentView() === t.view ? 'nav-item is-active' : 'nav-item') + (t.secondary ? ' nav-item-secondary' : '');
      const a = el('a', { class: cls, href: `#/${t.id}` }, text(t.label));
      a.setAttribute('data-portolan-nav', t.view);
      if (t.secondary) a.setAttribute('data-portolan-secondary', 'fleet');
      a.addEventListener('click', (ev) => { ev.preventDefault(); navigator.route('/' + t.id); });
      nav.appendChild(a);
    }
    topbar.appendChild(nav);
    return topbar;
  }

  // ---- Walkthrough: the system-reading first screen (captain-atlas 15 §1) ----
  // This is what /portolan:map opens to when a nav-atlas is present. It shows
  // target identity, a "what this system is" paragraph, 3-5 named journeys, the
  // top risks, the top next probes, a next-expedition section, agent handoff,
  // and a SECONDARY affordance to open the Fleet map. The graph is never the
  // default hero here. The panel carries data-portolan-view="walkthrough" so the
  // harness can prove the default screen is the walkthrough (not grep).
  function renderWalkthrough(main) {
    const t = (atlas.target) || {};
    const panel = el('section', { class: 'panel walkthrough-panel' });
    panel.setAttribute('data-portolan-view', 'walkthrough');

    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('PORTOLAN ATLAS · SYSTEM WALKTHROUGH')));
    panel.appendChild(el('h1', { class: 'panel-title hero-title' }, text(t.display_name || 'Portolan target')));
    if (t.root) panel.appendChild(el('p', { class: 'muted target-root' }, text(t.root)));

    // "What this system is" — synthesized from the journey catalogue so it
    // teaches meaning, not component counts.
    panel.appendChild(el('p', { class: 'hero-read walkthrough-summary' }, text(systemSummary())));

    // Fleet affordance is SECONDARY (§9): one quiet link, not the hero.
    const fleetLine = el('p', { class: 'muted fleet-affordance' });
    fleetLine.appendChild(text('Need the component/repository graph? '));
    fleetLine.appendChild(routeLink('Open the Fleet map →', '/map', { class: 'cta-secondary' }));
    panel.appendChild(fleetLine);

    // Named system journeys (§1, §2).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('SYSTEM JOURNEYS')));
    const journeyGrid = el('div', { class: 'journey-grid', 'data-portolan-kind': 'journeys' });
    for (const j of navVm.journeys) journeyGrid.appendChild(journeyCard(j));
    panel.appendChild(journeyGrid);

    // Top risks (§1, §6) — findings that explain system risk, not a flat list.
    if (navVm.topFindings.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('TOP RISKS')));
      const riskGrid = el('div', { class: 'journey-grid' });
      for (const f of navVm.topFindings) riskGrid.appendChild(riskCard(f));
      panel.appendChild(riskGrid);
    }

    // Top 3 next probes (§7) — a plan, not a passive list.
    if (navVm.topProbes.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('NEXT EXPEDITION · TOP PROBES')));
      const probeGrid = el('div', { class: 'journey-grid', 'data-portolan-kind': 'top-probes' });
      for (const p of navVm.topProbes) probeGrid.appendChild(probeCard(p));
      panel.appendChild(probeGrid);
    }

    // Agent handoff (§10).
    panel.appendChild(renderHandoffSection());

    main.appendChild(panel);
  }

  // One-paragraph "what this system is", derived from the journey catalogue so
  // it teaches the system, not the unit count. Falls back honestly when sparse.
  function systemSummary() {
    const journeys = navVm.journeys || [];
    if (!journeys.length) {
      return 'A navigation atlas is present but contains no system journeys yet. Open Coverage to see the mapped fleet.';
    }
    const routeJ = journeys.find(j => j.kind === 'route');
    const conf = journeys.find(j => j.kind === 'confidence_boundary');
    const cov = journeys.find(j => j.kind === 'fleet_coverage');
    const parts = [];
    if (routeJ) {
      parts.push(routeJ.journeySummary.split(/(?<=\.)\s/)[0]);
    }
    if (conf) {
      parts.push('Portolan can trace the static chain but cannot confirm anything builds, provisions, or runs.');
    }
    if (cov) {
      parts.push(cov.known + '.');
    }
    return parts.join(' ') || journeys[0].journeySummary;
  }

  // A journey card answers the six questions (§2): what / why / involved /
  // known / not-assessed / next. Teaches meaning; never restates route_family.
  function journeyCard(j) {
    const card = el('div', { class: 'card journey-card', 'data-portolan-kind': 'journey', 'data-portolan-id': j.journeyId });
    const head = el('div', { class: 'journey-head' });
    if (j.routeId) {
      head.appendChild(routeLink(j.title, `/route/${encodeURIComponent(j.routeId)}`, { id: j.journeyId, kind: 'journey', class: 'card-title journey-title' }));
    } else {
      head.appendChild(el('div', { class: 'card-title journey-title' }, text(j.title)));
    }
    const tags = el('div', { class: 'card-meta' });
    if (j.kind === 'confidence_boundary') tags.appendChild(el('span', { class: 'badge badge-runtime' }, text('confidence boundary')));
    else if (j.kind === 'fleet_coverage') tags.appendChild(el('span', { class: 'badge badge-quiet' }, text('fleet coverage')));
    else tags.appendChild(el('span', { class: 'badge badge-quality-medium' }, text('system journey')));
    head.appendChild(tags);
    card.appendChild(head);

    card.appendChild(el('p', { class: 'prose journey-summary' }, text(j.journeySummary)));
    card.appendChild(el('p', { class: 'muted journey-why' }, text('Why it matters: ' + j.whyItMatters)));

    const facts = el('dl', { class: 'journey-facts' });
    facts.appendChild(factRow('Known', j.known));
    facts.appendChild(factRow('Not assessed', j.notAssessed));
    if (j.involvedSubjects && j.involvedSubjects.length) facts.appendChild(factRow('Involved', j.involvedSubjects.slice(0, 4).join(', ')));
    if (j.topFindingTitles && j.topFindingTitles.length) facts.appendChild(factRow('Top risks', j.topFindingTitles.join(' · ')));
    card.appendChild(facts);

    const next = el('div', { class: 'journey-next' });
    next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Next expedition')));
    next.appendChild(el('span', { class: 'journey-next-text' }, text(j.nextStep)));
    card.appendChild(next);

    return card;
  }

  function factRow(term, detail) {
    const row = el('div', { class: 'fact-row' });
    row.appendChild(el('dt', { class: 'fact-term' }, text(term)));
    row.appendChild(el('dd', { class: 'fact-detail' }, text(detail)));
    return row;
  }

  // A finding rendered as a risk that explains system risk (§6): what / where /
  // why-care / evidence / next-check.
  function riskCard(f) {
    const card = el('div', { class: 'card risk-card', 'data-portolan-kind': 'finding', 'data-portolan-id': f.finding_id });
    card.appendChild(routeLink(f.title, `/finding/${encodeURIComponent(f.finding_id)}`, { id: f.finding_id, kind: 'finding', class: 'card-title' }));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-runtime' }, text(f.severity)));
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(f.finding_type)));
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(f.confidence)));
    card.appendChild(meta);
    if (f.summary) card.appendChild(el('p', { class: 'prose risk-summary' }, text(f.summary)));
    const why = el('p', { class: 'muted risk-why' });
    why.appendChild(text('Where it attaches: '));
    const where = (f.subject_ids && f.subject_ids.length ? f.subject_ids : (f.route_refs || []));
    why.appendChild(text(where.slice(0, 3).join(', ') || '—'));
    card.appendChild(why);
    // §6: "what evidence supports it?" — surface the evidence refs that back the
    // risk so the card answers the question, not just the where/why.
    if (f.evidence_refs && f.evidence_refs.length) {
      const ev = el('p', { class: 'muted risk-evidence' });
      ev.appendChild(text('Evidence: ' + f.evidence_refs.slice(0, 4).join(', ')));
      card.appendChild(ev);
    }
    if (f.next_raw_check) {
      const next = el('div', { class: 'journey-next' });
      next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Next check')));
      next.appendChild(el('span', { class: 'journey-next-text' }, text(f.next_raw_check)));
      card.appendChild(next);
    }
    return card;
  }

  // An unknown probe rendered as an expedition step (§7): what unknown / why /
  // permission class / next probe / expected outcome.
  function probeCard(p) {
    const card = el('div', { class: 'card probe-card', 'data-portolan-kind': 'probe', 'data-portolan-id': p.unknown_id });
    card.appendChild(routeLink(p.blocked_surface, `/probe/${encodeURIComponent(p.unknown_id)}`, { id: p.unknown_id, kind: 'probe', class: 'card-title' }));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-runtime' }, text(p.state)));
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('risk: ' + p.probe_risk)));
    card.appendChild(meta);
    card.appendChild(el('p', { class: 'muted probe-why' }, text('Why unknown: ' + p.why_unknown)));
    const next = el('div', { class: 'journey-next' });
    next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Next probe')));
    next.appendChild(el('span', { class: 'journey-next-text' }, text(p.next_probe)));
    card.appendChild(next);
    if (p.requires_permission && p.requires_permission.length) {
      card.appendChild(el('p', { class: 'muted probe-perms' }, text('Requires: ' + p.requires_permission.join(', '))));
    }
    return card;
  }

  // Agent handoff (§10): copyable query commands for a follow-up agent.
  function renderHandoffSection() {
    const sec = el('div', { class: 'handoff-section', 'data-portolan-kind': 'handoff' });
    sec.appendChild(el('div', { class: 'section-kicker' }, text('AGENT HANDOFF · NEXT EXPEDITION')));
    sec.appendChild(el('p', { class: 'muted' }, text('Copyable commands a follow-up agent can run against the navigation bundle to continue the expedition.')));
    const list = el('div', { class: 'handoff-list' });
    for (const q of navVm.handoff) {
      const row = el('div', { class: 'handoff-row' });
      row.appendChild(el('span', { class: 'handoff-label' }, text(q.label)));
      const code = el('code', { class: 'handoff-cmd', 'data-portolan-handoff': q.id }, text(q.command));
      row.appendChild(code);
      list.appendChild(row);
    }
    sec.appendChild(list);
    return sec;
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
    if (navVm) {
      grid.appendChild(metricCardLink('Routes', String(navVm.counts.routes), 'System routes', '/routes'));
      grid.appendChild(metricCardLink('Coverage', String(navVm.counts.coverage), 'Expected subjects', '/coverage'));
      grid.appendChild(metricCardLink('Atlas findings', String(navVm.counts.findings), 'Structural signals', '/findings'));
      grid.appendChild(metricCardLink('Probes', String(navVm.counts.probes), 'Unknown + next probe', '/unknowns'));
      grid.appendChild(metricCardLink('Receipt', navVm.receipt.machineStatus, 'Machine verdict', '/receipt'));
    }
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
  // metric card whose whole body navigates to a route (overview affordance).
  function metricCardLink(label, value, sub, route) {
    const card = el('div', { class: 'metric-card', style: 'cursor:pointer' });
    card.appendChild(el('div', { class: 'metric-label' }, text(label)));
    card.appendChild(el('div', { class: 'metric-value' }, text(String(value))));
    card.appendChild(el('div', { class: 'metric-sub muted' }, text(sub || '')));
    card.addEventListener('click', () => navigator.route(route.replace(/^\//, '')));
    return card;
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
  // When a nav-atlas is present this is the SECONDARY Fleet map (captain-atlas
  // 15 §9): one click away, reframed as Fleet, links back to journeys. It
  // carries data-portolan-view="fleet" so the harness can prove it is not the
  // default screen.
  function renderMap(main) {
    const panel = el('section', { class: 'panel map-panel' });
    panel.setAttribute('data-portolan-view', navVm ? 'fleet' : 'map');
    panel.appendChild(el('h1', { class: 'panel-title' }, text(navVm ? 'Fleet map' : 'Behaviour map')));
    const intro = el('p', { class: 'muted map-intro' },
      text(navVm
        ? 'A supporting map of the component/repository fleet. This is secondary to the system walkthrough: each node is a landscape unit, lines are declared dependencies. Click a unit to open its dossier.'
        : 'Each node is a landscape unit; lines are declared dependencies. Size shows connectivity, colour shows family. Click a unit to open its dossier.'));
    panel.appendChild(intro);
    if (navVm) {
      const back = el('p', { class: 'muted' });
      back.appendChild(text('← '));
      back.appendChild(routeLink('Back to the system walkthrough', '/overview', { class: 'cta-secondary' }));
      panel.appendChild(back);
    }

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

  // ---- Navigation atlas views (routes / coverage / findings / unknowns / receipt) ----
  // These are THIN MAPPERS over the view-model + open-* use-cases. All logic
  // lives in domain/use-cases; the shell only turns results into DOM, mirroring
  // how renderMap delegates graph building to openBehaviourMap.

  function navEmpty(main, msg) {
    const panel = el('section', { class: 'panel' });
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Navigation index unavailable')));
    panel.appendChild(el('p', { class: 'muted' }, text(msg || 'No navigation atlas was generated for this target.')));
    main.appendChild(panel);
  }

  function qualityBadge(q) {
    const cls = q === 'high' ? 'badge badge-quality-high' : q === 'medium' ? 'badge badge-quality-medium' : 'badge badge-quality-low';
    return el('span', { class: cls }, text('quality: ' + q));
  }

  function renderRoutesView(main) {
    if (!navVm) return navEmpty(main);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'routes');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Journeys')));
    panel.appendChild(el('p', { class: 'muted' }, text('Each journey is a system route. Open one for the route diagram and reading dossier.')));
    const list = el('div', { class: 'nav-route-list' });
    for (const [family, routes] of navVm.routesByFamily) {
      const group = el('div', { class: 'route-family-group' });
      group.appendChild(el('div', { class: 'section-kicker' }, text(family.toUpperCase())));
      for (const r of routes) {
        const row = el('div', { class: 'route-row' });
        row.appendChild(routeLink(r.route_title, `/route/${r.route_id}`, { id: r.route_id, kind: 'route', class: 'route-row-title' }));
        row.appendChild(qualityBadge(r.route_quality));
        // subject + source evidence state (spec §Route List required row fields)
        if (r.subjects && r.subjects.size) {
          row.appendChild(el('span', { class: 'badge badge-quiet' }, text([...r.subjects].join(', '))));
        }
        if (r.sourceStates && r.sourceStates.size) {
          row.appendChild(el('span', { class: 'badge badge-quiet' }, text(`source: ${[...r.sourceStates].sort().join('/')}`)));
        }
        row.appendChild(el('span', { class: 'badge badge-quiet' }, text(`${r.stages.length} stages`)));
        row.appendChild(el('span', { class: 'badge badge-quiet' }, text(`${r.findingCount} findings`)));
        row.appendChild(el('span', { class: 'badge badge-quiet' }, text(`${r.probeCount} probes`)));
        // runtime assessment (spec §Route List)
        if (r.runtimeAssessments && r.runtimeAssessments.size) {
          row.appendChild(el('span', { class: 'badge badge-runtime' }, text(`runtime: ${[...r.runtimeAssessments].sort().join('/')}`)));
        }
        group.appendChild(row);
      }
      list.appendChild(group);
    }
    panel.appendChild(list);
    main.appendChild(panel);
  }

  function renderRouteDossier(main, routeId) {
    if (!navAtlas) return navEmpty(main);
    const data = openNavigationRoute(navAtlas, routeId);
    const panel = el('section', { class: 'panel dossier-panel' });
    panel.setAttribute('data-portolan-view', 'route-dossier');
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Route not found')));
      panel.appendChild(routeLink('← Back to routes', '/routes', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    // 1. Route thesis (§4): what this route explains.
    panel.appendChild(el('h1', { class: 'panel-title' }, text(data.routeTitle)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-quiet' }, text(data.routeFamily)),
      qualityBadge(data.routeQuality)));
    panel.appendChild(el('p', { class: 'prose route-thesis' }, text(data.thesis)));
    if (data.routeQualityNote) panel.appendChild(el('p', { class: 'muted' }, text(data.routeQualityNote)));

    // 2. Diagram (§3): the route as an ordered system path, NOT a table.
    panel.appendChild(renderRouteDiagram(data.diagram));

    // 3. Stage cards (§4): one card per stage, with anchor-quality honesty.
    panel.appendChild(el('div', { class: 'section-kicker' }, text('STAGE CARDS')));
    for (const s of data.stages) panel.appendChild(stageCard(s));

    // Make source-visible-but-runtime-not-assessed obvious (truth preservation).
    const rt = data.stages.some(s => s.runtime_assessment === 'not_assessed' || s.runtime_assessment === 'blocked');
    if (rt) panel.appendChild(el('p', { class: 'muted route-truth', 'data-portolan-truth': 'source-not-runtime' }, text('Stages are source-visible but runtime-unverified — do not infer runtime proof from static source.')));

    // 4. Evidence (§4, §5).
    if (data.evidence.length) panel.appendChild(navRefList('Evidence', data.evidence.map(e => ({ id: e.evidence_id, label: `${e.evidence_id} (${e.evidence_state})`, kind: 'evidence' }))));

    // 5. Risks (§6): findings as risk cards, not a flat ref list.
    if (data.findings.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('RISKS · ATTACHED FINDINGS')));
      const grid = el('div', { class: 'route-button-grid' });
      for (const f of data.findings) grid.appendChild(riskCard(f));
      panel.appendChild(grid);
    }

    // 6. Unknowns (§7): probes as expedition steps.
    if (data.probes.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('UNKNOWNS · NEXT PROBES')));
      const grid = el('div', { class: 'route-button-grid' });
      for (const p of data.probes) grid.appendChild(probeCard(p));
      panel.appendChild(grid);
    }

    // 7. Next expedition (§4).
    if (data.nextRawCheck) {
      const next = el('div', { class: 'journey-next route-next' });
      next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Next expedition')));
      next.appendChild(el('span', { class: 'journey-next-text' }, text(data.nextRawCheck)));
      panel.appendChild(next);
    }
    panel.appendChild(routeLink('← Back to routes', '/routes', { class: 'back-link' }));
    main.appendChild(panel);
  }

  // Route diagram (§3): a linear ordered flow of stage nodes joined by arrows.
  // Implemented with HTML/CSS (no graph library). Each node carries role,
  // evidence state, runtime/build/test assessment, and finding/probe badges.
  function renderRouteDiagram(diagram) {
    const wrap = el('div', { class: 'route-diagram-wrap' });
    wrap.setAttribute('data-portolan-kind', 'route-diagram');
    wrap.appendChild(el('div', { class: 'section-kicker' }, text('ROUTE DIAGRAM')));
    if (!diagram || !diagram.nodes || !diagram.nodes.length) {
      wrap.appendChild(el('p', { class: 'muted' }, text('No diagram nodes.')));
      return wrap;
    }
    const flow = el('div', { class: 'route-diagram', role: 'img', 'aria-label': 'Route diagram: ordered stages' });
    diagram.nodes.forEach((n, i) => {
      const node = el('div', { class: `route-diagram-node anchor-${n.anchorStatus}` });
      node.appendChild(el('div', { class: 'rd-stage' }, text(String(n.stageIndex) + '. ' + n.label)));
      node.appendChild(el('div', { class: 'rd-role' }, text(n.role)));
      const badges = el('div', { class: 'rd-badges' });
      badges.appendChild(el('span', { class: 'badge badge-quiet' }, text(n.evidenceState)));
      badges.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime: ' + n.runtimeAssessment)));
      if (n.findingCount) badges.appendChild(el('span', { class: 'badge badge-conflict' }, text(n.findingCount + ' finding' + (n.findingCount === 1 ? '' : 's'))));
      if (n.probeCount) badges.appendChild(el('span', { class: 'badge badge-quality-medium' }, text(n.probeCount + ' probe' + (n.probeCount === 1 ? '' : 's'))));
      node.appendChild(badges);
      flow.appendChild(node);
      if (i < diagram.nodes.length - 1) flow.appendChild(el('div', { class: 'route-diagram-arrow', 'aria-hidden': 'true' }, text('→')));
    });
    wrap.appendChild(flow);
    return wrap;
  }

  // One stage card (§4): role, subject, source path, anchor status, snippet OR
  // honest explanation, runtime/build/test status, why it matters.
  function stageCard(s) {
    const card = el('div', { class: `card stage-card anchor-${s.anchorStatus}`, 'data-portolan-kind': 'stage', 'data-portolan-anchor': s.anchorStatus });
    const head = el('div', { class: 'stage-head' });
    head.appendChild(el('span', { class: 'stage-index' }, text(String(s.stage_index) + '.')));
    head.appendChild(el('span', { class: 'stage-title' }, text(stageLabel(s))));
    head.appendChild(el('span', { class: 'badge badge-quiet stage-role' }, text(s.role)));
    card.appendChild(head);

    const meta = el('div', { class: 'stage-meta' });
    // Source path + line range ONLY when the anchor is precise (a real line
    // number exists). A 0/0 range is never rendered as a precise line.
    if (s.anchorStatus === 'precise' && s.line_start) {
      meta.appendChild(el('code', { class: 'stage-path' }, text(`${s.source_path}:${s.line_start}${s.line_end && s.line_end !== s.line_start ? '-' + s.line_end : ''}`)));
    } else {
      meta.appendChild(el('code', { class: 'stage-path' }, text(s.source_path || '—')));
    }
    if (s.source_anchor) meta.appendChild(el('span', { class: 'stage-anchor' }, text(' — ' + s.source_anchor)));
    if (s.subject_id) meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(s.subject_id)));
    card.appendChild(meta);

    // Snippet OR honest anchor explanation (§5). Never fabricate a snippet.
    if (s.anchorStatus === 'precise' && s.source_excerpt) {
      card.appendChild(snippetBlock(s.source_excerpt));
    } else if (s.anchorExplanation) {
      card.appendChild(el('p', { class: 'muted anchor-explanation', 'data-portolan-anchor-explanation': s.anchorStatus }, text(s.anchorExplanation)));
    }

    const badges = el('div', { class: 'card-meta' });
    badges.appendChild(el('span', { class: 'badge badge-quiet' }, text('source: ' + (s.source_evidence_state || 'not_assessed'))));
    badges.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime/build/test: ' + (s.runtime_assessment || 'not_assessed'))));
    badges.appendChild(el('span', { class: 'badge anchor-badge-' + s.anchorStatus }, text('anchor: ' + s.anchorStatus)));
    card.appendChild(badges);

    if (s.next_raw_check) {
      const next = el('div', { class: 'journey-next' });
      next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Why it matters')));
      next.appendChild(el('span', { class: 'journey-next-text' }, text(s.next_raw_check)));
      card.appendChild(next);
    }
    return card;
  }

  // Stage label is sourced from the domain (atlas-reading.stageLabel) so the
  // diagram and the stage card render identically — no duplicate prettifier.

  // A line-numbered source snippet (§5). max 12 lines, line numbers preserved.
  function snippetBlock(excerpt) {
    const lines = String(excerpt).split(/\r\n|\r|\n/).slice(0, 12);
    const wrap = el('pre', { class: 'source-snippet', 'data-portolan-kind': 'snippet' });
    for (const ln of lines) {
      const row = el('div', { class: 'snippet-line' });
      // ln may already carry a line-number prefix from the adapter; render as-is.
      row.appendChild(el('code', {}, text(ln)));
      wrap.appendChild(row);
    }
    return wrap;
  }

  function renderCoverageView(main) {
    if (!navVm) return navEmpty(main);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'coverage');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Coverage · Fleet Regions')));
    const regions = navVm.coverageRegions;
    panel.appendChild(el('p', { class: 'muted' }, text('This is a fleet, not one route. Coverage shows covered, partial, route-less, and missing regions.')));
    // Scale summary (§8): counts by route status + central/peripheral.
    const scale = el('div', { class: 'coverage-scale', 'data-portolan-kind': 'coverage-scale' });
    scale.appendChild(coverageMetric('Total subjects', regions.counts.total));
    scale.appendChild(coverageMetric('Covered', regions.counts.covered));
    scale.appendChild(coverageMetric('Partial', regions.counts.partial));
    scale.appendChild(coverageMetric('Route-less', regions.counts.routeless));
    scale.appendChild(coverageMetric('Missing', regions.counts.missing));
    scale.appendChild(coverageMetric('Central', regions.counts.central));
    scale.appendChild(coverageMetric('Peripheral', regions.counts.peripheral));
    panel.appendChild(scale);

    // Regions with representative subjects linking into routes/findings/probes.
    panel.appendChild(coverageRegion('Covered regions (complete route)', regions.covered));
    panel.appendChild(coverageRegion('Partial regions (partial route)', regions.partial));
    panel.appendChild(coverageRegion('Route-less regions (no meaningful route)', regions.routeless));
    if (regions.missing.length) panel.appendChild(coverageRegion('Missing regions', regions.missing));
    main.appendChild(panel);
  }

  function coverageMetric(label, value) {
    return el('div', { class: 'metric-card coverage-metric' },
      el('div', { class: 'metric-label' }, text(label)),
      el('div', { class: 'metric-value' }, text(String(value))));
  }

  function coverageRegion(label, rows) {
    const sec = el('div', { class: 'coverage-region' });
    sec.appendChild(el('div', { class: 'section-kicker' }, text(label.toUpperCase() + ' · ' + rows.length)));
    if (!rows.length) {
      sec.appendChild(el('p', { class: 'muted' }, text('None.')));
      return sec;
    }
    const grid = el('div', { class: 'route-button-grid' });
    for (const c of rows.slice(0, 24)) {
      const card = el('div', { class: 'card coverage-card' });
      card.appendChild(routeLink(c.subject_label, `/coverage/${encodeURIComponent(c.subject_id)}`, { id: c.subject_id, kind: 'coverage', class: 'card-title' }));
      const meta = el('div', { class: 'card-meta' });
      meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(c.subject_type)));
      meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('route: ' + (c.route_status || '—'))));
      meta.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime: ' + (c.runtime_status || '—'))));
      card.appendChild(meta);
      if (c.route_refs && c.route_refs.length) card.appendChild(el('p', { class: 'muted coverage-links' }, text('routes: ' + c.route_refs.slice(0, 3).join(', '))));
      // §8: routes, findings, AND unknowns attached to each region should be
      // visible. Surface finding/probe counts as badges so a region shows all
      // three attachment kinds, not just routes.
      const extras = el('div', { class: 'card-meta' });
      if (c.finding_refs && c.finding_refs.length) extras.appendChild(el('span', { class: 'badge badge-conflict' }, text(c.finding_refs.length + ' finding' + (c.finding_refs.length === 1 ? '' : 's'))));
      if (c.known_unknown_ids && c.known_unknown_ids.length) extras.appendChild(el('span', { class: 'badge badge-quality-medium' }, text(c.known_unknown_ids.length + ' probe' + (c.known_unknown_ids.length === 1 ? '' : 's'))));
      if (extras.children.length) card.appendChild(extras);
      grid.appendChild(card);
    }
    sec.appendChild(grid);
    return sec;
  }

  function renderCoverageDossier(main, subjectId) {
    if (!navAtlas) return navEmpty(main);
    const data = openCoverageSubject(navAtlas, subjectId);
    const panel = el('section', { class: 'panel dossier-panel' });
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Coverage subject not found')));
      panel.appendChild(routeLink('← Back to coverage', '/coverage', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    const c = data.coverage;
    panel.appendChild(el('h1', { class: 'panel-title' }, text(c.subject_label)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-quiet' }, text(c.subject_type)),
      el('span', { class: 'badge badge-quiet' }, text(`promotion: ${c.promotion_state}`))));
    if (c.source_path) panel.appendChild(dossierSection('Source path', c.source_path));
    panel.appendChild(dossierSection('Status', `route: ${c.route_status} · findings: ${c.finding_status} · runtime: ${c.runtime_status} · test: ${c.test_status}`));
    if ((data.routeStages && data.routeStages.length) || data.routeIds.length) panel.appendChild(navRefList('Linked routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.findings.length) panel.appendChild(navRefList('Linked findings', data.findings.map(f => ({ id: f.finding_id, label: f.title, kind: 'finding' }))));
    if (data.probes.length) panel.appendChild(navRefList('Linked unknown probes', data.probes.map(p => ({ id: p.unknown_id, label: p.blocked_surface, kind: 'probe' }))));
    panel.appendChild(routeLink('← Back to coverage', '/coverage', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function renderFindingsView(main) {
    if (!navVm) return navEmpty(main);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'findings');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Findings · System Risks')));
    panel.appendChild(el('p', { class: 'muted' }, text(`${navVm.counts.findings} structural signal(s). Each finding explains a system risk, not a lint field.`)));
    const grid = el('div', { class: 'route-button-grid' });
    for (const f of navVm.findingIndex.values()) grid.appendChild(riskCard(f));
    panel.appendChild(grid);
    main.appendChild(panel);
  }

  function renderFindingDossier(main, findingId) {
    if (!navAtlas) return navEmpty(main);
    const data = openFinding(navAtlas, findingId);
    const panel = el('section', { class: 'panel dossier-panel' });
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Finding not found')));
      panel.appendChild(routeLink('← Back to findings', '/findings', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    const f = data.finding;
    panel.appendChild(el('h1', { class: 'panel-title' }, text(f.title)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-quiet' }, text(`type: ${f.finding_type}`)),
      el('span', { class: 'badge badge-quiet' }, text(`severity: ${f.severity}`)),
      el('span', { class: 'badge badge-quiet' }, text(`confidence: ${f.confidence}`)),
      el('span', { class: 'badge badge-quiet' }, text(`provenance: ${f.artifact_provenance}`))));
    panel.appendChild(dossierSection('Summary', f.summary));
    if (f.subject_ids && f.subject_ids.length) panel.appendChild(dossierSection('Subjects', f.subject_ids.join(', ')));
    if (data.routeIds.length) panel.appendChild(navRefList('Routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.evidence.length) panel.appendChild(navRefList('Evidence', data.evidence.map(e => ({ id: e.evidence_id, label: `${e.evidence_id} (${e.evidence_state})`, kind: 'evidence' }))));
    if (f.next_raw_check) panel.appendChild(dossierSection('Next raw check', f.next_raw_check));
    panel.appendChild(routeLink('← Back to findings', '/findings', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function renderUnknownsView(main) {
    if (!navVm) return navEmpty(main);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'unknowns');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Unknown Probes · Expedition Plan')));
    panel.appendChild(el('p', { class: 'muted' }, text(`${navVm.counts.probes} blocked/not-assessed surface(s), each a plan with a next safe probe and required permission.`)));
    const grid = el('div', { class: 'route-button-grid' });
    for (const p of navVm.probeIndex.values()) grid.appendChild(probeCard(p));
    panel.appendChild(grid);
    main.appendChild(panel);
  }

  function renderUnknownProbeDossier(main, unknownId) {
    if (!navAtlas) return navEmpty(main);
    const data = openUnknownProbe(navAtlas, unknownId);
    const panel = el('section', { class: 'panel dossier-panel' });
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Unknown probe not found')));
      panel.appendChild(routeLink('← Back to unknown probes', '/unknowns', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    const p = data.probe;
    panel.appendChild(el('h1', { class: 'panel-title' }, text(p.blocked_surface)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-runtime' }, text(`state: ${p.state}`)),
      el('span', { class: 'badge badge-quiet' }, text(`risk: ${p.probe_risk}`))));
    panel.appendChild(dossierSection('Why unknown', p.why_unknown));
    panel.appendChild(dossierSection('Next probe', p.next_probe));
    if (p.requires_permission && p.requires_permission.length) panel.appendChild(dossierSection('Required permissions', p.requires_permission.join(', ')));
    if (data.routeIds.length) panel.appendChild(navRefList('Linked routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.findings.length) panel.appendChild(navRefList('Linked findings', data.findings.map(f => ({ id: f.finding_id, label: f.title, kind: 'finding' }))));
    panel.appendChild(routeLink('← Back to unknown probes', '/unknowns', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function renderReceiptView(main) {
    if (!navVm) return navEmpty(main);
    const data = openReceipt(navAtlas.receiptValidation);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'receipt');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Receipt validation')));
    panel.appendChild(el('p', { class: 'muted' }, text(`target: ${data.targetId}`)));
    const status = el('div', { class: `receipt-status ${data.machineStatus}` });
    status.appendChild(el('div', { class: 'section-kicker' }, text('MACHINE STATUS')));
    status.appendChild(el('p', { class: 'prose' }, text(data.machineStatus)));
    panel.appendChild(status);
    panel.appendChild(dossierSection('Agent self-status', `${data.agentSelfStatus} (agent self-status is evidence, not authority)`));
    if (data.hasDisagreement) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('STATUS DISAGREEMENTS')));
      for (const d of data.disagreements) {
        panel.appendChild(el('p', { class: 'prose' }, text(`${d.subject}: machine=${d.machine_status}, agent=${d.agent_self_status} — ${d.reason}`)));
      }
    }
    // Surface failed + blocked checks first (the actionable ones), using the
    // pre-filtered arrays from openReceipt.
    if (data.failedChecks.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('FAILED CHECKS')));
      for (const c of data.failedChecks) panel.appendChild(checkRow(c));
    }
    if (data.blockedChecks.length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('BLOCKED CHECKS')));
      for (const c of data.blockedChecks) panel.appendChild(checkRow(c));
    }
    panel.appendChild(el('div', { class: 'section-kicker' }, text('ALL VALIDATION CHECKS')));
    for (const c of data.validationChecks) panel.appendChild(checkRow(c));
    if (data.receiptSources && Object.keys(data.receiptSources).length) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('RECEIPT SOURCES')));
      for (const [k, v] of Object.entries(data.receiptSources)) {
        panel.appendChild(el('p', { class: 'muted', style: 'font-size:12px' }, text(`${k}: ${v}`)));
      }
    }
    main.appendChild(panel);
  }

  // refList variant for nav-atlas ids (no system-map object lookup).
  // Render one validation-check row (icon + id + summary).
  function checkRow(c) {
    const icon = c.status === 'verified' ? '✓' : c.status === 'failed' ? '✗' : c.status === 'blocked' ? '⊘' : '?';
    return el('div', { class: 'validation-check' },
      el('span', { class: `check-icon-${c.status}` }, text(icon)),
      el('span', {}, text(`${c.check_id}: ${c.summary}`)));
  }

  function navRefList(label, items) {
    const sec = el('div', { class: 'ref-list' });
    sec.appendChild(el('div', { class: 'section-kicker' }, text(label.toUpperCase())));
    const grid = el('div', { class: 'route-button-grid' });
    for (const it of items) {
      if (it.kind === 'evidence') {
        // Evidence has no dossier view; render as a plain label (not a dead link).
        const chip = el('span', { class: 'chip', 'data-portolan-kind': 'evidence', 'data-portolan-id': it.id }, text(it.label));
        grid.appendChild(chip);
      } else {
        const route = it.kind === 'route' ? `/route/${encodeURIComponent(it.id)}`
          : it.kind === 'coverage' ? `/coverage/${encodeURIComponent(it.id)}`
          : it.kind === 'finding' ? `/finding/${encodeURIComponent(it.id)}`
          : it.kind === 'probe' ? `/probe/${encodeURIComponent(it.id)}`
          : '#/overview';
        grid.appendChild(routeLink(it.label, route, { id: it.id, kind: it.kind, class: 'chip' }));
      }
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
