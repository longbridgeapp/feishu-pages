# Feishu Docx

Convert Feishu Docx into other formats (Markdown, HTML ...)

Visit [https://github.com/longbridgeapp/feishu-pages](https://github.com/longbridgeapp/feishu-pages) to learn more.

## Installation

```bash
yarn add feishu-docx
```

## Usage

```bash
import { MarkdownRenderer } from 'feishu-docx'

// Load docx JSON from file
const docx = fs.readFileSync('test.json')
const render = new MarkdownRenderer(docx)
const text = render.parse();
const fileTokens = render.fileTokens;
```

Now `fileTokens` is:

```js
{
  "TVEyb1pmWo8oIwxyL3kcIfrrnGd": {
      token: 'TVEyb1pmWo8oIwxyL3kcIfrrnGd',
      type: 'file',
  }
}
```

## License

MIT
