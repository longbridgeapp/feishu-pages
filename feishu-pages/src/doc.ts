import { withTenantToken } from '@larksuiteoapi/node-sdk';
import { MarkdownRenderer } from 'feishu-docx';
import { Doc, feishuClient, feishuConfig, requestWait } from './feishu';

/**
 * Fetch doc content
 * https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document/raw_content
 * @param document_id doc.obj_token
 * @returns
 */
export const fetchDocBody = async (document_id: string) => {
  await requestWait();

  let payload: any = {
    path: {
      document_id: document_id,
    },
    params: {
      page_size: 500,
      document_revision_id: -1,
    },
  };

  const doc = {
    document: {
      document_id,
    },
    blocks: [],
  };

  const options = withTenantToken(feishuConfig.tenantAccessToken);

  for await (const data of await feishuClient.docx.documentBlock.listWithIterator(
    payload,
    options
  )) {
    data.items?.forEach((item) => {
      doc.blocks.push(item);
    });
  }

  const render = new MarkdownRenderer(doc as any);

  return render.parse();
};

/**
 * Generate a Markdown doc meta for describe sidebar info.
 * @param doc
 * @param urlPath
 * @param position
 * @returns
 */
export const generateFileMeta = (
  doc: Doc,
  urlPath: string,
  position: number
) => {
  const meta = {
    title: doc.title,
    slug: urlPath,
    sidebar_position: position,
  };

  let output = `---\n`;
  for (const key in meta) {
    const val = meta[key];
    if (!val) {
      continue;
    }
    output += `${key}: ${val}\n`;
  }
  output += `---\n`;

  return output;
};
