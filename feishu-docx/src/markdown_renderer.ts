import { CodeLanguage } from 'feishu-docx';
import YAML from 'js-yaml';
import { marked } from 'marked';
import { createElement } from './dom';
import { getEmojiChar } from './emoji';
import { Buffer } from './string_buffer';

import { Renderer, trimLastNewline } from './renderer';
import {
  Block,
  BlockType,
  CalloutBackgroundColorMap,
  CalloutBorderColorMap,
  FontColorMap,
  ImageBlock,
  TableBlock,
  TextBlock,
  TextElement,
  TextRun,
  getAlignStyle,
  getCodeLanguage,
} from './types';

/**
 * Markdown Renderer
 *
 * Convert Feishu Docx to Markdown GFM
 *
 * This is inspired by feishu2md (Go version)
 * https://github.com/Wsine/feishu2md/blob/cb906109235b07b82b5a6348bdf1103c9fa1e62c/core/parser.go
 */
export class MarkdownRenderer extends Renderer {
  parseBlock(block: Block, indent: number) {
    if (!block) {
      return '';
    }

    const buf = new Buffer();

    buf.write(' '.repeat(indent * 4));
    switch (block.block_type) {
      case BlockType.Page:
        buf.write(this.parsePageBlock(block));
        break;
      case BlockType.Text:
        buf.write(this.parseTextBlock(block.text));
        break;
      case BlockType.Heading1:
        buf.write('# ');
        buf.write(this.parseTextBlock(block.heading1));
        break;
      case BlockType.Heading2:
        buf.write('## ');
        buf.write(this.parseTextBlock(block.heading2));
        break;
      case BlockType.Heading3:
        buf.write('### ');
        buf.write(this.parseTextBlock(block.heading3));
        break;
      case BlockType.Heading4:
        buf.write('#### ');
        buf.write(this.parseTextBlock(block.heading4));
        break;
      case BlockType.Heading5:
        buf.write('##### ');
        buf.write(this.parseTextBlock(block.heading5));
        break;
      case BlockType.Heading6:
        buf.write('###### ');
        buf.write(this.parseTextBlock(block.heading6));
        break;
      case BlockType.Heading7:
        buf.write('####### ');
        buf.write(this.parseTextBlock(block.heading7));
        break;
      case BlockType.Heading8:
        buf.write('######## ');
        buf.write(this.parseTextBlock(block.heading8));
        break;
      case BlockType.Heading9:
        buf.write('######### ');
        buf.write(this.parseTextBlock(block.heading9));
        break;
      case BlockType.Bullet:
        buf.write(this.parseBulletBlock(block, indent));
        break;
      case BlockType.Ordered:
        buf.write(this.parseOrderedBlock(block, indent));
        break;
      case BlockType.Code:
        buf.write('```');
        buf.write(getCodeLanguage(block.code.style.language));
        buf.write('\n');
        buf.write(this.parseTextBlock(block.code).trim());
        buf.write('\n```\n');
        break;
      case BlockType.Quote:
        buf.write('> ');
        buf.write(this.parseTextBlock(block.quote));
        break;
      case BlockType.TodoList:
        buf.write('- [');
        buf.write(block.todo.style.done ? 'x' : ' ');
        buf.write('] ');
        buf.write(this.parseTextBlock(block.todo));
        break;
      case BlockType.Divider:
        buf.write('---\n');
        break;
      case BlockType.Image:
        buf.write(this.parseImage(block.image));
        break;
      case BlockType.TableCell:
        buf.write(this.parseTableCell(block));
        break;
      case BlockType.Table:
        buf.write(this.parseTable(block.table));
        break;
      case BlockType.QuoteContainer:
        buf.write(this.parseQuoteContainer(block));
        break;
      case BlockType.View:
        buf.write(this.parseView(block));
        break;
      case BlockType.File:
        buf.write(this.parseFile(block));
        break;
      case BlockType.Grid:
        buf.write(this.parseGrid(block));
        break;
      case BlockType.GridColumn:
        break;
      case BlockType.Callout:
        buf.write(this.parseCallout(block));
        break;
      case BlockType.Iframe:
        buf.write(this.parseIframe(block));
        break;
      case BlockType.SyncedBlock:
        buf.write(this.parseSyncedBlock(block));
        break;
      default:
        buf.write(this.parseUnsupport(block));
        break;
    }

    return buf.toString();
  }

  /**
   * Parse this first block as PageMeta
   *
   * Return false if not found first code block.
   * Otherwise return true if parsed as YAML, false if not YAML.
   *
   * https://longbridgeapp.github.io/feishu-pages/zh-CN/page-meta
   *
   * @param block
   * @returns
   */
  parsePageMeta(block: Block) {
    if (block?.block_type !== BlockType.Code) {
      if (block.children?.length > 0) {
        return this.parsePageMeta(this.blockMap[block.children[0]]);
      } else {
        return false;
      }
    }

    // Only support YAML
    if (block?.code?.style?.language !== CodeLanguage.YAML) {
      return false;
    }
    let code = this.parseTextBlock(block.code).trim();

    if (!code) {
      return false;
    }

    const language = block?.code?.style?.language;
    try {
      if (language === CodeLanguage.YAML) {
        this.meta = YAML.load(code);
      } else if (language === CodeLanguage.JSON) {
        this.meta = JSON.parse(code);
      }
    } catch {
      console.error(`Invalid ${language} content, ignored.\n\n` + code);
    }

    return true;
  }

  parsePageBlock(block: Block) {
    const buf = new Buffer();

    buf.write('# ');
    buf.write(this.parseTextBlock(block.page));
    buf.write('\n');

    block.children?.forEach((childId, idx) => {
      const child = this.blockMap[childId];
      this.nextBlock = this.blockMap[block.children[idx + 1]];

      // Extract PageMeta from first code block
      if (idx == 0) {
        if (this.parsePageMeta(child)) {
          return;
        }
      }

      let childText = this.parseBlock(child, 0);
      if (childText.length > 0) {
        buf.write(childText);
        buf.write('\n');
      }
    });

    return buf.toString();
  }

  parseTextBlock(block: TextBlock) {
    const buf = new Buffer();
    const inline = block.elements.length > 1;

    block.elements?.forEach((el) => {
      buf.write(this.parseTextElement(el, inline));
    });

    if (buf.length > 0) {
      buf.write('\n');
    }

    return buf.toString();
  }

  parseBulletBlock(block: Block, indent: number = 0) {
    const buf = new Buffer();

    buf.write('- ');
    let itemText = this.parseTextBlock(block.bullet);
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }

    buf.write(itemText);

    block.children?.forEach((childId, idx) => {
      const child = this.blockMap[childId];
      this.nextBlock = null;
      buf.write(this.parseBlock(child, indent + 1));
    });

    return buf.toString();
  }

  parseOrderedBlock(block: Block, indent: number = 0) {
    const buf = new Buffer();

    const parent = this.blockMap[block.parent_id];
    let order = 1;

    // Calc the order number
    parent?.children?.forEach((childId, idx) => {
      if (childId == block.block_id) {
        for (let i = idx - 1; i >= 0; i--) {
          if (
            this.blockMap[parent.children[i]].block_type == BlockType.Ordered
          ) {
            order++;
          } else {
            break;
          }
        }
      }
    });

    buf.write(`${order}. `);
    let itemText = this.parseTextBlock(block.ordered);
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }
    buf.write(itemText);

    // Sub items
    block.children?.forEach((childId, idx) => {
      const child = this.blockMap[childId];
      // Peek next block
      this.nextBlock = null;
      buf.write(this.parseBlock(child, indent + 1));
    });

    return buf.toString();
  }

  parseTextElement(el: TextElement, inline: boolean) {
    const buf = new Buffer();
    if (el.text_run) {
      buf.write(this.parseTextRun(el.text_run));
    } else if (el.equation) {
      let symbol = inline ? '$' : '$$';
      buf.write(symbol);
      buf.write(el.equation.content.trimEnd());
      buf.write(symbol);
    } else if (el.mention_doc) {
      const node_token = decodeURIComponent(el.mention_doc.token);
      buf.write(`[${el.mention_doc.title}](${node_token})`);
    }

    return buf.toString();
  }

  parseTextRun(textRun: TextRun) {
    const buf = new Buffer();
    let postWrite = '';

    let style = textRun.text_element_style;
    if (style) {
      if (style.bold) {
        buf.write('**');
        postWrite = '**';
      } else if (style.italic) {
        buf.write('_');
        postWrite = '_';
      } else if (style.strikethrough) {
        buf.write('~~');
        postWrite = '~~';
      } else if (style.underline) {
        buf.write('<u>');
        postWrite = '</u>';
      } else if (style.inline_code) {
        buf.write('`');
        postWrite = '`';
      } else if (style.link) {
        const unescapeURL = decodeURIComponent(style.link.url);
        buf.write(`[`);
        postWrite = `](${unescapeURL})`;
      }
    }
    buf.write(textRun.content || '');
    buf.write(postWrite);

    return buf.toString();
  }

  parseImage(image: ImageBlock) {
    const buf = new Buffer();

    const align = getAlignStyle(image.align);
    let alignAttr = '';
    if (align != 'left') {
      alignAttr = ` align="${align}"`;
    }

    const el = createElement('img');
    el.setAttribute('src', image.token);
    if (image.width) {
      el.setAttribute('src-width', image.width.toString());
    }
    // Only give height when width is not given
    if (image.height) {
      el.setAttribute('src-height', image.height.toString());
    }
    if (align && align != 'left') {
      el.setAttribute('align', align);
    }

    buf.write(el.outerHTML);
    buf.write('\n');

    this.addFileToken('image', image.token);

    return buf.toString();
  }

  parseTableCell(block: Block) {
    const buf = new Buffer();

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseBlock(child, 0));
    });

    return buf.toString();
  }

  parseTable(table: TableBlock) {
    let rows: string[][] = [[]];

    table.cells.forEach((blockId, idx) => {
      const block = this.blockMap[blockId];
      let cellText = this.parseBlock(block, 0);
      cellText = trimLastNewline(cellText).replace(/\n/gm, '<br/>');
      const row = Math.floor(idx / table.property.column_size);

      if (rows.length < row + 1) {
        rows.push([]);
      }

      rows[row].push(cellText);
    });

    const buf = new Buffer();

    // Write thead
    let headRow = [];
    if (table.property?.header_row) {
      headRow = rows.shift();
    }
    buf.write('|');
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write(headRow[i] || '   ');
      buf.write('|');
    }
    buf.write('\n');

    // Render thead divider
    buf.write('|');
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write('---|');
    }
    buf.write('\n');

    // Render tbody
    for (const row of rows) {
      buf.write('|');
      row.forEach((cell) => {
        buf.write(cell);
        buf.write('|');
      });
      buf.write('\n');
    }

    return buf.toString();
  }

  parseQuoteContainer(block: Block) {
    const buf = new Buffer();

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write('> ');
      buf.write(this.parseBlock(child, 0));
    });

    return buf.toString();
  }

  parseView(block: Block) {
    const buf = new Buffer();

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseBlock(child, 0));
    });

    return buf.toString();
  }

  parseFile(block: Block) {
    const buf = new Buffer();
    const file = block.file;

    this.addFileToken('file', file.token);

    buf.write(`[${file.name}](${file.token})`);
    buf.write('\n');

    return buf.toString();
  }

  parseGrid(block: Block) {
    const buf = new Buffer();

    buf.write(`<div class="grid gap-3 grid-cols-${block.grid.column_size}">\n`);

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseGridColumn(child));
    });
    buf.write('</div>\n');

    return buf.toString();
  }

  parseGridColumn(block: Block) {
    const buf = new Buffer();

    buf.write(`<div>\n`);

    let innerBuf = new Buffer();
    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      innerBuf.write(this.parseBlock(child, 0));
    });
    buf.write(this.markdownToHTML(innerBuf.toString()));
    buf.write('</div>\n');

    return buf.toString();
  }

  parseCallout(block: Block) {
    const buf = new Buffer();

    const style = {};
    const classNames = ['callout'];

    if (block.callout.background_color) {
      const backgroundColor =
        CalloutBackgroundColorMap[block.callout.background_color];
      style['background'] = backgroundColor;
      classNames.push(`callout-bg-${block.callout.background_color}`);
    }

    if (block.callout.border_color) {
      const borderColor = CalloutBorderColorMap[block.callout.border_color];
      style['border'] = `1px solid ${borderColor}`;
      classNames.push(`callout-border-${block.callout.border_color}`);
    }
    if (block.callout.text_color) {
      const textColor = FontColorMap[block.callout.text_color] || '#2222';
      style['color'] = textColor;
      classNames.push(`callout-color-${block.callout.text_color}`);
    }

    const styleAttr = Object.keys(style)
      .map((key) => {
        return `${key}: ${style[key]}`;
      })
      .join('; ');

    buf.write(`<div class="${classNames.join(' ')}">\n`);

    // Inner of the Callout, we need ouput as HTML
    let markdownBuf = new Buffer();
    if (block.callout.emoji_id) {
      markdownBuf.write(getEmojiChar(block.callout.emoji_id));
      markdownBuf.write(' ');
    }
    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      markdownBuf.write(this.parseBlock(child, 0));
    });

    let html = this.markdownToHTML(markdownBuf.toString());

    buf.write(html);
    buf.write('</div>\n');

    return buf.toString();
  }

  parseIframe(block: Block) {
    let buf = new Buffer();

    let url = block.iframe?.component?.url;
    if (!url) return '';

    const el = createElement('iframe');
    el.setAttribute('src', decodeURIComponent(block.iframe.component.url));
    buf.write(el.outerHTML);
    buf.write('\n');
    return buf.toString();
  }

  parseSyncedBlock(block: Block) {
    const buf = new Buffer();

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseBlock(child, 0));
    });

    return buf.toString();
  }

  parseUnsupport(block: Block) {
    if (!this.outputUnsupported) {
      return '';
    }

    const buf = new Buffer();

    buf.write('```\n');
    buf.write(`// [Unsupport] ${BlockType[block.block_type]}\n`);
    buf.write(JSON.stringify(block, null, 2));
    buf.write('\n```\n');
    return buf.toString();
  }

  markdownToHTML(markdown: string): string {
    let html = marked.parse(markdown, { gfm: true, breaks: true });
    return html;
  }
}
