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

const OUTPUT_DIR: string = path.join(__dirname, '../out');

// App entry
(async () => {
  await fetchTenantAccessToken();

  console.info('Out Dir:', OUTPUT_DIR);
  console.info('App Id:', feishuConfig.appId);
  console.info('Space Id:', feishuConfig.spaceId);

  const docs = await fetchAllDocs(feishuConfig.spaceId);
  await fetchDocAndWriteFile(OUTPUT_DIR, '', docs);
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

  docs.forEach(async (doc, idx) => {
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

    console.info(
      '-> Writing doc: ',
      doc.node_token,
      'content length:',
      content.length,
      '...'
    );

    fs.writeFileSync(filename, out);

    const subDir = path.join(outputDir, fileKey);
    await fetchDocAndWriteFile(subDir, fileKey, doc.children);
  });
};

const downloadImages = async (content: string, imageTokens: string[]) => {
  imageTokens.forEach(async (imageToken) => {
    const imagePath = await await feishuDownload(
      imageToken,
      path.join(OUTPUT_DIR, 'assets', imageToken)
    );
    content = content.replace(imageToken, imagePath);
  });

  return content;
};
