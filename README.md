# Feishu Pages

导出飞书知识库，并按相同目录结构生成 [Static Page Generator](https://www.google.com/search?q=Static+Page+Generator) 支持 Markdown 文件组织方式，用于发布为静态网站。

## Features

- [feishu-docx](https://github.com/longbridgeapp/feishu-pages/tree/main/feishu-docx) - 支持将飞书新版文档 Docx 转换为 Markdown 或其他格式（目前只支持 Markdown）
- 目录结构组织
- 图片下载
- 与 GitHub Actions 结合
- 生成支持 [Docusaurus](https://docusaurus.io) 支持的 Markdown 格式，以实现目录结构组织（基于 `sidebar_position`）

## Installation

Feishu Pages 可以以 NPM 的方式引入到 Static Page Generator 的项目中。

例如我们有一个 [Docusaurus](https://docusaurus.io) 的静态页面网站项目。

```bash
cd your-project/
yarn add feishu-pages
```

然后你就可以执行 `yarn feishu-pages` 来生成页面了。

## Feishu Permissions

- `docx:document:readonly`
- `wiki:wiki:readonly`
- `drive:drive:readonly`

## Configuration

| Name                | Description                                                             | Required | Default   |
| ------------------- | ----------------------------------------------------------------------- | -------- | --------- |
| `FEISHU_APP_ID`     | 飞书应用 ID                                                             | YES      |           |
| `FEISHU_APP_SECRET` | 飞书应用 Secret                                                         | YES      |           |
| `FEISHU_SPACE_ID`   | 飞书知识库 ID                                                           | YES      |           |
| `ASSET_BASE_URL`    | 资源文件（图片、附件）的 Base URL，通过这个配置配置 img src 的 URL 前缀 | NO       | `/assets` |
| `OUTPUT_DIR`        | 输出目录                                                                | NO       | `./dist`  |
| `ROOT_NODE_TOKEN`   | 根节点，导出节点以下（不含此节点）的所有内容。                          | NO       |           |

## Usage

### 创建飞书应用并开通权限

1. 请访问 https://open.feishu.cn/app 创建一个新应用，并获得：

   - `App ID`
   - `App Secret` - 请注意保管 App Secret，不要泄露到互联网。

2. 为应用开启 `机器人` 应用能力。
3. 为应用开启 `docx:document:readonly` 和 `wiki:wiki:readonly` 权限。
4. 将应用发布正式版本，并确保审批通过。
5. 在飞书 IM 中创建新群 `Feishu Pages`，将应用添加为该群机器人，知识库管理员在「知识空间设置」-> 「权限设置」->「添加管理员」中添加，把这个 `Feishu Pages` 群加成 **管理员**。

   - 否则会遇到 `permission denied: wiki space permission denied` 错误。 [ref](https://open.feishu.cn/document/server-docs/docs/wiki-v2/wiki-qa)

### 获取飞书知识库 `space_id`

我们需要配置 `FEISHU_SPACE_ID` 的环境变量，这个为飞书知识库的 `space_id`，你可以访问知识库设置界面，从 URL 中获取。

例如：`https://your-company.feishu.cn/wiki/settings/6992046856314306562` 这里面 `6992046856314306562` 为 `space_id`。

### 环境变量配置

Feishu Pages 支持 `.env` 文件，如果执行的根目录有个 `.env` 文件，将会自动读取。

请参考 `.env.default` 配置环境变量。

如需在 GitHub Actions 的 CI 流程里面使用，建议添加到 Secrets 中，再通过环境变量的方式获取。

### 从知识库导出 Markdown 文档

```bash
cd your-project/
yarn feishu-pages
```

按上面默认的配置，最终会在 `./dist` 目录下生成 Markdown 文件以及导出的图片文件，如果你期望调整目录，可以自己设置 `OUTPUT_DIR` 环境变量。

## GitHub Actions 集成

创建一个 `.github/workflows/feishu-pages.yml` 文件，内容如下：

> NOTE: 你需要用到 VitePress 或 Docusaurus 之类的文档工具，这里假设他们在项目根目录有 `yarn build` 命令可以将 `docs` 文件夹的 Markdown 文件生成为静态网站。
>
> 具体可以参考：https://github.com/longbridgeapp/feishu-pages/tree/main/example-website

```yml
on:
  push:
    branches:
      - main
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  feishu-pages:
    name: Feishu Pages Export
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Exporting
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_SPACE_ID: ${{ secrets.FEISHU_SPACE_ID }}
          OUTPUT_DIR: ./dist
          ASSET_BASE_URL: '/assets'
        uses: longbridgeapp/feishu-pages@main
      - name: Build Pages
        run: |
          cp dist/docs/**/* ./docs/
          cp -R dist/assets ./public/
          yarn
          yarn build
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './example-website/.vitepress/dist'
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

## 常见问题

### Rate Limit 相关错误

> Error: request trigger frequency limit

飞书 API 有总每分钟 100 次请求的[总频率限制](https://open.feishu.cn/document/ukTMukTMukTM/uUzN04SN3QjL1cDN)，这个项目实现的时候为每个请求之前做了 300ms 的延迟，以避免超过这个频率。如有遇到此类问题，请提交 Issue。

## License

MIT
