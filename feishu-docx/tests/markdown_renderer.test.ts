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
    let render = new MarkdownRenderer({});
    let result = render.parse();

    assert.strictEqual(result, '');
  });

  test('parse file', () => {
    ['case0', 'case1', 'case2', 'case3'].forEach((caseName) => {
      const doc = fixtureJSON(`${caseName}.raw.json`);
      const expected = fixture(`${caseName}.expect.md`);

      let render = new MarkdownRenderer(doc);
      let result = render.parse();

      assert.equal(result.trim(), expected.trim(), caseName);
    });
  });

  test('fileTokens', () => {
    const doc = fixtureJSON(`case3.raw.json`);

    let render = new MarkdownRenderer(doc);
    render.parse();

    assert.deepEqual(Object.keys(render.fileTokens), [
      'DkwibdF3ooVi0KxttdocdoQ5nPh',
      'TVEyb1pmWo8oIwxyL3kcIfrrnGd',
    ]);
    assert.deepEqual(render.fileTokens['DkwibdF3ooVi0KxttdocdoQ5nPh'], {
      token: 'DkwibdF3ooVi0KxttdocdoQ5nPh',
      type: 'image',
    });
    assert.deepEqual(render.fileTokens['TVEyb1pmWo8oIwxyL3kcIfrrnGd'], {
      token: 'TVEyb1pmWo8oIwxyL3kcIfrrnGd',
      type: 'file',
    });
  });

  test('parse unsupport', () => {
    const doc = fixtureJSON(`unsupport.raw.json`);

    let render = new MarkdownRenderer(doc, { outputUnsupported: true });
    let result = render.parse();
    let expect = fixture(`unsupport.a.md`);

    assert.equal(result.trim(), expect.trim());

    expect = fixture(`unsupport.b.md`);
    render = new MarkdownRenderer(doc);
    result = render.parse();

    assert.equal(result.trim(), expect.trim());
  });
});
