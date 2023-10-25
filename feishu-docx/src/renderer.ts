import { Block, FileToken } from './types';

export class Renderer {
  documentId: string;
  meta?: Record<string, any>;
  blockMap: Record<string, Block> = {};
  parentId?: string;
  fileTokens: Record<string, FileToken> = {};
  nextBlock?: Block | null;
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
