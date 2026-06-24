/**
 * Adapter: SVG graph renderer.
 *
 * Implements the GraphRenderer port for SVG (Part 1). Renders the graph model
 * (nodes/edges/bounds from open-behaviour-map) into an <svg> and emits abstract
 * events (node-click, node-hover, edge-click) that use-case logic listens to.
 * The WebGL renderer (Part 2) will implement the same port via ray-picking.
 *
 * Receives an injectable `document` (defaults to the global) so it is testable
 * without a real DOM. This is the ONLY adapter that touches SVG/DOM events.
 *
 * Adapters layer — may depend on ports.
 */
'use strict';

const SVG_NS = 'http://www.w3.org/2000/svg';

function createSvgGraphRenderer(container, opts = {}) {
  const doc = opts.document || (typeof document !== 'undefined' ? document : null);
  if (!doc) throw new Error('svg-graph-renderer requires a document (inject for tests)');
  const eventHandlers = new Set();
  let svg = null;
  let nodeIndex = new Map(); // id -> { group, data }
  let edgeIndex = new Map(); // id -> { line, data }
  let alive = true;

  function emit(event) { for (const fn of eventHandlers) fn(event); }
  function svgEl(tag, attrs, children) {
    const node = doc.createElementNS(SVG_NS, tag);
    const a = attrs || {};
    for (const [k, v] of Object.entries(a)) {
      if (v == null || v === false) continue;
      node.setAttribute(k, v);
    }
    for (const child of (children || [])) {
      if (child == null) continue;
      node.appendChild(typeof child === 'string' ? doc.createTextNode(child) : child);
    }
    return node;
  }

  function render(model, theme) {
    // Clear previous render.
    if (svg && svg.parentNode === container) container.removeChild(svg);
    nodeIndex = new Map();
    edgeIndex = new Map();
    const b = model.bounds;
    svg = svgEl('svg', {
      class: 'graph-svg',
      viewBox: `${b.minX} ${b.minY} ${b.width} ${b.height}`,
      preserveAspectRatio: 'xMidYMid meet',
      role: 'img',
      'aria-label': 'Component dependency graph',
    });

    // defs: arrow marker + glow filter.
    const defs = svgEl('defs');
    defs.appendChild(svgEl('marker', {
      id: 'graph-arrow', viewBox: '0 0 10 10', refX: '9', refY: '5',
      markerWidth: '6', markerHeight: '6', orient: 'auto-start-reverse',
    }, [svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: 'rgba(168,181,255,0.55)' })]));
    if (theme.graph.haloMode === 'glow') {
      const glow = svgEl('filter', { id: 'graph-glow', x: '-50%', y: '-50%', width: '200%', height: '200%' });
      glow.appendChild(svgEl('feGaussianBlur', { stdDeviation: '4', result: 'blur' }));
      glow.appendChild(svgEl('feMerge', null, [svgEl('feMergeNode', { in: 'blur' }), svgEl('feMergeNode', { in: 'SourceGraphic' })]));
      defs.appendChild(glow);
    }
    svg.appendChild(defs);

    // Edges first (under nodes).
    const edgeLayer = svgEl('g', { class: 'edge-layer' });
    for (const e of model.edges) {
      const line = svgEl('line', {
        class: 'graph-edge',
        x1: e.x1, y1: e.y1, x2: e.x2, y2: e.y2,
        'data-portolan-id': e.id,
        'data-portolan-kind': 'relationship',
        'data-portolan-route': e.route,
        'data-portolan-clickable': 'true',
        'data-from': e.fromId, 'data-to': e.toId,
        'marker-end': 'url(#graph-arrow)',
      });
      line.addEventListener('click', (ev) => { ev.preventDefault(); emit({ type: 'edge-click', id: e.id }); });
      edgeLayer.appendChild(line);
      edgeIndex.set(e.id, { line, data: e });
    }
    svg.appendChild(edgeLayer);

    // Nodes.
    const nodeLayer = svgEl('g', { class: 'node-layer' });
    for (const n of model.nodes) {
      const col = (theme.families[n.family] || theme.families.unknown) || { main: '#888', glow: '#aaa', ink: '#444', soft: '136,136,136' };
      let ringDash = 'none', ringStroke = col.main;
      if (n.lifecycle === 'retired') { ringDash = '4 3'; ringStroke = col.glow; }
      const g = svgEl('g', {
        class: 'graph-node',
        transform: `translate(${n.x},${n.y})`,
        'data-portolan-id': n.id,
        'data-portolan-kind': 'component',
        'data-portolan-route': n.route,
        'data-portolan-clickable': 'true',
        'data-family': n.family,
      });
      g.appendChild(svgEl('circle', {
        class: 'node-halo', r: String(n.r + 6),
        fill: `rgba(${col.soft},0.10)`,
      }));
      g.appendChild(svgEl('circle', {
        class: 'node-ring', r: String(n.r + 2), fill: 'none',
        stroke: ringStroke, 'stroke-width': '1.5', 'stroke-dasharray': ringDash,
        opacity: n.lifecycle === 'unknown' ? '0.5' : '0.8',
      }));
      const coreAttrs = { class: 'node-core', r: String(n.r), fill: col.main, stroke: col.glow, 'stroke-width': '1.5' };
      if (theme.graph.haloMode === 'glow') coreAttrs.filter = 'url(#graph-glow)';
      g.appendChild(svgEl('circle', coreAttrs));
      g.appendChild(svgEl('text', { class: 'node-label', y: String(n.r + 16), 'text-anchor': 'middle' }, [n.label]));
      g.addEventListener('click', (ev) => { ev.preventDefault(); emit({ type: 'node-click', id: n.id }); });
      g.addEventListener('mouseenter', () => { emit({ type: 'node-hover', id: n.id }); });
      g.addEventListener('mouseleave', () => { emit({ type: 'node-hover', id: null }); });
      nodeLayer.appendChild(g);
      nodeIndex.set(n.id, { group: g, data: n });
    }
    svg.appendChild(nodeLayer);
    container.appendChild(svg);
  }

  function focusNode(id) {
    if (!svg) return;
    if (id == null) {
      svg.querySelectorAll('.is-dim,.is-active').forEach(e => { e.classList.remove('is-dim'); e.classList.remove('is-active'); });
      return;
    }
    const connected = new Set([id]);
    svg.querySelectorAll('.graph-edge').forEach(e => {
      const from = e.getAttribute('data-from'), to = e.getAttribute('data-to');
      if (from === id || to === id) { e.classList.add('is-active'); connected.add(from); connected.add(to); }
      else e.classList.add('is-dim');
    });
    svg.querySelectorAll('.graph-node').forEach(n => {
      if (connected.has(n.getAttribute('data-portolan-id'))) n.classList.remove('is-dim');
      else n.classList.add('is-dim');
    });
  }

  function onEvent(handler) {
    eventHandlers.add(handler);
    return () => eventHandlers.delete(handler);
  }

  function destroy() {
    alive = false;
    eventHandlers.clear();
    nodeIndex.clear();
    edgeIndex.clear();
    if (svg && svg.parentNode === container) container.removeChild(svg);
    svg = null;
  }

  return { render, focusNode, onEvent, destroy };
}

module.exports = { createSvgGraphRenderer };
