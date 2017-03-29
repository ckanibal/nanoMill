const Transform = require('stream').Transform;

class C4MagicBytesReadTransform extends Transform {
  constructor(options) {
    super(options);

    this.magic_bytes = [0x1f, 0x8b];
    this.npos = 0;
  }

  _transform(chunk, encoding, callback) {
    while(this.npos < 2 && this.npos < chunk.length) {
      chunk[this.npos] = this.magic_bytes[this.npos];
      ++this.npos;
    }
    callback(null, chunk);
  }
};

module.exports = C4MagicBytesReadTransform;
