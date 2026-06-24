/**
 * Domain: route helpers.
 *
 * Single responsibility: convert object ids to stable route fragments per the
 * route contract: #/dossier/<kind>/<id> and #/detail/<kind>/<id>.
 *
 * Pure functions, zero dependencies. Domain layer — may not import use-cases,
 * ports, or adapters.
 *
 * Note: component ids are prefixed "component:" in objects but the prefix is
 * stripped from routes (shortId).
 */
'use strict';

function shortId(id) {
  return String(id || '')
    .replace(/^component:/, '')
    .trim();
}

function route(kind, id) {
  return `#/dossier/${kind}/${shortId(id)}`;
}

function detailRoute(kind, id) {
  return `#/detail/${kind}/${shortId(id)}`;
}

module.exports = { shortId, route, detailRoute };
