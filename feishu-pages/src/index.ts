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
  await fetchDocAndWriteFile(DOCS_DIR, '', docs);
})();

const fetchDocAndWriteFile = async (
  outputDir: string,
  slugPrefix: string,
  docs: Doc[]
) => {
  if (docs.length === 0) {
    return;
  }

  fs.mkdirSync(outputDir, { recursive: true });

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    let position = idx;
    let fileKey = normalizeSlug(doc.node_token);
    let filename = path.join(outputDir, `${fileKey}.md`);
    let fileSlug = path.join(slugPrefix, fileKey);
    const folder = path.dirname(filename);

    // If is first child, named as index.md
    if (idx === 0) {
      filename = path.join(outputDir, `index.md`);
      fileSlug = slugPrefix;
      position = -1;
    }

    fs.mkdirSync(folder, { recursive: true });

    const meta = generateFileMeta(doc, fileSlug, position);

    let out = '';
    out += meta + '\n\n';

    let { content, imageTokens } = await fetchDocBody(doc.obj_token);
    content = await downloadImages(content, imageTokens);

    out += content;

    console.info(' -> Writing doc', humanizeFileSize(content.length), '...');
    fs.writeFileSync(filename, out);

    const subDir = path.join(outputDir, fileKey);
    await fetchDocAndWriteFile(subDir, fileKey, doc.children);
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
