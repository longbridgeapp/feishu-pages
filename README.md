# Feishu Pages

导出**飞书知识库**，并按相同目录结构生成 [Static Page Generator](https://www.google.com/search?q=Static+Page+Generator) 支持 Markdown 文件组织方式，用于发布为静态网站。

借用飞书文档较好的撰写能力，让不懂 Markdown 和 Git 的非技术人员可以轻松撰写文档，并也最终以静态页面生成的方式来部署文档。这样我们依然可以继续保持 CI 流程和 GitHub PR 的方式来 Review 文档变更。

> 可以访问此文档的 [原始飞书知识库](https://longbridge.feishu.cn/wiki/space/7273324757679325186) 对比看一下。

## Features

- [feishu-docx](https://github.com/longbridgeapp/feishu-pages/tree/main/feishu-docx) - 支持将飞书新版文档 Docx 转换为 Markdown 或其他格式（_目前只支持 Markdown_）
- 目录结构组织，与 URL 路径自定义
- 图片、附件下载
- 国际化支持
- 与 GitHub Actions 结合
- 生成支持 [Docusaurus](https://docusaurus.io/) 支持的 MDX 格式的 Meta 信息，以实现目录结构组织（基于 `sidebar_position`）

## Prepare

> 📌 在开始使用之前，必须先完成飞书开放平台的配置工作，获得一些必要的信息，和配置必要的权限，请认真阅读完此页再继续。

### **创建飞书应用并开通权限**

1. 请访问 [https://open.feishu.cn/app](https://open.feishu.cn/app) 创建一个新应用，并获得：

   - `App ID`
   - `App Secret` - 请注意保管 App Secret，不要泄露到互联网。

2. 为应用开启 `机器人` 应用能力。
3. 为应用开启 `docx:document:readonly` 和 `wiki:wiki:readonly` 权限。
4. 将应用发布正式版本，并确保审批通过。
5. 在飞书 IM 中创建新群 `Feishu Pages`，将应用添加为该群机器人，知识库管理员在「知识空间设置」-> 「权限设置」->「添加管理员」中添加，把这个 `Feishu Pages` 群加成 **管理员**。
   - 否则会遇到 `permission denied: wiki space permission denied` 错误。 [ref](https://open.feishu.cn/document/server-docs/docs/wiki-v2/wiki-qa)

## **Feishu Permissions**

你的飞书应用需要开通下面几个权限，工具通过飞书 API 访问必须要这几项。

- `docx:document:readonly`
- `wiki:wiki:readonly`
- `drive:drive:readonly`

### **获取飞书知识库 \*\***space_id\*\*

我们需要配置 `FEISHU_SPACE_ID` 的环境变量，这个为飞书知识库的 `space_id`，你可以访问知识库设置界面，从 URL 中获取。

例如：`https://your-company.feishu.cn/wiki/settings/6992046856314306562` 这里面 `6992046856314306562` 为 `space_id`。

### **环境变量配置**

Feishu Pages 支持 `.env` 文件，如果执行的根目录有个 `.env` 文件，将会自动读取。

> 请参考 `.env.default` 配置环境变量。

如需在 GitHub Actions 的 CI 流程里面使用，建议添加到 Secrets 中，再通过环境变量的方式获取。

## Installation

Feishu Pages 可以以 NPM 的方式引入到 Static Page Generator 的项目中。

例如我们有一个 [Docusaurus](https://docusaurus.io) 的静态页面网站项目。

```bash
cd your-project/
yarn add feishu-pages
```

然后你就可以执行 `yarn feishu-pages` 来生成页面了。

在运行此命令之前，必须先完成飞书开放平台的配置工作，获得一些必要的信息，和配置必要的权限，请继续阅读完此页再继续。

## Configuration

我们可以通过环境变量（ENV）来配置 feishu-pages 需要的必要参数，这样你可以轻易在 GitHub Actions 之类的流程中使用 feishu-pages。

> 如果你想简单一些，也可以用 `.env` 文件来配置环境变量，注意避免 `FEISHU_APP_SECRET` 泄露到互联网。

| Name                | Description                                                       | Required | Default                |
| ------------------- | ----------------------------------------------------------------- | -------- | ---------------------- |
| `FEISHU_ENDPOINT`   | 飞书 API 节点，如用 LarkSuite 可以通过这个配置 API 地址           | NO       | https://open.feishu.cn |
| `FEISHU_APP_ID`     | 飞书应用 ID                                                       | YES      |                        |
| `FEISHU_APP_SECRET` | 飞书应用 Secret                                                   | YES      |                        |
| `FEISHU_SPACE_ID`   | 飞书知识库 ID                                                     | YES      |                        |
| `OUTPUT_DIR`        | 输出目录                                                          | NO       | `./dist`               |
| `ROOT_NODE_TOKEN`   | 根节点，导出节点以下（不含此节点）的所有内容。                    | NO       |                        |
| `BASE_URL`        | 自定义文档里面相关文档输出的 URL 前缀，例如：`/docs/`，默认为 `/`，建议采用完整 URL 避免相对路径的各类问题。 | NO       | `/`                    |

## Usage

### 从知识库导出 Markdown 文档

当你撰写完成文档以后，可以通过 `yarn feishu-pages` 命令来实现导出，这个命令作用是通过飞书 API 访问你 `FEISHU_SPACE_ID` 对应的知识库，并依次将所有文档导出，并转换为 Markdown 文件。

```bash
cd your-project/
yarn feishu-pages
```

按上面默认的配置，最终会在 `./dist` 目录下生成 Markdown 文件以及导出的图片文件，如果你期望调整目录，可以自己设置 `OUTPUT_DIR` 环境变量。

> 💡 文档内 [Page Mata](https://longbridgeapp.github.io/feishu-pages/zh-CN/page-meta) 标识为 `hide: true` 的文档将会被排除掉，你可以用来隐藏一些不想公开的文档。
>
> 所有的 Markdown 导出的文件名将遵循知识库的目录树，并按照 Page Meta 里面的 `slug` 来整理文件夹和文件名。

## GitHub Actions 集成

创建一个 `.github/workflows/feishu-pages.yml` 文件，内容如下：

> NOTE: 你需要用到 VitePress 或 Docusaurus 之类的文档工具，这里假设他们在项目根目录有 `yarn build` 命令可以将 `docs` 文件夹的 Markdown 文件生成为静态网站。
>
> 具体可以参考：https://github.com/longbridgeapp/feishu-pages/tree/main/website

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
      - uses: actions/cache@v3
        with:
          path: dist/.cache
          key: cache-dist
      - name: Exporting
        env:
          FEISHU_APP_ID: ${{ secrets.FEISHU_APP_ID }}
          FEISHU_APP_SECRET: ${{ secrets.FEISHU_APP_SECRET }}
          FEISHU_SPACE_ID: ${{ secrets.FEISHU_SPACE_ID }}
        uses: longbridgeapp/feishu-pages@main
      - name: Build Pages
        run: |
          cp -r dist/docs ./
          cp dist/docs.json ./
          yarn
          yarn build
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: './website/.vitepress/dist'
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
