import { generateWithOpenAI } from './openai'
import { generateWithClaude } from './claude'

export interface FAQ {
  question: string
  answer: string
  category: 'delivery' | 'usage' | 'technical' | 'refunds' | 'customization' | 'general'
}

export interface FAQResult {
  faqs: FAQ[]
  formattedBlock: string
}

const CATEGORY_LABELS: Record<FAQ['category'], string> = {
  delivery: 'Delivery & Access',
  usage: 'Using the Product',
  technical: 'Technical',
  refunds: 'Refunds & Policy',
  customization: 'Customization',
  general: 'General',
}

const FALLBACK_FAQS: FAQ[] = [
  {
    question: 'How do I receive my purchase?',
    answer: 'Immediately after payment, Etsy sends you a download link via email and makes the file available in your Etsy account under "Purchases and Reviews." No waiting — it\'s instant!',
    category: 'delivery',
  },
  {
    question: 'What file formats are included?',
    answer: 'The product comes as a PDF file that works on any device — computer, tablet, or phone. No special software is required beyond a free PDF reader like Adobe Acrobat Reader.',
    category: 'technical',
  },
  {
    question: 'Can I edit this template?',
    answer: 'The PDF is designed to be filled in digitally using Adobe Acrobat (free version works) or printed and filled by hand. If you need a fully editable version in Google Docs or Canva, please message me before purchasing.',
    category: 'customization',
  },
  {
    question: 'Do I need any special software?',
    answer: 'No special software needed. You just need a free PDF reader (Adobe Acrobat, Preview on Mac, or your browser\'s built-in PDF viewer). The product works on Windows, Mac, iOS, and Android.',
    category: 'technical',
  },
  {
    question: 'Can I print this at home?',
    answer: 'Absolutely! The PDF is sized for standard US Letter (8.5×11") and A4 paper. Print at home on your regular printer, or take it to a local print shop for a professional finish.',
    category: 'usage',
  },
  {
    question: 'Can I share this with my team or resell it?',
    answer: 'This is a single-user personal license. You may use it for yourself or one business. Sharing with multiple people, distributing, reselling, or claiming the design as your own is not permitted.',
    category: 'general',
  },
  {
    question: 'What if I have trouble downloading my file?',
    answer: 'Check your Etsy account under "Purchases and Reviews" and click the download button there. If you still have issues, check your spam folder for the Etsy receipt email, or message me directly and I\'ll resolve it within 24 hours.',
    category: 'delivery',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'Because this is an instant digital download, I\'m unable to offer refunds once the file has been downloaded. If you experience a technical issue with the file, please message me and I\'ll make it right immediately.',
    category: 'refunds',
  },
  {
    question: 'Can I get a custom version made for my brand?',
    answer: 'Yes! I offer custom versions with your logo, brand colors, and business name. Message me with your requirements and I\'ll send a custom quote. Typical turnaround is 2–3 business days.',
    category: 'customization',
  },
  {
    question: 'Is this suitable for commercial use?',
    answer: 'The standard license covers personal use only. If you\'d like to use this in a commercial setting (client work, resale, or as a product you sell), please message me to discuss a commercial license.',
    category: 'general',
  },
]

function buildFallbackFAQs(productName: string): FAQ[] {
  return FALLBACK_FAQS.map((faq) => ({
    ...faq,
    answer: faq.answer.replace(/this product/gi, productName || 'this product')
      .replace(/the product/gi, productName || 'the product'),
  }))
}

function parseFAQsFromText(text: string): FAQ[] | null {
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return null
    const parsed = JSON.parse(jsonMatch[0])
    if (!Array.isArray(parsed) || parsed.length < 4) return null
    const categories: FAQ['category'][] = ['delivery', 'usage', 'technical', 'refunds', 'customization', 'general']
    return parsed.map((item: Record<string, string>) => ({
      question: String(item.question ?? ''),
      answer: String(item.answer ?? ''),
      category: (categories.includes(item.category as FAQ['category']) ? item.category : 'general') as FAQ['category'],
    })).filter((f) => f.question && f.answer)
  } catch {
    return null
  }
}

function buildFormattedBlock(faqs: FAQ[]): string {
  const grouped: Partial<Record<FAQ['category'], FAQ[]>> = {}
  for (const faq of faqs) {
    if (!grouped[faq.category]) grouped[faq.category] = []
    grouped[faq.category]!.push(faq)
  }
  const lines: string[] = ['❓ FREQUENTLY ASKED QUESTIONS\n']
  for (const [cat, items] of Object.entries(grouped)) {
    lines.push(`── ${CATEGORY_LABELS[cat as FAQ['category']]} ──`)
    for (const faq of items!) {
      lines.push(`\nQ: ${faq.question}`)
      lines.push(`A: ${faq.answer}`)
    }
    lines.push('')
  }
  lines.push('Still have a question? Send me a message — I reply within 24 hours! 💬')
  return lines.join('\n')
}

export async function generateFAQs(productName: string, description: string): Promise<FAQResult> {
  const prompt = `You are an expert Etsy seller specializing in digital products. Generate 10 realistic buyer FAQs for this product.

Product: ${productName}
Description: ${description || 'A digital download product sold on Etsy'}

Generate questions that real buyers ask BEFORE purchasing. Cover: delivery & access, file format/technical requirements, editing/customization options, printing, licensing/sharing restrictions, refund policy, and any product-specific questions.

Return ONLY a JSON array, no markdown:
[{"question":"...","answer":"...","category":"delivery|usage|technical|refunds|customization|general"}]

Make answers specific, reassuring, and conversion-focused. Each answer should be 1-3 sentences.`

  let faqs = buildFallbackFAQs(productName)

  try {
    const text = await generateWithOpenAI(prompt, 'Return only the JSON array.')
    if (text) {
      const parsed = parseFAQsFromText(text)
      if (parsed && parsed.length >= 5) faqs = parsed
    }
  } catch {}

  if (faqs === buildFallbackFAQs(productName)) {
    try {
      const text = await generateWithClaude(prompt, 'Return only the JSON array.')
      if (text) {
        const parsed = parseFAQsFromText(text)
        if (parsed && parsed.length >= 5) faqs = parsed
      }
    } catch {}
  }

  return {
    faqs,
    formattedBlock: buildFormattedBlock(faqs),
  }
}

export { CATEGORY_LABELS }
