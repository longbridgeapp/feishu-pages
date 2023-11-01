import { describe, test, expect } from "@jest/globals";
import assert from "node:assert";
import {
  humanizeFileSize,
  normalizeSlug,
  cleanupDocsForJSON
} from "../src/utils";

describe("Utils", () => {
  test("normalizeSlug", () => {
    assert.equal(normalizeSlug("foo-bar"), "foo-bar");
    assert.equal(normalizeSlug("wikcnfoo-bar"), "foo-bar");
    assert.equal(normalizeSlug("wikenfoo-bar"), "foo-bar");
  });

  test("humanizeFileSize", () => {
    assert.equal(humanizeFileSize(1209482), "1.2 MB");
    assert.equal(humanizeFileSize(810473), "791.5 kB");
    assert.equal(humanizeFileSize(4621), "4.5 kB");
  });

  test("cleanupDocsForJSON", () => {
    const rawDocs: any = [
      {
        title: "title1",
        meta: {
          slug: "app1"
        },
        children: [
          {
            title: "title1-1",
            meta: {
              slug: "app1-1",
              hide: true
            }
          },
          {
            title: "title1-2",
            meta: {
              slug: "app1-2"
            },
            children: [
              {
                title: "title1-2-1",
                meta: {
                  slug: "app1-2-1"
                }
              },
              {
                title: "title1-2-2",
                meta: {
                  slug: "app1-2-2",
                  hide: true
                }
              }
            ]
          }
        ]
      },
      {
        title: "title2",
        meta: {
          slug: "app2",
          hide: true
        },
        children: [
          {
            title: "title2-1",
            meta: {
              slug: "app2-1"
            }
          },
          {
            title: "title2-2",
            meta: {
              slug: "app2-2"
            }
          }
        ]
      }
    ];
    cleanupDocsForJSON(rawDocs);

    expect(rawDocs).toStrictEqual([
      {
        children: [
          {
            children: [
              { meta: { slug: "app1-2-1" }, title: "title1-2-1" },
            ],
            meta: { slug: "app1-2" },
            title: "title1-2"
          }
        ],
        meta: { slug: "app1" },
        title: "title1"
      }
    ]);
  });
});
