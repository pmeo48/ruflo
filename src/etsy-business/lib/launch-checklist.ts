export interface ChecklistItem {
  id: string
  label: string
  detail: string
  link?: string
  linkLabel?: string
}

export interface ChecklistPhase {
  id: string
  title: string
  emoji: string
  description: string
  items: ChecklistItem[]
}

export const LAUNCH_PHASES: ChecklistPhase[] = [
  {
    id: 'research',
    title: 'Research & Validate',
    emoji: '🔍',
    description: 'Confirm demand before you build.',
    items: [
      {
        id: 'r1',
        label: 'Search your keyword on Etsy — note top 5 competitor listings',
        detail: 'Look at their titles, prices, photo styles, and review counts. Find the gap you can fill.',
        link: '/keywords',
        linkLabel: 'Keyword Research →',
      },
      {
        id: 'r2',
        label: 'Verify search demand: keyword has 500+ competing listings',
        detail: 'Too few = no market. Too many = hard to break in. Sweet spot: 500–10,000 results.',
      },
      {
        id: 'r3',
        label: 'Check average price range for your keyword',
        detail: 'Price within 20% of the market median to avoid being filtered out by buyers.',
        link: '/pricing',
        linkLabel: 'Price Optimizer →',
      },
      {
        id: 'r4',
        label: 'Identify one specific pain point your product solves better than competitors',
        detail: 'Write a 1-sentence "this is for X who struggle with Y" statement before building.',
      },
    ],
  },
  {
    id: 'create',
    title: 'Create the Product',
    emoji: '🛠️',
    description: 'Build something buyers actually want.',
    items: [
      {
        id: 'c1',
        label: 'Create the core product (PDF, Notion template, spreadsheet, etc.)',
        detail: 'Keep it focused — one product, one problem solved completely. Don\'t pad with filler.',
        link: '/products',
        linkLabel: 'Product Manager →',
      },
      {
        id: 'c2',
        label: 'Test the product yourself — complete every step as the buyer would',
        detail: 'Broken links, unclear instructions, or missing pages are the #1 reason for refund requests.',
      },
      {
        id: 'c3',
        label: 'Export final file as PDF (or ZIP for multi-file products)',
        detail: 'Compress images to keep file size under 20MB. Use PDF/A format for print products.',
      },
      {
        id: 'c4',
        label: 'Create a "Getting Started" page or readme inside the product',
        detail: 'Even a one-paragraph intro reduces support requests by 60%.',
      },
    ],
  },
  {
    id: 'design',
    title: 'Design Mockups & Graphics',
    emoji: '🎨',
    description: 'Visuals sell digital products — invest here.',
    items: [
      {
        id: 'd1',
        label: 'Create main listing image (1:1 ratio, 2000×2000px minimum)',
        detail: 'Show the product in context — a desk with the PDF open, a laptop screen, or a styled flat lay.',
        link: '/design',
        linkLabel: 'Design Studio →',
      },
      {
        id: 'd2',
        label: 'Create 4–6 additional images showing contents and use cases',
        detail: 'Include: contents preview, a "before/after" or problem/solution frame, and a testimonial graphic.',
      },
      {
        id: 'd3',
        label: 'Create a "What\'s Included" infographic',
        detail: 'Buyers want to see exactly what they\'re getting. List every file, page count, and format.',
      },
      {
        id: 'd4',
        label: 'Ensure brand consistency: same fonts, colors, and style across all images',
        detail: 'Consistent visuals build trust and make your shop recognizable as buyers scroll.',
      },
    ],
  },
  {
    id: 'listing',
    title: 'Write the Listing',
    emoji: '✍️',
    description: 'Optimize for search and conversions.',
    items: [
      {
        id: 'l1',
        label: 'Write a 120–140 character title with primary keyword first',
        detail: 'Format: [Primary Keyword] | [Secondary Keyword] | [Use Case/Audience]',
        link: '/seo',
        linkLabel: 'SEO Engine →',
      },
      {
        id: 'l2',
        label: 'Fill all 13 tags with multi-word keyword phrases',
        detail: 'No single-word tags. Use phrases buyers search: "business planner pdf" not just "planner".',
        link: '/keywords',
        linkLabel: 'Keyword Research →',
      },
      {
        id: 'l3',
        label: 'Write a 300+ word description with sections and bullet points',
        detail: 'Structure: hook → what\'s included → who it\'s for → how it works → FAQ → CTA.',
        link: '/copywriter',
        linkLabel: 'AI Copy Writer →',
      },
      {
        id: 'l4',
        label: 'Set price using market research + charm pricing (e.g. $17.99)',
        detail: 'Start at mid-market or slightly above. You can always discount — hard to raise price later.',
      },
      {
        id: 'l5',
        label: 'Add all relevant attributes and categories',
        detail: 'Etsy uses attributes for filtering. More attributes = more surfaces where your listing appears.',
      },
      {
        id: 'l6',
        label: 'Audit your listing score before publishing',
        detail: 'Use the Listing Audit tool to catch issues before going live.',
        link: '/listing-audit',
        linkLabel: 'Listing Audit →',
      },
    ],
  },
  {
    id: 'launch',
    title: 'Launch & Announce',
    emoji: '🚀',
    description: 'Drive initial traffic to build momentum.',
    items: [
      {
        id: 'la1',
        label: 'Publish listing on Etsy (set to Active)',
        detail: 'Double-check: instant download file is attached, price is correct, all 13 tags filled.',
        link: '/etsy',
        linkLabel: 'Etsy Listings →',
      },
      {
        id: 'la2',
        label: 'Share on Pinterest with 5 keyword-rich pins to different boards',
        detail: 'Pinterest drives significant Etsy traffic — one viral pin can send hundreds of buyers.',
        link: '/pinterest',
        linkLabel: 'Pinterest →',
      },
      {
        id: 'la3',
        label: 'Post a launch announcement on Instagram/TikTok Stories',
        detail: 'Show the product, explain the problem it solves, add the Etsy link in bio.',
        link: '/marketing',
        linkLabel: 'Marketing →',
      },
      {
        id: 'la4',
        label: 'Send launch email to your subscriber list',
        detail: 'Subject: "New: [Product Name] — [benefit]". Include a 24-hour launch discount code.',
        link: '/emails',
        linkLabel: 'Email Center →',
      },
      {
        id: 'la5',
        label: 'Create a launch coupon (15–20% off, 48-hour expiry)',
        detail: 'Urgency + discount drives first sales. First sales trigger Etsy\'s algorithm to show your listing.',
        link: '/coupons',
        linkLabel: 'Coupons →',
      },
    ],
  },
  {
    id: 'optimize',
    title: 'Optimize & Scale',
    emoji: '📈',
    description: 'Turn first sales into consistent revenue.',
    items: [
      {
        id: 'o1',
        label: 'Check listing stats after 7 days — review impressions and clicks',
        detail: 'Low impressions = SEO issue (fix title/tags). Good impressions, low clicks = thumbnail issue.',
        link: '/analytics',
        linkLabel: 'Analytics →',
      },
      {
        id: 'o2',
        label: 'Reply to all buyer messages within 24 hours',
        detail: 'Fast response rate boosts your Star Seller status and conversion rate.',
      },
      {
        id: 'o3',
        label: 'After first 3 sales: send a thank-you follow-up requesting a review',
        detail: 'Reviews are the single biggest conversion driver on Etsy. Personalized requests get 3× more responses.',
        link: '/reviews',
        linkLabel: 'Reviews →',
      },
      {
        id: 'o4',
        label: 'A/B test your main thumbnail after 30 days',
        detail: 'Try a different background color, angle, or text overlay. Even small changes lift CTR 10–30%.',
        link: '/abtesting',
        linkLabel: 'A/B Testing →',
      },
      {
        id: 'o5',
        label: 'Create 2–3 derivative products from this one (bundles, expansions)',
        detail: 'Each new product drives traffic to your whole shop. Returning buyers spend 5× more.',
        link: '/expansion',
        linkLabel: 'Product Expansion →',
      },
    ],
  },
]

export interface LaunchChecklist {
  id: string
  productName: string
  createdAt: string
  completedItems: string[]
}

const STORAGE_KEY = 'etsy_launch_checklists'

export function loadChecklists(): LaunchChecklist[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveChecklists(lists: LaunchChecklist[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lists))
}

export function totalItems(): number {
  return LAUNCH_PHASES.reduce((s, p) => s + p.items.length, 0)
}
