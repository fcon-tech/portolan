/**
 * Use-case: add agent-producer hypotheses to the snapshot (charter 08 Part-1b
 * "agent-producer data path").
 *
 * Single responsibility: validate and append an agent hypothesis (with
 * confidence tag) to the atlas's objects.hypotheses array. Enforces the Trust
 * Contract: deterministic producers may emit ironclad only; agent producers may
 * not emit ironclad; hypothesis-with-facts with empty evidence is downgraded.
 *
 * PURE (operates on the atlas object in place; no I/O). The snapshot writer
 * adapter persists the result.
 *
 * Use-case layer — depends on domain.
 */
'use strict';

const { confidenceForProducer, canEmit, downgradeUnresolvable } = require('../domain/confidence');

/**
 * Add a single hypothesis to the atlas.
 * @param {object} atlas - the snapshot (mutated: hypothesis appended)
 * @param {object} h - { id, claim, producer_family, confidence, evidence, affected_ids?, finding_type?, route? }
 * @throws if confidence is forbidden for the producer family, or id is duplicate
 */
function addHypothesis(atlas, h) {
  if (!atlas.objects) atlas.objects = {};
  if (!Array.isArray(atlas.objects.hypotheses)) atlas.objects.hypotheses = [];
  // Enforce: agent producers cannot emit ironclad.
  if (!canEmit(h.producer_family, h.confidence)) {
    throw new Error(`producer "${h.producer_family}" cannot emit confidence "${h.confidence}" (ironclad is deterministic-core only)`);
  }
  // Downgrade hypothesis-with-facts with empty evidence source.
  const finalConfidence = downgradeUnresolvable(h.confidence, h.evidence && h.evidence.source);
  // Duplicate id check.
  if (atlas.objects.hypotheses.some(existing => existing.id === h.id)) {
    throw new Error(`duplicate hypothesis id: "${h.id}"`);
  }
  atlas.objects.hypotheses.push({
    id: h.id,
    claim: h.claim,
    producer_family: h.producer_family,
    confidence: finalConfidence,
    evidence: h.evidence,
    ...(h.affected_ids ? { affected_ids: h.affected_ids } : {}),
    ...(h.finding_type ? { finding_type: h.finding_type } : {}),
    ...(h.route ? { route: h.route } : {}),
  });
}

/**
 * Add multiple hypotheses.
 * @param {object} atlas
 * @param {object[]} hypotheses
 */
function addHypotheses(atlas, hypotheses) {
  for (const h of hypotheses) addHypothesis(atlas, h);
}

/**
 * Read all hypotheses from the atlas.
 * @param {object} atlas
 * @returns {object[]}
 */
function getHypotheses(atlas) {
  return (atlas && atlas.objects && atlas.objects.hypotheses) || [];
}

module.exports = { addHypothesis, addHypotheses, getHypotheses };
