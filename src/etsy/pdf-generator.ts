import * as fs from 'fs';
import * as path from 'path';

export interface PdfSection {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet-list' | 'numbered-list' | 'prompt' | 'callout' | 'divider';
  content: string | string[];
  label?: string;
}

export interface PdfDocument {
  title: string;
  subtitle: string;
  author: string;
  sections: PdfSection[];
}

type ContentWithCategories = { categories: Array<{ name: string; prompts: string[] }> };
type ContentWithChapters = { chapters: Array<{ title: string; intro?: string; sections?: Array<{ heading: string; content: string }>; summary?: string }> };
type ContentWithSheets = { sheets: Array<{ title: string; subsections?: Array<{ heading: string; items: string[] }> }> };
type ContentWithWeeks = { weeks: Array<{ title?: string; week?: number; days: Array<{ day?: number; title?: string; content?: string; activity?: string }> }> };
type ContentWithPhases = { phases: Array<{ title: string; description?: string; steps?: string[] }> };
type ContentWithSessions = { sessions: Array<{ title: string; description?: string; steps?: string[] }> };

function hasCategories(c: unknown): c is ContentWithCategories {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['categories']);
}

function hasChapters(c: unknown): c is ContentWithChapters {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['chapters']);
}

function hasSheets(c: unknown): c is ContentWithSheets {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['sheets']);
}

function hasWeeks(c: unknown): c is ContentWithWeeks {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['weeks']);
}

function hasPhases(c: unknown): c is ContentWithPhases {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['phases']);
}

function hasSessions(c: unknown): c is ContentWithSessions {
  return typeof c === 'object' && c !== null && Array.isArray((c as Record<string, unknown>)['sessions']);
}

export class EtsyPdfGenerator {
  private outputDir: string;

  constructor(outputDir?: string) {
    this.outputDir = outputDir ?? path.join(process.cwd(), '.hive-mind', 'sessions', 'generated-pdfs');
  }

  generateMarkdown(doc: PdfDocument): string {
    const lines: string[] = [];

    lines.push(`# ${doc.title}`);
    lines.push('');
    lines.push(`> ${doc.subtitle}`);
    lines.push('');
    lines.push(`*Author: ${doc.author}*`);
    lines.push('');

    for (const section of doc.sections) {
      switch (section.type) {
        case 'divider':
          lines.push('---');
          lines.push('');
          break;

        case 'heading':
          lines.push(`## ${section.content as string}`);
          lines.push('');
          break;

        case 'subheading':
          lines.push(`### ${section.content as string}`);
          lines.push('');
          break;

        case 'paragraph':
          lines.push(section.content as string);
          lines.push('');
          break;

        case 'bullet-list': {
          const items = Array.isArray(section.content) ? section.content : [section.content as string];
          for (const item of items) {
            lines.push(`- ${item}`);
          }
          lines.push('');
          break;
        }

        case 'numbered-list': {
          const items = Array.isArray(section.content) ? section.content : [section.content as string];
          items.forEach((item, i) => {
            lines.push(`${i + 1}. ${item}`);
          });
          lines.push('');
          break;
        }

        case 'prompt':
          lines.push(EtsyPdfGenerator.formatPromptBlock(section.content as string));
          lines.push('');
          break;

        case 'callout': {
          const label = section.label ? `⚡ ${section.label}: ` : '⚡ ';
          lines.push(`> ${label}${section.content as string}`);
          lines.push('');
          break;
        }
      }
    }

    return lines.join('\n');
  }

  saveMarkdown(doc: PdfDocument, filename: string): string {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const filePath = path.join(this.outputDir, filename.endsWith('.md') ? filename : `${filename}.md`);
    fs.writeFileSync(filePath, this.generateMarkdown(doc), 'utf-8');
    return filePath;
  }

  generateProductMarkdown(product: {
    id: string;
    title: string;
    subtitle: string;
    content: unknown;
  }): string {
    const lines: string[] = [];

    lines.push(`# ${product.title}`);
    lines.push('');
    lines.push(`> ${product.subtitle}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    const content = product.content;

    if (hasCategories(content)) {
      for (const category of content.categories) {
        lines.push(`## ${category.name}`);
        lines.push('');
        category.prompts.forEach((prompt, i) => {
          lines.push(`${i + 1}. ${prompt}`);
        });
        lines.push('');
      }
    } else if (hasChapters(content)) {
      for (const chapter of content.chapters) {
        lines.push(`## ${chapter.title}`);
        lines.push('');
        if (chapter.intro) {
          lines.push(chapter.intro);
          lines.push('');
        }
        if (chapter.sections) {
          for (const section of chapter.sections) {
            lines.push(`### ${section.heading}`);
            lines.push('');
            lines.push(section.content);
            lines.push('');
          }
        }
        if (chapter.summary) {
          lines.push(`> **Summary:** ${chapter.summary}`);
          lines.push('');
        }
        lines.push('---');
        lines.push('');
      }
    } else if (hasSheets(content)) {
      for (const sheet of content.sheets) {
        lines.push(`## ${sheet.title}`);
        lines.push('');
        if (sheet.subsections) {
          for (const sub of sheet.subsections) {
            lines.push(`### ${sub.heading}`);
            lines.push('');
            for (const item of sub.items) {
              lines.push(`- ${item}`);
            }
            lines.push('');
          }
        }
      }
    } else if (hasWeeks(content)) {
      for (const week of content.weeks) {
        const weekLabel = week.title ?? `Week ${week.week ?? ''}`;
        lines.push(`## ${weekLabel}`);
        lines.push('');
        for (const day of week.days) {
          const dayLabel = day.title ?? `Day ${day.day ?? ''}`;
          lines.push(`### ${dayLabel}`);
          lines.push('');
          if (day.content) {
            lines.push(day.content);
            lines.push('');
          }
          if (day.activity) {
            lines.push(`> **Activity:** ${day.activity}`);
            lines.push('');
          }
        }
        lines.push('---');
        lines.push('');
      }
    } else if (hasPhases(content)) {
      for (const phase of content.phases) {
        lines.push(`## ${phase.title}`);
        lines.push('');
        if (phase.description) {
          lines.push(phase.description);
          lines.push('');
        }
        if (phase.steps) {
          phase.steps.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
          lines.push('');
        }
      }
    } else if (hasSessions(content)) {
      for (const session of content.sessions) {
        lines.push(`## ${session.title}`);
        lines.push('');
        if (session.description) {
          lines.push(session.description);
          lines.push('');
        }
        if (session.steps) {
          session.steps.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
          lines.push('');
        }
      }
    } else {
      lines.push('*Content available in the full digital download.*');
      lines.push('');
    }

    return lines.join('\n');
  }

  saveProductFiles(products: Array<{ id: string; title: string; subtitle: string; content: unknown }>): string[] {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const paths: string[] = [];

    for (const product of products) {
      const markdown = this.generateProductMarkdown(product);
      const safeId = product.id.replace(/[^a-z0-9-]/gi, '-');
      const filename = `${safeId}.md`;
      const filePath = path.join(this.outputDir, filename);
      fs.writeFileSync(filePath, markdown, 'utf-8');
      paths.push(filePath);
    }

    return paths;
  }

  static formatPromptBlock(prompt: string): string {
    return `> **💬 Prompt to Use:**\n>\n> ${prompt.split('\n').join('\n> ')}\n`;
  }
}
