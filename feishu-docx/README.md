# Feishu Docx

Convert Feishu Docx into other formats (Markdown, HTML ...)

## Usage

```bash
import { MarkdownRenderer } from 'feishu-docx'

// Load docx JSON from file
const docx = fs.readFileSync('test.json')
const renderer = new MarkdownRenderer(docx)
const text = renderer.parse();
```

## License

MIT
