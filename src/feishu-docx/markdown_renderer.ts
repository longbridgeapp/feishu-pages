import { Buffer } from 'node:buffer';
import {
  Block,
  BlockType,
  ImageBlock,
  Renderer,
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
 */
export class MarkdownRenderer extends Renderer {
  parseBlock(block: Block, indent: number) {
    if (!block) {
      return '';
    }

    console.log('parseBlock:', block);

    let buf = Buffer.alloc(0);

    buf.write(' '.repeat(indent * 2));
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
      case BlockType.Bulleted:
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
      default:
        buf.write(this.parseUnsupport(block));
        break;
    }

    return buf.toString();
  }

  parsePageBlock(block: Block) {
    if (block.block_type != BlockType.Page) {
      return '';
    }

    const buf = Buffer.from('');

    buf.write('#');
    buf.write(this.parseTextBlock(block.page));
    buf.write('\n');

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseBlock(child, 0));
      buf.write('\n');
    });

    return buf.toString();
  }

  parseTextBlock(block: TextBlock) {
    const buf = Buffer.from('');
    const elLen = block.elements.length;

    block.elements?.forEach((el) => {
      const inline = elLen > 1;
      buf.write(this.parseTextElement(el, inline));
    });

    buf.write('\n');

    return buf.toString();
  }

  parseBulletBlock(block: Block, indent: number = 0) {
    const buf = Buffer.from('');

    buf.write('- ');
    buf.write(this.parseTextBlock(block.bullet));

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseBlock(child, indent + 1));
    });

    return buf.toString();
  }

  parseOrderedBlock(block: Block, indent: number = 0) {
    const buf = Buffer.from('');

    const parent = this.blockMap[block.parent_id];
    let order = 1;

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
    buf.write(this.parseTextBlock(block.ordered));

    return buf.toString();
  }

  parseTextElement(el: TextElement, inline: boolean) {
    const buf = Buffer.from('');
    if (el.text_run) {
      buf.write(this.parseTextRun(el.text_run));
    } else if (el.equation) {
      buf.write('$$');
      buf.write(this.parseTextRun(el.equation));
      buf.write('$$');
    } else if (el.mention_doc) {
      buf.write(`[${el.mention_doc.title}](${el.mention_doc.url})`);
    }

    return buf.toString();
  }

  parseTextRun(textRun: TextRun) {
    const buf = Buffer.from('');
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
    const buf = Buffer.from('');

    const align = getAlignStyle(image.align);
    const imageHTML = `<img src="${image.token}" width="${image.width}" height="${image.height}" align="${align} />`;
    buf.write(imageHTML);
    buf.write('\n');

    this.imageTokens.push(image.token);

    return buf.toString();
  }

  parseTableCell(block: Block) {
    const buf = Buffer.from('');

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
      const cellText = this.parseBlock(block, 0).replace(/\n/, '<br>');
      const row = Math.floor(idx / table.property.column_size);

      if (rows.length < row + 1) {
        rows.push([]);
      }

      rows[row].push(cellText);
    });

    const buf = Buffer.from('');
    // Render markdown table
    buf.write('|');
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write('---|');
    }
    buf.write('\n');

    rows.forEach((row) => {
      buf.write('|');
      row.forEach((cell) => {
        buf.write(cell);
        buf.write('|');
      });
      buf.write('\n');
    });

    return buf.toString();
  }

  parseQuoteContainer(block: Block) {
    const buf = Buffer.from('');

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write('> ');
      buf.write(this.parseBlock(child, 0));
    });

    return buf.toString();
  }

  parseUnsupport(block: Block) {
    const buf = Buffer.from('');
    buf.write(`[Unsupport] ${BlockType[block.block_type]}\n`);
    buf.write('```\n');
    buf.write(JSON.stringify(block, null, 2));
    buf.write('\n```\n');
    return buf.toString();
  }
}
