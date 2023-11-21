export class Buffer {
  buffer: string[] = [];
  length: number;

  constructor() {
    this.buffer = [];
    this.length = 0;
  }

  write(s: string | Buffer) {
    if (typeof s === 'string') {
      this.buffer.push(s);
      this.length += s.length;
    } else {
      for (let part of s.buffer) {
        this.buffer.push(part);
        this.length += part.length;
      }
    }
  }

  toString() {
    return this.buffer.join('');
  }
}
