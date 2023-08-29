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
    let renderer = new MarkdownRenderer();
    let result = renderer.parse('OfD9dsSMIodxAOx5AFZcVoQ3nGe', []);

    assert.strictEqual(result, '');
  });

  test('parse file', () => {
    const doc = JSON.parse(readFile('example.raw.json'));
    let renderer = new MarkdownRenderer();
    let result = renderer.parse(doc.document.document_id, doc.blocks as any);
    console.log('--------- result:\n', result);

    assert.strictEqual(result, '');
  });
});
