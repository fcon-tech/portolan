/**
 * Port: graph renderer interface.
 *
 * This is a CONTRACT, not an implementation. Use-cases depend on this shape;
 * adapters (svg-graph-renderer today, webgl-graph-renderer in Part 2) implement
 * it. The port decouples graph-model + interaction logic from the rendering
 * technology, so switching SVG -> WebGL is a one-adapter swap.
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   createGraphRenderer(container, opts) -> GraphRenderer
 *
 *   GraphRenderer = {
 *     // Render (or re-render) the graph model into the container.
 *     //   model: { nodes: [{id,x,y,r,family,lifecycle,label,route}],
 *     //            edges: [{id,fromId,toId,route,weight}],
 *     //            bounds: {minX,minY,width,height} }
 *     //   theme: theme tokens (see theme-provider port)
 *     render(model, theme): void,
 *
 *     // Apply a focus state: highlight the node + its connected edges,
 *     // dim everything else. id=null clears focus.
 *     focusNode(id|null): void,
 *
 *     // Subscribe to abstract graph events. Returns an unsubscribe fn.
 *     // Event shapes:
 *     //   { type: 'node-click',  id }   — a node was clicked
 *     //   { type: 'node-hover',   id|null }
 *     //   { type: 'edge-click',   id }   — an edge was clicked
 *     onEvent(handler): () => void,
 *
 *     // Tear down: remove listeners, free resources (canvas/GL context).
 *     destroy(): void,
 *   }
 *
 * The event contract is the key seam: use-case logic (routing, dossier drill-
 * down) listens to these abstract events; it never touches DOM or canvas. The
 * SVG adapter emits them via DOM events; the WebGL adapter will emit them via
 * ray-picking.
 */
'use strict';

/**
 * Validate that an object satisfies the GraphRenderer contract. Used by the
 * composition root to fail fast if an adapter is malformed.
 * @param {object} r
 * @returns {boolean}
 */
function isGraphRenderer(r) {
  return !!(r && typeof r.render === 'function' && typeof r.focusNode === 'function'
    && typeof r.onEvent === 'function' && typeof r.destroy === 'function');
}

module.exports = { isGraphRenderer };
