import { withTenantToken } from '@larksuiteoapi/node-sdk';
import { feishuClient, feishuConfig, requestWait } from './feishu';

/**
 * Fetch doc content
 * https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/raw_content
 * @param document_id doc.obj_token
 * @returns
 */
export const fetchDocBody = async (document_id: string) => {
  await requestWait();

  let payload = {
    path: {
      document_id: document_id,
    },
  };

  const options = withTenantToken(feishuConfig.tenantAccessToken);

  const { data, code, msg } = await feishuClient.docx.document.rawContent(
    payload,
    options
  );
  if (code != 0) {
    throw new Error(`Fetch doc body failed: ${code}, msg: ${msg}`);
  }
  console.log('fetched: ', data);

  return data.content;
};
