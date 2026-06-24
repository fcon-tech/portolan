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

// ===== Knowledge-graph visualization (SVG, force-directed) =====
// soft is the "r,g,b" triple used to build rgba() glow strings.
const FAMILY_COLORS = {
  'data-systems':          { main:'#2dd4bf', glow:'#5eead4', soft:'45,212,191' },
  'compute-processing':    { main:'#a78bfa', glow:'#c4b5fd', soft:'167,139,250' },
  'platform-governance':   { main:'#fb7185', glow:'#fda4af', soft:'251,113,133' },
  'packaging-runtime':     { main:'#fbbf24', glow:'#fcd34d', soft:'251,191,36' },
  'coordination-community':{ main:'#60a5fa', glow:'#93c5fd', soft:'96,165,250' },
  'integration-services':  { main:'#34d399', glow:'#6ee7b7', soft:'52,211,153' },
  unknown:                 { main:'#94a3b8', glow:'#cbd5e1', soft:'148,163,184' },
};
function familyColor(fam){ return FAMILY_COLORS[fam]||FAMILY_COLORS.unknown; }
const SVG_NS='http://www.w3.org/2000/svg';
function svgEl(tag,attrs,...children){
  const node=document.createElementNS(SVG_NS,tag);
  if(attrs){for(const [k,v] of Object.entries(attrs)){if(v==null||v===false)continue;node.setAttribute(k,v);}}
  for(const child of children){if(child==null||child===false)continue;node.appendChild(typeof child==='string'?document.createTextNode(child):child);}
  return node;
}

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
  const view=(parts[0]==='search'||NAV.some(n=>n.view===parts[0]))?parts[0]:'overview';
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
  input.addEventListener('input',()=>{state.query=input.value;if(state.view!=='search')setHash('/search');else render();});
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
  else if(state.view==='search')renderSearch(main);
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
  // Hero: target identity + landscape radar (donut of family composition).
  const hero=el('div',{class:'overview-hero'});
  const heroText=el('div',{class:'hero-identity'});
  heroText.appendChild(el('div',{class:'hero-eyebrow'},text('PORTOLAN ATLAS')));
  heroText.appendChild(el('h1',{class:'panel-title hero-title'},text(target.display_name||'Portolan target')));
  if(target.root)heroText.appendChild(el('p',{class:'muted target-root'},text(target.root)));
  // One-line landscape read: what kind of ecosystem is this?
  const integrator=comps.find(c=>c.type==='platform')||comps[0];
  if(integrator){
    const famName=C4_FAMILY_LABELS[integrator.c4_family]||integrator.c4_family;
    heroText.appendChild(el('p',{class:'hero-read'},text(`${comps.length} components across ${countFamilies(comps)} C4 families, anchored by `),el('strong',null,text(integrator.display_name)),text(` (${famName.toLowerCase()}), with ${rels.length} declared dependency relationships.`)));
  }
  heroText.appendChild(el('div',{class:'hero-cta'},routeLink('Open the component map →','/map',{class:'cta-primary'}),routeLink('C4 lens','/c4',{class:'cta-secondary'})));
  hero.appendChild(heroText);
  hero.appendChild(renderFamilyDonut(comps));
  panel.appendChild(hero);
  // Metric strip (secondary, supports the visual).
  const firstScreen=el('div',{class:'hero-grid'});
  firstScreen.appendChild(metricCard('Components',String(comps.length),'Meaningful units'));
  firstScreen.appendChild(metricCard('Relationships',String(rels.length),'Declared dependencies'));
  firstScreen.appendChild(metricCard('Surfaces',String(surfaces.length),'Docs, CI, trackers'));
  firstScreen.appendChild(metricCard('Findings',String(findings.length),'Risks and signals'));
  firstScreen.appendChild(metricCard('Unknowns',String(unknowns.length),'Honest gaps'));
  panel.appendChild(firstScreen);
  // Family distribution bar: visual balance of the landscape.
  panel.appendChild(renderFamilyDistribution(comps));
  // Main components (ranked by connectivity).
  const ranked=[...comps].sort((a,b)=>(b.relationship_ids||[]).length+(b.finding_ids||[]).length-(a.relationship_ids||[]).length-(a.finding_ids||[]).length).slice(0,8);
  panel.appendChild(sectionKicker('Most connected components'));
  const compGrid=el('div',{class:'route-button-grid'});for(const c of ranked)compGrid.appendChild(componentCard(c));panel.appendChild(compGrid);
  panel.appendChild(sectionKicker('What is missing or unknown'));
  const unkList=el('div',{class:'unknown-list'});
  for(const u of unknowns.slice(0,6))unkList.appendChild(el('div',{class:'unknown-item','data-portolan-id':u.id,'data-portolan-kind':'unknown'},routeLink(u.summary,u.route||('#/detail/unknown/'+u.id),{id:u.id,kind:'unknown',class:'unknown-summary'})));
  if(unknowns.length===0)panel.appendChild(el('p',{class:'muted'},text('No unknowns recorded.')));else panel.appendChild(unkList);
  main.appendChild(panel);
}
function countFamilies(comps){const s=new Set();for(const c of comps)s.add(c.c4_family||'unknown');return s.size;}

// Donut chart: each C4 family is a colored arc, proportional to component count.
// Gives an instant visual read of the landscape's shape.
function renderFamilyDonut(comps){
  const byFam=new Map();
  for(const c of comps){const f=c.c4_family||'unknown';byFam.set(f,(byFam.get(f)||0)+1);}
  const total=Math.max(1,comps.length);
  const order=['data-systems','compute-processing','platform-governance','packaging-runtime','coordination-community','integration-services','unknown'].filter(f=>byFam.has(f));
  const size=220,cx=size/2,cy=size/2,rOuter=92,rInner=58;
  const svg=svgEl('svg',{class:'family-donut',viewBox:`0 0 ${size} ${size}`,width:size,height:size,role:'img','aria-label':'Component count by C4 family'});
  let angle=-Math.PI/2; // start at top
  for(const fam of order){
    const count=byFam.get(fam);
    const sweep=(count/total)*Math.PI*2;
    const col=familyColor(fam);
    const path=arcPath(cx,cy,rOuter,rInner,angle,angle+sweep);
    const seg=svgEl('path',{d:path,fill:col.main,stroke:'var(--bg)','stroke-width':'2',class:'donut-seg','data-family':fam});
    seg.appendChild(svgEl('title',null,`${C4_FAMILY_LABELS[fam]||fam}: ${count} component${count===1?'':'s'}`));
    svg.appendChild(seg);
    angle+=sweep;
  }
  // Center label: total components.
  const center=svgEl('g',{class:'donut-center'});
  center.appendChild(svgEl('text',{x:cx,y:cy-4,'text-anchor':'middle',class:'donut-count'},String(comps.length)));
  center.appendChild(svgEl('text',{x:cx,y:cy+16,'text-anchor':'middle',class:'donut-label'},'components'));
  svg.appendChild(center);
  const wrap=el('div',{class:'donut-wrap'});
  wrap.appendChild(svg);
  return wrap;
}
// Annular sector path between two radii and two angles.
function arcPath(cx,cy,rO,rI,a0,a1){
  const large=(a1-a0)>Math.PI?1:0;
  const x0=cx+rO*Math.cos(a0),y0=cy+rO*Math.sin(a0);
  const x1=cx+rO*Math.cos(a1),y1=cy+rO*Math.sin(a1);
  const x2=cx+rI*Math.cos(a1),y2=cy+rI*Math.sin(a1);
  const x3=cx+rI*Math.cos(a0),y3=cy+rI*Math.sin(a0);
  return `M${x0} ${y0} A${rO} ${rO} 0 ${large} 1 ${x1} ${y1} L${x2} ${y2} A${rI} ${rI} 0 ${large} 0 ${x3} ${y3} Z`;
}
// Horizontal stacked bar showing family composition — a second visual read.
function renderFamilyDistribution(comps){
  const byFam=new Map();
  for(const c of comps){const f=c.c4_family||'unknown';byFam.set(f,(byFam.get(f)||0)+1);}
  const total=Math.max(1,comps.length);
  const order=['data-systems','compute-processing','platform-governance','packaging-runtime','coordination-community','integration-services','unknown'].filter(f=>byFam.has(f));
  const wrap=el('div',{class:'family-distribution'});
  wrap.appendChild(sectionKicker('Landscape composition by C4 family'));
  const bar=el('div',{class:'dist-bar',role:'img','aria-label':'Component distribution by family'});
  for(const fam of order){
    const count=byFam.get(fam);
    const col=familyColor(fam);
    const pct=(count/total)*100;
    const seg=el('div',{class:'dist-seg',style:`flex-grow:${count};background:${col.main}`,title:`${C4_FAMILY_LABELS[fam]||fam}: ${count} (${pct.toFixed(0)}%)`});
    bar.appendChild(seg);
  }
  wrap.appendChild(bar);
  // Legend below the bar.
  const legend=el('div',{class:'dist-legend'});
  for(const fam of order){
    const count=byFam.get(fam);const col=familyColor(fam);
    legend.appendChild(el('span',{class:'dist-leg-item'},el('span',{class:'dist-leg-swatch',style:`background:${col.main}`}),text(`${C4_FAMILY_LABELS[fam]||fam} · ${count}`)));
  }
  wrap.appendChild(legend);
  return wrap;
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
  const comps=(state.map.objects&&state.map.objects.components)||[];
  const rels=(state.map.objects&&state.map.objects.relationships)||[];
  panel.appendChild(sectionKicker('Container view — families and inter-family dependencies'));
  // Build a family-level dependency diagram: each family is a box; an edge exists
  // between two families when a component in one depends on a component in another.
  panel.appendChild(renderFamilyContainerDiagram(families,comps,rels));
  // Keep the detailed family cards below the diagram for drill-down.
  panel.appendChild(sectionKicker('Families — detail'));
  const grid=el('div',{class:'c4-family-grid'});
  for(const f of families){
    const card=el('a',{class:'card c4-family-card',href:`#${f.route}`,'data-portolan-id':f.id,'data-portolan-kind':'c4-family','data-portolan-route':f.route,'data-portolan-clickable':'true'});
    card.addEventListener('click',(ev)=>{ev.preventDefault();setHash('/c4/components/'+f.family);});
    const col=familyColor(f.family);
    card.style.borderColor=`rgba(${col.soft},0.35)`;
    card.appendChild(el('div',{class:'c4-family-marker',style:`background:${col.main}`}));
    card.appendChild(el('div',{class:'card-title'},text(f.display_name)));
    card.appendChild(el('p',{class:'muted'},text(f.purpose||'')));
    card.appendChild(el('div',{class:'card-meta'},el('span',{class:'badge badge-quiet'},text(`${f.component_ids.length} components`)),el('span',{class:'badge badge-quiet'},text(`${f.surface_count} surfaces`)),el('span',{class:'badge badge-quiet'},text(`${f.finding_count} findings`)),el('span',{class:'badge badge-quiet'},text(`${f.unknown_count} unknowns`))));
    card.appendChild(el('p',{class:'muted card-reason'},text(f.grouping_reason||'')));
    grid.appendChild(card);
  }
  panel.appendChild(grid);
}
// SVG container diagram: families as rounded boxes arranged in a grid, edges
// between families that have inter-family component dependencies. Edge width
// encodes the number of dependencies between the two families.
function renderFamilyContainerDiagram(families,comps,rels){
  if(families.length===0)return el('p',{class:'muted'},text('No C4 families recorded.'));
  // Map component → family.
  const compFam=new Map();
  for(const c of comps)compFam.set(c.id,c.c4_family||'unknown');
  // Count inter-family edges.
  const edgeCount=new Map(); // "famA|famB" → count
  for(const r of rels){
    const fa=compFam.get(r.from_id),fb=compFam.get(r.to_id);
    if(!fa||!fb||fa===fb)continue; // skip intra-family
    const key=[fa,fb].sort().join('|');
    edgeCount.set(key,(edgeCount.get(key)||0)+1);
  }
  // Layout: arrange family boxes in a grid.
  const cols=Math.ceil(Math.sqrt(families.length));
  const rows=Math.ceil(families.length/cols);
  const boxW=150,boxH=64,gapX=70,gapY=50;
  const w=cols*boxW+(cols-1)*gapX;
  const h=rows*boxH+(rows-1)*gapY;
  const pad=30;
  const famPos=new Map();
  families.forEach((f,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    famPos.set(f.family,{x:pad+col*(boxW+gapX),y:pad+row*(boxH+gapY),f});
  });
  const svg=svgEl('svg',{class:'c4-container-diagram',viewBox:`0 0 ${w+pad*2} ${h+pad*2}`,preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'C4 container diagram: families and inter-family dependencies'});
  // Edges first (under boxes).
  for(const [key,count] of edgeCount){
    const [fa,fb]=key.split('|');
    const a=famPos.get(fa),b=famPos.get(fb);
    if(!a||!b)continue;
    const ax=a.x+boxW/2,ay=a.y+boxH/2;
    const bx=b.x+boxW/2,by=b.y+boxH/2;
    const lw=Math.min(6,1.5+count*0.8);
    const line=svgEl('line',{x1:ax,y1:ay,x2:bx,y2:by,stroke:'rgba(168,181,255,0.3)','stroke-width':String(lw),'stroke-linecap':'round'});
    line.appendChild(svgEl('title',null,`${fa} ↔ ${fb}: ${count} inter-family dependenc${count===1?'y':'ies'}`));
    svg.appendChild(line);
  }
  // Boxes.
  for(const f of families){
    const p=famPos.get(f.family);if(!p)continue;
    const col=familyColor(f.family);
    const g=svgEl('g',{class:'c4-fam-box',transform:`translate(${p.x},${p.y})`,'data-portolan-id':f.id,'data-portolan-kind':'c4-family','data-portolan-route':f.route,'data-portolan-clickable':'true'});
    g.appendChild(svgEl('rect',{width:boxW,height:boxH,rx:10,fill:`rgba(${col.soft},0.12)`,stroke:col.main,'stroke-width':'1.5'}));
    g.appendChild(svgEl('text',{x:boxW/2,y:24,'text-anchor':'middle',class:'c4-box-title',fill:col.main},f.display_name));
    g.appendChild(svgEl('text',{x:boxW/2,y:44,'text-anchor':'middle',class:'c4-box-sub',fill:'var(--muted)'},`${f.component_ids.length} components`));
    g.addEventListener('click',(ev)=>{ev.preventDefault();setHash('/c4/components/'+f.family);});
    svg.appendChild(g);
  }
  const wrap=el('div',{class:'c4-diagram-wrap'});
  wrap.appendChild(svg);
  if(edgeCount.size===0)wrap.appendChild(el('p',{class:'muted graph-hint'},text('No inter-family dependencies observed — families are independent at this level.')));
  return wrap;
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
  panel.appendChild(el('p',{class:'muted map-intro'},text('Each circle is a component; lines are declared dependencies. Size shows how connected a component is, color shows its C4 family. Hover to focus, click to open its dossier.')));
  const comps=((state.map.objects&&state.map.objects.components)||[]);
  const rels=((state.map.objects&&state.map.objects.relationships)||[]);
  panel.appendChild(renderGraphLegend());
  panel.appendChild(renderGraphCanvas(comps,rels));
  // Surfaces toggle stays, but is no longer the focus of the view.
  const toggle=el('button',{class:'map-surface-toggle','data-portolan-clickable':'true'},text(state.mapShowSurfaces?'Hide attached surfaces':'Show attached surfaces'));
  toggle.addEventListener('click',()=>{state.mapShowSurfaces=!state.mapShowSurfaces;render();});
  if(state.mapShowSurfaces){
    const surfStrip=el('div',{class:'map-surface-strip'});
    surfStrip.appendChild(sectionKicker('Attached surfaces (revealed)'));
    const allSurfaces=((state.map.objects&&state.map.objects.surfaces)||[]);
    const sg=el('div',{class:'route-button-grid'});
    for(const sf of allSurfaces.slice(0,40))sg.appendChild(routeLink(sf.label,sf.route,{id:sf.id,kind:'surface',class:'chip surface-chip'}));
    if(allSurfaces.length===0)surfStrip.appendChild(el('p',{class:'muted'},text('No surfaces.')));else surfStrip.appendChild(sg);
    panel.appendChild(toggle);
    panel.appendChild(surfStrip);
  }
  main.appendChild(panel);
}

// Color swatch + label row showing what each family color encodes.
function renderGraphLegend(){
  const legend=el('div',{class:'graph-legend','aria-label':'C4 family color legend'});
  const families=Object.keys(C4_FAMILY_LABELS);
  for(const fam of families){
    const col=familyColor(fam);
    const item=el('div',{class:'legend-item'},el('span',{class:'legend-swatch',style:`background:${col.main};box-shadow:0 0 8px rgba(${col.soft},0.5)`}),el('span',{class:'legend-label'},text(C4_FAMILY_LABELS[fam])));
    legend.appendChild(item);
  }
  return legend;
}

// Build node/edge model, compute a radial family-clustered layout, draw SVG.
function renderGraphCanvas(comps,rels){
  // 1. Build graph model.
  const nodeMap=new Map();
  for(const c of comps){nodeMap.set(c.id,{id:c.id,comp:c,family:c.c4_family||'unknown',degree:0});}
  const edges=[];
  for(const r of rels){
    const from=nodeMap.get(r.from_id);const to=nodeMap.get(r.to_id);
    if(from&&to){from.degree++;to.degree++;edges.push({from:from,to:to,rel:r});}
  }
  const nodes=[...nodeMap.values()];
  // 2. Compute node radius from degree (importance).
  const maxDeg=Math.max(1,...nodes.map(n=>n.degree));
  for(const n of nodes){
    // base 9, scale up to 26 for the most-connected node; isolated nodes still 9.
    n.r=9+14*(n.degree/maxDeg);
  }
  // 3. Radial family-clustered layout: each family gets a sector angle; members fan out around it.
  layoutRadialClusters(nodes);
  // 4. Render SVG.
  const bounds=computeBounds(nodes,40);
  const canvas=el('div',{class:'map-canvas graph-stage','data-testid':'portolan-map'});
  const svg=svgEl('svg',{class:'graph-svg',viewBox:`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`,preserveAspectRatio:'xMidYMid meet',role:'img','aria-label':'Component dependency graph'});
  // defs: edge arrow marker + soft glow filter
  const defs=svgEl('defs');
  defs.appendChild(svgEl('marker',{id:'graph-arrow',viewBox:'0 0 10 10',refX:'9',refY:'5',markerWidth:'6',markerHeight:'6',orient:'auto-start-reverse'},
    svgEl('path',{d:'M0,0 L10,5 L0,10 z',fill:'rgba(168,181,255,0.55)'})));
  const glow=svgEl('filter',{id:'graph-glow',x:'-50%',y:'-50%',width:'200%',height:'200%'});
  glow.appendChild(svgEl('feGaussianBlur',{stdDeviation:'4',result:'blur'}));
  glow.appendChild(svgEl('feMerge',null,svgEl('feMergeNode',{in:'blur'}),svgEl('feMergeNode',{in:'SourceGraphic'})));
  defs.appendChild(glow);
  svg.appendChild(defs);
  // 5. Edges first (under nodes).
  const edgeLayer=svgEl('g',{class:'edge-layer'});
  for(const e of edges){
    const a=e.from,b=e.to;
    // straight segment, trimmed to node borders
    const dx=b.x-a.x,dy=b.y-a.y;
    const dist=Math.max(0.001,Math.hypot(dx,dy));
    const ux=dx/dist,uy=dy/dist;
    const x1=a.x+ux*a.r,y1=a.y+uy*a.r;
    const x2=b.x-ux*b.r,y2=b.y-uy*b.r;
    const line=svgEl('line',{class:'graph-edge',x1,y1,x2,y2,'data-portolan-id':e.rel.id,'data-portolan-kind':'relationship','data-portolan-route':e.rel.route,'data-portolan-clickable':'true','data-from':a.id,'data-to':b.id});
    line.setAttribute('marker-end','url(#graph-arrow)');
    line.addEventListener('click',(ev)=>{ev.preventDefault();setHash(e.rel.route.replace(/^#/,''));});
    edgeLayer.appendChild(line);
  }
  svg.appendChild(edgeLayer);
  // 6. Nodes.
  const nodeLayer=svgEl('g',{class:'node-layer'});
  for(const n of nodes){
    const col=familyColor(n.family);
    const g=svgEl('g',{class:'graph-node',transform:`translate(${n.x},${n.y})`,'data-portolan-id':n.id,'data-portolan-kind':'component','data-portolan-route':n.comp.route,'data-portolan-clickable':'true','data-family':n.family,'data-degree':String(n.degree),'data-testid':'portolan-map-node'});
    // lifecycle styling: retired = dashed ring, unknown = faint ring
    let ringDash='none',ringStroke=col.main;
    if(n.comp.lifecycle==='retired'){ringDash='4 3';ringStroke=col.glow;}
    g.appendChild(svgEl('circle',{class:'node-halo',r:String(n.r+6),fill:`rgba(${col.soft},0.10)`}));
    g.appendChild(svgEl('circle',{class:'node-ring',r:String(n.r+2),fill:'none',stroke:ringStroke,'stroke-width':'1.5','stroke-dasharray':ringDash,opacity:n.comp.lifecycle==='unknown'?'0.5':'0.8'}));
    g.appendChild(svgEl('circle',{class:'node-core',r:String(n.r),fill:col.main,stroke:col.glow,'stroke-width':'1.5',filter:'url(#graph-glow)'}));
    // label: always render for readability
    const label=n.comp.display_name;
    const labelY=n.r+16;
    g.appendChild(svgEl('text',{class:'node-label',y:String(labelY),'text-anchor':'middle'},label));
    g.addEventListener('click',(ev)=>{ev.preventDefault();setHash(n.comp.route.replace(/^#/,''));});
    g.addEventListener('mouseenter',()=>focusNode(svg,n.id));
    g.addEventListener('mouseleave',()=>unfocusAll(svg));
    nodeLayer.appendChild(g);
  }
  svg.appendChild(nodeLayer);
  // 7. Edge hover behavior delegated on svg.
  svg.addEventListener('mouseover',(ev)=>{
    const t=ev.target;
    if(t.classList&&t.classList.contains('graph-edge')){highlightEdge(svg,t.getAttribute('data-from'),t.getAttribute('data-to'));}
  });
  svg.addEventListener('mouseout',(ev)=>{
    const t=ev.target;
    if(t.classList&&t.classList.contains('graph-edge')){unfocusAll(svg);}
  });
  canvas.appendChild(svg);
  // 8. Hint line for isolated nodes.
  const isolated=nodes.filter(n=>n.degree===0);
  if(isolated.length>0){
    canvas.appendChild(el('p',{class:'muted graph-hint'},text(`${isolated.length} component(s) with no declared dependencies sit at the edge of their family cluster.`)));
  }
  return canvas;
}

// Radial layout: place families around a circle, fan members out within each family sector.
// Hubs (high-degree nodes) are pulled toward the center so the dense core is visible.
// Isolated nodes (degree 0) are placed on the outer orbit of their family to avoid the dense core.
function layoutRadialClusters(nodes){
  if(nodes.length===0)return;
  const families=['data-systems','compute-processing','platform-governance','packaging-runtime','coordination-community','integration-services','unknown'];
  const byFam=new Map();
  for(const f of families)byFam.set(f,[]);
  for(const n of nodes){(byFam.get(n.family)||byFam.get('unknown')).push(n);}
  const usedFamilies=families.filter(f=>(byFam.get(f)||[]).length>0);
  const k=usedFamilies.length;
  const sectorAngle=(Math.PI*2)/Math.max(1,k);
  const RING_BASE=230; // base family ring radius from global center
  const globalMaxDeg=Math.max(1,...nodes.map(n=>n.degree));
  usedFamilies.forEach((fam,fi)=>{
    const members=byFam.get(fam);
    const centerAngle=fi*sectorAngle-Math.PI/2; // start at top
    // Split into connected (have edges) and isolated (degree 0).
    const connected=members.filter(n=>n.degree>0).sort((a,b)=>b.degree-a.degree);
    const isolated=members.filter(n=>n.degree===0);
    // Family cluster center: pulled toward global origin proportional to its hub's importance.
    const hub=connected[0]||members[0];
    const hubPull=hub.degree/globalMaxDeg; // 0..1
    const cx=Math.cos(centerAngle)*RING_BASE*(1-0.5*hubPull);
    const cy=Math.sin(centerAngle)*RING_BASE*(1-0.5*hubPull);
    // Connected members: hub at cluster center, others on a ring around it.
    connected.forEach((n,i)=>{
      if(i===0){n.x=cx;n.y=cy;return;}
      // Distribute non-hub connected members evenly around the hub on a ring.
      // Use golden-angle spiral for even spacing regardless of count.
      const ringR=78+26*Math.floor((i-1)/6); // grow rings if many members
      const ang=centerAngle+Math.PI+((i-1)*2.399963); // golden angle offset from hub direction
      n.x=cx+Math.cos(ang)*ringR;
      n.y=cy+Math.sin(ang)*ringR;
    });
    // Isolated members: place on outer orbit in the family sector direction,
    // spread along an arc so they read as "edge of cluster, not connected".
    const isoBaseR=RING_BASE+115;
    isolated.forEach((n,i)=>{
      const spread=0.7; // radians of arc per isolated node — wider to avoid connected members
      const ang=centerAngle+(i-(isolated.length-1)/2)*spread;
      n.x=Math.cos(ang)*isoBaseR;
      n.y=Math.sin(ang)*isoBaseR;
    });
  });
  // Resolve gross overlaps between clusters with a light relaxation pass.
  relax(nodes,55,24);
}
// Simple overlap resolution: push apart any two nodes closer than minDist, a few iterations.
function relax(nodes,minDist,iterations){
  for(let iter=0;iter<iterations;iter++){
    for(let i=0;i<nodes.length;i++){
      for(let j=i+1;j<nodes.length;j++){
        const a=nodes[i],b=nodes[j];
        const dx=b.x-a.x,dy=b.y-a.y;
        const d=Math.hypot(dx,dy);
        const want=a.r+b.r+minDist;
        if(d<want&&d>0.001){
          const push=(want-d)/2;
          const ux=dx/d,uy=dy/d;
          a.x-=ux*push;a.y-=uy*push;
          b.x+=ux*push;b.y+=uy*push;
        }
      }
    }
  }
}
function computeBounds(nodes,pad){
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
  for(const n of nodes){
    // Account for node radius + label height below the node so labels never clip.
    const r=n.r+28;
    minX=Math.min(minX,n.x-r);minY=Math.min(minY,n.y-r);
    maxX=Math.max(maxX,n.x+r);maxY=Math.max(maxY,n.y+r);
  }
  if(!isFinite(minX)){minX=0;minY=0;maxX=600;maxY=400;}
  return {minX:minX-pad,minY:minY-pad,maxX:maxX+pad,maxY:maxY+pad,width:(maxX-minX)+pad*2,height:(maxY-minY)+pad*2};
}
// Highlight a node and its connected edges; dim everything else.
function focusNode(svg,id){
  const edges=svg.querySelectorAll('.graph-edge');
  const nodes=svg.querySelectorAll('.graph-node');
  const connected=new Set([id]);
  edges.forEach(e=>{
    const from=e.getAttribute('data-from'),to=e.getAttribute('data-to');
    if(from===id||to===id){e.classList.add('is-active');connected.add(from);connected.add(to);}
    else e.classList.add('is-dim');
  });
  nodes.forEach(n=>{
    if(connected.has(n.getAttribute('data-portolan-id')))n.classList.remove('is-dim');
    else n.classList.add('is-dim');
  });
}
function highlightEdge(svg,fromId,toId){
  const nodes=svg.querySelectorAll('.graph-node');
  const keep=new Set([fromId,toId]);
  nodes.forEach(n=>{if(!keep.has(n.getAttribute('data-portolan-id')))n.classList.add('is-dim');});
  svg.querySelectorAll('.graph-edge').forEach(e=>{
    if(e.getAttribute('data-from')!==fromId||e.getAttribute('data-to')!==toId)e.classList.add('is-dim');
  });
}
function unfocusAll(svg){
  svg.querySelectorAll('.is-dim,.is-active').forEach(e=>{e.classList.remove('is-dim');e.classList.remove('is-active');});
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

function renderSearch(main){
  const q=(state.query||'').toLowerCase().trim();
  const panel=el('section',{class:'panel search-panel'});
  panel.appendChild(el('h1',{class:'panel-title'},text(q?('Results for "'+state.query+'"'):'Search')));
  if(!q){panel.appendChild(el('p',{class:'muted'},text('Type to search components, repositories, surfaces, findings, and relationships.')));main.appendChild(panel);return;}
  const o=state.map.objects||{};
  // Search every object kind per Feature 9.
  const matches=[];
  const pushMatches=(arr,label)=>{for(const x of (arr||[])){const blob=JSON.stringify(x).toLowerCase();if(blob.includes(q))matches.push({obj:x,kind:label});}};
  pushMatches(o.components,'component');
  pushMatches(o.repositories,'repository');
  pushMatches(o.surfaces,'surface');
  pushMatches(o.relationships,'relationship');
  pushMatches(o.findings,'finding');
  pushMatches(o.unknowns,'unknown');
  panel.appendChild(el('p',{class:'muted'},text(matches.length+' match(es) across all object kinds')));
  // Group by kind.
  const byKind={};
  for(const m of matches){(byKind[m.kind]=byKind[m.kind]||[]).push(m);}
  const kindOrder=['component','repository','surface','relationship','finding','unknown'];
  for(const k of kindOrder){
    const items=byKind[k];if(!items||!items.length)continue;
    panel.appendChild(el('h3',{class:'family-heading'},text(k+' ('+items.length+')')));
    const grid=el('div',{class:'route-button-grid'});
    for(const m of items){
      const obj=m.obj;const label=obj.display_name||obj.label||obj.summary||obj.id;
      grid.appendChild(routeLink(label,obj.route||('#/detail/'+k+'/'+obj.id),{id:obj.id,kind:k,class:'card search-result-card'}));
    }
    panel.appendChild(grid);
  }
  if(matches.length===0)panel.appendChild(el('p',{class:'muted'},text('No objects match this query.')));
  main.appendChild(panel);
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
