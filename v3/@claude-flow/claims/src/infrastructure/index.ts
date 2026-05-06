/**
 * @claude-flow/claims - Infrastructure Layer
 *
 * Exports persistence implementations for the claims module.
 *
 * @module v3/claims/infrastructure
 */

// Claim Repository
export {
  InMemoryClaimRepository,
  createClaimRepository,
} from './claim-repository.js';

// Event Store
export {
  InMemoryClaimEventStore,
  createClaimEventStore,
  type EventFilter,
  type EventSubscription,
} from './event-store.js';

// Hybrid Logical Clock (ADR-101 Component A)
export {
  LocalHlc,
  HlcSkewError,
  compareHlc,
  hlcToWallMs,
  wallMsToHlc,
  zeroHlc,
  DEFAULT_MAX_SKEW_MS,
  type HlcTimestamp,
  type IHlc,
  type PhysicalClock,
} from './hlc.js';
