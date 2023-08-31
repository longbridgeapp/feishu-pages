export enum BlockType {
  Page = 1,
  Text = 2,
  Heading1 = 3,
  Heading2 = 4,
  Heading3 = 5,
  Heading4 = 6,
  Heading5 = 7,
  Heading6 = 8,
  Heading7 = 9,
  Heading8 = 10,
  Heading9 = 11,
  Bullet = 12,
  Ordered = 13,
  Code = 14,
  Quote = 15,
  // 代办事项
  TodoList = 17,
  // 多维表格
  Bitable = 18,
  // 高亮块 Block
  Callout = 19,
  // 群聊卡片
  ChatCard = 20,
  // 流程图/UML Block
  Diagram = 21,
  Divider = 22,
  File = 23,
  // 分栏 Block
  Grid = 24,
  // 分栏列 Block
  GridColumn = 25,
  Iframe = 26,
  Image = 27,
  Widget = 28,
  MindNote = 29,
  Sheet = 30,
  Table = 31,
  TableCell = 32,
  View = 33,
  QuoteContainer = 34,
}

export enum StyleAlign {
  Left = 1,
  Center = 2,
  Right = 3,
}

export enum CodeLanguage {
  PlainText = 1,
  ABAP,
  Ada,
  Apache,
  Apex,
  AssemblyLanguage,
  Bash,
  CSharp,
  CPlusPlus,
  C,
  COBOL,
  CSS,
  CoffeeScript,
  D,
  Dart,
  Delphi,
  Django,
  Dockerfile,
  Erlang,
  Fortran,
  FoxPro,
  Go,
  Groovy,
  HTML,
  HTMLBars,
  HTTP,
  Haskell,
  JSON,
  Java,
  JavaScript,
  Julia,
  Kotlin,
  LateX,
  Lisp,
  Logo,
  Lua,
  MATLAB,
  Makefile,
  Markdown,
  Nginx,
  ObjectiveC,
  OpenEdgeABL,
  PHP,
  Perl,
  PostScript,
  PowerShell,
  Prolog,
  ProtoBuf,
  Python,
  R,
  RPG,
  Ruby,
  Rust,
  SAS,
  SCSS,
  SQL,
  Scala,
  Scheme,
  Scratch,
  Shell,
  Swift,
  Thrift,
  TypeScript,
  VBScript,
  VisualBasic,
  XML,
  YAML,
  CMake,
  Diff,
  Gherkin,
  GraphQL,
  OpenGLShadingLanguage,
  Properties,
  Solidity,
  TOML,
}

/**
 * Return code language by enum
 * @param code
 * @returns
 */
export const getCodeLanguage = (code: CodeLanguage) => {
  switch (code) {
    case CodeLanguage.PlainText:
      return 'text';
    case CodeLanguage.AssemblyLanguage:
      return 'assembly';
    case CodeLanguage.CPlusPlus:
      return 'cpp';
    case CodeLanguage.CoffeeScript:
      return 'coffee';
    case CodeLanguage.Dockerfile:
      return 'docker';
    case CodeLanguage.FoxPro:
      return 'foxpro';
    case CodeLanguage.TypeScript:
      return 'ts';
    case CodeLanguage.JavaScript:
      return 'js';
    case CodeLanguage.Rust:
      return 'rs';
    case CodeLanguage.Python:
      return 'py';
    case CodeLanguage.Ruby:
      return 'rb';
    case CodeLanguage.Markdown:
      return 'md';
    default:
      return CodeLanguage[code]?.toLowerCase() || '';
  }
};

export enum Color {
  LightPink = 1,
  LightOrange,
  LightYellow,
  LightGreen,
  LightBlue,
  LightPurple,
  LightGray,
  DarkPink,
  DarkOrange,
  DarkYellow,
  DarkGreen,
  DarkBlue,
  DarkPurple,
  DarkGray,
  DarkSilverGray,
}

export enum IframeType {
  Bilibili = 1,
  Xigua = 2,
  Youku = 3,
  Airtable = 4,
  BaiduMap = 5,
  GaodeMap = 6,
  Figma = 8,
  Modao = 9,
  Canva = 10,
  CodePen = 11,
  FeishuWenjuan = 12,
  Jinshuju = 13,
}

export interface TextStyle {
  align: StyleAlign;
  done: boolean;
  folded: boolean;
  language: CodeLanguage;
  wrap: boolean;
}

export enum ObjType {
  Doc = 1,
  Sheet = 3,
  Bitable = 8,
  MindNote = 11,
  File = 12,
  Slide = 15,
  Wiki = 16,
  Docx = 22,
}

export interface TextLink {
  url: string;
}

export interface TextElementStyle {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  inline_code: boolean;
  background_color: Color;
  text_color: Color;
  link: TextLink;
}

export interface TextElement {
  text_run?: TextRun;
  file?: InlineFile;
  inline_block?: InlineBlock;
  equation?: TextRun;
  mention_doc?: MentionDoc;
}

export interface MentionDoc {
  token: string;
  obj_type: ObjType;
  url: string;
  title: string;
  text_element_style: TextElementStyle;
}

export interface InlineFile {
  file_token: string;
  source_block_id: string;
  text_element_style: TextElementStyle;
}

export interface TextRun {
  content: string;
  text_element_style?: TextElementStyle;
}

export interface InlineBlock {
  block_id: string;
  text_element_style: TextElementStyle;
}

export interface InlineFile {
  file_token: string;
  source_block_id: string;
  text_element_style: TextElementStyle;
  inline_block: InlineBlock;
}

export interface TextBlock {
  style: TextStyle;
  elements: TextElement[];
}

export interface ImageBlock {
  width: number;
  height: number;
  token: string;
  align: StyleAlign;
}

export interface TableBlock {
  cells: string[];
  property: {
    row_size: number;
    column_size: number;
    column_width: number[];
    header_column: boolean;
    header_row: boolean;
    merge_info: {
      row_span: number;
      column_span: number;
    }[];
  };
}

export interface Block {
  block_id: string;
  parent_id: string;
  children: string[];
  block_type: BlockType;
  page: TextBlock;
  text: TextBlock;
  heading1: TextBlock;
  heading2: TextBlock;
  heading3: TextBlock;
  heading4: TextBlock;
  heading5: TextBlock;
  heading6: TextBlock;
  heading7: TextBlock;
  heading8: TextBlock;
  heading9: TextBlock;
  bullet: TextBlock;
  ordered: TextBlock;
  code: TextBlock;
  quote: TextBlock;
  todo: TextBlock;
  bitable: TextBlock;
  callout: TextBlock;
  chat_card: TextBlock;
  diagram: TextBlock;
  divider: TextBlock;
  file: {
    name: string;
    token: string;
  };
  grid: {
    // 分栏列数量
    column_size: number;
  };
  grid_column: {
    // 当前分栏列占整个分栏的比例
    width_ratio: number;
  };
  iframe: {
    component: {
      iframe_type: IframeType;
      /**
       * UrlEncoded
       */
      url: string;
    };
  };
  image: ImageBlock;
  table: TableBlock;
  table_cell: TextBlock;
}

export function getAlignStyle(align: StyleAlign) {
  switch (align) {
    case StyleAlign.Left:
      return 'left';
    case StyleAlign.Center:
      return 'center';
    case StyleAlign.Right:
      return 'right';
    default:
      return 'left';
  }
}

export class Renderer {
  documentId: string;
  blockMap: Record<string, Block> = {};
  parentId?: string;
  imageTokens: string[];
  nextBlock?: Block | null;
  debug: boolean;
  output_unsupported: boolean = false;

  constructor(
    doc: any,
    options: { debug?: boolean; output_unsupported?: boolean } = {}
  ) {
    const { debug = false, output_unsupported } = options;

    this.documentId = doc?.document?.document_id || '';
    this.imageTokens = [];
    doc?.blocks?.forEach((block) => {
      this.blockMap[block?.block_id] = block;
    });
    this.debug = debug;
    this.output_unsupported = output_unsupported;
  }

  /**
   * Parse Feishu doc to new format
   * @returns Text of new format content.
   */
  parse(): string {
    const entryBlock = this.blockMap[this.documentId];
    return this.parseBlock(entryBlock, 0);
  }

  parseBlock(block: Block, indent: number): string {
    throw new Error('Not implemented');
  }
}

/**
 * 去掉末尾 1 个换行
 * @param str
 * @returns
 */
export const trimLastNewline = (str: string) => {
  return str.replace(/\n$/, '');
};
