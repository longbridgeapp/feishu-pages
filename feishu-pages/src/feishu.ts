// node-sdk 使用说明：https://github.com/larksuite/node-sdk/blob/main/README.zh.md
import { Client } from '@larksuiteoapi/node-sdk';
import axios from 'axios';
import 'dotenv/config';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { humanizeFileSize } from './utils';

export const OUTPUT_DIR: string = path.resolve(
  process.env.OUTPUT_DIR || './dist'
);
export const DOCS_DIR: string = path.join(OUTPUT_DIR, 'docs');

let baseUrl = process.env.BASE_URL || process.env.URL_PREFIX || '/';
if (!baseUrl.endsWith('/')) {
  baseUrl += '/';
}
export const BASE_URL: string = baseUrl;
export const ROOT_NODE_TOKEN: string = process.env.ROOT_NODE_TOKEN || '';
export const CACHE_DIR = path.resolve(
  process.env.CACHE_DIR || path.join(OUTPUT_DIR, '.cache')
);

const feishuConfig = {
  endpoint: process.env.FEISHU_ENDPOINT || 'https://open.feishu.cn',
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
  tenantAccessToken: null,

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
 * 获取 tenantAccessToken
 *
 * Max-Age: 2 hours
 *
 * https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token
 * @returns
 */
export const fetchTenantAccessToken = async () => {
  console.log('Fetching tenantAccessToken...');
  const res: Record<string, any> =
    await feishuClient.auth.tenantAccessToken.internal({
      data: {
        app_id: feishuConfig.appId,
        app_secret: feishuConfig.appSecret,
      },
    });
  const access_token = res?.tenant_access_token || '';
  console.info('TENANT_ACCESS_TOKEN:', maskToken(access_token));
  feishuConfig.tenantAccessToken = access_token;
};

/**
 * Mask part of token as ****
 * @param token
 * @returns
 */
export const maskToken = (token) => {
  const len = token.length;
  const mashLen = len * 0.6;
  return (
    token.substring(0, len - mashLen + 5) +
    '*'.repeat(mashLen) +
    token.substring(len - 5)
  );
};

const RATE_LIMITS = {};

/**
 * Feishu Rate Limit:
 *
 * - 100 times/min
 * - 5 times/s in Max
 */
export const requestWait = async (ms?: number) => {
  ms = ms || 0;

  const minuteLockKey = new Date().getMinutes();
  if (!RATE_LIMITS[minuteLockKey]) {
    RATE_LIMITS[minuteLockKey] = 0;
  }

  // If overload 100 times/min, wait 1 minute
  if (RATE_LIMITS[minuteLockKey] >= 100) {
    console.warn(
      '[RATE LIMIT] Overload request 100 times/min, wait 1 minute...'
    );
    await await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
    RATE_LIMITS[minuteLockKey] = 0;
  }

  await new Promise((resolve) => setTimeout(resolve, ms));
  RATE_LIMITS[minuteLockKey] += 1;
};

axios.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const { headers, data } = error.response;

    // Rate Limit code: 99991400, delay to retry
    if (data?.code === 99991400) {
      const rateLimitResetSeconds = headers['x-ogw-ratelimit-reset'];
      console.warn(
        '[RATE LIMIT]',
        data.code,
        data.msg,
        `delay ${rateLimitResetSeconds}s to retry...`
      );

      // Delay to retry
      await requestWait(rateLimitResetSeconds * 1000);
      return await axios.request(error.config);
    }

    throw error;
  }
);

/**
 * 带有全局 RateLimit 的 Feishu 网络请求方式
 * @param fn
 * @param payload
 * @param options
 * @returns
 */
export const feishuFetch = async (method, path, payload): Promise<any> => {
  const authorization = `Bearer ${feishuConfig.tenantAccessToken}`;
  const headers = {
    Authorization: authorization,
    'Content-Type': 'application/json; charset=utf-8',
    'User-Agent': 'feishu-pages',
  };

  const url = `${feishuConfig.endpoint}${path}`;

  const { code, data, msg } = await axios
    .request({
      method,
      url,
      params: payload,
      headers,
    })
    .then((res) => res.data);

  if (code !== 0) {
    console.warn('feishuFetch code:', code, 'msg:', msg);
    return null;
  }

  return data;
};

/**
 * Download Feishu File into a Local path
 *
 * If download failed, return null
 *
 * @param fileToken
 * @param localPath
 * @returns
 */
export const feishuDownload = async (fileToken: string, localPath: string) => {
  const cacheFilePath = path.join(CACHE_DIR, fileToken);
  const cacheFileMetaPath = path.join(CACHE_DIR, `${fileToken}.headers.json`);
  fs.mkdirSync(CACHE_DIR, { recursive: true });

  let res: any = {};
  if (fs.existsSync(cacheFilePath) && fs.existsSync(cacheFileMetaPath)) {
    res.data = fs.readFileSync(cacheFilePath);
    res.headers = JSON.parse(fs.readFileSync(cacheFileMetaPath, 'utf-8'));
    console.info(' -> Cache hit:', fileToken);
  } else {
    console.info('Download file', fileToken, '...');
    res = await axios
      .get(
        `${feishuConfig.endpoint}/open-apis/drive/v1/medias/${fileToken}/download`,
        {
          responseType: 'arraybuffer',
          headers: {
            Authorization: `Bearer ${feishuConfig.tenantAccessToken}`,
            'User-Agent': 'feishu-pages',
          },
        }
      )
      .then((res) => {
        // Write cache info
        fs.writeFileSync(cacheFilePath, res.data);
        fs.writeFileSync(cacheFileMetaPath, JSON.stringify(res.headers));
        return res;
      })
      .catch((err) => {
        const { message } = err;
        console.error(' -> Failed to download image:', fileToken, message);
      });
  }

  if (!res) {
    return null;
  }

  if (res.data) {
    let extension = mime.extension(res.headers['content-type']);
    console.info(
      ' =>',
      res.headers['content-type'],
      humanizeFileSize(res.data.length)
    );

    if (extension) {
      localPath = localPath + '.' + extension;
    }
    const dir = path.dirname(localPath);
    fs.mkdirSync(dir, { recursive: true });
    console.info(' -> Writing file:', localPath);
    fs.writeFileSync(localPath, res.data);
  }

  return localPath;
};

/**
 * Request Feishu List API with iterator
 *
 * @param method
 * @param path
 * @param payload
 * @param options
 * @returns
 */
export const feishuFetchWithIterator = async (
  method: string,
  path: string,
  payload: Record<string, any> = {}
): Promise<any[]> => {
  let pageToken = '';
  let hasMore = true;
  let results: any[] = [];

  while (hasMore) {
    const data = await feishuFetch(method, path, {
      ...payload,
      page_token: pageToken,
    });

    if (data.items) {
      results = results.concat(data.items);
    }
    hasMore = data.has_more;
    pageToken = data.page_token;
  }

  return results;
};

export interface Doc {
  title: string;
  meta?: Record<string, any>;
  node_token: string;
  parent_node_token?: string;
  depth: number;
  obj_create_time?: string;
  obj_edit_time?: string;
  obj_token?: string;
  children: Doc[];
  has_child?: boolean;
}

export { checkEnv, feishuConfig };
