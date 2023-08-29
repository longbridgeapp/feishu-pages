import { JSDOM } from 'jsdom';
export const createElement = (type: string) => {
  const dom = new JSDOM();
  return dom.window.document.createElement(type);
};
