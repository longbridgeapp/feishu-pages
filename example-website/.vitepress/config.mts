import { defineConfig } from 'vitepress';
import { generateSidebar } from 'vitepress-sidebar';

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'Feishu Pages Example',
  base: '/feishu-pages/',
  ignoreDeadLinks: true,
  cleanUrls: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [{ text: 'Home', link: '/' }],

    sidebar: generateSidebar({
      useTitleFromFrontmatter: true,
      useIndexFileForFolderMenuInfo: true,
      excludeFolders: ['node_modules'],
    }),

    socialLinks: [
      { icon: 'github', link: 'https://github.com/longbridgeapp/feishu-pages' },
    ],
  },
});
