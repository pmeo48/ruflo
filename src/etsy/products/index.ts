export const PRODUCT_CATALOG: Record<string, { title: string; price: number; type: string; niche: string; pages: number }> = {
  '001': { title: '500 ChatGPT Prompts for Entrepreneurs', price: 9.99, type: 'prompt-pack', niche: 'entrepreneurs', pages: 45 },
  '002': { title: 'AI for Complete Beginners Guide', price: 12.99, type: 'guide', niche: 'beginners', pages: 52 },
  '003': { title: 'Build Your First AI Agent in a Weekend', price: 14.99, type: 'guide', niche: 'ai-tools', pages: 38 },
  '004': { title: 'AI Daily Life Toolkit: 30 Day Challenge', price: 8.99, type: 'template', niche: 'productivity', pages: 35 },
  '005': { title: 'Ultimate AI Cheat Sheet Bundle', price: 6.99, type: 'cheat-sheet', niche: 'ai-tools', pages: 14 },
  '006': { title: 'AI for Insurance Agents: Complete Guide', price: 14.99, type: 'guide', niche: 'insurance', pages: 44 },
  '007': { title: '300 Prompts for Social Media Managers', price: 7.99, type: 'prompt-pack', niche: 'social-media', pages: 28 },
  '008': { title: 'No-Code AI Automation Guide', price: 12.99, type: 'guide', niche: 'automation', pages: 40 },
  '009': { title: 'AI Morning Routine Productivity System', price: 6.99, type: 'template', niche: 'productivity', pages: 22 },
  '010': { title: 'Complete AI Beginner Mega Bundle', price: 29.99, type: 'bundle', niche: 'beginners', pages: 210 },
};

export const ALL_PRODUCT_IDS = Object.keys(PRODUCT_CATALOG);

export function getProduct(id: string) {
  return PRODUCT_CATALOG[id] ?? null;
}

export function getProductsByNiche(niche: string) {
  return Object.entries(PRODUCT_CATALOG)
    .filter(([, p]) => p.niche === niche)
    .map(([id, p]) => ({ id, ...p }));
}

export function getProductsByType(type: string) {
  return Object.entries(PRODUCT_CATALOG)
    .filter(([, p]) => p.type === type)
    .map(([id, p]) => ({ id, ...p }));
}
