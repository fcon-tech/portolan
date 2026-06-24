/**
 * Id and route helpers for the system map. Pure functions.
 *
 * Single responsibility: convert object ids to stable route fragments per the
 * DOM/route contract (Feature 9): #/dossier/<kind>/<id> and #/detail/<kind>/<id>.
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
