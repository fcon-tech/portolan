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
// captain-atlas 16 drill-down detail use-cases (bounded panels, not generic dossiers).
const { openRelationship } = require('./use-cases/open-relationship');
const { openStage } = require('./use-cases/open-stage');
const { openEvidence } = require('./use-cases/open-evidence');
const { openC4 } = require('./use-cases/open-c4');
const { openComponentDossier } = require('./use-cases/open-component-dossier');
// captain-atlas 17 semantic component investigation (bounded investigation
// pages + ecosystem placement map; the semantic layer over the atlas).
// All semantic accessors (incl. resolveSourceRef) come through the use-case so
// the shell depends only on use-cases, not the domain (Clean Architecture rule).
const { openSemanticInvestigation, overlapRelationsFor, ecosystemPlacementMap, buildSemanticViewModel, resolveSourceRef } = require('./use-cases/open-semantic-investigation');

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
  const semanticInvestigation = opts.semanticInvestigation || null;
  const theme = createThemeProvider();
  const navigator = createHashNavigator();
  const triangulationEnabled = false; // overlay off by default; admiral toggles

  if (!doc) throw new Error('createPortolanShell requires a document (inject for tests)');
  if (!atlas) throw new Error('createPortolanShell requires a pre-loaded atlas');

  // Build the navigation view-model once (routes/coverage/findings/probes/receipt).
  const navVm = navAtlas ? buildNavViewModel(navAtlas) : null;

  // captain-atlas 17: build the semantic-investigation view-model once when the
  // sidecar is present. The sample set drives which components are "selected"
  // (i.e. get an investigation page instead of a generic dossier). When absent,
  // the semantic surfaces are simply not rendered.
  const semanticVm = semanticInvestigation ? buildSemanticViewModel(semanticInvestigation) : null;
  const selectedComponentIds = semanticVm ? new Set(semanticInvestigation.sample.components) : new Set();

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
  // text() coerces a value into a text node. It intentionally REJECTS objects
  // rather than silently rendering "[object Object]" — per captain-atlas 17 the
  // renderer must prevent object-as-text, and the harness must FAIL if such a
  // bug ever reaches the DOM. Pass a string (or number); pass nothing for null.
  // An object here is a real bug that must surface, not be hidden.
  function text(s) {
    if (s == null) return doc.createTextNode('');
    if (typeof s === 'string') return doc.createTextNode(s);
    if (typeof s === 'number' || typeof s === 'boolean') return doc.createTextNode(String(s));
    throw new TypeError('text() received a non-string value of type ' + typeof s + ' — pass a primitive, not an object. Rendering it would produce "[object Object]".');
  }

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
    if (head === 'structure') return 'fleet'; // "Structure Map" tab -> Fleet map view
    if (head === 'ecosystem' && semanticVm) return 'ecosystem';
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
    // captain-atlas 16 bounded drill-down details (never generic dossiers).
    else if (frag.startsWith('relationship/')) renderRelationshipDetail(main, decode(frag.slice('relationship/'.length)));
    else if (frag.startsWith('stage/')) renderStageDetailRoute(main, frag.slice('stage/'.length));
    else if (frag.startsWith('evidence/')) renderEvidenceDetail(main, decode(frag.slice('evidence/'.length)));
    // captain-atlas 17: semantic component investigation page. Checked BEFORE
    // dossier/component so a selected component's investigation wins over its
    // generic dossier for any path that resolves here.
    else if (frag.startsWith('investigation/')) renderSemanticInvestigation(main, decode(frag.slice('investigation/'.length)));
    else if (frag.startsWith('dossier/component/')) {
      const cid = decode(frag.slice('dossier/component/'.length));
      // captain-atlas 17: a SELECTED component must NEVER fall back to a generic
      // dossier. Reroute to its investigation. A non-selected component keeps
      // the generic dossier.
      if (selectedComponentIds.has(cid)) renderSemanticInvestigation(main, cid);
      else renderComponentDossier(main, cid);
    }
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
      else if (view === 'c4') renderC4View(main);
      else if (view === 'ecosystem') renderEcosystemMap(main);
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
      // captain-atlas 16 §Navigation Labels: reader-facing labels, each
      // understandable without Portolan internals. "Fleet" is NOT a primary
      // label — the graph is the "Structure Map" (secondary). Maritime flavor
      // appears only as secondary explanatory copy, never as a tab.
      tabs = [
        { id: 'overview', label: 'Overview', view: 'walkthrough' },
        { id: 'routes', label: 'System Routes', view: 'routes' },
        { id: 'structure', label: 'Structure Map', view: 'fleet', secondary: true },
        { id: 'ecosystem', label: 'Semantic Map', view: 'ecosystem' },
        { id: 'coverage', label: 'Mapped Areas', view: 'coverage' },
        { id: 'findings', label: 'Hazards', view: 'findings' },
        { id: 'unknowns', label: 'Next Checks', view: 'unknowns' },
        { id: 'receipt', label: 'Run Log', view: 'receipt' },
        { id: 'c4', label: 'C4', view: 'c4' },
      ];
    } else {
      tabs = [
        { id: 'overview', label: 'Overview', view: 'overview' },
        { id: 'map', label: 'Map', view: 'map' },
        { id: 'components', label: 'Components', view: 'components' },
      ];
      // The Semantic Map tab also appears without a nav-atlas when a semantic
      // investigation is present, so the investigation surfaces are reachable
      // even from the minimal atlas shell.
      if (semanticVm) tabs.splice(1, 0, { id: 'ecosystem', label: 'Semantic Map', view: 'ecosystem' });
    }
    for (const t of tabs) {
      // The Semantic Map tab exists only when a semantic investigation is present.
      if (t.view === 'ecosystem' && !semanticVm) continue;
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
    panel.appendChild(sectionIntro('What this landscape appears to be and what matters first. Read the journeys to understand the system, then drill into routes, hazards, and next checks for evidence and gaps.'));

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
    panel.appendChild(el('h1', { class: 'panel-title' }, text(navVm ? 'Structure Map' : 'Behaviour map')));
    // captain-atlas 16: the Structure Map also carries a section-intro marker
    // so every section explains itself consistently (doc-16 §Navigation Labels).
    const intro = sectionIntro(navVm
      ? 'A supporting map of the component fleet (repositories and their declared dependencies). This is secondary to the system walkthrough: each node is a landscape unit, each line is a declared dependency. Click a unit to open its dossier; click a line to open the relationship detail.'
      : 'Each node is a landscape unit; lines are declared dependencies. Size shows connectivity, colour shows family. Click a unit to open its dossier.');
    intro.className = 'muted section-intro map-intro';
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
        if (node && node.id) {
          // captain-atlas 17: a SELECTED component opens its semantic
          // investigation (ecosystem/purpose/internal model/risks/overlap), not
          // the generic dossier. Non-selected components keep the nav-enriched
          // dossier (captain-atlas 16). This closes the graph-node-click
          // fallback path for selected components.
          if (selectedComponentIds.has(node.id)) {
            navigator.route('/investigation/' + encodeURIComponent(node.id));
          } else {
            navigator.route('/dossier/component/' + encodeURIComponent(node.id));
          }
        }
      } else if (ev.type === 'edge-click') {
        const edge = model.edges.find(e => e.id === ev.id);
        // captain-atlas 16: edge click opens a RELATIONSHIP DETAIL panel that
        // explains the edge (source/target/type/direction/evidence/what it
        // proves/does not prove). It must NEVER fall through to a generic
        // component/repo dossier.
        if (edge && edge.id) navigator.route('/relationship/' + encodeURIComponent(edge.id));
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
    panel.appendChild(el('h1', { class: 'panel-title' }, text('System Routes')));
    panel.appendChild(sectionIntro('How code and config move through source, build, deploy, test, and runtime. Open this to follow a journey end to end; click a route to open its diagram and reading dossier, and to see where confidence stops.'));
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
    // captain-atlas 16 §System Route: evidence usability status for this route,
    // shown as two badges so artifact validation is never conflated with
    // evidence depth or runtime verification.
    const euMeta = el('div', { class: 'card-meta route-evidence-usability', 'data-portolan-kind': 'route-evidence-usability' });
    euMeta.appendChild(el('span', { class: `badge eu-axis-badge eu-evidence-${data.evidenceUsability}` }, text('evidence: ' + data.evidenceUsability)));
    euMeta.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime: ' + data.runtimeAssessment)));
    panel.appendChild(euMeta);

    // 2. Diagram (§3): the route as an ordered system path, NOT a table.
    panel.appendChild(renderRouteDiagram(data.diagram, data.routeId));

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
  // captain-atlas 16: each node is CLICKABLE -> focuses a stage detail.
  function renderRouteDiagram(diagram, routeId) {
    const wrap = el('div', { class: 'route-diagram-wrap' });
    wrap.setAttribute('data-portolan-kind', 'route-diagram');
    wrap.appendChild(el('div', { class: 'section-kicker' }, text('ROUTE DIAGRAM')));
    if (!diagram || !diagram.nodes || !diagram.nodes.length) {
      wrap.appendChild(el('p', { class: 'muted' }, text('No diagram nodes.')));
      return wrap;
    }
    const flow = el('div', { class: 'route-diagram', role: 'img', 'aria-label': 'Route diagram: ordered stages' });
    diagram.nodes.forEach((n, i) => {
      const stageRoute = routeId ? `/stage/${encodeURIComponent(routeId)}/${n.stageIndex}` : null;
      const node = stageRoute
        ? el('a', { class: `route-diagram-node anchor-${n.anchorStatus}`, href: '#' + stageRoute, 'data-portolan-kind': 'stage-target', 'data-portolan-stage': String(n.stageIndex) })
        : el('div', { class: `route-diagram-node anchor-${n.anchorStatus}` });
      node.appendChild(el('div', { class: 'rd-stage' }, text(String(n.stageIndex) + '. ' + n.label)));
      node.appendChild(el('div', { class: 'rd-role' }, text(n.role)));
      const badges = el('div', { class: 'rd-badges' });
      badges.appendChild(el('span', { class: 'badge badge-quiet' }, text(n.evidenceState)));
      badges.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime: ' + n.runtimeAssessment)));
      if (n.findingCount) badges.appendChild(el('span', { class: 'badge badge-conflict' }, text(n.findingCount + ' finding' + (n.findingCount === 1 ? '' : 's'))));
      if (n.probeCount) badges.appendChild(el('span', { class: 'badge badge-quality-medium' }, text(n.probeCount + ' probe' + (n.probeCount === 1 ? '' : 's'))));
      node.appendChild(badges);
      if (stageRoute) {
        node.setAttribute('data-portolan-clickable', 'true');
        node.addEventListener('click', (ev) => { ev.preventDefault(); navigator.route(stageRoute.replace(/^\//, '')); });
      }
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
    // captain-atlas 16: stage title is a link to the focused stage detail.
    head.appendChild(routeLink(stageLabel(s), `/stage/${encodeURIComponent(s.route_id)}/${s.stage_index}`, { kind: 'stage-target', class: 'stage-title stage-title-link' }));
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
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Mapped Areas')));
    const regions = navVm.coverageRegions;
    panel.appendChild(sectionIntro('What is covered, partial, route-less, missing, or not assessed across the landscape. Open this to see the fleet at a glance; click a region to drill into its route, hazards, or next checks.'));
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
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Hazards')));
    panel.appendChild(sectionIntro('Structural risks and findings — why each one matters and what evidence supports it. Open this to see what could break; click a hazard to read where it attaches and what check would reduce the uncertainty.'));
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
    panel.setAttribute('data-portolan-kind', 'finding');
    panel.appendChild(el('h1', { class: 'panel-title' }, text(f.title)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-quiet' }, text(`type: ${f.finding_type}`)),
      el('span', { class: 'badge badge-quiet' }, text(`severity: ${f.severity}`)),
      el('span', { class: 'badge badge-quiet' }, text(`confidence: ${f.confidence}`)),
      el('span', { class: 'badge badge-quiet' }, text(`provenance: ${f.artifact_provenance}`))));
    panel.appendChild(dossierSection('Summary', f.summary));
    if (f.subject_ids && f.subject_ids.length) panel.appendChild(dossierSection('Subjects', f.subject_ids.join(', ')));
    if (data.contextDerived) {
      panel.appendChild(el('p', { class: 'muted finding-context-derived' },
        text('Route context below was reverse-derived from where this finding is referenced — the finding row itself carries no direct route refs.')));
    }
    if (data.routeIds.length) panel.appendChild(navRefList('Routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.stageRefs && data.stageRefs.length) panel.appendChild(linkedStagesList('Related stages', data.stageRefs));
    if (data.evidence.length) panel.appendChild(navRefList('Evidence', data.evidence.map(e => ({ id: e.evidence_id, label: `${e.evidence_id} (${e.evidence_state})`, kind: 'evidence' }))));
    if (f.next_raw_check) panel.appendChild(dossierSection('Next check to reduce uncertainty', f.next_raw_check));
    panel.appendChild(routeLink('← Back to hazards', '/findings', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function renderUnknownsView(main) {
    if (!navVm) return navEmpty(main);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'unknowns');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Next Checks')));
    panel.appendChild(sectionIntro('Unknowns and probes an agent can run with permission. Open this to see what is not yet assessed; click a check to read what is unknown, why Portolan cannot claim it, what permission it needs, and what it would prove if it ran.'));
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
    panel.setAttribute('data-portolan-kind', 'probe');
    panel.appendChild(el('h1', { class: 'panel-title' }, text(p.blocked_surface)));
    panel.appendChild(el('div', { class: 'card-meta' },
      el('span', { class: 'badge badge-runtime' }, text(`state: ${p.state}`)),
      el('span', { class: 'badge badge-quiet' }, text(`risk: ${p.probe_risk}`))));
    panel.appendChild(dossierSection('Why unknown', p.why_unknown));
    panel.appendChild(dossierSection('Next probe', p.next_probe));
    if (p.requires_permission && p.requires_permission.length) panel.appendChild(dossierSection('Required permissions', p.requires_permission.join(', ')));
    // captain-atlas 16: if the probe row lacked direct route refs but context
    // was reverse-derived, say so explicitly so the admiral knows the linkage
    // is inferred from where the probe is referenced, not declared.
    if (data.contextDerived) {
      panel.appendChild(el('p', { class: 'muted probe-context-derived' },
        text('Route/stage context below was reverse-derived from where this probe is referenced — the probe row itself carries no direct route refs.')));
    }
    if (data.routeIds.length) panel.appendChild(navRefList('Linked routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.stageRefs && data.stageRefs.length) panel.appendChild(linkedStagesList('Linked stages', data.stageRefs));
    if (data.findings.length) panel.appendChild(navRefList('Linked findings', data.findings.map(f => ({ id: f.finding_id, label: f.title, kind: 'finding' }))));
    panel.appendChild(routeLink('← Back to next checks', '/unknowns', { class: 'back-link' }));
    main.appendChild(panel);
  }

  // ---- Run Log (captain-atlas 16: receipt validation + 3-axis evidence usability) ----
  // The Run Log shows artifact validation, evidence usability, and runtime
  // assessment as SEPARATE sections. The hard rule (doc 16): artifact_validated
  // must not be displayed as if the atlas is evidence-rich.
  function renderReceiptView(main) {
    if (!navVm) return navEmpty(main);
    const data = openReceipt(navAtlas.receiptValidation, navAtlas);
    const panel = el('section', { class: 'panel' });
    panel.setAttribute('data-portolan-view', 'receipt');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Run Log')));
    panel.appendChild(sectionIntro('What Portolan generated, validated, blocked, or could not assess. Open this to tell whether an expedition receipt is clean, failed, blocked, or disputed — and how strong the underlying evidence actually is.'));

    // ---- Three independent evidence-usable axes (captain-atlas 16) ----
    if (data.evidenceUsability) {
      const eu = data.evidenceUsability;
      const euWrap = el('div', { class: 'evidence-usability-grid', 'data-portolan-kind': 'evidence-usability' });
      euWrap.appendChild(euAxisCard('ARTIFACT VALIDATION', eu.artifactValidation, eu.copy.artifactValidation, 'axis-artifact'));
      euWrap.appendChild(euAxisCard('EVIDENCE USABILITY', eu.evidenceUsability, eu.copy.evidenceUsability, 'axis-evidence'));
      euWrap.appendChild(euAxisCard('RUNTIME ASSESSMENT', eu.runtimeAssessment, eu.copy.runtimeAssessment, 'axis-runtime'));
      panel.appendChild(euWrap);
      // Stage-count context so the admiral sees what the usability verdict is over.
      panel.appendChild(el('p', { class: 'muted evidence-stage-counts' },
        text(`${eu.stageCounts.total} stage(s): ${eu.stageCounts.visibleEvidence} with visible evidence, ${eu.stageCounts.preciseAnchors} with precise source anchors.`)));
      // Hard rule: make it impossible to misread artifact_validated as evidence-rich.
      // The caveat fires for anything short of fully-anchored evidence (weak/none/partial),
      // because 'partial' can also be misread as evidence-rich (k2p6 minor #10).
      if (eu.artifactValidation === 'verified' && eu.evidenceUsability !== 'anchored') {
        const strength = eu.evidenceUsability === 'partial'
          ? 'only partial — some stages have precise anchors while others do not'
          : eu.evidenceUsability === 'weak'
            ? 'weak — key stages lack precise source anchors'
            : 'absent — no source-visible evidence with anchors was found';
        panel.appendChild(el('p', { class: 'muted evidence-caveat', 'data-portolan-truth': 'artifact-not-evidence' },
          text(`The bundle validates structurally, but evidence usability is ${strength}. Artifacts parsing is not the same as an evidence-rich atlas. Do not treat the 'verified' artifact status as proof of source-depth.`)));
      }
    }

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

  // One three-axis card: verdict + plain-language copy.
  function euAxisCard(label, verdict, copy, cls) {
    const card = el('div', { class: `card eu-axis-card ${cls}` });
    card.appendChild(el('div', { class: 'section-kicker' }, text(label)));
    card.appendChild(el('div', { class: `eu-axis-verdict eu-verdict-${verdict}` }, text(verdict)));
    card.appendChild(el('p', { class: 'muted eu-axis-copy' }, text(copy)));
    return card;
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
        // captain-atlas 16: evidence chips now open an evidence DETAIL panel
        // (path/anchor quality/snippet/what it proves), instead of being a
        // dead span. Never a generic dossier.
        const route = `/evidence/${encodeURIComponent(it.id)}`;
        grid.appendChild(routeLink(it.label, route, { id: it.id, kind: 'evidence', class: 'chip' }));
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

  // Linked-stages list for the evidence detail (captain-atlas 16). Stage routes
  // are TWO segments /stage/<routeId>/<stageIndex>; the generic navRefList
  // encodes a single id into one segment, which the stage router cannot parse.
  // Build the links directly so evidence -> stage navigation is live.
  function linkedStagesList(label, stageRefs) {
    const sec = el('div', { class: 'ref-list' });
    sec.appendChild(el('div', { class: 'section-kicker' }, text(label.toUpperCase())));
    const grid = el('div', { class: 'route-button-grid' });
    for (const s of stageRefs) {
      const stageRoute = `/stage/${encodeURIComponent(s.routeId)}/${s.stageIndex}`;
      grid.appendChild(routeLink(s.label + ' (' + s.routeId + ' #' + s.stageIndex + ')', stageRoute, { id: s.routeId, kind: 'stage-target', class: 'chip' }));
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

  // ---- captain-atlas 16: drill-down detail panels + C4 + section intros ----

  // One-sentence section explanation (doc 16 §Navigation Labels): what this
  // section is, why open it, what's clickable, what clicking reveals. Carries a
  // stable marker so the harness can prove each section explains itself.
  function sectionIntro(copy) {
    return el('p', { class: 'muted section-intro', 'data-portolan-section-intro': 'true' }, text(copy));
  }

  // Relationship detail (doc 16 §Relationship): explains the EDGE, not a node.
  // Never falls through to a generic component/repo dossier.
  function renderRelationshipDetail(main, relId) {
    const data = openRelationship(atlas, navAtlas, relId);
    const panel = el('section', { class: 'panel dossier-panel' });
    panel.setAttribute('data-portolan-view', 'relationship-detail');
    panel.setAttribute('data-portolan-kind', 'relationship');
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Relationship not found')));
      panel.appendChild(el('p', { class: 'muted' }, text(`No relationship with id "${relId}". This edge has no safe detail — it is recorded but not explainable from the current data.`)));
      panel.appendChild(routeLink('← Back to the Structure Map', '/structure', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('RELATIONSHIP DETAIL')));
    panel.appendChild(el('h1', { class: 'panel-title' }, text(`${data.relationshipType} · ${data.direction}`)));
    panel.appendChild(el('p', { class: 'prose' }, text(data.summary || data.whyPresent || 'A declared relationship between two landscape units.')));
    const fromTo = el('div', { class: 'rel-from-to' });
    fromTo.appendChild(relEndpoint(data.from, 'from'));
    fromTo.appendChild(el('div', { class: 'route-diagram-arrow', 'aria-hidden': 'true' }, text('→')));
    fromTo.appendChild(relEndpoint(data.to, 'to'));
    panel.appendChild(fromTo);
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('evidence: ' + data.evidenceState)));
    if (data.producerFamily) meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('producer: ' + data.producerFamily)));
    panel.appendChild(meta);
    if (data.whyPresent) panel.appendChild(dossierSection('Why this relationship is in the atlas', data.whyPresent));
    panel.appendChild(dossierSection('What this relationship proves', data.whatItProves));
    panel.appendChild(dossierSection('What it does not prove', data.whatItDoesNotProve));
    if (data.routeIds.length) panel.appendChild(navRefList('Route context', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    if (data.hazardIds.length) panel.appendChild(navRefList('Attached hazards', data.hazardIds.map(id => ({ id, label: id, kind: 'finding' }))));
    if (data.probeIds.length) panel.appendChild(navRefList('Attached next checks', data.probeIds.map(id => ({ id, label: id, kind: 'probe' }))));
    panel.appendChild(routeLink('← Back to the Structure Map', '/structure', { class: 'back-link' }));
    main.appendChild(panel);
  }

  function relEndpoint(endpoint, role) {
    const wrap = el('div', { class: `rel-endpoint rel-${role}` });
    if (endpoint && endpoint.route) {
      wrap.appendChild(routeLink(endpoint.label, endpoint.route, { id: endpoint.id, kind: 'component', class: 'rel-endpoint-link' }));
    } else {
      wrap.appendChild(el('span', { class: 'rel-endpoint-label' }, text(endpoint ? endpoint.label : '—')));
    }
    wrap.appendChild(el('div', { class: 'rd-role' }, text(role)));
    return wrap;
  }

  // Stage detail (doc 16 §Route Stage): a focused view of one stage, reachable
  // from the route diagram node or a stage card. Answers role / source anchor /
  // evidence state / runtime status / attached hazards+probes / proves / does
  // not prove.
  function renderStageDetailRoute(main, fragTail) {
    // fragTail = "<routeId>/<stageIndex>" — routeId may contain slashes? No:
    // route ids are colon-delimited (route:bigtop:...) and never contain '/'.
    // The stageIndex is the last segment.
    const parts = fragTail.split('/');
    const stageIndex = parts.pop();
    const routeId = decodeURIComponent(parts.join('/'));
    renderStageDetail(main, routeId, stageIndex);
  }

  function renderStageDetail(main, routeId, stageIndex) {
    const data = openStage(navAtlas, routeId, stageIndex);
    const panel = el('section', { class: 'panel dossier-panel' });
    panel.setAttribute('data-portolan-view', 'stage-detail');
    panel.setAttribute('data-portolan-kind', 'stage-detail');
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Stage not found')));
      panel.appendChild(el('p', { class: 'muted' }, text(`No stage ${stageIndex} in route "${routeId}".`)));
      panel.appendChild(routeLink('← Back to the route', `/route/${encodeURIComponent(routeId)}`, { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('STAGE DETAIL')));
    panel.appendChild(el('h1', { class: 'panel-title' }, text(`${data.label}`)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-quiet stage-role' }, text(data.role)));
    meta.appendChild(el('span', { class: `badge anchor-badge-${data.anchorStatus}` }, text('anchor: ' + data.anchorStatus)));
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('source: ' + data.sourceEvidenceState)));
    meta.appendChild(el('span', { class: 'badge badge-runtime' }, text('runtime/build/test: ' + data.runtimeAssessment)));
    panel.appendChild(meta);
    panel.appendChild(routeLink('← Back to the route', `/route/${encodeURIComponent(routeId)}`, { class: 'back-link' }));

    if (data.sourcePath) {
      const pathLine = data.anchorStatus === 'precise' && data.lineStart
        ? `${data.sourcePath}:${data.lineStart}${data.lineEnd && data.lineEnd !== data.lineStart ? '-' + data.lineEnd : ''}`
        : data.sourcePath;
      panel.appendChild(dossierSection('Source path', pathLine));
    }
    if (data.sourceAnchor) panel.appendChild(dossierSection('Source anchor', data.sourceAnchor));
    if (data.subjectId) panel.appendChild(dossierSection('Subject', data.subjectId));
    // Snippet OR honest anchor explanation (never fabricate a snippet).
    if (data.anchorStatus === 'precise' && data.sourceExcerpt) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('SOURCE EXCERPT')));
      panel.appendChild(snippetBlock(data.sourceExcerpt));
    } else if (data.anchorExplanation) {
      panel.appendChild(el('p', { class: 'muted anchor-explanation', 'data-portolan-anchor-explanation': data.anchorStatus }, text(data.anchorExplanation)));
    }
    panel.appendChild(dossierSection('What this stage proves', data.whatItProves));
    panel.appendChild(dossierSection('What it does not prove', data.whatItDoesNotProve));
    if (data.hazardRefs.length) panel.appendChild(navRefList('Attached hazards', data.hazardRefs.map(id => ({ id, label: id, kind: 'finding' }))));
    if (data.probeRefs.length) panel.appendChild(navRefList('Attached next checks', data.probeRefs.map(id => ({ id, label: id, kind: 'probe' }))));
    if (data.evidenceRefs.length) panel.appendChild(navRefList('Evidence', data.evidenceRefs.map(id => ({ id, label: id, kind: 'evidence' }))));
    if (data.nextRawCheck) panel.appendChild(dossierSection('Next useful action', data.nextRawCheck));
    main.appendChild(panel);
  }

  // Evidence detail (doc 16 §Evidence Anchor): path / anchor quality / excerpt
  // or missing explanation / what it proves / linked route/stage/finding/probe.
  // Source-visible evidence NEVER implies runtime/build/test verification.
  function renderEvidenceDetail(main, evidenceId) {
    const data = openEvidence(navAtlas, evidenceId);
    const panel = el('section', { class: 'panel dossier-panel' });
    panel.setAttribute('data-portolan-view', 'evidence-detail');
    panel.setAttribute('data-portolan-kind', 'evidence-detail');
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Evidence not found')));
      panel.appendChild(el('p', { class: 'muted' }, text(`No evidence with id "${evidenceId}".`)));
      panel.appendChild(routeLink('← Back', '/overview', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('EVIDENCE DETAIL')));
    panel.appendChild(el('h1', { class: 'panel-title' }, text(data.evidenceId)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: `badge anchor-badge-${data.anchorStatus}` }, text('anchor: ' + data.anchorStatus)));
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('state: ' + data.evidenceState)));
    if (data.artifactProvenance) meta.appendChild(el('span', { class: 'badge badge-quiet' }, text('provenance: ' + data.artifactProvenance)));
    panel.appendChild(meta);
    if (data.sourcePath) panel.appendChild(dossierSection('Local path', data.sourcePath));
    if (data.sourceAnchor) panel.appendChild(dossierSection('Anchor type', data.sourceAnchor));
    if (data.anchorStatus === 'precise' && data.lineStart) {
      panel.appendChild(dossierSection('Line range', `${data.lineStart}${data.lineEnd && data.lineEnd !== data.lineStart ? '-' + data.lineEnd : ''}`));
    }
    if (data.observation) panel.appendChild(dossierSection('Observation', data.observation));
    if (data.anchorStatus === 'precise' && data.sourceExcerpt) {
      panel.appendChild(el('div', { class: 'section-kicker' }, text('SOURCE EXCERPT (max 12 lines)')));
      panel.appendChild(snippetBlock(data.sourceExcerpt));
    } else if (data.anchorExplanation) {
      panel.appendChild(el('p', { class: 'muted anchor-explanation', 'data-portolan-anchor-explanation': data.anchorStatus }, text(data.anchorExplanation)));
    }
    panel.appendChild(dossierSection('What this evidence proves', data.whatItProves));
    panel.appendChild(el('p', { class: 'muted evidence-truth', 'data-portolan-truth': 'source-not-runtime' }, text(data.whatItDoesNotProve)));
    if (data.routeIds.length) panel.appendChild(navRefList('Linked routes', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    // Linked stages: build TWO-SEGMENT /stage/<routeId>/<stageIndex> links
    // directly, consistent with route diagram nodes. (The generic navRefList
    // encodes the whole id into one segment, which breaks the stage router
    // that expects <routeId>/<stageIndex> as two segments.)
    if (data.stageRefs.length) panel.appendChild(linkedStagesList('Linked stages', data.stageRefs));
    if (data.findingIds.length) panel.appendChild(navRefList('Linked findings', data.findingIds.map(id => ({ id, label: id, kind: 'finding' }))));
    if (data.probeIds.length) panel.appendChild(navRefList('Linked probes', data.probeIds.map(id => ({ id, label: id, kind: 'probe' }))));
    panel.appendChild(routeLink('← Back', '/overview', { class: 'back-link' }));
    main.appendChild(panel);
  }

  // Component dossier (doc 16 §Repository Or Component): nav-enriched. Answers
  // what it is / why present / route participation / coverage / hazards /
  // probes / evidence / C4 placement or honest absence / next action.
  function renderComponentDossier(main, componentId) {
    const data = openComponentDossier(atlas, navAtlas, componentId);
    const panel = el('section', { class: 'panel dossier-panel' });
    panel.setAttribute('data-portolan-view', 'component-dossier');
    panel.setAttribute('data-portolan-kind', 'component');
    if (!data) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Object not found')));
      panel.appendChild(el('p', { class: 'muted' }, text(`No component with id "${componentId}".`)));
      panel.appendChild(routeLink('← Back', '/structure', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }
    const c = data.component;
    panel.appendChild(el('h1', { class: 'panel-title' }, text(c.display_name || c.id)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(`kind: component`)));
    if (c.c4_family) meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(FAMILY_LABELS[c.c4_family] || c.c4_family)));
    panel.appendChild(meta);
    if (c.why_present) panel.appendChild(dossierSection('Why it is present in the atlas', c.why_present));
    if (c.role) panel.appendChild(dossierSection('Role', c.role));
    // Route participation.
    if (data.routeIds.length) {
      panel.appendChild(navRefList('System routes this participates in', data.routeIds.map(id => ({ id, label: id, kind: 'route' }))));
    } else {
      panel.appendChild(dossierSection('System routes', 'This component participates in no mapped system route. It appears in the atlas as a landscape unit, but its build/test/runtime path is not traced.'));
    }
    // Coverage state.
    if (data.coverage) {
      const cov = data.coverage;
      panel.appendChild(dossierSection('Coverage', `route: ${cov.route_status} · findings: ${cov.finding_status} · runtime: ${cov.runtime_status} · test: ${cov.test_status}`));
    }
    // C4 placement or honest absence.
    if (data.c4Placement) {
      panel.appendChild(dossierSection('C4 placement', data.c4Placement.present
        ? 'Placed at the C4 Component level.'
        : data.c4Placement.note));
    }
    if (data.hazards.length) panel.appendChild(navRefList('Attached hazards', data.hazards.map(id => ({ id, label: id, kind: 'finding' }))));
    if (data.probes.length) panel.appendChild(navRefList('Attached next checks', data.probes.map(id => ({ id, label: id, kind: 'probe' }))));
    if (data.evidence.length) panel.appendChild(navRefList('Evidence anchors', data.evidence.map(e => ({ id: e.evidence_id, label: `${e.evidence_id} (${e.evidence_state})`, kind: 'evidence' }))));
    // Related system-map objects (surfaces, relationships) via the existing
    // generic resolver — these are component-relative, not generic fallthrough.
    const generic = drillToDossier(atlas, componentId, 'component');
    if (generic && generic.related) {
      if (generic.related.relationships.length) panel.appendChild(refList('Relationships', generic.related.relationships));
      if (generic.related.surfaces.length) panel.appendChild(refList('Surfaces', generic.related.surfaces));
    }
    if (data.nextAction) {
      const next = el('div', { class: 'journey-next' });
      next.appendChild(el('span', { class: 'badge badge-quality-high' }, text('Next useful action')));
      next.appendChild(el('span', { class: 'journey-next-text' }, text(data.nextAction)));
      panel.appendChild(next);
    }
    panel.appendChild(routeLink('← Back to the Structure Map', '/structure', { class: 'back-link' }));
    main.appendChild(panel);
  }

  // C4 view (doc 16 §C4 Contract): an optional map, NOT a renamed repo graph.
  // Context always present; Container honest-empty when no runtime/deploy
  // evidence; Component from promoted units (limited/derived); Code
  // out-of-scope.
  function renderC4View(main) {
    const model = openC4(atlas);
    const panel = el('section', { class: 'panel c4-panel' });
    panel.setAttribute('data-portolan-view', 'c4');
    panel.appendChild(el('h1', { class: 'panel-title' }, text('C4')));
    panel.appendChild(sectionIntro('An optional decomposition view: Context (the system and its externals), Container (runtime/deploy units), Component (promoted units), and Code (out of scope). Open this to see how deep the model goes — and where it honestly stops.'));
    // Context level (always present).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('CONTEXT · always present')));
    if (!model.context.length) {
      panel.appendChild(el('p', { class: 'muted' }, text('No context boxes recorded. The target system is the implicit context.')));
    } else {
      const ctx = el('div', { class: 'route-button-grid c4-context-grid' });
      for (const b of model.context) {
        ctx.appendChild(routeLink(b.display_name || b.id, b.route || '#/overview', { id: b.id, kind: 'context', class: 'chip c4-box' }));
      }
      panel.appendChild(ctx);
    }
    // Container level (honest-empty when absent).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('CONTAINER')));
    if (model.container.present) {
      const ctr = el('div', { class: 'route-button-grid c4-container-grid' });
      for (const b of model.container.boxes) {
        ctr.appendChild(routeLink(b.display_name || b.id, b.route || '#/overview', { id: b.id, kind: 'container', class: 'chip c4-box' }));
      }
      panel.appendChild(ctr);
    } else {
      const empty = el('div', { class: 'c4-honest-empty', 'data-portolan-c4': 'container-honest-empty' });
      empty.appendChild(el('p', { class: 'muted' }, text(model.container.explanation)));
      panel.appendChild(empty);
    }
    // Component level (promoted units only; limited/derived label).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('COMPONENT · promoted units')));
    if (model.component.limited) {
      panel.appendChild(el('p', { class: 'muted c4-limited', 'data-portolan-c4': 'component-limited' }, text(model.component.note)));
    }
    const comp = el('div', { class: 'route-button-grid c4-component-grid' });
    for (const b of model.component.boxes) {
      comp.appendChild(routeLink(b.display_name || b.id, b.route || '#/overview', { id: b.id, kind: 'component', class: 'chip c4-box' }));
    }
    // captain-atlas 16 §C4: Component uses PROMOTED UNITS ONLY. Do NOT infer
    // component boxes from families, repo names, colors, or grouping — families
    // are a separate structural axis, not a C4 Component level. When no
    // explicit component boxes exist, show an honest-empty state instead.
    if (comp.children.length) {
      panel.appendChild(comp);
    } else {
      const empty = el('div', { class: 'c4-honest-empty', 'data-portolan-c4': 'component-honest-empty' });
      empty.appendChild(el('p', { class: 'muted' }, text('No promoted Component boxes. Components are not inferred from families or repository names — open the Structure Map to see landscape units, or promote specific units to populate this level.')));
      panel.appendChild(empty);
    }
    // Code level (out of scope).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('CODE · out of scope')));
    panel.appendChild(el('p', { class: 'muted c4-code-handoff', 'data-portolan-c4': 'code-out-of-scope' }, text(model.code.nextAction)));
    main.appendChild(panel);
  }

  // =========================================================================
  // captain-atlas 17: semantic component investigation + ecosystem map.
  // The investigation page answers the seven semantic questions (ecosystem
  // placement, purpose, internal model, integration, risks, overlaps, evidence
  // boundary) for a SELECTED component. A selected component must NEVER fall
  // back to a generic dossier. A null investigation for a selected id is a HARD
  // FAILURE — the page renders a typed "investigation missing" error, not a
  // dossier.
  // =========================================================================

  // The source-boundary badge for a claim. The four boundaries are an
  // orthogonal axis to evidence.state (doc 17). Visible so the admiral can read
  // the main story first, then inspect the boundary.
  function sourceBoundaryBadge(boundary) {
    const cls = boundary === 'local-corpus' ? 'badge badge-quality-high'
      : boundary === 'curated-knowledge' ? 'badge badge-quality-medium'
        : boundary === 'agent-hypothesis' ? 'badge badge-quality-low'
          : 'badge badge-runtime';
    return el('span', { class: cls, 'data-portolan-source-boundary': boundary }, text(boundary));
  }

  // A source-card link. Resolves the ref against the registry; if it resolves
  // to a card with a URL, link externally (clearly marked); otherwise show the
  // card label as a resolvable local reference. Never invents a link.
  function sourceCardLink(sourceRef) {
    if (!sourceRef) return el('span', { class: 'muted' }, text('no source ref'));
    const r = resolveSourceRef(semanticInvestigation, sourceRef);
    if (!r.resolves) {
      return el('span', { class: 'muted', 'data-portolan-source-unresolved': 'true' }, text('unresolved source: ' + sourceRef));
    }
    const card = r.sourceCard || {};
    const label = card.label || sourceRef;
    if (card.url) {
      // External official-doc handoff: clearly marked, opens in a new tab.
      const a = el('a', { class: 'chip', href: card.url, target: '_blank', rel: 'noopener noreferrer' }, text(label + ' ↗'));
      a.setAttribute('data-portolan-source-card', sourceRef);
      return a;
    }
    // A locally-resolvable card (curated note / local-corpus anchor /
    // intra-investigation ref). Mark it so the harness can prove resolvability.
    const span = el('span', { class: 'chip', 'data-portolan-source-card': sourceRef, 'data-portolan-source-kind': card.kind || '' }, text(label));
    return span;
  }

  // The 8 required investigation sections, rendered from generated data (never
  // hardcoded DOM text — the harness proves the UI consumes the inlined
  // semanticInvestigation object).
  function renderSemanticInvestigation(main, componentId) {
    const panel = el('section', { class: 'panel dossier-panel semantic-investigation' });
    panel.setAttribute('data-portolan-view', 'semantic-investigation');
    panel.setAttribute('data-portolan-kind', 'investigation');

    // HARD FAILURE: a selected component with no investigation data is a
    // product contract failure, not a graceful gap. Render a typed error and
    // do NOT fall back to a generic dossier.
    if (!semanticVm) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Investigation unavailable')));
      panel.appendChild(el('p', { class: 'muted' }, text('This component is marked for semantic investigation, but no investigation data is present. This is a data contract failure.')));
      panel.appendChild(routeLink('← Back to the Semantic Map', '/ecosystem', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }

    const data = openSemanticInvestigation(semanticInvestigation, componentId);
    const isSelected = selectedComponentIds.has(componentId);
    if (!data) {
      // Non-selected component: a typed not-investigated panel (NOT a fallback
      // to a generic dossier). For a SELECTED component this branch is
      // unreachable in practice (the validator guarantees the data), but we
      // guard explicitly: if reached for a selected id, it is a hard failure.
      panel.appendChild(el('h1', { class: 'panel-title' }, text(isSelected ? 'Investigation data missing' : 'Not investigated')));
      panel.appendChild(el('p', { class: 'muted' }, text(isSelected
        ? `This selected component (${componentId}) has no investigation data. This is a contract failure.`
        : `This component is not part of the semantic investigation sample. Open the Structure Map for its landscape-unit dossier.`)));
      panel.appendChild(routeLink('← Back to the Semantic Map', '/ecosystem', { class: 'back-link' }));
      main.appendChild(panel);
      return;
    }

    panel.appendChild(el('div', { class: 'hero-eyebrow' }, text('COMPONENT INVESTIGATION')));
    panel.appendChild(el('h1', { class: 'panel-title' }, text(data.displayName)));
    // Top summary: a concise "what is this and why does it matter?". The source
    // boundary of the purpose claim is shown once as a badge (not duplicated).
    panel.appendChild(dossierSection('Why this matters', data.purpose.explanation || data.purpose.summary || ''));
    const purposeMeta = el('div', { class: 'card-meta' });
    purposeMeta.appendChild(sourceBoundaryBadge(data.purpose.sourceBoundary));
    panel.appendChild(purposeMeta);

    // §1 Ecosystem Placement
    panel.appendChild(investigationSection('ECOSYSTEM PLACEMENT', 'ecosystem-placement', () => {
      const wrap = el('div', {});
      if (data.ecosystemRegions.length) {
        const regionList = el('div', { class: 'card-meta' });
        for (const r of data.ecosystemRegions) {
          regionList.appendChild(el('span', { class: 'chip' }, text(r.label || r.id)));
        }
        wrap.appendChild(regionList);
      } else {
        wrap.appendChild(el('p', { class: 'muted' }, text('Not placed in a named capability region.')));
      }
      // Adjacent relations (depends_on / integrates_with / packaged_by) — the
      // ecosystem neighbourhood, not a repo dependency list.
      const neighbour = data.semanticRelations.filter(rel => rel.type !== 'overlaps_with' && rel.type !== 'contrasts_with');
      if (neighbour.length) {
        wrap.appendChild(el('div', { class: 'section-kicker' }, text('NEIGHBOURS')));
        const grid = el('div', { class: 'route-button-grid' });
        for (const rel of neighbour) {
          const comp = semanticVm.componentsById.get(rel.targetId);
          const route = selectedComponentIds.has(rel.targetId)
            ? `/investigation/${encodeURIComponent(rel.targetId)}`
            : (comp && comp.route ? comp.route : `/dossier/component/${encodeURIComponent(rel.targetId)}`);
          grid.appendChild(relationChip(rel, route));
        }
        wrap.appendChild(grid);
      }
      return wrap;
    }));

    // §2 Purpose And Capabilities
    panel.appendChild(investigationSection('PURPOSE AND CAPABILITIES', 'purpose-capabilities', () => {
      const wrap = el('div', {});
      const capList = el('div', { class: 'card-meta' });
      for (const cap of data.capabilities) {
        const chip = el('span', { class: 'chip' }, text(cap.label));
        chip.appendChild(el('span', { class: 'muted', style: 'margin-left:6px;font-size:11px' }, text(cap.sourceBoundary)));
        capList.appendChild(chip);
      }
      wrap.appendChild(capList);
      return wrap;
    }));

    // §3 Internal Model (concept cards)
    panel.appendChild(investigationSection('INTERNAL MODEL', 'internal-model', () => {
      const wrap = el('div', {});
      if (!data.internalConcepts.length) {
        wrap.appendChild(el('p', { class: 'muted' }, text('The internal model is not_assessed for this component.')));
        if (data.nextExpedition.length) {
          wrap.appendChild(el('p', { class: 'muted', style: 'font-style:italic' }, text('Next producer: ' + (data.nextExpedition[0].producer || data.nextExpedition[0].action || ''))));
        }
        return wrap;
      }
      const grid = el('div', { class: 'journey-grid' });
      for (const concept of data.internalConcepts) {
        grid.appendChild(conceptCard(concept));
      }
      wrap.appendChild(grid);
      return wrap;
    }));

    // §4 Integration Surface
    panel.appendChild(investigationSection('INTEGRATION SURFACE', 'integration-surface', () => {
      const wrap = el('div', {});
      const grid = el('div', { class: 'journey-grid' });
      for (const surf of data.integrationSurfaces) {
        grid.appendChild(integrationCard(surf));
      }
      wrap.appendChild(grid);
      return wrap;
    }));

    // §5 Problems, Risks, And Peculiarities
    panel.appendChild(investigationSection('PROBLEMS, RISKS, AND PECULIARITIES', 'risks', () => {
      const grid = el('div', { class: 'journey-grid' });
      for (const risk of data.risks) {
        grid.appendChild(riskInvestigationCard(risk));
      }
      return grid;
    }));

    // §6 Overlap And Alternatives (bidirectional overlap pair)
    panel.appendChild(investigationSection('OVERLAP AND ALTERNATIVES', 'overlap-alternatives', () => {
      const wrap = el('div', {});
      const overlaps = overlapRelationsFor(semanticInvestigation, componentId);
      if (!overlaps.length) {
        wrap.appendChild(el('p', { class: 'muted' }, text('No overlap or alternative relations for this component.')));
        return wrap;
      }
      const grid = el('div', { class: 'journey-grid' });
      for (const ov of overlaps) {
        grid.appendChild(overlapCard(ov));
      }
      wrap.appendChild(grid);
      return wrap;
    }));

    // §7 Evidence And Confidence Boundary (4 buckets, never one badge)
    panel.appendChild(investigationSection('EVIDENCE AND CONFIDENCE BOUNDARY', 'evidence-boundary', () => {
      const wrap = el('div', {});
      wrap.appendChild(el('p', { class: 'muted section-intro' }, text('Each claim above is labelled by where it comes from. This is the boundary: which statements are local corpus evidence, which are curated knowledge, which are agent hypotheses, and what cannot yet be said.')));
      const grid = el('div', { class: 'evidence-usability-grid' });
      const b = data.evidenceBoundary || {};
      grid.appendChild(boundaryBucketCard('LOCAL CORPUS', (b.local_corpus || []).length, 'Derived from inspected target files/artifacts.'));
      grid.appendChild(boundaryBucketCard('CURATED KNOWLEDGE', (b.curated_knowledge || []).length, 'Stable curated knowledge with a resolvable source card.'));
      grid.appendChild(boundaryBucketCard('AGENT HYPOTHESES', (b.agent_hypotheses || []).length, 'Agent inference, labelled and reversible.'));
      grid.appendChild(boundaryBucketCard('NOT ASSESSED', (b.not_assessed || []).length, 'The atlas cannot say this yet — see Next Expedition.'));
      wrap.appendChild(grid);
      // List the not_assessed gaps explicitly so they are visible, not hidden.
      if ((b.not_assessed || []).length) {
        const gaps = el('div', { class: 'route-button-grid' });
        for (const g of b.not_assessed) gaps.appendChild(el('span', { class: 'chip' }, text(g)));
        wrap.appendChild(el('div', { class: 'section-kicker' }, text('NOT-ASSESSED GAPS')));
        wrap.appendChild(gaps);
      }
      return wrap;
    }));

    // §8 Next Expedition
    panel.appendChild(investigationSection('NEXT EXPEDITION', 'next-expedition', () => {
      const wrap = el('div', {});
      if (!data.nextExpedition.length) {
        wrap.appendChild(el('p', { class: 'muted' }, text('No specific next-expedition actions for this component.')));
        return wrap;
      }
      const list = el('div', { class: 'journey-grid' });
      for (const n of data.nextExpedition) {
        list.appendChild(nextExpeditionCard(n));
      }
      wrap.appendChild(list);
      return wrap;
    }));

    panel.appendChild(routeLink('← Back to the Semantic Map', '/ecosystem', { class: 'back-link' }));
    main.appendChild(panel);
  }

  // A labelled investigation section wrapper carrying a stable data attribute so
  // the harness can assert section presence + minimum content counts.
  function investigationSection(label, sectionKey, bodyFn) {
    const sec = el('div', { class: 'dossier-section', 'data-portolan-section': sectionKey });
    sec.appendChild(el('div', { class: 'section-kicker' }, text(label)));
    sec.appendChild(bodyFn());
    return sec;
  }

  function conceptCard(concept) {
    const card = el('div', { class: 'card journey-card', 'data-portolan-concept': concept.id });
    card.appendChild(el('div', { class: 'card-title' }, text(concept.label || concept.id)));
    card.appendChild(el('p', { class: 'prose' }, text(concept.explanation)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(sourceBoundaryBadge(concept.sourceBoundary));
    card.appendChild(meta);
    card.appendChild(sourceCardLink(concept.sourceRef));
    return card;
  }

  function integrationCard(surf) {
    const card = el('div', { class: 'card journey-card', 'data-portolan-integration': surf.kind });
    card.appendChild(el('div', { class: 'card-title' }, text(surf.label)));
    card.appendChild(el('p', { class: 'prose' }, text(surf.explanation)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(el('span', { class: 'badge badge-quiet' }, text(surf.kind)));
    meta.appendChild(sourceBoundaryBadge(surf.sourceBoundary));
    card.appendChild(meta);
    return card;
  }

  function riskInvestigationCard(risk) {
    const card = el('div', { class: 'card risk-card', 'data-portolan-risk': risk.id });
    card.appendChild(el('div', { class: 'card-title' }, text(risk.label || risk.id)));
    card.appendChild(el('p', { class: 'risk-summary' }, text(risk.explanation)));
    const meta = el('div', { class: 'card-meta' });
    meta.appendChild(sourceBoundaryBadge(risk.sourceBoundary));
    card.appendChild(meta);
    card.appendChild(sourceCardLink(risk.sourceRef));
    return card;
  }

  // An overlap/alternative card. Shows the OTHER component as a link, the
  // relation type, the dimensions, and the bidirectionality status so the
  // reader sees the pair is declared both ways.
  function overlapCard(ov) {
    const card = el('div', { class: 'card journey-card', 'data-portolan-overlap': ov.otherId });
    const other = semanticVm.componentsById.get(ov.otherId);
    const otherLabel = (other && other.display_name) || ov.otherId;
    // Link to the other component's investigation (selected) or dossier.
    const route = selectedComponentIds.has(ov.otherId)
      ? `/investigation/${encodeURIComponent(ov.otherId)}`
      : (other && other.route ? other.route : `/dossier/component/${encodeURIComponent(ov.otherId)}`);
    const head = el('div', { class: 'card-title' });
    head.appendChild(routeLink(otherLabel, route, { id: ov.otherId, kind: 'investigation', class: 'stage-title-link' }));
    card.appendChild(head);
    const relTypes = ov.edges.map(e => e.type).join(', ');
    card.appendChild(el('p', { class: 'prose' }, text('Relation: ' + relTypes + (ov.bidirectional ? ' · bidirectional' : ' · one-directional (declared on this side only)'))));
    // Dimensions: the union of overlap/contrast dimensions.
    if (ov.dimensions.length) {
      const dims = el('div', { class: 'card-meta' });
      for (const d of ov.dimensions) dims.appendChild(el('span', { class: 'chip' }, text(d)));
      card.appendChild(dims);
    }
    // Explanation from the first edge (the curated reasoning).
    if (ov.edges.length && ov.edges[0].explanation) {
      card.appendChild(el('p', { class: 'muted risk-why' }, text(ov.edges[0].explanation)));
    }
    card.appendChild(sourceCardLink(ov.edges[0] && ov.edges[0].sourceRef));
    return card;
  }

  function relationChip(rel, route) {
    const chip = el('span', { class: 'route-diagram-node', 'data-portolan-relation': rel.type });
    chip.appendChild(routeLink(rel.targetLabel, route, { id: rel.targetId, kind: 'investigation', class: 'stage-title-link' }));
    chip.appendChild(el('div', { class: 'rd-role' }, text(rel.type)));
    return chip;
  }

  function boundaryBucketCard(label, count, copy) {
    // The label encodes the source boundary (e.g. "LOCAL CORPUS" -> local-corpus).
    const boundaryKey = label.toLowerCase().replace(/\s+/g, '-');
    const card = el('div', { class: 'card eu-axis-card', 'data-portolan-boundary-bucket': boundaryKey });
    card.appendChild(el('div', { class: 'section-kicker' }, text(label)));
    card.appendChild(el('div', { class: 'eu-axis-verdict' }, text(String(count))));
    card.appendChild(el('p', { class: 'muted eu-axis-copy' }, text(copy)));
    return card;
  }

  function nextExpeditionCard(n) {
    const card = el('div', { class: 'card probe-card', 'data-portolan-next-expedition': n.closes_gap || '' });
    card.appendChild(el('div', { class: 'card-title' }, text(n.producer || n.action || 'Next producer')));
    if (n.action) card.appendChild(el('p', { class: 'prose' }, text(n.action)));
    if (n.why) card.appendChild(el('p', { class: 'muted risk-why' }, text(n.why)));
    if (n.closes_gap) card.appendChild(el('span', { class: 'chip' }, text('closes: ' + n.closes_gap)));
    return card;
  }

  // =========================================================================
  // Ecosystem Placement Map (captain-atlas 17 §Ecosystem Placement Map).
  // A capability-region view: regions as columns, selected components placed in
  // them, bidirectional overlap/alternative relations drawn as connectors. This
  // is NOT the repository graph (Structure Map) — it is a fresh lane layout by
  // capability, so a different DOM marker and a different data source.
  // =========================================================================
  function renderEcosystemMap(main) {
    const panel = el('section', { class: 'panel ecosystem-map' });
    panel.setAttribute('data-portolan-view', 'ecosystem');
    panel.setAttribute('data-portolan-kind', 'ecosystem-map');
    // Guard: if a user lands on #/ecosystem with no semantic investigation
    // loaded, render a typed empty state instead of crashing on
    // semanticInvestigation.sample (defensive — currentView() also gates the
    // tab, but a hand-edited hash must not throw).
    if (!semanticVm) {
      panel.appendChild(el('h1', { class: 'panel-title' }, text('Semantic Map')));
      panel.appendChild(el('p', { class: 'muted' }, text('No semantic investigation is loaded for this atlas, so there is no capability-region map to show. Open the Structure Map for the unit/edge chart.')));
      main.appendChild(panel);
      return;
    }
    const map = ecosystemPlacementMap(semanticInvestigation, selectedComponentIds);
    panel.appendChild(el('h1', { class: 'panel-title' }, text('Semantic Map · capability regions')));
    panel.appendChild(sectionIntro('Where the investigated components sit by capability, and where they overlap or act as alternatives. This is a capability view, not the repository graph — open the Structure Map for the unit/edge chart.'));
    if (semanticInvestigation.sample && semanticInvestigation.sample.selection_reason) {
      panel.appendChild(el('p', { class: 'muted section-intro' }, text('Sample: ' + semanticInvestigation.sample.selection_reason)));
    }

    // Regions as lanes.
    panel.appendChild(el('div', { class: 'section-kicker' }, text('CAPABILITY REGIONS')));
    const grid = el('div', { class: 'ecosystem-region-grid', 'data-portolan-kind': 'ecosystem-regions' });
    for (const region of map.regions) {
      const lane = el('div', { class: 'card ecosystem-region', 'data-portolan-region': region.id });
      lane.appendChild(el('div', { class: 'card-title' }, text(region.label)));
      if (region.description) lane.appendChild(el('p', { class: 'muted risk-why' }, text(region.description)));
      const placed = el('div', { class: 'route-button-grid' });
      for (const comp of region.components) {
        // Placed selected components link to their investigation; placement
        // chips carry a stable marker so the harness can prove placement.
        const route = selectedComponentIds.has(comp.id)
          ? `/investigation/${encodeURIComponent(comp.id)}`
          : `/dossier/component/${encodeURIComponent(comp.id)}`;
        const chip = routeLink(comp.label, route, { id: comp.id, kind: 'investigation', class: 'chip ecosystem-placement' });
        chip.setAttribute('data-portolan-placement', comp.id);
        placed.appendChild(chip);
      }
      if (!region.components.length) placed.appendChild(el('span', { class: 'muted' }, text('No investigated components placed here.')));
      lane.appendChild(placed);
      grid.appendChild(lane);
    }
    panel.appendChild(grid);

    // Overlap/alternative relations (the visible connectors).
    panel.appendChild(el('div', { class: 'section-kicker' }, text('OVERLAP / ALTERNATIVE RELATIONS')));
    const overlapWrap = el('div', { class: 'journey-grid', 'data-portolan-kind': 'ecosystem-overlaps' });
    for (const p of map.overlapPairs) {
      const aComp = semanticVm.componentsById.get(p.a);
      const bComp = semanticVm.componentsById.get(p.b);
      const card = el('div', { class: 'card journey-card ecosystem-overlap', 'data-portolan-overlap-pair': `${p.a}__${p.b}` });
      const head = el('div', { class: 'card-title' });
      head.appendChild(routeLink(aComp ? aComp.display_name : p.a, `/investigation/${encodeURIComponent(p.a)}`, { id: p.a, kind: 'investigation', class: 'stage-title-link' }));
      head.appendChild(el('span', { style: 'margin:0 6px' }, text('↔')));
      head.appendChild(routeLink(bComp ? bComp.display_name : p.b, `/investigation/${encodeURIComponent(p.b)}`, { id: p.b, kind: 'investigation', class: 'stage-title-link' }));
      card.appendChild(head);
      card.appendChild(el('p', { class: 'prose' }, text('Bidirectional overlap across ' + p.dimensions.length + ' dimension(s).')));
      const dims = el('div', { class: 'card-meta' });
      for (const d of p.dimensions) dims.appendChild(el('span', { class: 'chip' }, text(d)));
      card.appendChild(dims);
      overlapWrap.appendChild(card);
    }
    if (!map.overlapPairs.length) overlapWrap.appendChild(el('p', { class: 'muted' }, text('No bidirectional overlap/alternative relations.')));
    panel.appendChild(overlapWrap);

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
