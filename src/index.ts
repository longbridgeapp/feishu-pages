import fs from 'fs';
import path from 'path';
import { fetchDocBody } from './doc';
import { Doc, feishuConfig } from './feishu';
import { fetchAllDocs } from './wiki';

// App entry
(async () => {
  const outputDir: string = path.join(__dirname, 'out');

  console.info('outdir: ', outputDir);
  console.info('App Id:', feishuConfig.appId);
  console.info('Space Id:', feishuConfig.spaceId);

  const content = await fetchDocBody('OfD9dsSMIodxAOx5AFZcVoQ3nGe');
  console.log(content);

  const docs = await fetchAllDocs(feishuConfig.spaceId);
  // await fetchDocAndWriteFile(outputDir, docs);
})();

const fetchDocAndWriteFile = async (outputDir: string, docs: Doc[]) => {
  fs.mkdirSync(outputDir, { recursive: true });

  for (const doc of docs) {
    let fileKey = doc.node_token;
    let filename = path.join(outputDir, `${fileKey}.md`);
    console.info('Fetching doc: ', doc.node_token, '...');
    let content = await fetchDocBody(doc.obj_token);
    console.info(
      '-> Writing doc: ',
      doc.node_token,
      'content length:',
      content.length,
      '...'
    );
    fs.writeFileSync(filename, content);

    const subDir = path.join(outputDir, fileKey);
    await fetchDocAndWriteFile(subDir, doc.children);
  }
};
