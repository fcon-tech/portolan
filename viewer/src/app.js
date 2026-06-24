/**
 * Portolan Atlas viewer — meaning-first UI.
 *
 * Primary data source: /bundle/system-map.json (the normalized system map from
 * docs/captain-atlas/07-portolan-core-product-spec.md Task B).
 *
 * Route contract (Feature 9):
 *   #/overview (default) / #/c4 / #/map / #/components / #/risks / #/surfaces
 *   #/dossier/<kind>/<id>  — object dossier
 *   #/detail/<kind>/<id>   — bounded relationship/finding detail
 *
 * DOM contract: every visible object element sets data-portolan-id +
 *   data-portolan-kind; clickable elements set data-portolan-route.
 */
'use strict';
const app = document.getElementById('app');
const state = { map: null, view: 'overview', selectedId: '', selectedKind: '', c4Level: 'families', c4Family: '', mapShowSurfaces: false, query: '', ready: false, loadError: '', index: { byId: new Map() }, manifest: null, handoff: null };
const NAV = [ {view:'overview',label:'Overview'},{view:'c4',label:'C4'},{view:'map',label:'Map'},{view:'components',label:'Components'},{view:'risks',label:'Risks'},{view:'surfaces',label:'Surfaces'} ];
const C4_FAMILY_LABELS = { 'data-systems':'Data systems','compute-processing':'Compute / processing','platform-governance':'Platform / governance','packaging-runtime':'Packaging / runtime','coordination-community':'Coordination / community','integration-services':'Integration / services',unknown:'Unclassified' };
const LIFECYCLE_LABELS = { active:'Active',external:'External',retired:'Retired / legacy','internal-support':'Internal support',unknown:'Lifecycle unknown' };
const EVIDENCE_LABELS = { 'source-visible':'Source-visible','metadata-visible':'Metadata-visible','runtime-visible':'Runtime-visible','claim-only':'Claim only',unknown:'Unknown',cannot_verify:'Cannot verify' };

async function fetchJson(p){const r=await fetch(p);if(!r.ok)return null;return r.json();}
async function loadModel(){const [map,manifest,handoff]=await Promise.all([fetchJson('/bundle/system-map.json'),fetchJson('/bundle/manifest.json'),fetchJson('/bundle/captain-handoff.json')]);return {map,manifest,handoff};}
function buildIndexes(map){
  const byId=new Map();
  if(!map||!map.objects)return {byId};
  for(const c of map.objects.components||[])byId.set(c.id,{obj:c,kind:'component'});
  for(const r of map.objects.repositories||[])byId.set(r.id,{obj:r,kind:'repository'});
  for(const s of map.objects.surfaces||[])byId.set(s.id,{obj:s,kind:'surface'});
  for(const r of map.objects.relationships||[])byId.set(r.id,{obj:r,kind:'relationship'});
  for(const f of map.objects.findings||[])byId.set(f.id,{obj:f,kind:'finding'});
  for(const u of map.objects.unknowns||[])byId.set(u.id,{obj:u,kind:'unknown'});
  return {byId};
}
function parseHash(){
  const hash=(window.location.hash||'').replace(/^#\/?/,'');
  const parts=hash.split('/').filter(Boolean);
  if((parts[0]==='dossier'||parts[0]==='detail')&&parts[1]&&parts[2])return {view:'dossier',mode:parts[0],kind:parts[1],id:parts.slice(2).join('/')};
  const view=NAV.some(n=>n.view===parts[0])?parts[0]:'overview';
  if(parts[0]==='c4'&&parts[1]==='context')return {view:'c4',c4Level:'context'};
  if(parts[0]==='c4'&&parts[1]==='components')return {view:'c4',c4Level:'components',c4Family:parts[2]||''};
  if(parts[0]==='c4')return {view:'c4',c4Level:'families'};
  return {view};
}
function setHash(fragment){const target=fragment.startsWith('#')?fragment:`#${fragment}`;if(window.location.hash!==target)history.pushState(null,'',target);routeAndRender();}
function routeFromHash(){const parsed=parseHash();state.view=parsed.view;if(parsed.c4Level)state.c4Level=parsed.c4Level;if(parsed.c4Family!==undefined)state.c4Family=parsed.c4Family||'';if(parsed.kind&&parsed.id){state.selectedKind=parsed.kind;state.selectedId=parsed.id;}else if(parsed.view!=='dossier'){state.selectedId='';state.selectedKind='';}}

function el(tag,attrs,...children){
  const node=document.createElement(tag);
  if(attrs){for(const [k,v] of Object.entries(attrs)){if(v==null||v===false)continue;if(k==='class')node.className=v;else node.setAttribute(k,v);}}
  for(const child of children){if(child==null||child===false)continue;node.appendChild(typeof child==='string'?document.createTextNode(child):child);}
  return node;
}
function text(s){return document.createTextNode(String(s==null?'':s));}
function routeLink(label,route,opts){
  const o=opts||{};
  const href=route.startsWith('#')?route:`#${route}`;
  const a=el('a',{class:o.class||'route-link',href},text(label));
  a.setAttribute('data-portolan-route',route);
  if(o.id)a.setAttribute('data-portolan-id',o.id);
  if(o.kind)a.setAttribute('data-portolan-kind',o.kind);
  if(o.clickable===false){a.setAttribute('data-portolan-clickable','false');a.classList.add('is-disabled');a.title=o.reason||'Not clickable';}
  else a.setAttribute('data-portolan-clickable','true');
  a.addEventListener('click',(ev)=>{ev.preventDefault();setHash(route);});
  return a;
}
function evidenceDot(st){
  const map={'source-visible':'dot-source','metadata-visible':'dot-meta','runtime-visible':'dot-runtime','claim-only':'dot-claim',unknown:'dot-gap',cannot_verify:'dot-gap'};
  const cls=map[st]||'dot-gap';
  return el('span',{class:`dot ${cls}`,title:EVIDENCE_LABELS[st]||st});
}
function lifecycleBadge(lc){const label=LIFECYCLE_LABELS[lc]||'Lifecycle unknown';const cls=lc==='retired'?'badge-retired':lc==='active'?'badge-active':'badge-quiet';return el('span',{class:`badge ${cls}`},text(label));}
function sectionKicker(label){return el('div',{class:'section-kicker'},text(label.toUpperCase()));}
function refList(label,ids,kind){
  if(!ids||ids.length===0)return el('div',{class:'ref-list empty'},sectionKicker(label),el('p',{class:'muted'},text('None recorded.')));
  const links=ids.map(id=>{const entry=state.index.byId.get(id);const display=entry?entry.obj.display_name||entry.obj.label||id:id;const route=entry&&entry.obj.route?entry.obj.route:`#/detail/${kind||'unknown'}/${id}`;return routeLink(display,route,{id,kind:kind||(entry&&entry.kind)});});
  return el('div',{class:'ref-list'},sectionKicker(label),el('div',{class:'route-button-grid'},...links));
}

function renderShell(){app.innerHTML='';app.appendChild(renderTopbar());const main=el('main',{class:'workspace'});app.appendChild(main);return main;}
function renderTopbar(){
  const topbar=el('header',{class:'topbar'});
  const brand=el('div',{class:'brand'},el('span',{class:'brand-mark'},text('Portolan')));
  const nav=el('nav',{class:'nav','aria-label':'Main navigation'});
  for(const n of NAV){const cls=state.view===n.view?'nav-item is-active':'nav-item';const a=el('a',{class:cls,href:`#/${n.view}`},text(n.label));a.addEventListener('click',(ev)=>{ev.preventDefault();setHash(`/${n.view}`);});nav.appendChild(a);}
  const search=el('div',{class:'search'},el('input',{type:'search',class:'search-input',placeholder:'Search components, surfaces, findings…',value:state.query,'aria-label':'Search system map'}));
  const input=search.querySelector('input');
  input.addEventListener('input',()=>{state.query=input.value;if(state.view!=='components')setHash('/components');else render();});
  topbar.appendChild(brand);topbar.appendChild(nav);topbar.appendChild(search);
  return topbar;
}
function render(){
  if(!state.ready)return renderLoading();
  if(state.loadError)return renderError(state.loadError);
  const main=renderShell();
  if(state.view==='overview')renderOverview(main);
  else if(state.view==='c4')renderC4(main);
  else if(state.view==='map')renderMap(main);
  else if(state.view==='components')renderComponents(main);
  else if(state.view==='risks')renderRisks(main);
  else if(state.view==='surfaces')renderSurfaces(main);
  else if(state.view==='dossier')renderDossier(main);
  window.scrollTo({top:0});
}
function renderLoading(){app.innerHTML='<main class="loading-screen" aria-live="polite"><div class="loading-mark">Portolan</div><p>Building local system map…</p></main>';}
function renderError(msg){app.innerHTML='';app.appendChild(renderTopbar());app.appendChild(el('main',{class:'workspace'},el('div',{class:'panel error-panel'},el('h2',{},text('Could not load the system map')),el('p',{class:'muted'},text(msg||'The bundle may be incomplete.')))));}

function renderOverview(main){
  const map=state.map;const target=map.target||{};
  const comps=(map.objects&&map.objects.components)||[];
  const rels=(map.objects&&map.objects.relationships)||[];
  const findings=(map.objects&&map.objects.findings)||[];
  const unknowns=(map.objects&&map.objects.unknowns)||[];
  const surfaces=(map.objects&&map.objects.surfaces)||[];
  const panel=el('section',{class:'panel overview-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text(target.display_name||'Portolan target')));
  panel.appendChild(el('p',{class:'muted target-root'},text(target.root||'')));
  const firstScreen=el('div',{class:'hero-grid'});
  firstScreen.appendChild(metricCard('Target',target.display_name||'—','What Portolan inspected'));
  firstScreen.appendChild(metricCard('Components',String(comps.length),'Main components'));
  firstScreen.appendChild(metricCard('Relationships',String(rels.length),'Observed connections'));
  firstScreen.appendChild(metricCard('Findings',String(findings.length),'Risks and signals'));
  firstScreen.appendChild(metricCard('Surfaces',String(surfaces.length),'Docs, CI, trackers, packages'));
  firstScreen.appendChild(metricCard('Unknowns',String(unknowns.length),'Honest gaps'));
  panel.appendChild(firstScreen);
  const ranked=[...comps].sort((a,b)=>(b.relationship_ids||[]).length+(b.finding_ids||[]).length-(a.relationship_ids||[]).length-(a.finding_ids||[]).length).slice(0,8);
  panel.appendChild(sectionKicker('Main components'));
  const compGrid=el('div',{class:'route-button-grid'});for(const c of ranked)compGrid.appendChild(componentCard(c));panel.appendChild(compGrid);
  panel.appendChild(sectionKicker('Role of this target'));
  const integrator=comps.find(c=>c.type==='platform')||comps[0];
  if(integrator)panel.appendChild(el('p',{class:'prose'},text(`${integrator.display_name} is the integrator/platform that owns the inspected components and surfaces. It sits in the ${C4_FAMILY_LABELS[integrator.c4_family]||integrator.c4_family} family.`)));
  else panel.appendChild(el('p',{class:'muted'},text('No integrator component was identified in this target.')));
  panel.appendChild(sectionKicker('Important relationships'));
  const relList=el('div',{class:'route-button-grid'});for(const r of rels.slice(0,10))relList.appendChild(relationshipChip(r));
  if(rels.length===0)panel.appendChild(el('p',{class:'muted'},text('No relationships observed.')));else panel.appendChild(relList);
  panel.appendChild(sectionKicker('What is risky or suspicious'));
  const riskList=el('div',{class:'route-button-grid'});for(const f of findings.slice(0,8))riskList.appendChild(findingChip(f));
  if(findings.length===0)panel.appendChild(el('p',{class:'muted'},text('No findings recorded.')));else panel.appendChild(riskList);
  panel.appendChild(sectionKicker('What is missing or unknown'));
  const unkList=el('div',{class:'unknown-list'});
  for(const u of unknowns.slice(0,8))unkList.appendChild(el('div',{class:'unknown-item','data-portolan-id':u.id,'data-portolan-kind':u.unknown ? 'unknown':'unknown'},routeLink(u.summary,u.route||('#/detail/unknown/'+u.id),{id:u.id,kind:'unknown',class:'unknown-summary'})));
  if(unknowns.length===0)panel.appendChild(el('p',{class:'muted'},text('No unknowns recorded.')));else panel.appendChild(unkList);
  panel.appendChild(sectionKicker('What to click next'));
  const nextActions=el('div',{class:'route-button-grid'});
  nextActions.appendChild(routeLink('Browse all components','/components',{}));
  nextActions.appendChild(routeLink('Open the C4 lens','/c4',{}));
  nextActions.appendChild(routeLink('See the component map','/map',{}));
  nextActions.appendChild(routeLink('Review risks','/risks',{}));
  nextActions.appendChild(routeLink('Inspect surfaces','/surfaces',{}));
  panel.appendChild(nextActions);
  main.appendChild(panel);
}
function metricCard(label,value,sub){return el('div',{class:'metric-card'},el('div',{class:'metric-label'},text(label)),el('div',{class:'metric-value'},text(value)),el('div',{class:'metric-sub muted'},text(sub||'')));}
function componentCard(c){return el('div',{class:'card component-card'},routeLink(c.display_name,c.route,{id:c.id,kind:'component',class:'card-title'}),el('div',{class:'card-meta'},lifecycleBadge(c.lifecycle),el('span',{class:'badge badge-quiet'},text(C4_FAMILY_LABELS[c.c4_family]||c.c4_family)),evidenceDot(c.evidence&&c.evidence.state)),el('p',{class:'card-role muted'},text(c.role||c.type||'')));}
function relationshipChip(r){const from=state.index.byId.get(r.from_id);const to=state.index.byId.get(r.to_id);const fromLabel=from?from.obj.display_name:r.from_id;const toLabel=to?to.obj.display_name:r.to_id;return el('a',{class:'chip rel-chip',href:`#${r.route}`,'data-portolan-id':r.id,'data-portolan-kind':'relationship','data-portolan-route':r.route,'data-portolan-clickable':'true'},text(`${fromLabel} → ${toLabel} (${r.relationship_type})`));}
function findingChip(f){return el('a',{class:'chip finding-chip',href:`#${f.route}`,'data-portolan-id':f.id,'data-portolan-kind':'finding','data-portolan-route':f.route,'data-portolan-clickable':'true'},text(`${f.finding_type}${f.severity?' · '+f.severity:''}: ${f.summary}`));}

function renderC4(main){
  const panel=el('section',{class:'panel c4-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text('C4 lens')));
  panel.appendChild(el('p',{class:'muted'},text('The same system map viewed as Context, Families, and Components. C4 is a lens, not observed runtime topology.')));
  const levelNav=el('div',{class:'level-nav'});
  for(const lv of ['context','families','components']){const cls=state.c4Level===lv?'level-item is-active':'level-item';const a=el('a',{class:cls,href:`#/c4/${lv}`},text(lv.charAt(0).toUpperCase()+lv.slice(1)));a.addEventListener('click',(ev)=>{ev.preventDefault();setHash(`/c4/${lv}`);});levelNav.appendChild(a);}
  panel.appendChild(levelNav);
  if(state.c4Level==='context')renderC4Context(panel);
  else if(state.c4Level==='families')renderC4Families(panel);
  else renderC4Components(panel);
  main.appendChild(panel);
}
function renderC4Context(panel){
  const boxes=(state.map.c4&&state.map.c4.context_boxes)||[];
  panel.appendChild(sectionKicker('Context — target and external systems'));
  const grid=el('div',{class:'route-button-grid'});
  for(const b of boxes){const entry=state.index.byId.get(b.object_id);const label=b.display_name||(entry&&entry.obj.display_name)||b.object_id;grid.appendChild(routeLink(label,b.route,{id:b.id,kind:'c4-box',class:'card c4-context-card'}));}
  panel.appendChild(grid);
}
function renderC4Families(panel){
  const families=(state.map.c4&&state.map.c4.families)||[];
  panel.appendChild(sectionKicker('Containers / Families — grouped by role'));
  const grid=el('div',{class:'c4-family-grid'});
  for(const f of families){
    const card=el('a',{class:'card c4-family-card',href:`#${f.route}`,'data-portolan-id':f.id,'data-portolan-kind':'c4-family','data-portolan-route':f.route,'data-portolan-clickable':'true'});
    card.addEventListener('click',(ev)=>{ev.preventDefault();setHash('/c4/components/'+f.family);});
    card.appendChild(el('div',{class:'card-title'},text(f.display_name)));
    card.appendChild(el('p',{class:'muted'},text(f.purpose||'')));
    card.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(`${f.component_ids.length} components`)),el('span',{class:'badge badge-quiet'},text(`${f.surface_count} surfaces`)),el('span',{class:'badge badge-quiet'},text(`${f.finding_count} findings`)),el('span',{class:'badge badge-quiet'},text(`${f.unknown_count} unknowns`))));
    card.appendChild(el('p',{class:'muted card-reason'},text(f.grouping_reason||'')));
    grid.appendChild(card);
  }
  panel.appendChild(grid);
}
function renderC4Components(panel){
  const boxes=(state.map.c4&&state.map.c4.component_boxes)||[];
  const families=(state.map.c4&&state.map.c4.families)||[];
  // Family selector pills.
  const sel=el('div',{class:'family-selector'});
  const allCls=!state.c4Family?'family-pill is-active':'family-pill';
  const allA=el('a',{class:allCls,href:'#/c4/components'},text('All families'));
  allA.addEventListener('click',(ev)=>{ev.preventDefault();setHash('/c4/components');});
  sel.appendChild(allA);
  for(const f of families){const cls=state.c4Family===f.family?'family-pill is-active':'family-pill';const a=el('a',{class:cls,href:'#/c4/components/'+f.family},text(f.display_name));a.addEventListener('click',(ev)=>{ev.preventDefault();setHash('/c4/components/'+f.family);});sel.appendChild(a);}
  panel.appendChild(sel);
  panel.appendChild(sectionKicker(state.c4Family?('Components — '+(C4_FAMILY_LABELS[state.c4Family]||state.c4Family)):'Components — by family'));
  const byFamily=new Map();
  for(const b of boxes){const entry=state.index.byId.get(b.object_id);const comp=entry&&entry.obj;const fam=comp?comp.c4_family:'unknown';if(!byFamily.has(fam))byFamily.set(fam,[]);byFamily.get(fam).push(b);}
  for(const [fam,famBoxes] of byFamily){
    if(state.c4Family&&fam!==state.c4Family)continue;
    panel.appendChild(el('h3',{class:'family-heading'},text(C4_FAMILY_LABELS[fam]||fam)));
    const grid=el('div',{class:'route-button-grid'});
    for(const b of famBoxes){const entry=state.index.byId.get(b.object_id);const comp=entry&&entry.obj;const label=b.display_name||(entry&&entry.obj.display_name)||b.object_id;const card=el('div',{class:'card c4-component-card-block'},routeLink(label,b.route,{id:b.id,kind:'c4-box',class:'card-title'}));
      if(comp){const compSurfaces=((state.map.objects&&state.map.objects.surfaces)||[]).filter(sf=>sf.owner_id===comp.id);if(compSurfaces.length>0){card.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(compSurfaces.length+' surfaces'))));}
        card.appendChild(el('div',{class:'route-button-grid'},...compSurfaces.slice(0,6).map(sf=>routeLink(sf.label,sf.route,{id:sf.id,kind:'surface',class:'chip surface-chip'}))));}
      grid.appendChild(card);}
    panel.appendChild(grid);
  }
}

function renderMap(main){
  const panel=el('section',{class:'panel map-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text('Component map')));
  panel.appendChild(el('p',{class:'muted'},text('Meaningful components and their important relationships. Surfaces are hidden by default — toggle below or use the Surfaces view.')));
  const toggle=el('button',{class:'map-surface-toggle','data-portolan-clickable':'true'},text(state.mapShowSurfaces?'Hide attached surfaces':'Show attached surfaces'));
  toggle.addEventListener('click',()=>{state.mapShowSurfaces=!state.mapShowSurfaces;render();});
  panel.appendChild(toggle);
  const comps=((state.map.objects&&state.map.objects.components)||[]);
  const rels=((state.map.objects&&state.map.objects.relationships)||[]);
  const canvas=el('div',{class:'map-canvas','data-testid':'portolan-map'});
  const byFamily=new Map();
  for(const c of comps){if(!byFamily.has(c.c4_family))byFamily.set(c.c4_family,[]);byFamily.get(c.c4_family).push(c);}
  const familyOrder=['data-systems','compute-processing','platform-governance','packaging-runtime','coordination-community','integration-services','unknown'];
  const lanes=el('div',{class:'domain-lanes'});
  for(const fam of familyOrder){
    const famComps=byFamily.get(fam)||[];if(famComps.length===0)continue;
    const lane=el('div',{class:'map-lane'});
    lane.appendChild(el('div',{class:'lane-label'},text(C4_FAMILY_LABELS[fam]||fam)));
    for(const c of famComps){
      const node=el('a',{class:'map-node',href:`#${c.route}`,'data-portolan-id':c.id,'data-portolan-kind':'component','data-portolan-route':c.route,'data-portolan-clickable':'true','data-testid':'portolan-map-node'});
      node.addEventListener('click',(ev)=>{ev.preventDefault();setHash(c.route.replace(/^#/,''));});
      node.appendChild(evidenceDot(c.evidence&&c.evidence.state));
      node.appendChild(el('span',{class:'map-node-label'},text(c.display_name)));
      if(c.lifecycle==='retired')node.classList.add('is-retired');
      lane.appendChild(node);
    }
    lanes.appendChild(lane);
  }
  canvas.appendChild(lanes);
  if(rels.length>0){const edgeList=el('div',{class:'edge-list'});edgeList.appendChild(sectionKicker('Relationships'));for(const r of rels.slice(0,40))edgeList.appendChild(relationshipChip(r));canvas.appendChild(edgeList);}
  if(state.mapShowSurfaces){const surfStrip=el('div',{class:'map-surface-strip'});surfStrip.appendChild(sectionKicker('Attached surfaces (revealed)'));const allSurfaces=((state.map.objects&&state.map.objects.surfaces)||[]);const sg=el('div',{class:'route-button-grid'});for(const sf of allSurfaces.slice(0,40))sg.appendChild(routeLink(sf.label,sf.route,{id:sf.id,kind:'surface',class:'chip surface-chip'}));if(allSurfaces.length===0)surfStrip.appendChild(el('p',{class:'muted'},text('No surfaces.')));else surfStrip.appendChild(sg);panel.appendChild(surfStrip);}
  panel.appendChild(canvas);
  main.appendChild(panel);
}

function renderComponents(main){
  const panel=el('section',{class:'panel components-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text('Components')));
  const comps=((state.map.objects&&state.map.objects.components)||[]);
  const q=(state.query||'').toLowerCase().trim();
  const filtered=q?comps.filter(c=>(c.display_name||'').toLowerCase().includes(q)||(c.role||'').toLowerCase().includes(q)||(c.why_present||'').toLowerCase().includes(q)):comps;
  panel.appendChild(el('p',{class:'muted'},text(`${filtered.length} of ${comps.length} components`)));
  const grid=el('div',{class:'component-grid'});for(const c of filtered)grid.appendChild(componentCard(c));
  panel.appendChild(grid);main.appendChild(panel);
}

function renderRisks(main){
  const panel=el('section',{class:'panel risks-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text('Risks and findings')));
  const findings=((state.map.objects&&state.map.objects.findings)||[]);
  const comps=((state.map.objects&&state.map.objects.components)||[]);
  const byComp=new Map();const unattached=[];
  for(const f of findings){const affected=(f.affected_ids||[]).filter(id=>state.index.byId.has(id));if(affected.length===0){unattached.push(f);continue;}for(const id of affected){if(!byComp.has(id))byComp.set(id,[]);byComp.get(id).push(f);}}
  for(const c of comps){const compFindings=byComp.get(c.id)||[];if(compFindings.length===0)continue;const group=el('div',{class:'risk-group'});group.appendChild(routeLink(c.display_name,c.route,{id:c.id,kind:'component',class:'risk-group-title'}));for(const f of compFindings)group.appendChild(findingChip(f));panel.appendChild(group);}
  if(unattached.length>0){panel.appendChild(sectionKicker('Findings not attached to a component'));for(const f of unattached)panel.appendChild(findingChip(f));}
  if(findings.length===0)panel.appendChild(el('p',{class:'muted'},text('No findings recorded.')));
  main.appendChild(panel);
}

function renderSurfaces(main){
  const panel=el('section',{class:'panel surfaces-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text('Surfaces')));
  panel.appendChild(el('p',{class:'muted'},text('Documentation, CI, mailing lists, support matrix, package/runtime surfaces. Attached to their owning component, not shown as peer components.')));
  const surfaces=((state.map.objects&&state.map.objects.surfaces)||[]);
  const byType=new Map();for(const s of surfaces){if(!byType.has(s.surface_type))byType.set(s.surface_type,[]);byType.get(s.surface_type).push(s);}
  const typeOrder=['docs','release-matrix','wiki','issue-tracker','mailing-list','ci','binary-repo','docker-image','runtime-endpoint','vendor-config','other'];
  for(const t of typeOrder){const typeSurfaces=byType.get(t)||[];if(typeSurfaces.length===0)continue;panel.appendChild(el('h3',{class:'family-heading'},text(t)));const grid=el('div',{class:'surface-grid'});
    for(const s of typeSurfaces){const owner=state.index.byId.get(s.owner_id);const ownerLabel=owner?owner.obj.display_name:s.owner_id;
      const card=el('a',{class:'card surface-card',href:`#${s.route}`,'data-portolan-id':s.id,'data-portolan-kind':'surface','data-portolan-route':s.route,'data-portolan-clickable':'true'});
      card.addEventListener('click',(ev)=>{ev.preventDefault();setHash(s.route.replace(/^#/,''));});
      card.appendChild(el('div',{class:'card-title'},text(s.label)));
      card.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(`owner: ${ownerLabel}`)),el('span',{class:`badge badge-${s.state==='available'?'active':'quiet'}`},text(s.state)),evidenceDot(s.evidence&&s.evidence.state)));
      card.appendChild(el('p',{class:'muted card-reason'},text(s.why_it_matters||'')));
      grid.appendChild(card);}
    panel.appendChild(grid);}
  if(surfaces.length===0)panel.appendChild(el('p',{class:'muted'},text('No surfaces recorded.')));
  main.appendChild(panel);
}

function findById(id){if(state.index.byId.has(id))return state.index.byId.get(id);const candidates=[`component:${id}`,id.replace(/^component:/,"")];for(const c of candidates){if(state.index.byId.has(c))return state.index.byId.get(c);}return undefined;}
function renderDossier(main){
  const id=state.selectedId;const kind=state.selectedKind;
  if(kind==='c4-family'){const fam=((state.map.c4&&state.map.c4.families)||[]).find(f=>f.id===id||f.id===`c4-family:${id}`);if(fam){renderFamilyDossier(main,fam);return;}}
  const entry=findById(id);
  if(!entry){main.appendChild(el('div',{class:'panel'},el('h2',{},text('Object not found')),el('p',{class:'muted'},text(`No object with id "${id}" (${kind}).`)),routeLink('Back to overview','/overview',{})));return;}
  if(entry.kind==='component')renderComponentDossier(main,entry.obj);
  else if(entry.kind==='repository')renderRepositoryDossier(main,entry.obj);
  else if(entry.kind==='surface')renderSurfaceDossier(main,entry.obj);
  else renderBoundedDetail(main,entry.obj,entry.kind);
}
function renderComponentDossier(main,c){
  const panel=el('section',{class:'panel dossier-panel','data-portolan-id':c.id,'data-portolan-kind':'component'});
  panel.appendChild(dossierHeader(c.display_name));
  panel.appendChild(el('div',{class:'card-meta'},lifecycleBadge(c.lifecycle),el('span',{class:'badge badge-quiet'},text(`type: ${c.type}`)),el('span',{class:'badge badge-quiet'},text(`C4: ${C4_FAMILY_LABELS[c.c4_family]||c.c4_family}`)),evidenceDot(c.evidence&&c.evidence.state)));
  panel.appendChild(dossierSection('What this is',c.role||c.type||'Not recorded. The adapter did not capture a concrete role for this component.'));
  panel.appendChild(dossierSection('Why it is present',c.why_present||'—'));
  if(c.lifecycle==='retired')panel.appendChild(dossierSection('Lifecycle','Retired or legacy. Retained because the corpus/BOM includes it or because it is useful for replacement and migration analysis.'));
  panel.appendChild(dossierSection('Where it sits in C4',`Primary family: ${C4_FAMILY_LABELS[c.c4_family]||c.c4_family}.`+(c.secondary_c4_families&&c.secondary_c4_families.length?` Secondary: ${(c.secondary_c4_families||[]).map(f=>C4_FAMILY_LABELS[f]||f).join(', ')}.`:'')));
  panel.appendChild(refList('Links and local paths',c.repository_ids,'repository'));
  panel.appendChild(refList('Backing repositories',c.repository_ids,'repository'));
  panel.appendChild(refList('Attached surfaces',c.surface_ids,'surface'));
  panel.appendChild(refList('Relationships',c.relationship_ids,'relationship'));
  panel.appendChild(refList('Findings and risks',c.finding_ids,'finding'));
  panel.appendChild(refList('Unknowns and not-assessed areas',c.unknown_ids,'unknown'));
  if((c.relationship_ids||[]).length===0)panel.appendChild(el('p',{class:'muted'},text('This component has no recorded relationships. That may be expected for an isolated component, or suspicious for a platform/integrator.')));
  panel.appendChild(nextActionsSection(c.next_actions));
  panel.appendChild(producerSection(c.evidence,c.created_by_producer_family));
  main.appendChild(panel);
}
function renderRepositoryDossier(main,r){
  const panel=el('section',{class:'panel dossier-panel','data-portolan-id':r.id,'data-portolan-kind':'repository'});
  panel.appendChild(dossierHeader(r.display_name));
  panel.appendChild(dossierSection('What this is',`Source repository with ${r.file_count||0} files.`));
  panel.appendChild(dossierSection('Local path',r.path||'Path not recorded.'));
  panel.appendChild(dossierSection('Source visibility',r.source_visibility_state||'not_assessed'));
  panel.appendChild(dossierSection('Why it is present',r.why_present||'Backing repository discovered under the target root.'));
  if(r.languages&&r.languages.length)panel.appendChild(dossierSection('Languages',r.languages.join(', ')));
  panel.appendChild(refList('Components backed',r.component_ids,'component'));
  panel.appendChild(refList('Top findings',r.top_finding_ids,'finding'));
  panel.appendChild(refList('Gaps',r.gap_ids,'unknown'));
  panel.appendChild(nextActionsSection([]));
  panel.appendChild(producerSection(r.evidence,r.created_by_producer_family));
  main.appendChild(panel);
}
function renderSurfaceDossier(main,s){
  const owner=state.index.byId.get(s.owner_id);const ownerLabel=owner?owner.obj.display_name:s.owner_id;
  const panel=el('section',{class:'panel dossier-panel','data-portolan-id':s.id,'data-portolan-kind':'surface'});
  panel.appendChild(dossierHeader(s.label));
  panel.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(`type: ${s.surface_type}`)),el('span',{class:'badge badge-quiet'},text(`owner: ${ownerLabel}`)),el('span',{class:`badge badge-${s.state==='available'?'active':'quiet'}`},text(s.state)),evidenceDot(s.evidence&&s.evidence.state)));
  panel.appendChild(dossierSection('What this is',`${s.surface_type} surface attached to ${ownerLabel}.`));
  panel.appendChild(dossierSection('Why it is present',s.why_present||'—'));
  panel.appendChild(dossierSection('Why it matters',s.why_it_matters||'—'));
  if(s.url||s.path)panel.appendChild(dossierSection('Link or path',s.url||s.path));
  panel.appendChild(producerSection(s.evidence,s.created_by_producer_family));
  main.appendChild(panel);
}
function renderFamilyDossier(main,f){
  const panel=el('section',{class:'panel dossier-panel','data-portolan-id':f.id,'data-portolan-kind':'c4-family'});
  panel.appendChild(dossierHeader(f.display_name));
  panel.appendChild(dossierSection('Family purpose',f.purpose||'—'));
  panel.appendChild(dossierSection('Grouping reason',f.grouping_reason||'—'));
  panel.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(`${f.component_ids.length} components`)),el('span',{class:'badge badge-quiet'},text(`${f.surface_count} surfaces`)),el('span',{class:'badge badge-quiet'},text(`${f.finding_count} findings`)),el('span',{class:'badge badge-quiet'},text(`${f.unknown_count} unknowns`))));
  panel.appendChild(refList('Members',f.component_ids,'component'));
  panel.appendChild(nextActionsSection(f.next_actions));
  main.appendChild(panel);
}
function renderBoundedDetail(main,obj,kind){
  const panel=el('section',{class:'panel dossier-panel','data-portolan-id':obj.id,'data-portolan-kind':kind});
  panel.appendChild(dossierHeader(obj.summary||obj.id));
  if(kind==='relationship'){const from=state.index.byId.get(obj.from_id);const to=state.index.byId.get(obj.to_id);panel.appendChild(dossierSection('Connected components',`${from?from.obj.display_name:obj.from_id} → ${to?to.obj.display_name:obj.to_id} (${obj.relationship_type})`));panel.appendChild(dossierSection('Summary',obj.summary||'—'));panel.appendChild(dossierSection('Direction',obj.direction||'unknown'));
    if(obj.weight)panel.appendChild(dossierSection('Weight / count',String(obj.weight)));}
  else if(kind==='finding'){panel.appendChild(dossierSection('Finding type',obj.finding_type||'—'));if(obj.severity)panel.appendChild(dossierSection('Severity',obj.severity));panel.appendChild(dossierSection('Summary',obj.summary||'—'));panel.appendChild(refList('Affected objects',obj.affected_ids,'component'));}
  else if(kind==='unknown')panel.appendChild(dossierSection('Gap',obj.summary||'—'));
  panel.appendChild(producerSection(obj.evidence,obj.created_by_producer_family));
  main.appendChild(panel);
}
function dossierHeader(title){const h=el('div',{class:'dossier-header'});h.appendChild(el('h1',{class:'panel-title'},text(title)));h.appendChild(routeLink('← Back','/overview',{class:'back-link'}));return h;}
function dossierSection(label,body){return el('div',{class:'dossier-section'},sectionKicker(label),el('p',{class:'prose'},text(body)));}
function nextActionsSection(actions){const sec=el('div',{class:'dossier-section'});sec.appendChild(sectionKicker('Next useful actions'));if(!actions||actions.length===0){sec.appendChild(el('p',{class:'muted'},text('Open related objects above to drill deeper.')));return sec;}const grid=el('div',{class:'route-button-grid'});for(const a of actions)grid.appendChild(routeLink(a.label,a.target.replace(/^#/,''),{}));sec.appendChild(grid);return sec;}
function producerSection(evidence,producerFamily){const sec=el('div',{class:'dossier-section'});sec.appendChild(sectionKicker('Producer and evidence'));const reason=(evidence&&evidence.reason)?` — ${evidence.reason}`:'';sec.appendChild(el('p',{class:'prose muted'},evidenceDot(evidence&&evidence.state),text(` Evidence: ${EVIDENCE_LABELS[evidence&&evidence.state]||(evidence&&evidence.state)||'unknown'} · Producer: ${producerFamily||(evidence&&evidence.producer)||'unknown'}${reason}`)));return sec;}

async function init(){
  try{
    const model=await loadModel();
    if(!model.map||!model.map.objects)throw new Error('system-map.json is missing or empty. Run a Portolan scan to generate it.');
    state.map=model.map;state.manifest=model.manifest;state.handoff=model.handoff;state.index=buildIndexes(model.map);state.ready=true;
  }catch(err){state.loadError=err.message||String(err);state.ready=true;}
  routeAndRender();
}
function routeAndRender(){if(!state.ready){renderLoading();return;}routeFromHash();render();}
window.addEventListener('hashchange',routeAndRender);
init();
