# Feishu Pages

Generate Feishu Wiki into a markdown pages for work with static page generators.

## Feishu Permissions

- `docx:document:readonly`
- `wiki:wiki:readonly`

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

例如：`https://you-company.feishu.cn/wiki/settings/6992046856314306562` 这里面 `6992046856314306562` 为 `space_id`。

### 环境变量配置

请参考 `.env.default` 配置环境变量。

如需在 GitHub Actions 的 CI 流程里面使用，建议添加到 Secrets 中，再通过环境变量的方式获取。

## 常见问题

### Rate Limit 相关错误

> Error: request trigger frequency limit

飞书 API 有总每分钟 100 次请求的[总频率限制](https://open.feishu.cn/document/ukTMukTMukTM/uUzN04SN3QjL1cDN)，这个项目实现的时候为每个请求之前做了 300ms 的延迟，以避免超过这个频率。如有遇到此类问题，请提交 Issue。
