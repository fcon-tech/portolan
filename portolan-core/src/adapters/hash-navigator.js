/**
 * Adapter: hash navigator.
 *
 * Implements the Navigator port on top of window.location.hash + pushState.
 * Decouples use-cases from the routing mechanism. A test/agent navigator could
 * implement the same port without a browser.
 *
 * Adapters layer — the only place window/history lives.
 */
'use strict';

function currentFragment() {
  return (typeof window !== 'undefined' ? window.location.hash : '').replace(/^#\/?/, '');
}

function createHashNavigator() {
  const listeners = new Set();
  function emit() {
    const frag = currentFragment();
    for (const fn of listeners) fn(frag);
  }
  let bound = false;
  function bind() {
    if (bound || typeof window === 'undefined') return;
    bound = true;
    window.addEventListener('hashchange', emit);
  }
  bind();
  return {
    current() { return currentFragment(); },
    route(fragment) {
      const target = fragment.startsWith('#') ? fragment : `#${fragment}`;
      if (typeof window === 'undefined') return;
      if (window.location.hash !== target) {
        window.history.pushState(null, '', target);
      }
      emit();
    },
    onRouteChange(handler) {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}

module.exports = { createHashNavigator };
