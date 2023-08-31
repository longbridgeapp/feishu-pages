# Feishu Docx

Convert Feishu Docx into other formats (Markdown, HTML ...)

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
const imageTokens = render.imageTokens;
```

## License

MIT
