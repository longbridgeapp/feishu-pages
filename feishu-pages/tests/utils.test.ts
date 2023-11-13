import { describe, expect, test } from '@jest/globals';
import assert from 'node:assert';
import {
  cleanupDocsForJSON,
  humanizeFileSize,
  normalizeSlug,
  replaceLinks,
} from '../src/utils';

describe('Utils', () => {
  test('normalizeSlug', () => {
    assert.equal(normalizeSlug('foo-bar'), 'foo-bar');
    assert.equal(normalizeSlug('wikcnfoo-bar'), 'foo-bar');
    assert.equal(normalizeSlug('wikenfoo-bar'), 'foo-bar');
  });

  test('humanizeFileSize', () => {
    assert.equal(humanizeFileSize(1209482), '1.2 MB');
    assert.equal(humanizeFileSize(810473), '791.5 kB');
    assert.equal(humanizeFileSize(4621), '4.5 kB');
  });

  test('cleanupDocsForJSON', () => {
    const rawDocs: any = [
      {
        title: 'title1',
        meta: {
          slug: 'app1',
        },
        children: [
          {
            title: 'title1-1',
            meta: {
              slug: 'app1-1',
              hide: true,
            },
          },
          {
            title: 'title1-2',
            meta: {
              slug: 'app1-2',
            },
            children: [
              {
                title: 'title1-2-1',
                meta: {
                  slug: 'app1-2-1',
                },
              },
              {
                title: 'title1-2-2',
                meta: {
                  slug: 'app1-2-2',
                  hide: true,
                },
              },
            ],
          },
        ],
      },
      {
        title: 'title2',
        meta: {
          slug: 'app2',
          hide: true,
        },
        children: [
          {
            title: 'title2-1',
            meta: {
              slug: 'app2-1',
            },
          },
          {
            title: 'title2-2',
            meta: {
              slug: 'app2-2',
            },
          },
        ],
      },
    ];
    cleanupDocsForJSON(rawDocs);

    expect(rawDocs).toStrictEqual([
      {
        children: [
          {
            children: [{ meta: { slug: 'app1-2-1' }, title: 'title1-2-1' }],
            meta: { slug: 'app1-2' },
            title: 'title1-2',
          },
        ],
        meta: { slug: 'app1' },
        title: 'title1',
      },
    ]);
  });

  test('replaceLinks', () => {
    let raw = `
    ](https://ywh1bkansf.feishu.cn/wiki/aabbdd)
    ](https://ywh1bkansf.feishu.cn/foo/aabbdd)
    ](https://ywh1bkansf.feishu.cn/F8OMwrI3TisTPokQAJHcMG2knBh)
    ](https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh)
    href="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh"
    href="https://ywh1bkansf.larksuite.com/wiki/F8OMwrI3TisTPokQAJHcMG2knBh"
    src="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh"
    ](F8OMwrI3TisTPokQAJHcMG2knBh)
    ](flasdjkgajklsdgjklajklsdgjklal)
    href="F8OMwrI3TisTPokQAJHcMG2knBh"
    href="./F8OMwrI3TisTPokQAJHcMG2knBh"
    src="F8OMwrI3TisTPokQAJHcMG2knBh"
    href="/F8OMwrI3TisTPokQAJHcMG2knBh/F8OMwrI3TisTPokQAJHcMG2knBh"
    href="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh?foo=bar#hash1"
    `;

    let expected = `
    ](https://ywh1bkansf.feishu.cn/wiki/aabbdd)
    ](https://ywh1bkansf.feishu.cn/foo/aabbdd)
    ](/new-link)
    ](/new-link)
    href="/new-link"
    href="/new-link"
    src="/new-link"
    ](/new-link)
    ](flasdjkgajklsdgjklajklsdgjklal)
    href="/new-link"
    href="./F8OMwrI3TisTPokQAJHcMG2knBh"
    src="/new-link"
    href="/F8OMwrI3TisTPokQAJHcMG2knBh/F8OMwrI3TisTPokQAJHcMG2knBh"
    href="/new-link"
    `;

    assert.equal(
      replaceLinks(raw, 'F8OMwrI3TisTPokQAJHcMG2knBh', '/new-link'),
      expected
    );
  });
});
