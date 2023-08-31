import { describe, test } from '@jest/globals';
import assert from 'node:assert';
import { humanizeFileSize, normalizeSlug } from '../src/utils';

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
});
