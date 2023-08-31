import { describe, test } from '@jest/globals';
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { MarkdownRenderer } from '../src';

const fixture = (filename: string): string => {
  return fs.readFileSync(path.join(__dirname, 'fixtures', filename), 'utf8');
};

const fixtureJSON = (filename: string): any => {
  return JSON.parse(fixture(filename));
};

describe('MarkdownRenderer', () => {
  test('parse', () => {
    let renderer = new MarkdownRenderer({});
    let result = renderer.parse();

    assert.strictEqual(result, '');
  });

  test('parse file', () => {
    ['case0', 'case1', 'case2', 'case3'].forEach((caseName) => {
      const doc = fixtureJSON(`${caseName}.raw.json`);
      const expected = fixture(`${caseName}.expect.md`);

      let renderer = new MarkdownRenderer(doc);
      let result = renderer.parse();

      assert.equal(result.trim(), expected.trim(), caseName);
    });
  });

  test('parse unsupport', () => {
    const doc = fixtureJSON(`unsupport.raw.json`);

    let render = new MarkdownRenderer(doc, { output_unsupported: true });
    let result = render.parse();
    let expect = fixture(`unsupport.a.md`);

    assert.equal(result.trim(), expect.trim());

    expect = fixture(`unsupport.b.md`);
    render = new MarkdownRenderer(doc);
    result = render.parse();

    assert.equal(result.trim(), expect.trim());
  });
});
