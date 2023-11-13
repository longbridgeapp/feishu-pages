import { MarkdownRenderer } from 'feishu-docx';
import fs from 'fs';
import path from 'path';
import { CACHE_DIR, Doc, feishuFetchWithIterator } from './feishu';

/**
 * Fetch doc content
 * https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/raw_content
 * @param document_id doc.obj_token
 * @returns
 */
export const fetchDocBody = async (fileDoc: Doc) => {
  let document_id = fileDoc.obj_token;

  const doc = {
    document: {
      document_id,
    },
    blocks: [],
  };

  const fetchDocBlocks = async (document_id: string) => {
    // Check cache in .cache/docs/${document_id}.json
    let cacheBlocks = path.join(CACHE_DIR, 'blocks', document_id + '.json');
    fs.mkdirSync(path.dirname(cacheBlocks), { recursive: true });
    if (fs.existsSync(cacheBlocks)) {
      const doc = JSON.parse(fs.readFileSync(cacheBlocks, 'utf-8'));
      if (doc?.obj_edit_time === fileDoc.obj_edit_time) {
        console.info('Cache hit doc: ', document_id, '...');
        return doc.blocks;
      }
    }

    console.info('Fetching doc: ', document_id, '...');
    const blocks = await feishuFetchWithIterator(
      'GET',
      `/open-apis/docx/v1/documents/${document_id}/blocks`,
      {
        page_size: 500,
        document_revision_id: -1,
      }
    );
    fs.writeFileSync(
      cacheBlocks,
      JSON.stringify({
        obj_edit_time: fileDoc.obj_edit_time,
        blocks,
      })
    );
    return blocks;
  };

  doc.blocks = await fetchDocBlocks(document_id);

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

  // Replace double quote to avoid YAML parse error
  meta.title = meta.title.replace(/"/g, '\\"');

  let output = `---\n`;
  for (const key in meta) {
    const val = meta[key];
    if (val === null || val === undefined) {
      continue;
    }
    output += `${key}: "${val}"\n`;
  }
  output += `---\n`;

  return output;
};
