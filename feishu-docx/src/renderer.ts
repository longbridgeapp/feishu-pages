import { Block, FileToken } from './types';

export class Renderer {
  documentId: string;
  meta?: Record<string, any>;
  blockMap: Record<string, Block> = {};
  parentId?: string;
  fileTokens: Record<string, FileToken> = {};
  nextBlock?: Block | null;
  /**
   * Current Block
   */
  currentBlock?: Block | null;
  indent: number = 0;
  debug: boolean;
  outputUnsupported: boolean = false;

  constructor(
    doc: any,
    options: { debug?: boolean; outputUnsupported?: boolean } = {}
  ) {
    const { debug = false, outputUnsupported } = options;

    this.documentId = doc?.document?.document_id || '';
    this.fileTokens = {};
    doc?.blocks?.forEach((block) => {
      this.blockMap[block?.block_id] = block;
    });
    this.debug = debug;
    this.outputUnsupported = outputUnsupported;
  }

  /**
   * Parse Feishu doc to new format
   * @returns Text of new format content.
   */
  parse(): string {
    const entryBlock = this.blockMap[this.documentId];
    return this.parseBlock(entryBlock, 0);
  }

  parseBlock(block: Block, indent: number): string {
    throw new Error('Not implemented');
  }

  /**
   * Wrap with sub indent, after the function, will restore the old indent
   * @param indent
   * @param fn
   */
  withSubIndent(fn: () => void) {
    const oldIndent = this.indent;
    fn();
    this.indent = oldIndent;
  }

  /**
   * Add a file token to context
   * @param type
   * @param token
   */
  addFileToken(type: 'file' | 'image', token: string) {
    this.fileTokens[token] = {
      token,
      type,
    };
  }
}

/**
 * 去掉末尾 1 个换行
 * @param str
 * @returns
 */
export const trimLastNewline = (str: string) => {
  return str.replace(/\n$/, '');
};

/**
 * Escape HTML tags into HTML entities
 *
 * This for avoid Feishu paragraph text has `<` or `>` charactor, will break the HTML structure.
 * In some Static Site Generator (VitePress, Docusaurus), the used JSX and Vue template, will cause the HTML structure broken.
 *
 * - `>` -> `&gt;` (Danger, > in Markdown is used for blockquote)
 * - `<` -> `&lt;`
 *
 * This method must make sure used to escape the Plain Text, not the Markdown Text.
 *
 * @param plainText
 * @returns text with escaped HTML tags
 */
export const escapeHTMLTags = (plainText: string) => {
  return plainText.replace(/<|>/g, (m) => {
    switch (m) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      default:
        return m;
    }
  });
};
