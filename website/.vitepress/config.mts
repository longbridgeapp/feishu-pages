import fs from 'fs';
import path from 'path';
import { DefaultTheme, defineConfig } from 'vitepress';

let docsPath = 'docs.json';
let srcDir = 'docs';
if (process.env.VITEPRESS_DOCS_ROOT) {
  docsPath = path.join(process.env.VITEPRESS_DOCS_ROOT, 'docs.json');
  srcDir = path.join(process.env.VITEPRESS_DOCS_ROOT, 'docs');
}
docsPath = path.resolve(docsPath);
console.info(`Loading ${docsPath}`);
const docs = JSON.parse(fs.readFileSync(docsPath).toString());

/**
 * Convert feishu-pages's docs.json into VitePress's sidebar config
 * @param docs from `docs.json`
 * @param rootSlug if provided, will find and use this node as the root.
 * @returns
 */
const convertDocsToSidebars = (
  docs: Record<string, any>[],
  rootSlug?: string
) => {
  const sidebars: DefaultTheme.SidebarItem[] = [];

  // Go to root slug
  docs = docs.find((doc) => doc.slug === rootSlug)?.children || docs;

  for (const doc of docs) {
    let sidebar: DefaultTheme.SidebarItem = {
      text: doc.title,
      link: '/' + doc.slug,
    };
    if (doc.children.length > 0) {
      sidebar.items = convertDocsToSidebars(doc.children);
    }
    sidebars.push(sidebar);
  }

  return sidebars;
};

const docsSidebarEN = convertDocsToSidebars(docs, 'en');
const docsSidebarZHCN = convertDocsToSidebars(docs, 'zh-CN');

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Feishu Pages',
  base: '/feishu-pages/',
  ignoreDeadLinks: true,
  locales: {
    en: {
      label: 'English',
      lang: 'en',
    },
    'zh-CN': {
      label: '简体中文',
      lang: 'zh-CN',
    },
  },
  cleanUrls: true,
  srcExclude: ['SUMMARY.md'],
  srcDir: srcDir,
  markdown: {
    math: true,
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    outline: [2, 3],
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Releases',
        link: '/releases',
      },
      {
        text: 'Feishu Wiki',
        link: 'https://longbridge.feishu.cn/wiki/space/7273324757679325186',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/longbridge/feishu-pages',
      },
    ],

    sidebar: {
      en: docsSidebarEN,
      'zh-CN': docsSidebarZHCN,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/longbridge/feishu-pages' },
    ],
  },
});
