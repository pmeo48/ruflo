export const PRODUCT_010 = {
  id: '010',
  title: 'Complete AI Beginner Mega Bundle',
  subtitle: 'Everything You Need to Master AI — 5 Guides + 1 Prompt Pack + 1 Cheat Sheet Bundle',
  type: 'bundle' as const,
  niche: 'beginners',
  targetAudience: 'anyone wanting a complete AI education package at exceptional value',
  pages: 210,
  wordCount: 75000,
  fileFormats: ['PDF', 'ZIP'] as string[],
  price: 29.99,
  bundledProducts: [
    { id: '002', title: 'AI for Complete Beginners Guide', value: 12.99, pages: 52 },
    { id: '003', title: 'Build Your First AI Agent in a Weekend', value: 14.99, pages: 38 },
    { id: '004', title: 'AI Daily Life Toolkit: 30 Day Challenge', value: 8.99, pages: 35 },
    { id: '005', title: 'Ultimate AI Cheat Sheet Bundle (7 sheets)', value: 6.99, pages: 14 },
    { id: '008', title: 'No-Code AI Automation Guide', value: 12.99, pages: 40 },
    { id: '009', title: 'AI Morning Routine Productivity System', value: 6.99, pages: 22 },
  ],
  totalRetailValue: 63.94,
  bundlePrice: 29.99,
  savings: 33.95,
  bundleWelcome: `Welcome to the Complete AI Beginner Mega Bundle — the fastest path from "AI intimidates me" to "I use AI every single day and it's changed my work."

You're getting 6 products that normally sell for $63.94 — yours for $29.99. That's more than 50% off.

But more than the discount: this bundle is designed as a curriculum. Each product builds on the last, taking you from zero AI knowledge to building your own automated workflows in about 4 weeks.

Here's what changes after 4 weeks with this bundle:
• You'll save 10+ hours per week on routine tasks
• You'll write emails, reports, and proposals in a fraction of the time
• You'll have a personal prompt library that gets smarter every day
• You'll have your first working AI automation (built in a weekend)
• You'll wake up every morning with an AI-powered plan for your best day

Let's start.`,
  readingOrder: [
    {
      week: 1,
      product: '002',
      goal: 'Build your AI foundation. Understand what AI is, set up your tools, and get your first 5 wins.',
    },
    {
      week: 1,
      product: '005',
      goal: 'Pin the cheat sheets to your wall or save them to your phone. Reference them every time you use AI this week.',
    },
    {
      week: 2,
      product: '004',
      goal: 'Start the 30-Day Challenge. This is your daily habit builder — do one task per day starting Day 8.',
    },
    {
      week: 2,
      product: '009',
      goal: 'Implement the Morning Routine starting Week 2. It takes 45 minutes and transforms how you start each day.',
    },
    {
      week: 3,
      product: '008',
      goal: "Set up your first automation using the No-Code guide. This is where things get magical — AI works while you sleep.",
    },
    {
      week: 4,
      product: '003',
      goal: 'Build your first AI agent this weekend. You now have enough context for this to feel achievable.',
    },
  ],
  faq: [
    {
      q: 'Do I need technical skills?',
      a: 'No. These guides are written for complete beginners. The most technical thing is creating a free account on a website.',
    },
    {
      q: 'Which AI tools do I need?',
      a: 'A free ChatGPT account gets you through 90% of this bundle. Products 3 and 8 use n8n.io (free tier). Total cost: $0 to start.',
    },
    {
      q: 'What if I get stuck?',
      a: "Every guide has troubleshooting sections for the most common problems. You can also use ChatGPT to ask \"I'm following this tutorial and got stuck at [step]. Here's the error: [X]. What's wrong?\"",
    },
    {
      q: 'How long will this take?',
      a: 'Plan 4 weeks of 30-60 minutes per day. The 30-Day Challenge gives you the exact structure.',
    },
    {
      q: 'Is this useful for business or just personal use?',
      a: 'Both. The bundle covers personal productivity, professional writing, business automation, and building AI agents — all with real examples you can adapt.',
    },
  ],
};
