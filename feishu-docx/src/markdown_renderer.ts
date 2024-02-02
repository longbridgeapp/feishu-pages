import { CodeLanguage } from "feishu-docx";
import YAML from "js-yaml";
import { marked } from "marked";
import { markedXhtml } from "marked-xhtml";
import { createElement } from "./dom";
import { getEmojiChar } from "./emoji";
import { Buffer } from "./string_buffer";

import { Renderer, escapeHTMLTags, trimLastNewline } from "./renderer";
import {
  Block,
  BlockType,
  CalloutBackgroundColorMap,
  CalloutBorderColorMap,
  FontColorMap,
  ImageBlock,
  TableBlock,
  TableMergeInfo,
  TextBlock,
  TextElement,
  TextRun,
  getAlignStyle,
  getCodeLanguage,
} from "./types";

marked.use(markedXhtml());

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
    this.indent = indent;

    if (!block) {
      return "";
    }

    const buf = new Buffer();
    buf.writeIndent(this.indent);

    this.currentBlock = block;
    switch (block.block_type) {
      case BlockType.Page:
        buf.write(this.parsePageBlock(block));
        break;
      case BlockType.Text:
        buf.write(this.parseTextBlock(block.text));
        break;
      case BlockType.Heading1:
        buf.write("# ");
        buf.write(this.parseTextBlock(block.heading1));
        break;
      case BlockType.Heading2:
        buf.write("## ");
        buf.write(this.parseTextBlock(block.heading2));
        break;
      case BlockType.Heading3:
        buf.write("### ");
        buf.write(this.parseTextBlock(block.heading3));
        break;
      case BlockType.Heading4:
        buf.write("#### ");
        buf.write(this.parseTextBlock(block.heading4));
        break;
      case BlockType.Heading5:
        buf.write("##### ");
        buf.write(this.parseTextBlock(block.heading5));
        break;
      case BlockType.Heading6:
        buf.write("###### ");
        buf.write(this.parseTextBlock(block.heading6));
        break;
      case BlockType.Heading7:
        buf.write("####### ");
        buf.write(this.parseTextBlock(block.heading7));
        break;
      case BlockType.Heading8:
        buf.write("######## ");
        buf.write(this.parseTextBlock(block.heading8));
        break;
      case BlockType.Heading9:
        buf.write("######### ");
        buf.write(this.parseTextBlock(block.heading9));
        break;
      case BlockType.Bullet:
        buf.write(this.parseBulletBlock(block, indent));
        break;
      case BlockType.Ordered:
        buf.write(this.parseOrderedBlock(block, indent));
        break;
      case BlockType.Code:
        buf.write("```");
        buf.write(getCodeLanguage(block.code.style.language));
        buf.write("\n");
        buf.write(this.parseTextBlock(block.code).toString().trim());
        buf.write("\n```\n");
        break;
      case BlockType.Quote:
        buf.write("> ");
        buf.write(this.parseTextBlock(block.quote));
        break;
      case BlockType.TodoList:
        buf.write("- [");
        buf.write(block.todo.style.done ? "x" : " ");
        buf.write("] ");
        buf.write(this.parseTextBlock(block.todo));
        break;
      case BlockType.Divider:
        buf.write("---\n");
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
    let code = this.parseTextBlock(block.code).toString().trim();

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

  parsePageBlock(block: Block): Buffer | string {
    const buf = new Buffer();

    buf.write("# ");
    buf.write(this.parseTextBlock(block.page));
    buf.write("\n");

    block.children?.forEach((childId, idx) => {
      const child = this.blockMap[childId];
      this.nextBlock = this.blockMap[block.children[idx + 1]];

      // Extract PageMeta from first code block
      if (idx == 0) {
        if (this.parsePageMeta(child)) {
          return;
        }
      }

      this.withSubIndent(() => {
        let childText = this.parseBlock(child, 0);
        if (childText.length > 0) {
          buf.write(childText);
          buf.write("\n");
        }
      });
    });

    return buf;
  }

  parseTextBlock(block: TextBlock): Buffer | string {
    const buf = new Buffer();
    const inline = block.elements.length > 1;

    block.elements?.forEach((el) => {
      this.parseTextElement(buf, el, inline);
    });

    if (buf.length > 0) {
      buf.write("\n");
    }

    return buf;
  }

  parseBulletBlock(block: Block, indent: number = 0): Buffer | string {
    const buf = new Buffer();

    buf.write("- ");
    let itemText = this.parseTextBlock(block.bullet).toString();
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }

    buf.write(itemText);

    this.withSubIndent(() => {
      block.children?.forEach((childId, idx) => {
        const child = this.blockMap[childId];
        this.nextBlock = null;
        buf.write(this.parseBlock(child, indent + 1));
      });
    });

    return buf;
  }

  parseOrderedBlock(block: Block, indent: number = 0): Buffer | string {
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
    let itemText = this.parseTextBlock(block.ordered).toString();
    if (
      this.nextBlock?.block_type == block.block_type &&
      this.nextBlock?.parent_id == block.parent_id &&
      !block.children?.length
    ) {
      itemText = trimLastNewline(itemText);
    }
    buf.write(itemText);

    // Sub items
    this.withSubIndent(() => {
      block.children?.forEach((childId, idx) => {
        const child = this.blockMap[childId];
        // Peek next block
        this.nextBlock = null;
        buf.write(this.parseBlock(child, indent + 1));
      });
    });

    return buf;
  }

  parseTextElement(buf: Buffer, el: TextElement, inline: boolean) {
    if (el.text_run) {
      this.parseTextRun(buf, el.text_run);
    } else if (el.equation) {
      let symbol = inline ? "$" : "$$";
      buf.write(symbol);
      buf.write(el.equation.content.trimEnd());
      buf.write(symbol);
    } else if (el.mention_doc) {
      const node_token = decodeURIComponent(el.mention_doc.token);
      buf.write(`[${el.mention_doc.title}](${node_token})`);
    }
  }

  parseTextRun(buf: Buffer, textRun: TextRun) {
    let preWrite = "";
    let postWrite = "";

    let style = textRun.text_element_style;
    let escape = true;
    if (style) {
      if (style.bold) {
        preWrite = "**";
        postWrite = "**";
      } else if (style.italic) {
        preWrite = "_";
        postWrite = "_";
      } else if (style.strikethrough) {
        preWrite = "~~";
        postWrite = "~~";
      } else if (style.underline) {
        preWrite = "<u>";
        postWrite = "</u>";
      } else if (style.inline_code) {
        preWrite = "`";
        postWrite = "`";
        escape = false;
      } else if (style.link) {
        const unescapeURL = decodeURIComponent(style.link.url);
        preWrite = `[`;
        postWrite = `](${unescapeURL})`;
      }
    }

    let plainText = textRun.content || "";
    // Only escape HTML tags when not in style
    // For example: `<div>` will keep.
    //
    // ignore in CodeBlock
    if (escape && this.currentBlock?.block_type != BlockType.Code) {
      plainText = escapeHTMLTags(plainText);
    }

    // If the previus style is same as current, we can merge them.
    // For example:
    // Last is: **He**
    // Current is: **llo**
    // Then we can merge them to **Hello**
    if (!buf.trimLastIfEndsWith(preWrite)) {
      buf.write(preWrite);
    }
    buf.write(plainText);
    buf.write(postWrite);
  }

  parseImage(image: ImageBlock): Buffer | string {
    const buf = new Buffer();

    const align = getAlignStyle(image.align);
    let alignAttr = "";
    if (align != "left") {
      alignAttr = ` align="${align}"`;
    }

    const el = createElement("img");
    el.setAttribute("src", image.token);
    if (image.width) {
      el.setAttribute("src-width", image.width.toString());
    }
    // Only give height when width is not given
    if (image.height) {
      el.setAttribute("src-height", image.height.toString());
    }
    if (align && align != "left") {
      el.setAttribute("align", align);
    }

    buf.write(el.outerHTML);
    buf.write("\n");

    this.addFileToken("image", image.token);

    return buf;
  }

  parseTableCell(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  parseTable(table: TableBlock): Buffer | string {
    if (this.isComplexTable(table)) {
      return this.parseTableAsHTML(table);
    }

    let rows: string[][] = [[]];

    this.withSubIndent(() => {
      table.cells.forEach((blockId, idx) => {
        const block = this.blockMap[blockId];
        let cellText = this.parseBlock(block, 0);
        cellText = trimLastNewline(cellText).replace(/\n/gm, "<br/>");
        const row = Math.floor(idx / table.property.column_size);

        if (rows.length < row + 1) {
          rows.push([]);
        }

        rows[row].push(cellText);
      });
    });

    const buf = new Buffer();

    // Write thead
    let headRow = [];
    if (table.property?.header_row) {
      headRow = rows.shift();
    }
    buf.write("|");
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write(headRow[i] || "   ");
      buf.write("|");
    }
    buf.write("\n");

    // Render thead divider
    buf.write("|");
    for (let i = 0; i < table.property?.column_size; i++) {
      buf.write("---|");
    }
    buf.write("\n");

    // Render tbody
    for (const row of rows) {
      buf.write("|");
      row.forEach((cell) => {
        buf.write(cell);
        buf.write("|");
      });
      buf.write("\n");
    }

    return buf;
  }

  parseTableAsHTML(table: TableBlock): Buffer | string {
    let rows: string[][] = [[]];

    this.withSubIndent(() => {
      table.cells.forEach((blockId, idx) => {
        const block = this.blockMap[blockId];
        let cellHTML = this.markdownToHTML(this.parseBlock(block, 0));
        const row = Math.floor(idx / table.property.column_size);
        if (rows.length < row + 1) {
          rows.push([]);
        }

        rows[row].push(cellHTML.trim());
      });
    });

    // Build table attrs
    let attrs: any = {};
    if (table.property.header_column) {
      attrs.header_column = 1;
    }
    if (table.property.header_row) {
      attrs.header_row = 1;
    }

    let attrHTML = Object.keys(attrs)
      .map((key) => `${key}="${attrs[key]}"`)
      .join(" ");
    if (attrHTML.length > 0) {
      attrHTML = ` ${attrHTML}`;
    }

    const buf = new Buffer();
    buf.writeln(`<table${attrHTML}>`);

    // Write colgroup for col width
    buf.writeln("<colgroup>");

    for (let i = 0; i < table.property?.column_size; i++) {
      let width = table.property?.column_width[i];
      let widthAttr = width ? ` width="${width}"` : "";
      buf.writeln(`<col${widthAttr}/>`);
    }
    buf.writeln("</colgroup>");

    let cellIdx = 0;

    /*
      Merge Cells

      | 0 | 1 | 2 | 3 |
      --------|   |----
      | 4   5 | 6 | 7 |
      -----------------
      | 8 | 9 | 10| 11|
    */
    let columnSize = table.property?.column_size;
    let mergeInfos = table.property?.merge_info;

    // cellInfos 用来存储每个单元格是否要生成，1 生成，0 跳过
    let cellInfos = mergeInfos.map((info) => {
      return 1;
    });

    // 遍历 mergeInfos，将需要合并的单元格标记为 0
    for (let i = 0; i < mergeInfos.length; i++) {
      let info = mergeInfos[i];
      let rowSpan = info.row_span;
      let colSpan = info.col_span;

      if (rowSpan > 1) {
        for (let j = 1; j < rowSpan; j++) {
          cellInfos[i + j * columnSize] = 0;
        }
      }

      if (colSpan > 1) {
        for (let j = 1; j < colSpan; j++) {
          cellInfos[i + j] = 0;
        }
      }
    }

    const writeCell = (buf: Buffer, cell: string, tag: "th" | "td") => {
      let attr = this.tableCellAttrHTML(mergeInfos, cellIdx);
      if (cellInfos?.[cellIdx] == 1) {
        buf.write(`<${tag}${attr}>${cell || ""}</${tag}>`);
      }

      cellIdx += 1;
    };

    // Write thead
    if (table.property?.header_row) {
      let headRow = [];
      headRow = rows.shift();

      buf.writeln("<thead>");
      buf.write("<tr>");
      for (let i = 0; i < columnSize; i++) {
        writeCell(buf, headRow[i], "th");
      }
      buf.writeln("</tr>");
      buf.writeln("</thead>");
    }

    // Render tbody
    buf.writeln("<tbody>");
    for (const row of rows) {
      buf.write("<tr>");
      row.forEach((cell) => {
        writeCell(buf, cell, "td");
      });
      buf.writeln("</tr>");
    }
    buf.writeln("</tbody>");
    buf.writeln("</table>");

    return buf.toString({ indent: this.indent });
  }

  parseQuoteContainer(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write("> ");
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  parseView(block: Block): Buffer | string {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  parseFile(block: Block): Buffer | string {
    const buf = new Buffer();
    const file = block.file;

    this.addFileToken("file", file.token);

    buf.write(`[${file.name}](${file.token})`);
    buf.write("\n");

    return buf.toString();
  }

  parseGrid(block: Block) {
    const buf = new Buffer();
    const { column_size } = block.grid;

    buf.writeln(
      `<div class="flex gap-3 columns-${column_size}" column-size="${column_size}">`,
    );

    block.children?.forEach((childId) => {
      const child = this.blockMap[childId];
      buf.write(this.parseGridColumn(child));
    });
    buf.writeln("</div>");

    return buf.toString({ indent: this.indent });
  }

  parseGridColumn(block: Block): Buffer | string {
    const buf = new Buffer();

    let { width_ratio } = block.grid_column;

    buf.writeln(
      `<div class="w-[${width_ratio}%]" width-ratio="${width_ratio}">`,
    );

    let inner = "";

    this.withSubIndent(() => {
      inner = block.children
        ?.map((childId) => {
          const child = this.blockMap[childId];
          return this.parseBlock(child, 0);
        })
        .join("\n");
    });

    buf.write(this.markdownToHTML(inner));
    buf.writeln("</div>");

    return buf.toString({ indent: this.indent });
  }

  parseCallout(block: Block): Buffer | string {
    const buf = new Buffer();

    const style = {};
    const classNames = ["callout"];

    if (block.callout.background_color) {
      const backgroundColor =
        CalloutBackgroundColorMap[block.callout.background_color];
      style["background"] = backgroundColor;
      classNames.push(`callout-bg-${block.callout.background_color}`);
    }

    if (block.callout.border_color) {
      const borderColor = CalloutBorderColorMap[block.callout.border_color];
      style["border"] = `1px solid ${borderColor}`;
      classNames.push(`callout-border-${block.callout.border_color}`);
    }
    if (block.callout.text_color) {
      const textColor = FontColorMap[block.callout.text_color] || "#2222";
      style["color"] = textColor;
      classNames.push(`callout-color-${block.callout.text_color}`);
    }

    const styleAttr = Object.keys(style)
      .map((key) => {
        return `${key}: ${style[key]}`;
      })
      .join("; ");

    buf.writeln(`<div class="${classNames.join(" ")}">`);
    if (block.callout.emoji_id) {
      buf.write("<div class='callout-emoji'>");
      buf.write(getEmojiChar(block.callout.emoji_id));
      buf.writeln("</div>");
    }

    // Inner of the Callout, we need ouput as HTML
    let markdownBuf = new Buffer();

    this.withSubIndent(() => {
      markdownBuf.write(
        block.children
          ?.map((childId) => {
            const child = this.blockMap[childId];
            return this.parseBlock(child, 0);
          })
          .join("\n"),
      );
    });

    let html = this.markdownToHTML(markdownBuf.toString());
    buf.write(html);
    buf.writeln("</div>");

    return buf.toString({ indent: this.indent });
  }

  parseIframe(block: Block): Buffer | string {
    let buf = new Buffer();

    let url = block.iframe?.component?.url;
    if (!url) return "";

    const el = createElement("iframe");
    el.setAttribute("src", decodeURIComponent(block.iframe.component.url));
    buf.write(el.outerHTML);
    buf.write("\n");
    return buf;
  }

  parseSyncedBlock(block: Block): Buffer {
    const buf = new Buffer();

    this.withSubIndent(() => {
      block.children?.forEach((childId) => {
        const child = this.blockMap[childId];
        buf.write(this.parseBlock(child, 0));
      });
    });

    return buf;
  }

  parseUnsupport(block: Block) {
    if (!this.outputUnsupported) {
      return "";
    }

    const buf = new Buffer();

    buf.write("```\n");
    buf.write(`// [Unsupport] ${BlockType[block.block_type]}\n`);
    buf.write(JSON.stringify(block, null, 2));
    buf.write("\n```\n");
    return buf.toString();
  }

  markdownToHTML(markdown: string): string {
    let html = marked.parse(markdown, { gfm: true, breaks: true });
    return html;
  }

  tableCellAttrHTML(mergeInfos: TableMergeInfo[], idx: number): string {
    let mergeInfo = mergeInfos[idx];
    if (!mergeInfo) return "";

    let attr: any = {};
    if (mergeInfo.row_span > 1) {
      attr.rowspan = mergeInfo.row_span;
    }
    if (mergeInfo.col_span > 1) {
      attr.colspan = mergeInfo.col_span;
    }

    let html = Object.keys(attr)
      .map((key) => `${key}="${attr[key]}"`)
      .join(" ");

    if (html.length > 0) {
      html = ` ${html}`;
    }
    return html;
  }

  isComplexTable(table: TableBlock): boolean {
    let mergeInfos = table.property?.merge_info;
    let hasMerge = mergeInfos.some((info) => {
      return info.row_span > 1 || info.col_span > 1;
    });
    let hasColWidth = table.property?.column_width?.some((width) => {
      return width > 100;
    });

    return hasMerge || hasColWidth;
  }
}
