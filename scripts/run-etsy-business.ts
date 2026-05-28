#!/usr/bin/env npx ts-node
import { EtsyOrchestrator } from '../src/etsy/orchestrator';

async function main() {
  const niche = process.argv[2];
  const count = process.argv[3] ? parseInt(process.argv[3]) : 3;

  console.log('🏪 Starting Autonomous Etsy Digital Products Business...\n');

  const orchestrator = new EtsyOrchestrator();
  await orchestrator.run({ niche, productCount: count });

  console.log('\n✅ Business run complete. State saved to .hive-mind/sessions/state.json');
}

main().catch((err) => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
