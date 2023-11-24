import { Doc, WikiNode, feishuFetch, feishuFetchWithIterator } from './feishu';

/**
 *
 * @param spaceId https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/get_node
 * @param nodeToken
 */
export const fetchDocInfo = async (
  spaceId: string,
  nodeToken: string
): Promise<WikiNode> => {
  let data = await feishuFetch('GET', '/open-apis/wiki/v2/spaces/get_node', {
    token: nodeToken,
  });

  const node = data.node as WikiNode;
  if (!node) {
    console.error('Node not found', nodeToken, data);
  }

  return node;
};

/**
 * 获取某个空间下的所有文档列表
 *
 * https://open.feishu.cn/document/server-docs/docs/wiki-v2/space-node/list
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
  let docs: Doc[] = [];

  // Fetch fron root node
  if (depth == 0 && parent_node_token) {
    let rootNode = await fetchDocInfo(spaceId, parent_node_token);
    let doc = {
      depth: depth,
      title: rootNode.title,
      node_token: rootNode.node_token,
      parent_node_token: null,
      obj_create_time: rootNode.obj_create_time,
      obj_edit_time: rootNode.obj_edit_time,
      obj_token: rootNode.obj_token,
      children: [],
      has_child: rootNode.has_child,
    };
    docs.push(doc);
  } else {
    let items = await feishuFetchWithIterator(
      'GET',
      `/open-apis/wiki/v2/spaces/${spaceId}/nodes`,
      {
        parent_node_token,
        page_size: 50,
      }
    );

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
  }

  // Ignore title `[hide]` or `[隐藏]`
  docs = docs.filter((doc) => {
    let title = doc.title.toLocaleLowerCase();
    return !title.includes('[hide]') && !title.includes('[隐藏]');
  });

  for (const doc of docs) {
    if (doc.has_child) {
      doc.children = await fetchAllDocs(spaceId, depth + 1, doc.node_token);
    }
  }

  return docs;
};
