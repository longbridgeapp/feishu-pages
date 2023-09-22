import { MarkdownRenderer } from 'feishu-docx';
import { Doc, feishuFetchWithIterator } from './feishu';

/**
 * Fetch doc content
 * https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/raw_content
 * @param document_id doc.obj_token
 * @returns
 */
export const fetchDocBody = async (document_id: string) => {
  console.info('Fetching doc: ', document_id, '...');

  const doc = {
    document: {
      document_id,
    },
    blocks: [],
  };

  doc.blocks = await feishuFetchWithIterator(
    'GET',
    `/open-apis/docx/v1/documents/${document_id}/blocks`,
    {
      page_size: 500,
      document_revision_id: -1,
    }
  );

  const render = new MarkdownRenderer(doc as any);
  const content = render.parse();
  const fileTokens = render.fileTokens;
  const meta = render.meta;

  return {
    content,
    meta,
    fileTokens,
  };
};

/**
 * Generate a Markdown doc meta for describe sidebar info.
 * @param doc
 * @param urlPath
 * @param position
 * @returns
 */
export const generateFileMeta = (
  doc: Doc,
  urlPath: string,
  position: number
) => {
  const meta = {
    title: doc.title,
    slug: urlPath,
    sidebar_position: position,
  };

  let output = `---\n`;
  for (const key in meta) {
    const val = meta[key];
    if (val === null || val === undefined) {
      continue;
    }
    output += `${key}: ${val}\n`;
  }
  output += `---\n`;

  return output;
};
