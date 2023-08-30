import fs from 'fs';
import path from 'path';
import { fetchDocBody, generateFileMeta } from './doc';
import { Doc, feishuConfig } from './feishu';
import { fetchAllDocs } from './wiki';

// App entry
(async () => {
  const outputDir: string = path.join(__dirname, '../out');

  console.info('outdir: ', outputDir);
  console.info('App Id:', feishuConfig.appId);
  console.info('Space Id:', feishuConfig.spaceId);

  // const text = await fetchDocBody('MmAEdaJB3og1idxJ8Dxca8EjnEg');
  // console.log('----------- text:', text);
  // return;

  const docs = await fetchAllDocs(feishuConfig.spaceId);
  await fetchDocAndWriteFile(outputDir, '', docs);
})();

const fetchDocAndWriteFile = async (
  outputDir: string,
  slugPrefix: string,
  docs: Doc[]
) => {
  fs.mkdirSync(outputDir, { recursive: true });

  docs.forEach(async (doc, idx) => {
    let fileKey = doc.node_token;
    let filename = path.join(outputDir, `${fileKey}.md`);

    const fileSlug = path.join(slugPrefix, fileKey);
    const meta = generateFileMeta(doc, fileSlug, idx);

    let out = '';
    out += meta + '\n\n';

    console.info('Fetching doc: ', doc.node_token, '...');
    let content = await fetchDocBody(doc.obj_token);
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
