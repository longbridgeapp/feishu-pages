import { describe, test } from '@jest/globals';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { MarkdownRenderer } from '../src/feishu-docx';

const readFile = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, filename), 'utf8');
};

describe('MarkdownRenderer', () => {
  test('parse', () => {
    let renderer = new MarkdownRenderer({});
    let result = renderer.parse();

    assert.strictEqual(result, '');
  });

  test('parse file', () => {
    const doc = JSON.parse(readFile('example.raw.json'));
    const expected = readFile('example.expected.md');

    let renderer = new MarkdownRenderer(doc);
    let result = renderer.parse();

    assert.equal(result, expected);
  });
});
