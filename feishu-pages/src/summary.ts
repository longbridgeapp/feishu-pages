import { Doc } from './feishu';

/**
 * Generate SUMMARY.md
 */
export const generateSummary = (docs: Doc[], depth: number = 0) => {
  let output = '';
  for (const doc of docs) {
    output += `${'  '.repeat(depth)}- [${doc.title}](${doc.node_token}.md)\n`;
    if (doc.children.length > 0) {
      output += generateSummary(doc.children, depth + 1);
    }
  }
};
