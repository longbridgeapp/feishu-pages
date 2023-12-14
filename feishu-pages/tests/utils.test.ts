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
[](https://ywh1bkansf.feishu.cn/wiki/aabbdd)
[](https://ywh1bkansf.feishu.cn/foo/aabbdd)
[](https://ywh1bkansf.feishu.cn/F8OMwrI3TisTPokQAJHcMG2knBh)
[](https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh)
<a href="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh">Link</a>
<a href="https://ywh1bkansf.larksuite.com/wiki/F8OMwrI3TisTPokQAJHcMG2knBh" title="Foo">Link1</a>
<img src="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh" width="20" height="100"/>
![](F8OMwrI3TisTPokQAJHcMG2knBh)
![Img Alt](flasdjkgajklsdgjklajklsdgjklal)
<a href='F8OMwrI3TisTPokQAJHcMG2knBh'>Link2</a>
<a href="./F8OMwrI3TisTPokQAJHcMG2knBh" class="foo">Link3</a>
<img src='F8OMwrI3TisTPokQAJHcMG2knBh' />
<a href="/F8OMwrI3TisTPokQAJHcMG2knBh/F8OMwrI3TisTPokQAJHcMG2knBh">Link Complex</a>
<a href="https://ywh1bkansf.feishu.cn/wiki/F8OMwrI3TisTPokQAJHcMG2knBh?foo=bar#hash1">Link with Query</a>
    `;

    let expected = `
[](https://ywh1bkansf.feishu.cn/wiki/aabbdd)
[](https://ywh1bkansf.feishu.cn/foo/aabbdd)
[](/new-link)
[](/new-link)
<a href="/new-link">Link</a>
<a href="/new-link" title="Foo">Link1</a>
<img src="/new-link" width="20" height="100"/>
![](/new-link)
![Img Alt](flasdjkgajklsdgjklajklsdgjklal)
<a href='/new-link'>Link2</a>
<a href="./F8OMwrI3TisTPokQAJHcMG2knBh" class="foo">Link3</a>
<img src='/new-link' />
<a href="/F8OMwrI3TisTPokQAJHcMG2knBh/F8OMwrI3TisTPokQAJHcMG2knBh">Link Complex</a>
<a href="/new-link">Link with Query</a>
    `;

    assert.equal(
      replaceLinks(raw, 'F8OMwrI3TisTPokQAJHcMG2knBh', '/new-link'),
      expected
    );

    assert.equal(
      replaceLinks(
        `Hello world [链接 1](Yg5Dwtk30isnqBkNmbscxSK4nme) 說明公司行動預告數據導入方式 () [链接 2](PjI5wER20ic3VDkLX6ccjqv3nAh) 其他文字。`,
        'Yg5Dwtk30isnqBkNmbscxSK4nme',
        '/this-is-new-link'
      ),
      `Hello world [链接 1](/this-is-new-link) 說明公司行動預告數據導入方式 () [链接 2](PjI5wER20ic3VDkLX6ccjqv3nAh) 其他文字。`
    );

    assert.equal(
      replaceLinks(
        `<tr><td><p><a href="Yg5Dwtk30isnqBkNmbscxSK4nme">公司行動數據導入</a> </p></td><td><p>說明公司行動預告數據導入方式 (港股 05 / 02 文件)</p></td></tr><tr><td><p><a href="PjI5wER20ic3VDkLX6ccjqv3nAh">公司行動手動新增</a> </p></td></tr><tr>`,
        'Yg5Dwtk30isnqBkNmbscxSK4nme',
        '/this-is-new-link'
      ),

      `<tr><td><p><a href="/this-is-new-link">公司行動數據導入</a> </p></td><td><p>說明公司行動預告數據導入方式 (港股 05 / 02 文件)</p></td></tr><tr><td><p><a href="PjI5wER20ic3VDkLX6ccjqv3nAh">公司行動手動新增</a> </p></td></tr><tr>`
    );
  });
});
