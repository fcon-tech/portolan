/**
 * Port: navigator interface.
 *
 * Contract for routing. Decouples use-cases from the routing mechanism:
 * window.location.hash (today), or a future in-app/agent-driven navigator.
 * The composition root injects one navigator; use-cases call route()/onRouteChange().
 *
 * Ports layer — may reference domain types, never adapters.
 *
 * Contract:
 *
 *   Navigator = {
 *     // The current route fragment (e.g. '/map', '/dossier/component/x').
 *     current(): string,
 *
 *     // Navigate to a route fragment. Updates the address + notifies subscribers.
 *     route(fragment): void,
 *
 *     // Subscribe to route changes (back/forward, direct edit, programmatic).
 *     // handler receives the new fragment. Returns unsubscribe.
 *     onRouteChange(handler): () => void,
 *   }
 */
'use strict';

function isNavigator(n) {
  return !!(n && typeof n.current === 'function' && typeof n.route === 'function' && typeof n.onRouteChange === 'function');
}

module.exports = { isNavigator };
