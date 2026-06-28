/**
 * Use-case: validate the evidence-promotion atlas artifacts.
 *
 * Read-only: reads the 7 promotion artifacts via the reader port and delegates
 * to the pure domain validator (validatePromotionAtlas). Returns { errors };
 * the driver decides the exit code. Mirrors the legacy validate() body.
 *
 * Use-case layer — depends on domain + ports (via args).
 */
'use strict';

const P = require('../domain/promotion-atlas');

function validatePromotionAtlas({ reader, completion }) {
  const registry = reader.readJson('evidence-families.json');
  const matrix = reader.readJson('promotion-matrix.json');
  const queryIndex = reader.readJson('promotion-query-index.json');
  const health = reader.readJsonl('promotion-health.jsonl');
  const classified = reader.readJsonl('classified-sources.jsonl');
  const raw = reader.readJsonl('raw-artifacts.jsonl');

  const promotedStat = reader.stat('promoted-facts.jsonl');
  const promotedLarge = promotedStat !== null && promotedStat.size > 256 * 1024 * 1024;
  const promoted = promotedLarge ? null : reader.readJsonl('promoted-facts.jsonl');

  return P.validatePromotionAtlas({
    registry, matrix, queryIndex,
    health, classified, raw, promoted, completion,
    sizeOf: (name) => reader.size(name),
    hasArtifact: (name) => reader.exists(name),
  });
}

module.exports = { validatePromotionAtlas };
