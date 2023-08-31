#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import {
  Doc,
  feishuConfig,
  feishuDownload,
  fetchTenantAccessToken,
} from './feishu';
import { humanizeFileSize, normalizeSlug } from './utils';
import { fetchAllDocs } from './wiki';

const OUTPUT_DIR: string = path.resolve(process.env.OUTPUT_DIR || './dist');
const ASSET_BASE_URL: string = process.env.ASSET_BASE_URL || '/assets';

const ASSET_DIR: string = path.join(OUTPUT_DIR, 'assets');
const DOCS_DIR: string = path.join(OUTPUT_DIR, 'docs');
const ROOT_NODE_TOKEN: string = process.env.ROOT_NODE_TOKEN || '';

// App entry
(async () => {
  await fetchTenantAccessToken();

  console.info('OUTPUT_DIR:', OUTPUT_DIR);
  console.info('ASSET_BASE_URL:', ASSET_BASE_URL);
  console.info('FEISHU_APP_ID:', feishuConfig.appId);
  console.info('FEISHU_SPACE_ID:', feishuConfig.spaceId);
  console.info('ROOT_NODE_TOKEN:', ROOT_NODE_TOKEN);
  console.info('-------------------------------------------\n');

  const docs = await fetchAllDocs(feishuConfig.spaceId, 0, ROOT_NODE_TOKEN);
  await fetchDocAndWriteFile(DOCS_DIR, '', docs, 0);
})();

const fetchDocAndWriteFile = async (
  outputDir: string,
  parentSlug: string,
  docs: Doc[],
  depth: number = 0
) => {
  if (docs.length === 0) {
    return;
  }

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    let position = idx;
    let fileKey = normalizeSlug(doc.node_token);
    let fileSlug = path.join(parentSlug, fileKey);
    let filename = path.join(outputDir, `${fileSlug}.md`);

    if (idx == 0) {
      if (depth === 0) {
        filename = path.join(outputDir, `index.md`);
        fileSlug = '';
      } else {
        filename = path.join(outputDir, `${fileSlug}/index.md`);
        fileSlug = fileSlug;
      }
      position = -1;
    }

    const folder = path.dirname(filename);
    fs.mkdirSync(folder, { recursive: true });

    const meta = generateFileMeta(doc, fileSlug, position);

    let out = '';
    out += meta + '\n\n';

    let { content, imageTokens } = await fetchDocBody(doc.obj_token);
    content = await downloadImages(content, imageTokens);

    out += content;

    console.info(' -> Writing doc', humanizeFileSize(content.length), '...');
    fs.writeFileSync(filename, out);

    await fetchDocAndWriteFile(outputDir, fileSlug, doc.children, depth + 1);
  }
};

const downloadImages = async (content: string, imageTokens: string[]) => {
  for (const imageToken of imageTokens) {
    const imagePath = await feishuDownload(
      imageToken,
      ASSET_BASE_URL,
      path.join(ASSET_DIR, imageToken)
    );

    const re = new RegExp(`${imageToken}`, 'gm');
    content = content.replace(re, imagePath);
  }

  return content;
};
