import path from 'path';
import { Doc } from './feishu';
import { normalizeSlug } from './utils';

export interface FileDoc extends Doc {
  slug: string;
  position: number;
  filename: string;
  children: FileDoc[];
}

/**
 * Iter docs tree to give them as slug, position and filename
 * @param docs
 * @param parentSlug
 */
export const prepareDocSlugs = (docs: FileDoc[], parentSlug: string = '') => {
  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const fileKey = normalizeSlug(doc.node_token);
    const fileSlug = path.join(parentSlug, fileKey);

    doc.slug = fileSlug;
    doc.position = i;
    doc.filename = `${fileSlug}.md`;

    if (doc.children.length > 0) {
      prepareDocSlugs(doc.children as any, fileSlug);
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
