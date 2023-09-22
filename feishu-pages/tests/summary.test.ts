import { describe, test } from '@jest/globals';
import assert from 'node:assert';
import { Doc } from '../src/feishu';
import { FileDoc, generateSummary, prepareDocSlugs } from '../src/summary';

describe('Summary', () => {
  test('prepareDocSlugs', () => {
    let docs: Doc[] = [
      {
        node_token: 'foo',
        title: 'Foo',
        depth: 0,
        has_child: true,
        children: [
          {
            node_token: 'bar',
            title: 'Bar',
            depth: 1,
            has_child: false,
            children: [],
          },
          {
            node_token: 'baz',
            title: 'Baz',
            depth: 1,
            has_child: true,
            children: [
              {
                node_token: 'qux',
                title: 'Qux',
                depth: 2,
                has_child: false,
                children: [],
              },
              {
                node_token: 'quux',
                title: 'Quux',
                depth: 2,
                has_child: false,
                children: [],
              },
            ],
          },
          {
            node_token: 'aza',
            title: 'Aza',
            depth: 1,
            has_child: true,
            children: [
              {
                node_token: 'zaf',
                title: 'Zaf',
                depth: 2,
                has_child: false,
                children: [],
              },
            ],
          },
        ],
      },
      {
        node_token: 'bb',
        title: 'BB',
        depth: 0,
        has_child: false,
        children: [],
      },
    ];

    let slugMap = {};

    prepareDocSlugs(docs as any, slugMap, '');

    let newDocs: FileDoc[] = [
      {
        node_token: 'foo',
        title: 'Foo',
        depth: 0,
        has_child: true,
        filename: 'foo.md',
        position: 0,
        slug: 'foo',
        children: [
          {
            node_token: 'bar',
            title: 'Bar',
            depth: 1,
            has_child: false,
            children: [],
            filename: 'foo/bar.md',
            position: 0,
            slug: 'foo/bar',
          },
          {
            node_token: 'baz',
            title: 'Baz',
            depth: 1,
            has_child: true,
            filename: 'foo/baz.md',
            position: 1,
            slug: 'foo/baz',
            children: [
              {
                node_token: 'qux',
                title: 'Qux',
                depth: 2,
                has_child: false,
                children: [],
                filename: 'foo/baz/qux.md',
                position: 0,
                slug: 'foo/baz/qux',
              },
              {
                node_token: 'quux',
                title: 'Quux',
                depth: 2,
                has_child: false,
                children: [],
                filename: 'foo/baz/quux.md',
                position: 1,
                slug: 'foo/baz/quux',
              },
            ],
          },
          {
            node_token: 'aza',
            title: 'Aza',
            depth: 1,
            has_child: true,
            filename: 'foo/aza.md',
            position: 2,
            slug: 'foo/aza',
            children: [
              {
                node_token: 'zaf',
                title: 'Zaf',
                depth: 2,
                has_child: false,
                children: [],
                filename: 'foo/aza/zaf.md',
                position: 0,
                slug: 'foo/aza/zaf',
              },
            ],
          },
        ],
      },
      {
        node_token: 'bb',
        title: 'BB',
        depth: 0,
        has_child: false,
        children: [],
        filename: 'bb.md',
        position: 1,
        slug: 'bb',
      },
    ];

    assert.deepEqual(newDocs, docs);

    let summary = generateSummary(newDocs);
    let expeted = `
- [Foo](foo.md)
  - [Bar](foo/bar.md)
  - [Baz](foo/baz.md)
    - [Qux](foo/baz/qux.md)
    - [Quux](foo/baz/quux.md)
  - [Aza](foo/aza.md)
    - [Zaf](foo/aza/zaf.md)
- [BB](bb.md)
    `;
    assert.equal(summary.trim(), expeted.trim());

    assert.deepEqual(slugMap, {
      aza: 'foo/aza',
      bar: 'foo/bar',
      baz: 'foo/baz',
      bb: 'bb',
      foo: 'foo',
      quux: 'foo/baz/quux',
      qux: 'foo/baz/qux',
      zaf: 'foo/aza/zaf',
    });
  });
});
