import { JSDOM } from 'jsdom';
export const createElement = (type: string) => {
  // Make JSDom output with xhtml for better compatibility
  const dom = new JSDOM(
    "<?xml version='1.0' encoding='utf-8'?><html xmlns='http://www.w3.org/1999/xhtml'> <head><title>T</title></head><body> <br /><img src='test.png' /> </body></html>",
    { contentType: 'text/xml' }
  );
  return dom.window.document.createElement(type);
};
