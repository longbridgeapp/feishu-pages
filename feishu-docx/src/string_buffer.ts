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

  /**
   * Remove last string if ends with part
   * @param part
   * @returns
   */
  trimLastIfEndsWith(part: string): boolean {
    if (part.length == 0) {
      return false;
    }

    const lastIdx = this.buffer.length - 1;
    const lastStr = this.buffer[lastIdx];
    if (!lastStr) {
      return false;
    }
    if (lastStr.endsWith(part)) {
      this.buffer[lastIdx] = lastStr.slice(0, -part.length);
      this.length -= part.length;
      return true;
    }

    return false;
  }

  toString() {
    return this.buffer.join('');
  }
}
