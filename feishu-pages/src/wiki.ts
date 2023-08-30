import { Doc, feishuFetchWithIterator } from './feishu';

/**
 * 获取某个空间下的所有文档列表
 *
 * @param {string} spaceId 空间 ID
 */
export const fetchAllDocs = async (
  spaceId: string,
  depth?: number,
  parent_node_token?: string
) => {
  if (!depth) {
    depth = 0;
  }

  const prefix = '|__' + '___'.repeat(depth) + ' ';

  let items = await feishuFetchWithIterator(
    'GET',
    `/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
    {
      parent_node_token,
      page_size: 50,
    }
  );

  const docs: Doc[] = [];

  items
    .filter((item) => item.obj_type == 'doc' || item.obj_type == 'docx')
    .forEach((item) => {
      const doc: Doc = {
        depth: depth,
        title: item.title,
        node_token: item.node_token,
        parent_node_token: parent_node_token,
        obj_create_time: item.obj_create_time,
        obj_edit_time: item.obj_edit_time,
        obj_token: item.obj_token,
        children: [],
        has_child: item.has_child,
      };

      docs.push(doc);
    });

  console.info(
    prefix + 'node:',
    parent_node_token || 'root',
    docs.length > 0 ? `${docs.length} docs` : ''
  );

  for (const doc of docs) {
    doc.children = await fetchAllDocs(spaceId, depth + 1, doc.node_token);
  }

  return docs;
};
