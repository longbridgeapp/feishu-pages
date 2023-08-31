import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import {
  Doc,
  feishuConfig,
  feishuDownload,
  fetchTenantAccessToken,
} from './feishu';
import { normalizeSlug } from './utils';
import { fetchAllDocs } from './wiki';

const OUTPUT_DIR: string = path.resolve(process.env.OUTPUT_DIR || './dist');
const ASSET_BASE_URL: string = process.env.ASSET_BASE_URL || '/assets';

const ASSET_DIR: string = path.join(OUTPUT_DIR, 'assets');
const DOCS_DIR: string = path.join(OUTPUT_DIR, 'docs');

// App entry
(async () => {
  await fetchTenantAccessToken();

  console.info('OUTPUT_DIR:', OUTPUT_DIR);
  console.info('ASSET_BASE_URL:', ASSET_BASE_URL);
  console.info('App ID:', feishuConfig.appId);
  console.info('Space ID:', feishuConfig.spaceId);

  const docs = await fetchAllDocs(feishuConfig.spaceId);
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

    // If is a folder index page, write to ${fileKey}/index.md
    if (doc.children.length > 0) {
      let folder = path.join(outputDir, fileKey);
      fs.mkdirSync(folder, { recursive: true });
      filename = path.join(folder, `index.md`);
      position = -1;
    }

    const fileSlug = path.join(slugPrefix, fileKey);
    const meta = generateFileMeta(doc, fileSlug, position);

    let out = '';
    out += meta + '\n\n';

    let { content, imageTokens } = await fetchDocBody(doc.obj_token);
    content = await downloadImages(content, imageTokens);

    out += content;

    console.info(' -> Writing doc: ', content.length, '...');
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
