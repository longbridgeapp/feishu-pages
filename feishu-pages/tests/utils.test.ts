import { describe, test } from '@jest/globals';
import assert from 'node:assert';
import { normalizeSlug } from '../src/utils';

describe('Utils', () => {
  test('normalizeSlug', () => {
    assert.equal(normalizeSlug('foo-bar'), 'foo-bar');
    assert.equal(normalizeSlug('wikcnfoo-bar'), 'foo-bar');
    assert.equal(normalizeSlug('wikenfoo-bar'), 'foo-bar');
  });
});
