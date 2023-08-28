import { feishuConfig } from './feishu';
import { fetchAllDocs } from './wiki';

// App entry
(async () => {
  console.info('App Id:', feishuConfig.appId);
  console.info('Space Id:', feishuConfig.spaceId);

  const docs = await fetchAllDocs(feishuConfig.spaceId);
  console.log(docs);
})();
