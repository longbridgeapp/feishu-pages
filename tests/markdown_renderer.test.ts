import { describe, test } from '@jest/globals';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { MarkdownRenderer } from '../src/feishu-docx';

const fixture = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8');
};

describe('MarkdownRenderer', () => {
  test('parse', () => {
    let renderer = new MarkdownRenderer({});
    let result = renderer.parse();

    assert.strictEqual(result, '');
  });

  test('parse file', () => {
    ['case0', 'case1', 'case2'].forEach((caseName) => {
      const raw = fixture(`${caseName}.raw.json`);
      const doc = JSON.parse(raw);
      const expected = fixture(`${caseName}.expect.md`);

      let renderer = new MarkdownRenderer(doc);
      let result = renderer.parse();

      assert.equal(result.trim(), expected.trim(), caseName);
    });
  });
});
