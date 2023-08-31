import { DefaultTheme, defineConfig } from 'vitepress';

const docs = require('../docs.json');

/**
 * Convert feishu-pages's docs.json into VitePress's sidebar config
 * @param docs from `docs.json`
 * @returns
 */
const convertDocsToSidebars = (docs: any) => {
  const sidebars: DefaultTheme.SidebarItem[] = [];
  for (const doc of docs) {
    let sidebar: DefaultTheme.SidebarItem = {
      text: doc.title,
      link: doc.slug,
    };
    if (doc.children.length > 0) {
      sidebar.items = convertDocsToSidebars(doc.children);
    }
    sidebars.push(sidebar);
  }

  return sidebars;
};

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Feishu Pages Example',
  base: '/feishu-pages/',
  ignoreDeadLinks: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }],

    sidebar: convertDocsToSidebars(docs),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/longbridgeapp/feishu-pages' },
    ],
  },
});
