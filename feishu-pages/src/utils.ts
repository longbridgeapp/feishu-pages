import fs from 'fs';
import { Token, Tokens, marked } from 'marked';
import { markedXhtml } from 'marked-xhtml';
import os from 'os';
import path from 'path';
import { FileDoc } from './summary';

marked.use(markedXhtml());

export const normalizeSlug = (slug: string | number) => {
  // force convert slug into string
  slug = String(slug);
  return slug.replace(/^wik(cn|en)/, '');
};

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const humanizeFileSize = (bytes, dp = 1) => {
  const thresh = 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + ' B';
  }

  const units = ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + ' ' + units[u];
};

const allowKeys = [
  'depth',
  'title',
  'slug',
  'filename',
  'node_token',
  'parent_node_token',
  'children',
  'obj_create_time',
  'obj_edit_time',
  'obj_token',
  'has_child',
  'meta',
  'position',
];

export function cleanupDocsForJSON(docs: FileDoc[]) {
  const nodesToDelete = [];

  for (let idx = 0; idx < docs.length; idx++) {
    const doc = docs[idx];

    Object.keys(doc).forEach((key) => {
      if (!allowKeys.includes(key)) {
        delete doc[key];
      }
    });

    if (doc.meta?.hide) {
      nodesToDelete.push(idx);
    }

    if (doc.children) {
      cleanupDocsForJSON(doc.children);
    }
  }

  // Delete nodes in reverse order to avoid index issues
  for (let i = nodesToDelete.length - 1; i >= 0; i--) {
    docs.splice(nodesToDelete[i], 1);
  }
}

const httpRe = new RegExp(/http[s]?:\/\//i);

const matchLinksFromTokens = (
  tokens: Token[],
  content: string,
  oldLink: string,
  newLink: string
): string => {
  if (!tokens) {
    return content;
  }

  tokens.forEach((token) => {
    if (token.type === 'link' || token.type === 'image') {
      let isMatch = false;
      if (httpRe.test(token.href)) {
        let url = new URL(token.href);
        if (
          url.hostname?.endsWith('feishu.cn') ||
          url.hostname?.endsWith('larksuite.com')
        ) {
          isMatch = url.pathname.includes(oldLink);
        }
      } else {
        isMatch = token.href == oldLink;
      }

      if (isMatch) {
        let newRaw = token.raw.replace(token.href, newLink);
        content = content.replaceAll(token.raw, newRaw);
      }
    }

    if (token.type == 'html') {
      /*
        match all

        1 - ]( or src=" or href="
        2 - https://ywh1bkansf.feishu.cn/wiki/aabbdd
        3 - node_token
        4 - ) or "
      */
      const hrefRe = new RegExp(
        `((src|href)=["|'])(http[s]?:\\\/\\\/[\\w]+\\.(feishu\\.cn|larksuite\.com)\\\/.*)?(${oldLink}[^"']*)("|')`,
        'gm'
      );
      content = content.replace(hrefRe, `$1${newLink}$6`);
    }

    // @ts-ignore
    if (token.tokens) {
      // @ts-ignore
      content = matchLinksFromTokens(token.tokens, content, oldLink, newLink);
    }

    // Tokens.List
    if (token.type == 'list') {
      content = matchLinksFromTokens(token.items, content, oldLink, newLink);
    }

    /// Tokens.Table
    if (token.type == 'table') {
      content = matchLinksFromTokens(token.header, content, oldLink, newLink);
      if (token.rows) {
        token.rows.forEach((colums: Tokens.TableCell[]) => {
          content = matchLinksFromTokens(
            colums as any,
            content,
            oldLink,
            newLink
          );
        });
      }
    }
  });

  return content;
};

export function replaceLinks(
  content: string,
  node_token: string,
  newLink?: string
): string {
  if (!newLink) {
    return content;
  }

  // Parse all links in Markdown
  let tokens = marked.lexer(content, { gfm: true, breaks: true });
  content = matchLinksFromTokens(tokens, content, node_token, newLink);

  return content;
}

/**
 * Write content to a temp filename with random string, returns the filename.
 * @returns
 */
export function writeTemplfile(content: string): string {
  let filename = path.join(
    os.tmpdir(),
    'feishi-pages',
    Math.random().toString(36)
  );
  if (!fs.existsSync(path.dirname(filename))) {
    fs.mkdirSync(path.dirname(filename), { recursive: true });
  }
  fs.writeFileSync(filename, content);

  return filename;
}

/**
 * Cleanup temp files
 *
 * Remove /tmp/feishi-pages
 */
export function cleanupTmpFiles() {
  const tmpDir = path.join(os.tmpdir(), 'feishi-pages');
  console.log('Cleanup temp files:', tmpDir);

  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
}

export function printMemoryUsage(prefix?: string) {
  if (process.env.DEBUG !== '1' && process.env.DEBUG !== 'true') {
    return;
  }

  const used = process.memoryUsage();
  if (prefix) {
    prefix = prefix + ' ';
  }

  console.log(
    `${prefix}${humanizeFileSize(used.rss)} RSS, ${humanizeFileSize(
      used.heapTotal
    )} heapTotal, ${humanizeFileSize(
      used.heapUsed
    )} heapUsed, ${humanizeFileSize(used.external)} external`
  );
}
