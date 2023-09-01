#!/usr/bin/env node
import { FileToken } from 'feishu-docx';
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import {
  DOCS_DIR,
  OUTPUT_DIR,
  ROOT_NODE_TOKEN,
  feishuConfig,
  feishuDownload,
  fetchTenantAccessToken,
} from './feishu';
import { FileDoc, generateSummary, prepareDocSlugs } from './summary';
import { humanizeFileSize } from './utils';
import { fetchAllDocs } from './wiki';

// App entry
(async () => {
  await fetchTenantAccessToken();

  console.info('OUTPUT_DIR:', OUTPUT_DIR);
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

    let { content, fileTokens } = await fetchDocBody(doc.obj_token);

    content = await downloadFiles(content, fileTokens, folder);

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

const downloadFiles = async (
  content: string,
  fileTokens: Record<string, FileToken>,
  docFolder: string
) => {
  for (const fileToken in fileTokens) {
    const filePath = await feishuDownload(
      fileToken,
      path.join(path.join(docFolder, 'assets'), fileToken)
    );
    const extension = path.extname(filePath);

    const re = new RegExp(`${fileToken}`, 'gm');
    content = content.replace(re, './assets/' + fileToken + extension);
  }

  return content;
};
