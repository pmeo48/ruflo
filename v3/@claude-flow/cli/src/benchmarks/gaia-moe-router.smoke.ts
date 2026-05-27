/**
 * MoE Router Smoke Tests — ADR-135 Track G
 *
 * Validates the heuristic gating network and public API surface.  All tests
 * use mocked / synthetic GaiaQuestion objects — no HF_TOKEN required, no
 * external network calls, no @ruvector dependency.
 *
 * 10 assertions covering:
 *   1. Factual question → factual_lookup
 *   2. Computational question → computational
 *   3. Multi-hop question → multi_hop
 *   4. Multimodal question (image attachment) → multimodal
 *   5. List/count question → list_aggregation
 *   6. Fallback for unknown type → general (fallbackUsed=true)
 *   7. applyExpertRouting merges model + maxTurns correctly
 *   8. applyExpertRouting preserves caller overrides (model, maxTurns)
 *   9. routeToExpert with custom thresholds changes routing result
 *  10. extractGatingFeatures returns all 12 expected keys
 *
 * Run: npx ts-node --esm src/benchmarks/gaia-moe-router.smoke.ts
 * Or:  node --loader ts-node/esm src/benchmarks/gaia-moe-router.smoke.ts
 *
 * Refs: ADR-135, #2156
 */

import {
  routeToExpert,
  extractGatingFeatures,
  applyExpertRouting,
  EXPERT_PROFILES,
} from './gaia-moe-router.js';
import type { GaiaQuestion } from './gaia-loader.js';

// ---------------------------------------------------------------------------
// Minimal fixture factory
// ---------------------------------------------------------------------------

function makeQ(
  question: string,
  level: 1 | 2 | 3 = 1,
  fileName: string | null = null,
): GaiaQuestion {
  return {
    task_id: `smoke-${Math.random().toString(36).slice(2, 8)}`,
    level,
    question,
    final_answer: '',
    file_name: fileName,
    file_path: fileName ? `/tmp/${fileName}` : null,
  };
}

// ---------------------------------------------------------------------------
// Test runner (zero dependencies — no vitest/jest needed)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const errors: string[] = [];

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS  ${message}`);
  } else {
    failed++;
    errors.push(message);
    console.error(`  FAIL  ${message}`);
  }
}

async function runSmoke(): Promise<void> {
  console.log('\n=== ADR-135 Track G — MoE Router Smoke Tests ===\n');

  // ------------------------------------------------------------------
  // Test 1: Factual question → factual_lookup
  // ------------------------------------------------------------------
  {
    const q = makeQ('What year was the Eiffel Tower built?', 1);
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'factual_lookup',
      'Test 1: "What year…" → factual_lookup',
    );
  }

  // ------------------------------------------------------------------
  // Test 2: Computational question → computational
  // ------------------------------------------------------------------
  {
    const q = makeQ('Calculate the average of 45, 67, 89, and 123.', 1);
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'computational',
      'Test 2: "Calculate the average…" → computational',
    );
  }

  // ------------------------------------------------------------------
  // Test 3: Multi-hop question → multi_hop
  // ------------------------------------------------------------------
  {
    const q = makeQ(
      'Who was the first president of France after the connection between Napoleon Bonaparte ' +
      'and the French Revolution was established?',
      2,
    );
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'multi_hop',
      'Test 3: "connection between Napoleon…" → multi_hop',
    );
  }

  // ------------------------------------------------------------------
  // Test 4: Multimodal question → multimodal
  // ------------------------------------------------------------------
  {
    const q = makeQ(
      'What is the animal shown in the attached image?',
      1,
      'animal_photo.jpg',
    );
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'multimodal',
      'Test 4: image attachment (.jpg) → multimodal',
    );
    assert(
      decision.confidence > 0,
      'Test 4b: multimodal routing has non-zero confidence',
    );
  }

  // ------------------------------------------------------------------
  // Test 5: List/count question → list_aggregation
  // ------------------------------------------------------------------
  {
    const q = makeQ('How many countries are in the United Nations as of 2024?', 1);
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'list_aggregation',
      'Test 5: "How many countries…" → list_aggregation',
    );
  }

  // ------------------------------------------------------------------
  // Test 6: Ambiguous / unknown type → general (fallbackUsed = true)
  // ------------------------------------------------------------------
  {
    const q = makeQ('Explain the significance of the color blue in art history.', 2);
    const decision = await routeToExpert(q);
    assert(
      decision.expert.id === 'general',
      'Test 6: ambiguous question → general (catchall)',
    );
    assert(
      decision.fallbackUsed === true,
      'Test 6b: general routing sets fallbackUsed=true',
    );
  }

  // ------------------------------------------------------------------
  // Test 7: applyExpertRouting sets model + maxTurns from expert profile
  // ------------------------------------------------------------------
  {
    const q = makeQ('Calculate the square root of 144 plus 5.', 1);
    const decision = await routeToExpert(q);
    const baseOptions = { systemPrompt: 'You are a GAIA agent.' };
    const merged = applyExpertRouting(decision, baseOptions);

    assert(
      merged.model === decision.expert.recommendedModel,
      'Test 7: applyExpertRouting sets model from expert profile',
    );
    assert(
      merged.maxTurns === decision.expert.recommendedMaxTurns,
      'Test 7b: applyExpertRouting sets maxTurns from expert profile',
    );
    assert(
      typeof merged.systemPrompt === 'string' &&
        (merged.systemPrompt as string).includes(decision.expert.systemPromptAddendum),
      'Test 7c: applyExpertRouting appends systemPromptAddendum',
    );
  }

  // ------------------------------------------------------------------
  // Test 8: applyExpertRouting preserves caller overrides
  // ------------------------------------------------------------------
  {
    const q = makeQ('What is 2 + 2?', 1);
    const decision = await routeToExpert(q);
    const baseOptions = {
      systemPrompt: 'Custom system prompt.',
      model: 'opus',         // explicit override
      maxTurns: 99,          // explicit override
    };
    const merged = applyExpertRouting(decision, baseOptions);

    assert(
      merged.model === 'opus',
      'Test 8: applyExpertRouting preserves caller model override',
    );
    assert(
      merged.maxTurns === 99,
      'Test 8b: applyExpertRouting preserves caller maxTurns override',
    );
  }

  // ------------------------------------------------------------------
  // Test 9: routeToExpert with custom thresholds changes routing
  // ------------------------------------------------------------------
  {
    // Use a Level 2 question with count keywords.  Default routing:
    // 'how many' is in COUNT_KEYWORDS → list_aggregation.
    // With list_aggregation threshold raised to 2 (impossible to fire),
    // the question has 'year' in DATE_KEYWORDS → temporal.
    // (Level 2 → level_norm > 1/3, so factual_lookup shortcut won't fire.
    //  No relational / comparative keywords in this sentence.)
    const q = makeQ('How many years did the expedition last in that century?', 2);
    const decisionDefault = await routeToExpert(q);
    assert(
      decisionDefault.expert.id === 'list_aggregation',
      'Test 9: default routing: "How many years did…" → list_aggregation',
    );

    // Raise list_aggregation threshold so it never fires.
    // Next matching rule: has_date_keywords ('years', 'century') → temporal.
    const decisionHighThreshold = await routeToExpert(q, {
      thresholds: { list_aggregation: 2 },
    });
    assert(
      decisionHighThreshold.expert.id === 'temporal',
      'Test 9b: raised list_aggregation threshold → temporal (date keywords fire)',
    );
  }

  // ------------------------------------------------------------------
  // Test 10: extractGatingFeatures returns all 12 expected keys
  // ------------------------------------------------------------------
  {
    const q = makeQ('Who invented the telephone in 1876?', 1);
    const features = extractGatingFeatures(q);
    const expectedKeys = [
      'has_file_attachment',
      'has_image_or_video',
      'has_digits',
      'has_calc_keywords',
      'has_date_keywords',
      'has_count_keywords',
      'has_relational_keywords',
      'has_comparative_keywords',
      'named_entity_density',
      'question_length_norm',
      'level_norm',
      'has_multiple_sentences',
    ];
    const missingKeys = expectedKeys.filter(k => !(k in features));
    assert(
      missingKeys.length === 0,
      `Test 10: extractGatingFeatures returns all 12 keys (missing: ${missingKeys.join(', ') || 'none'})`,
    );
    // All values must be in [0, 1]
    const outOfRange = Object.entries(features).filter(([, v]) => v < 0 || v > 1);
    assert(
      outOfRange.length === 0,
      `Test 10b: all feature values are in [0, 1] (out-of-range: ${outOfRange.map(([k]) => k).join(', ') || 'none'})`,
    );
  }

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  const total = passed + failed;
  console.log(`\n--- Results: ${passed}/${total} passed ---`);
  if (failed > 0) {
    console.error('\nFailed assertions:');
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('All smoke tests passed.\n');
  }
}

runSmoke().catch(err => {
  console.error('Smoke test runner threw:', err);
  process.exit(1);
});
