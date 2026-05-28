export interface CoverDesignSpec {
  productId: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  iconSuggestion: string;
  layoutStyle: 'bold-minimal' | 'gradient-modern' | 'professional-clean' | 'vibrant-bold';
  canvaPrompt: string;
  dimensions: { width: number; height: number };
  dpi: number;
}

export interface MockupSpec {
  productId: string;
  mockupType: 'ipad-screen' | 'laptop-screen' | 'printed-stack' | 'flat-lay' | 'phone-screen';
  backgroundColor: string;
  propSuggestions: string[];
}

export const NICHE_PALETTES: Record<
  string,
  { bg: string; accent: string; text: string; font: string }
> = {
  'ai-tools':      { bg: '#0F172A', accent: '#6366F1', text: '#FFFFFF', font: 'Inter' },
  'productivity':  { bg: '#1E293B', accent: '#10B981', text: '#FFFFFF', font: 'Poppins' },
  'entrepreneurs': { bg: '#1F2937', accent: '#F59E0B', text: '#FFFFFF', font: 'Montserrat' },
  'social-media':  { bg: '#4F46E5', accent: '#EC4899', text: '#FFFFFF', font: 'Nunito' },
  'insurance':     { bg: '#1E3A5F', accent: '#3B82F6', text: '#FFFFFF', font: 'Merriweather' },
  'beginners':     { bg: '#065F46', accent: '#34D399', text: '#FFFFFF', font: 'Lato' },
  'automation':    { bg: '#312E81', accent: '#A78BFA', text: '#FFFFFF', font: 'Roboto' },
  'default':       { bg: '#111827', accent: '#60A5FA', text: '#FFFFFF', font: 'Inter' },
};

type LayoutStyle = CoverDesignSpec['layoutStyle'];

const TYPE_LAYOUTS: Record<string, LayoutStyle> = {
  'prompt-pack':  'bold-minimal',
  guide:          'professional-clean',
  'cheat-sheet':  'gradient-modern',
  template:       'professional-clean',
  bundle:         'vibrant-bold',
  printable:      'gradient-modern',
  planner:        'professional-clean',
  default:        'bold-minimal',
};

const TYPE_ICONS: Record<string, string> = {
  'prompt-pack':  'speech bubble with sparkles',
  guide:          'open book with light bulb',
  'cheat-sheet':  'lightning bolt checklist',
  template:       'document with pencil',
  bundle:         'stack of documents with star',
  printable:      'printer with page',
  planner:        'calendar with checkmark',
  default:        'star with document',
};

const MOCKUP_PROPS: Record<string, string[]> = {
  'prompt-pack':  ['keyboard', 'coffee mug', 'notepad', 'phone with ChatGPT open'],
  guide:          ['reading glasses', 'highlighter', 'sticky notes', 'notebook'],
  'cheat-sheet':  ['desk lamp', 'pen', 'sticky note', 'coffee'],
  template:       ['laptop', 'mouse', 'pen holder', 'plant'],
  bundle:         ['gift box', 'ribbon', 'confetti', 'multiple devices'],
  default:        ['coffee mug', 'plant', 'notepad', 'pen'],
};

function normalizeNicheKey(niche: string): string {
  const lower = niche.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  if (lower in NICHE_PALETTES) return lower;

  for (const key of Object.keys(NICHE_PALETTES)) {
    if (key === 'default') continue;
    if (lower.includes(key) || key.includes(lower)) return key;
  }

  const partialMatches: Record<string, string> = {
    ai: 'ai-tools',
    chatgpt: 'ai-tools',
    gpt: 'ai-tools',
    artificial: 'ai-tools',
    product: 'productivity',
    planner: 'productivity',
    work: 'productivity',
    business: 'entrepreneurs',
    entrepreneur: 'entrepreneurs',
    startup: 'entrepreneurs',
    social: 'social-media',
    instagram: 'social-media',
    tiktok: 'social-media',
    beginner: 'beginners',
    starter: 'beginners',
    intro: 'beginners',
    automat: 'automation',
    workflow: 'automation',
    zap: 'automation',
  };

  for (const [fragment, paletteKey] of Object.entries(partialMatches)) {
    if (lower.includes(fragment)) return paletteKey;
  }

  return 'default';
}

export class EtsyDesignAgent {
  getCoverSpec(product: {
    id: string;
    title: string;
    subtitle?: string;
    niche: string;
    type: string;
  }): CoverDesignSpec {
    const paletteKey = normalizeNicheKey(product.niche);
    const palette = NICHE_PALETTES[paletteKey] ?? NICHE_PALETTES['default'];
    const layoutStyle: LayoutStyle = TYPE_LAYOUTS[product.type] ?? TYPE_LAYOUTS['default'];
    const iconSuggestion = TYPE_ICONS[product.type] ?? TYPE_ICONS['default'];
    const subtitle = product.subtitle ?? `The ultimate ${product.type.replace('-', ' ')} for ${product.niche}`;

    const canvaPrompt =
      `Create a ${layoutStyle} digital product cover for '${product.title}'. ` +
      `Use ${palette.bg} background with ${palette.accent} accent colors and ${palette.text} text in ${palette.font} typography. ` +
      `Include a ${iconSuggestion} icon as the focal visual element — dimensions 2000x2000px at 300 DPI for Etsy listing image.`;

    return {
      productId: product.id,
      title: product.title,
      subtitle,
      backgroundColor: palette.bg,
      accentColor: palette.accent,
      textColor: palette.text,
      fontFamily: palette.font,
      iconSuggestion,
      layoutStyle,
      canvaPrompt,
      dimensions: { width: 2000, height: 2000 },
      dpi: 300,
    };
  }

  getMockupSpecs(product: { id: string; type: string }): MockupSpec[] {
    const props = MOCKUP_PROPS[product.type] ?? MOCKUP_PROPS['default'];
    const paletteKey = 'default';
    const palette = NICHE_PALETTES[paletteKey];

    return [
      {
        productId: product.id,
        mockupType: 'laptop-screen',
        backgroundColor: palette.bg,
        propSuggestions: [props[0] ?? 'coffee mug', props[1] ?? 'plant', 'desk surface', 'soft lighting'],
      },
      {
        productId: product.id,
        mockupType: 'ipad-screen',
        backgroundColor: '#F8FAFC',
        propSuggestions: [props[2] ?? 'notepad', props[3] ?? 'pen', 'wooden table', 'natural light'],
      },
      {
        productId: product.id,
        mockupType: 'flat-lay',
        backgroundColor: '#FFFFFF',
        propSuggestions: [
          props[0] ?? 'coffee mug',
          'printed pages',
          'pen',
          'minimal desk accessories',
          'overhead shot at 45°',
        ],
      },
    ];
  }
}
