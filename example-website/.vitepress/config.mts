import { DefaultTheme, defineConfig } from 'vitepress';

import docs from '../docs.json';

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
  srcDir: 'docs',
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Feishu Wiki',
        link: 'https://longbridge.feishu.cn/wiki/space/7273324757679325186',
      },
      {
        text: 'Releases',
        link: 'https://github.com/longbridgeapp/feishu-pages/releases',
      },
      {
        text: 'GitHub',
        link: 'https://github.com/longbridgeapp/feishu-pages',
      },
    ],

    sidebar: {
      en: docsSidebarEN,
      'zh-CN': docsSidebarZHCN,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/longbridgeapp/feishu-pages' },
    ],
  },
});
