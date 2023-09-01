#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import { feishuConfig, feishuDownload, fetchTenantAccessToken } from './feishu';
import { FileDoc, generateSummary, prepareDocSlugs } from './summary';
import { humanizeFileSize } from './utils';
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

  // Prepare docs as slug, position and filename
  prepareDocSlugs(docs as any, '');

  // Fetch docs contents and write files
  await fetchDocAndWriteFile(DOCS_DIR, docs as FileDoc[]);

  // Write SUMMARY.md
  const summary = generateSummary(docs as FileDoc[]);
  fs.writeFileSync(path.join(DOCS_DIR, 'SUMMARY.md'), summary);

  // Write docs.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'docs.json'),
    JSON.stringify(docs, null, 2)
  );
})();

const fetchDocAndWriteFile = async (outputDir: string, docs: FileDoc[]) => {
  if (docs.length === 0) {
    return;
  }

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];
    let filename = path.join(outputDir, doc.filename);
    const folder = path.dirname(filename);
    fs.mkdirSync(folder, { recursive: true });

    const meta = generateFileMeta(doc, doc.slug, doc.position);

    let out = '';
    out += meta + '\n\n';

    let { content, imageTokens } = await fetchDocBody(doc.obj_token);
    content = await downloadFiles(content, imageTokens);

    out += content;

    console.info(
      ' -> Writing doc',
      doc.filename,
      humanizeFileSize(content.length),
      '...'
    );
    fs.writeFileSync(filename, out);

    await fetchDocAndWriteFile(outputDir, doc.children);
  }
};

const downloadFiles = async (content: string, imageTokens: string[]) => {
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
