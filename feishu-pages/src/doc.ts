import { MarkdownRenderer } from 'feishu-docx';
import fs from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { CACHE_DIR, Doc, feishuFetchWithIterator } from './feishu';
import { printMemoryUsage, writeTemplfile } from './utils';

/**
 * Fetch doc content
 * https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/list
 * @param document_id doc.obj_token
 * @returns
 */
 export const fetchDocBody = async (fileDoc: Doc): Promise<{ contentFile: string; meta: Record<string, any>; fileTokens: Record<string, any>; hasCache: boolean }> => {
  let document_id = fileDoc.obj_token;

  const doc = {
    document: {
      document_id,
    },
    blocks: [],
  };

  const fetchDocBlocks = async (document_id: string): Promise<{ hasCache: boolean; blocks: any[] }> => {
    // Check cache in .cache/docs/${document_id}.json
    let hasCache = false;
    let cacheBlocks = path.join(CACHE_DIR, 'blocks', document_id + '.json');
    fs.mkdirSync(path.dirname(cacheBlocks), { recursive: true });
    if (fs.existsSync(cacheBlocks)) {
      const doc = JSON.parse(fs.readFileSync(cacheBlocks, 'utf-8'));
      if (doc?.obj_edit_time === fileDoc.obj_edit_time) {
        hasCache = true;
        console.info('Cache hit doc: ', document_id, '...');
        return {
          hasCache,
          blocks: doc.blocks,
        };
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
    return { hasCache, blocks };
  };


  let { blocks, hasCache } = await fetchDocBlocks(document_id);

  doc.blocks = blocks;
  printMemoryUsage('loaded doc blocks');

  const render = new MarkdownRenderer(doc as any);
  const content = render.parse();
  printMemoryUsage('MarkdownRenderer parsed');
  const fileTokens = render.fileTokens;
  const meta = render.meta;

  let tmp_filename = writeTemplfile(content);

  return {
    contentFile: tmp_filename,
    meta,
    fileTokens,
    hasCache,
  };
};

/**
 * Generate a Markdown Frontmatter.
 * @param doc
 * @param urlPath
 * @param position
 * @returns
 */
export const generateFrontmatter = (
  doc: Doc,
  urlPath: string,
  position: number
) => {
  const meta = Object.assign(
    {
      title: doc.title,
      slug: urlPath,
      sidebar_position: position,
    },
    doc.meta || {}
  );

  // Remove null or undefined key
  for (const key in meta) {
    if (meta[key] === undefined || meta[key] === null) {
      delete meta[key];
    }
  }

  let meta_yaml = yaml.dump(meta, {
    skipInvalid: true,
  });

  let output = `---\n`;
  output += meta_yaml;
  output += `---\n`;

  return output;
};
