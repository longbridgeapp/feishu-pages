// node-sdk 使用说明：https://github.com/larksuite/node-sdk/blob/main/README.zh.md
import { Client } from '@larksuiteoapi/node-sdk';
import 'dotenv/config';

const feishuConfig: Record<string, string> = {
  /**
   * App Id of Feishu App
   *
   * env: `FEISHU_APP_ID`
   */
  appId: process.env.FEISHU_APP_ID,
  /**
   * App Secret of Feishu App
   *
   * env: `FEISHU_APP_SECRET`
   */
  appSecret: process.env.FEISHU_APP_SECRET,

  /**
   * Tenant Access Token of Feishu App
   *
   * env: `FEISHU_TENANT_ACCESS_TOKEN`
   *
   * https://open.feishu.cn/document/faq/trouble-shooting/how-to-choose-which-type-of-token-to-use
   */
  tenantAccessToken: process.env.FEISHU_TENANT_ACCESS_TOKEN,

  /**
   * Wiki Space Id of Feishu App
   *
   * env: `FEISHU_SPACE_ID`
   */
  spaceId: process.env.FEISHU_SPACE_ID,
  logLevel: process.env.FEISHU_LOG_LEVEL || '2',
};

const checkEnv = () => {
  if (!feishuConfig.appId) {
    throw new Error('FEISHU_APP_ID is required');
  }

  if (!feishuConfig.appSecret) {
    throw new Error('FEISHU_APP_SECRET is required');
  }

  if (!feishuConfig.tenantAccessToken) {
    throw new Error('FEISHU_TENANT_ACCESS_TOKEN is required');
  }

  if (!feishuConfig.spaceId) {
    throw new Error('FEISHU_SPACE_ID is required');
  }
};

checkEnv();
const feishuClient = new Client({
  appId: feishuConfig.appId,
  appSecret: feishuConfig.appSecret,
  loggerLevel: feishuConfig.logLevel as any,
  disableTokenCache: true,
});

/**
 * Feishu Rate Limit 5 times/s
 */
export const requestWait = async () => {
  await new Promise((resolve) => setTimeout(resolve, 220));
};

export interface Doc {
  title: string;
  node_token: string;
  parent_node_token?: string;
  depth: number;
  obj_create_time: string;
  obj_edit_time: string;
  obj_token: string;
  children: Doc[];
  has_child?: boolean;
}

export { checkEnv, feishuClient, feishuConfig };
