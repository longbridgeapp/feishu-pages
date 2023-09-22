import path from 'path';
import { Doc } from './feishu';
import { normalizeSlug } from './utils';

export interface FileDoc extends Doc {
  slug: string;
  position: number;
  filename: string;
  content?: string;
  meta?: Record<string, any>;
  fileTokens?: any;
  children: FileDoc[];
}

/**
 * Iter docs tree to give them as slug, position and filename
 * @param docs
 * @param parentSlug
 */
export const prepareDocSlugs = (
  docs: FileDoc[],
  slugMap: Record<string, string>,
  parentSlug: string = ''
) => {
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const fileKey = normalizeSlug(doc.meta?.slug || doc.node_token);
    const fileSlug = path.join(parentSlug, fileKey);

    doc.slug = fileSlug;
    doc.position = i;
    doc.filename = `${fileSlug}.md`;

    slugMap[doc.node_token] = doc.slug;

    if (doc.children.length > 0) {
      prepareDocSlugs(doc.children as any, slugMap, fileSlug);
    }
  }
};

/**
 * Generate SUMMARY.md
 */
export const generateSummary = (docs: FileDoc[]): string => {
  let output = '';
  for (const doc of docs) {
    let indent = '  '.repeat(doc.depth);
    output += `${indent}- [${doc.title}](${doc.filename})\n`;

    if (doc.children.length > 0) {
      output += generateSummary(doc.children);
    }
  }

  return output;
};
