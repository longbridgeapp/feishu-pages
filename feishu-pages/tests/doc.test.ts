import { describe, test } from '@jest/globals';
import assert from 'node:assert';
import { generateFileMeta } from '../src/doc';

describe('Doc', () => {
  test('generateFileMeta', () => {
    let doc: any = {
      title: 'hello world',
    };

    const urlPath = '/hello/world';
    const position = 1;

    let expected = `---
title: hello world
slug: /hello/world
sidebar_position: 1
---
`;

    assert.equal(generateFileMeta(doc, urlPath, position), expected);

    doc = {
      title: null,
    };
    expected = `---
slug: /hello/world
sidebar_position: 1
---
`;

    assert.equal(generateFileMeta(doc, urlPath, position), expected);
  });
});
