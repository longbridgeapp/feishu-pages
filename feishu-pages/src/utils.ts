export const normalizeSlug = (slug: string) => {
  return slug.replace(/^wik(cn|en)/, '');
};
