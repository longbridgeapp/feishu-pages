#!/usr/bin/env node
import { FileToken } from 'feishu-docx';
import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import {
  BASE_URL,
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

  // Map file_token to slug
  let slugMap = {};

  const docs = await fetchAllDocs(feishuConfig.spaceId, 0, ROOT_NODE_TOKEN);

  await fetchDocBodies(docs as FileDoc[]);

  prepareDocSlugs(docs as FileDoc[], slugMap);

  // Fetch docs contents and write files
  await fetchDocAndWriteFile(DOCS_DIR, docs as FileDoc[], slugMap);

  // Write SUMMARY.md
  const summary = generateSummary(docs as FileDoc[]);
  fs.writeFileSync(path.join(DOCS_DIR, 'SUMMARY.md'), summary);

  // Omit hide docs
  cleanupDocsForJSON(docs as FileDoc[]);

  // Write docs.json
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'docs.json'),
    JSON.stringify(docs, null, 2)
  );
})();

const allowKeys = [
  'depth',
  'title',
  'slug',
  'filename',
  'node_token',
  'parent_node_token',
  'children',
  'obj_create_time',
  'obj_edit_time',
  'obj_token',
  'has_child',
  'meta',
  'position',
];
const cleanupDocsForJSON = (docs: FileDoc[]) => {
  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    Object.keys(doc).forEach((key) => {
      if (!allowKeys.includes(key)) {
        delete doc[key];
      }
    });

    if (doc.meta?.hide) {
      docs.splice(idx, 1);
    }

    cleanupDocsForJSON(doc.children);
  }
};

const fetchDocBodies = async (docs: FileDoc[]) => {
  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];
    const { content, fileTokens, meta } = await fetchDocBody(doc.obj_token);

    doc.content = content;
    doc.meta = meta;
    doc.fileTokens = fileTokens;

    await fetchDocBodies(doc.children);
  }
};

const fetchDocAndWriteFile = async (
  outputDir: string,
  docs: FileDoc[],
  slugMap: Record<string, string>
) => {
  if (docs.length === 0) {
    return;
  }

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    // Skip write the hide doc
    if (doc.meta?.hide) {
      continue;
    }

    let filename = path.join(outputDir, doc.filename);
    const folder = path.dirname(filename);
    fs.mkdirSync(folder, { recursive: true });

    let { content, fileTokens } = doc;

    // TODO: Replace link's node_token into slug
    for (const node_token in slugMap) {
      // Replace Markdown link and HTML link
      const re = new RegExp(`${node_token}`, 'gm');
      const newLink = `${BASE_URL}${slugMap[node_token]}`;
      content = content.replace(re, newLink);
    }

    const metaInfo = generateFileMeta(doc, doc.slug, doc.position);

    let out = '';
    out += metaInfo + '\n\n';

    content = await downloadFiles(content, fileTokens, folder);

    out += content;

    console.info(
      'Writing doc',
      doc.filename,
      humanizeFileSize(content.length),
      '...'
    );
    fs.writeFileSync(filename, out);

    await fetchDocAndWriteFile(outputDir, doc.children, slugMap);
  }
};

/**
 * This alwasy download assets into ./assets into the docFolder (same folder as the doc).
 *
 * @param content
 * @param fileTokens
 * @param docFolder
 * @returns
 */
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
    if (!filePath) {
      continue;
    }

    const extension = path.extname(filePath);

    const re = new RegExp(`${fileToken}`, 'gm');
    content = content.replace(re, './assets/' + fileToken + extension);
  }

  return content;
};
