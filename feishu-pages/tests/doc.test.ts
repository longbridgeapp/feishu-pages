import { describe, test } from '@jest/globals';
import assert from 'node:assert';
import { generateFrontmatter } from '../src/doc';

describe('Doc', () => {
  test('generateFrontmatter', () => {
    let doc: any = {
      title: 'Docs: "hello world"',
    };

    const urlPath = '/hello/world';
    const position = 1;

    let expected = `---
title: 'Docs: "hello world"'
slug: /hello/world
sidebar_position: 1
---
`;

    assert.equal(generateFrontmatter(doc, urlPath, position), expected);

    doc = {
      title: `Docs: 'Test single quote'`,
    };

    expected = `---
title: 'Docs: ''Test single quote'''
slug: /hello/world
sidebar_position: 1
---
`;
    assert.equal(generateFrontmatter(doc, urlPath, position), expected);

    doc = {
      title: null,
    };
    expected = `---
slug: /hello/world
sidebar_position: 1
---
`;

    assert.equal(generateFrontmatter(doc, urlPath, position), expected);

    let doc1 = {
      title: null,
      meta: {
        foo: {
          bar: 'hello world',
          dar: 1.1,
        },
        tools: ['Node.js', 'Bun'],
      },
    };
    expected = `---
slug: https://github.com/foo/bar?dar=A+B&key=#hash1
sidebar_position: 3
foo:
  bar: hello world
  dar: 1.1
tools:
  - Node.js
  - Bun
---
`;

    assert.equal(
      generateFrontmatter(
        doc1 as any,
        'https://github.com/foo/bar?dar=A+B&key=#hash1',
        3
      ),
      expected
    );
  });
});
