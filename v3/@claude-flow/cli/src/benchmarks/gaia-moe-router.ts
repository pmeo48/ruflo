/**
 * GAIA MoE Expert Router — ADR-135 Track G
 *
 * Routes each GAIA question to one of 8 specialist experts based on
 * extracted question features (a heuristic gating network by default).
 *
 * Production upgrade path: replace `heuristicGate` with ruflo's actual
 * 8-expert MoE gating network via `@ruvector/sona`.  The SONA module
 * includes a trained MoE router that maps the same 12-dim feature vector
 * to expert logits — swap by setting `options.gatingNetwork = 'sona'` and
 * injecting the ruvector MCP client.  The feature extraction contract
 * (`extractGatingFeatures`) is identical between both modes.
 *
 * Track G rationale (honest framing):
 *   HAL baseline = 82.07% on 53-Q L1 (iter 41 confirmed).
 *   Ruflo iter 35 = 49.1% (gap = 33pp).
 *   Track G adds SPECIALIST ROUTING — each expert has a tailored system
 *   prompt addendum + preferred tool subset + tuned turn budget + model
 *   tier.  ADR-135 estimated the full 10-track suite at +3-8pp; post-iter-41
 *   honest estimate: +2-5pp.  Track G is ONE of those contributors.
 *
 * This module is NOT wired into gaia-agent.ts yet (avoid conflict with
 * in-flight iter 39 measurements).  Wiring is a follow-up PR.
 *
 * Plugin sync TODO: when wiring, add --enable-moe flag to
 *   plugins/ruflo-workflows/commands/gaia-run.md
 *   plugins/ruflo-workflows/skills/gaia-architecture-comparison/SKILL.md
 *
 * Refs: ADR-135, ADR-133, #2156
 */

import type { GaiaQuestion } from './gaia-loader.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ExpertId =
  | 'factual_lookup'    // Wikipedia / simple web facts
  | 'computational'     // math, statistics, code execution
  | 'multi_hop'         // chain reasoning across entities
  | 'multimodal'        // image, video, audio
  | 'temporal'          // date / time / sequence questions
  | 'list_aggregation'  // count, enumerate, list-of
  | 'comparative'       // "which is bigger", "between X and Y"
  | 'general';          // catchall

export interface ExpertProfile {
  id: ExpertId;
  description: string;
  /** Appended verbatim to the agent's main system prompt for this question. */
  systemPromptAddendum: string;
  /** Tool subset this expert prefers (ordered by priority). */
  recommendedTools: string[];
  /** Suggested maxTurns for the agent loop when routed to this expert. */
  recommendedMaxTurns: number;
  /** Model tier recommendation for cost/quality trade-off. */
  recommendedModel: 'haiku' | 'sonnet' | 'opus';
}

export interface RouterDecision {
  expert: ExpertProfile;
  /** 12-dim feature vector used by the gating network, keyed by feature name. */
  features: Record<string, number>;
  /** Gating confidence in [0, 1]. */
  confidence: number;
  /** True when no specific expert fired and the 'general' catchall was used. */
  fallbackUsed: boolean;
}

export interface MoERouterOptions {
  /**
   * 'heuristic' — rule-based gating (default, zero external deps).
   * 'mock'      — deterministic stub for unit tests (returns features directly).
   *
   * Production upgrade: add 'sona' which calls ruflo's actual 8-expert MoE
   * gating network via the @ruvector/sona MCP tool, accepting the same
   * 12-dim feature vector and returning expert logits + confidence scores.
   */
  gatingNetwork?: 'heuristic' | 'mock';
  /**
   * Override confidence thresholds for each heuristic rule.
   * Keys match feature names; values are minimum activation scores [0, 1].
   */
  thresholds?: Partial<Record<string, number>>;
}

// ---------------------------------------------------------------------------
// Expert profiles (8 experts)
// ---------------------------------------------------------------------------

/**
 * Default expert profiles.  Each profile is a first-class citizen; callers
 * may override individual fields (e.g. recommendedModel) when constructing
 * a custom routing configuration.
 */
export const EXPERT_PROFILES: Readonly<Record<ExpertId, ExpertProfile>> = {
  factual_lookup: {
    id: 'factual_lookup',
    description: 'Single-fact questions answerable via Wikipedia or web search',
    systemPromptAddendum:
      'You will answer a factual question. Use grounded_query or web_search. ' +
      'Aim for a single focused tool call. Be concise — the answer is typically one entity, ' +
      'date, number, or short phrase.',
    recommendedTools: ['grounded_query', 'web_search'],
    recommendedMaxTurns: 4,
    recommendedModel: 'haiku',
  },

  computational: {
    id: 'computational',
    description: 'Math, statistics, unit-conversion, or code-execution questions',
    systemPromptAddendum:
      'You will answer a computational question. Use python_exec for any non-trivial ' +
      'arithmetic, statistics, or unit conversion. Always verify your result by re-running ' +
      'the computation once before committing to a final answer.',
    recommendedTools: ['python_exec', 'grounded_query'],
    recommendedMaxTurns: 6,
    recommendedModel: 'sonnet',
  },

  multi_hop: {
    id: 'multi_hop',
    description: 'Multi-step reasoning chains connecting multiple entities or facts',
    systemPromptAddendum:
      'Decompose this multi-step question into independent sub-questions. ' +
      'Solve each sub-question with a separate tool call before synthesising the final answer. ' +
      'Show your chain of reasoning explicitly.',
    recommendedTools: ['grounded_query', 'python_exec', 'web_browse'],
    recommendedMaxTurns: 12,
    recommendedModel: 'sonnet',
  },

  multimodal: {
    id: 'multimodal',
    description: 'Questions that reference an image, video, or audio attachment',
    systemPromptAddendum:
      'Use image_describe for any visual content. Describe what you see precisely before ' +
      'reasoning about it. If you receive an audio or video file, extract any text or ' +
      'metadata first, then reason over the extracted content.',
    recommendedTools: ['image_describe', 'web_browse', 'grounded_query'],
    recommendedMaxTurns: 8,
    recommendedModel: 'sonnet',
  },

  temporal: {
    id: 'temporal',
    description: 'Date, time, duration, sequence, or chronological ordering questions',
    systemPromptAddendum:
      'You will answer a temporal question. Be precise about dates, durations, and ' +
      'orderings. Use grounded_query to verify specific dates rather than relying on ' +
      'memory. Express answers in the units requested by the question.',
    recommendedTools: ['grounded_query', 'python_exec'],
    recommendedMaxTurns: 4,
    recommendedModel: 'haiku',
  },

  list_aggregation: {
    id: 'list_aggregation',
    description: 'Count, enumerate, or aggregate items from a set',
    systemPromptAddendum:
      'You will enumerate or count items. Build the complete list before counting. ' +
      'Use python_exec to count if the list is long. Double-check your enumeration — ' +
      'missing a single item is the most common error on list questions.',
    recommendedTools: ['python_exec', 'grounded_query', 'web_search'],
    recommendedMaxTurns: 6,
    recommendedModel: 'sonnet',
  },

  comparative: {
    id: 'comparative',
    description: '"Which is bigger/earlier/faster?" and "between X and Y" questions',
    systemPromptAddendum:
      'You will compare two or more entities. Retrieve the relevant attribute for each ' +
      'candidate separately, then compare explicitly. State the winning value alongside ' +
      'the entity name so the comparison is transparent.',
    recommendedTools: ['grounded_query', 'python_exec'],
    recommendedMaxTurns: 6,
    recommendedModel: 'sonnet',
  },

  general: {
    id: 'general',
    description: 'Catchall for questions that do not match a more specific expert',
    systemPromptAddendum:
      'Answer the question as accurately as possible. Use web_search or grounded_query ' +
      'if you are uncertain. Prefer a brief, verifiable answer.',
    recommendedTools: ['grounded_query', 'web_search', 'python_exec'],
    recommendedMaxTurns: 8,
    recommendedModel: 'haiku',
  },
} as const;

// ---------------------------------------------------------------------------
// Feature extraction (12-dim feature vector)
// ---------------------------------------------------------------------------

/** Lowercase keywords that indicate a computational question. */
const CALC_KEYWORDS = [
  'calculate', 'compute', 'total', 'sum', 'average', 'mean',
  'percent', 'percentage', 'ratio', 'sqrt', 'square root', 'multiply',
  'divide', 'subtract', 'equation', 'formula',
  // Note: 'how many' is intentionally excluded — it belongs to list_aggregation
];

/** Lowercase keywords that indicate temporal reasoning. */
const DATE_KEYWORDS = [
  'when', 'year', 'date', 'month', 'day', 'before', 'after', 'during',
  'century', 'decade', 'era', 'period', 'timeline', 'sequence', 'chronological',
  'oldest', 'newest', 'first', 'last', 'earliest', 'latest',
];

/** Lowercase keywords that indicate list or aggregation. */
const COUNT_KEYWORDS = [
  'how many', 'count', 'list', 'enumerate', 'all of', 'each', 'every',
  'number of', 'total number',
];

/** Lowercase keywords that indicate multi-hop reasoning. */
const RELATIONAL_KEYWORDS = [
  'who was', 'what was', 'connection between', 'relationship', 'related to',
  'between .+ and', 'born in', 'founded by', 'created by', 'successor',
  'predecessor', 'discover', 'invent',
];

/** Lowercase keywords that indicate comparative reasoning. */
const COMPARATIVE_KEYWORDS = [
  'which is', 'compare', 'larger', 'smaller', 'bigger', 'older', 'younger',
  'faster', 'slower', 'more', 'less', 'greater', 'fewer', 'taller', 'shorter',
  'heavier', 'lighter', 'between .+ and .+ which',
];

/** File extensions that indicate a multimodal question. */
const MULTIMODAL_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.mp4', '.wav', '.mp3', '.pdf'];

/**
 * Extract a 12-dimensional feature vector from a GAIA question.
 *
 * Features (keys and semantics):
 *   has_file_attachment   — 1 if file_name is set, else 0
 *   has_image_or_video    — 1 if attachment is image/video/audio
 *   has_digits            — fraction of tokens that are numeric
 *   has_calc_keywords     — keyword hit count (clipped to 1)
 *   has_date_keywords     — keyword hit count (clipped to 1)
 *   has_count_keywords    — keyword hit count (clipped to 1)
 *   has_relational_keywords — keyword hit count (clipped to 1)
 *   has_comparative_keywords — keyword hit count (clipped to 1)
 *   named_entity_density  — rough proxy: capitalised-word density
 *   question_length_norm  — token count / 100 (clipped to 1)
 *   level_norm            — GAIA level / 3
 *   has_multiple_sentences — 1 if question contains more than one sentence
 */
export function extractGatingFeatures(question: GaiaQuestion): Record<string, number> {
  const text = question.question.toLowerCase();
  const tokens = text.split(/\s+/).filter(t => t.length > 0);
  const tokenCount = tokens.length;

  // Attachment features
  const hasFile = question.file_name != null && question.file_name.length > 0 ? 1 : 0;
  const fileName = (question.file_name ?? '').toLowerCase();
  const hasImageOrVideo = MULTIMODAL_EXTENSIONS.some(ext => fileName.endsWith(ext)) ? 1 : 0;

  // Numeric density
  const digitTokens = tokens.filter(t => /\d/.test(t)).length;
  const hasDigits = tokenCount > 0 ? Math.min(digitTokens / tokenCount, 1) : 0;

  // Keyword features (clip to 1)
  const hasCalc = CALC_KEYWORDS.some(kw => text.includes(kw)) ? 1 : 0;
  const hasDate = DATE_KEYWORDS.some(kw => text.includes(kw)) ? 1 : 0;
  const hasCount = COUNT_KEYWORDS.some(kw => text.includes(kw)) ? 1 : 0;
  const hasRelational = RELATIONAL_KEYWORDS.some(kw => new RegExp(kw).test(text)) ? 1 : 0;
  const hasComparative = COMPARATIVE_KEYWORDS.some(kw => new RegExp(kw).test(text)) ? 1 : 0;

  // Named-entity density: fraction of original tokens that start with a capital letter
  const originalTokens = question.question.split(/\s+/).filter(t => t.length > 0);
  const capitalised = originalTokens.filter(t => /^[A-Z]/.test(t)).length;
  // Subtract 1 for the opening word of the sentence (likely capitalised regardless)
  const entityTokens = Math.max(0, capitalised - 1);
  const namedEntityDensity = originalTokens.length > 1
    ? Math.min(entityTokens / (originalTokens.length - 1), 1)
    : 0;

  // Length and level
  const questionLengthNorm = Math.min(tokenCount / 100, 1);
  const levelNorm = question.level / 3;

  // Multiple sentences
  const sentenceCount = question.question.split(/[.?!]/).filter(s => s.trim().length > 0).length;
  const hasMultipleSentences = sentenceCount > 1 ? 1 : 0;

  return {
    has_file_attachment: hasFile,
    has_image_or_video: hasImageOrVideo,
    has_digits: hasDigits,
    has_calc_keywords: hasCalc,
    has_date_keywords: hasDate,
    has_count_keywords: hasCount,
    has_relational_keywords: hasRelational,
    has_comparative_keywords: hasComparative,
    named_entity_density: namedEntityDensity,
    question_length_norm: questionLengthNorm,
    level_norm: levelNorm,
    has_multiple_sentences: hasMultipleSentences,
  };
}

// ---------------------------------------------------------------------------
// Heuristic gating network
// ---------------------------------------------------------------------------

interface GatingResult {
  expert: ExpertId;
  confidence: number;
}

/**
 * Default confidence thresholds for each heuristic rule.
 * Values represent minimum feature activations required to route to that expert.
 */
const DEFAULT_THRESHOLDS: Record<string, number> = {
  multimodal_image_video: 0.5,   // has_image_or_video
  computational_calc: 0.5,       // has_calc_keywords
  computational_digits: 0.3,     // has_digits (combined with calc)
  multi_hop_relational: 0.5,     // has_relational_keywords
  multi_hop_entities: 0.4,       // named_entity_density (combined with relational)
  list_aggregation: 0.5,         // has_count_keywords
  temporal: 0.5,                 // has_date_keywords
  comparative: 0.5,              // has_comparative_keywords
};

/**
 * Rule-based gating network.
 *
 * Rules fire in priority order; the first rule that meets its threshold wins.
 * The confidence is the activation strength of the winning rule (0-1).
 *
 * Production upgrade: replace this function body with:
 *   const logits = await ruvectorSonaClient.moeRoute(features);
 *   return { expert: argmax(logits), confidence: softmax(logits)[argmax(logits)] };
 */
function heuristicGate(
  features: Record<string, number>,
  thresholds: Record<string, number>,
): GatingResult {
  const t = thresholds;

  // 1. Multimodal (highest priority — file attachment is definitive)
  if (features.has_image_or_video >= t.multimodal_image_video) {
    return { expert: 'multimodal', confidence: features.has_image_or_video };
  }

  // 2. List aggregation — "how many / count / enumerate" is more specific than
  //    computational.  Must fire before computational to avoid "how many"
  //    being absorbed by a digits+calc rule.
  if (features.has_count_keywords >= t.list_aggregation) {
    return { expert: 'list_aggregation', confidence: features.has_count_keywords };
  }

  // 3. Computational — explicit calc keyword OR strong digit density
  if (
    features.has_calc_keywords >= t.computational_calc ||
    (features.has_digits >= t.computational_digits && features.has_calc_keywords > 0)
  ) {
    const conf = Math.max(
      features.has_calc_keywords,
      features.has_digits * 0.8,
    );
    return { expert: 'computational', confidence: Math.min(conf, 1) };
  }

  // 4. Comparative
  if (features.has_comparative_keywords >= t.comparative) {
    return { expert: 'comparative', confidence: features.has_comparative_keywords };
  }

  // 5. Multi-hop — relational keywords AND high entity density
  if (
    features.has_relational_keywords >= t.multi_hop_relational ||
    (features.named_entity_density >= t.multi_hop_entities &&
      features.has_multiple_sentences > 0)
  ) {
    const conf = Math.max(
      features.has_relational_keywords,
      features.named_entity_density * 0.7,
    );
    return { expert: 'multi_hop', confidence: Math.min(conf, 1) };
  }

  // 6. Factual lookup — simple "what/who/where/when/which" question:
  //    single sentence, named entities present, low GAIA level.
  //    Fires before temporal so that "what year was X built?" routes here
  //    rather than to the temporal expert (which is for sequence/duration
  //    reasoning rather than bare year-lookup facts).
  if (
    features.has_multiple_sentences === 0 &&
    features.level_norm <= 1 / 3 &&
    features.named_entity_density > 0
  ) {
    return { expert: 'factual_lookup', confidence: 0.65 };
  }

  // 7. Temporal — date/time/duration reasoning that didn't match factual
  if (features.has_date_keywords >= t.temporal) {
    return { expert: 'temporal', confidence: features.has_date_keywords };
  }

  // 8. General catchall
  return { expert: 'general', confidence: 0.4 };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Route a GAIA question to its specialist expert.
 *
 * Uses heuristic gating by default (no @ruvector dependency required for
 * smoke or CI runs).  Set `options.gatingNetwork = 'mock'` in unit tests to
 * get a deterministic, synchronous result without running the heuristic.
 *
 * @param question  The GAIA question to route.
 * @param options   Routing configuration (optional).
 * @returns         A `RouterDecision` describing the chosen expert.
 */
export async function routeToExpert(
  question: GaiaQuestion,
  options: MoERouterOptions = {},
): Promise<RouterDecision> {
  const features = extractGatingFeatures(question);

  const gatingNetwork = options.gatingNetwork ?? 'heuristic';
  // Merge thresholds: start from defaults, override with caller-supplied values.
  // Filter out undefined entries that result from Partial<Record<...>> spread.
  const overrides: Record<string, number> = Object.fromEntries(
    Object.entries(options.thresholds ?? {}).filter(
      (entry): entry is [string, number] => entry[1] !== undefined,
    ),
  );
  const thresholds: Record<string, number> = { ...DEFAULT_THRESHOLDS, ...overrides };

  let gating: GatingResult;

  if (gatingNetwork === 'mock') {
    // Deterministic stub: return features directly without running heuristics.
    // Used in unit tests to avoid coupling tests to rule changes.
    gating = { expert: 'general', confidence: 1.0 };
  } else {
    // Default: heuristic rule-based gating
    gating = heuristicGate(features, thresholds);
  }

  const expert = EXPERT_PROFILES[gating.expert];
  const fallbackUsed = gating.expert === 'general';

  return {
    expert,
    features,
    confidence: gating.confidence,
    fallbackUsed,
  };
}

/**
 * Apply a routing decision to a base agent options object.
 *
 * Merges the expert's recommendations into the caller-supplied options.
 * Caller options take precedence over expert defaults (except systemPrompt,
 * which is augmented rather than replaced).
 *
 * @param decision         The `RouterDecision` returned by `routeToExpert`.
 * @param baseAgentOptions An existing GaiaAgentOptions object (loosely typed
 *                         to avoid a hard dep on gaia-agent.ts while the
 *                         wiring PR is pending).
 * @returns                A new options object with expert routing applied.
 */
export function applyExpertRouting(
  decision: RouterDecision,
  baseAgentOptions: Record<string, unknown>,
): Record<string, unknown> {
  const expert = decision.expert;

  // Augment system prompt (append the expert's addendum)
  const existingSystemPrompt =
    typeof baseAgentOptions.systemPrompt === 'string'
      ? baseAgentOptions.systemPrompt
      : '';
  const augmentedSystemPrompt = existingSystemPrompt.length > 0
    ? `${existingSystemPrompt}\n\n[Expert: ${expert.id}] ${expert.systemPromptAddendum}`
    : `[Expert: ${expert.id}] ${expert.systemPromptAddendum}`;

  // Merge tool list (expert recommendations first, caller additions after)
  const callerTools: string[] =
    Array.isArray(baseAgentOptions.toolNames) ? baseAgentOptions.toolNames as string[] : [];
  const mergedTools = [
    ...expert.recommendedTools,
    ...callerTools.filter(t => !expert.recommendedTools.includes(t)),
  ];

  return {
    ...baseAgentOptions,
    systemPrompt: augmentedSystemPrompt,
    toolNames: mergedTools,
    // Only apply expert defaults if the caller hasn't explicitly set these
    maxTurns:
      baseAgentOptions.maxTurns !== undefined
        ? baseAgentOptions.maxTurns
        : expert.recommendedMaxTurns,
    model:
      baseAgentOptions.model !== undefined
        ? baseAgentOptions.model
        : expert.recommendedModel,
    // Attach routing metadata for observability / post-hoc analysis
    _expertRouting: {
      expertId: expert.id,
      confidence: decision.confidence,
      fallbackUsed: decision.fallbackUsed,
      features: decision.features,
    },
  };
}
