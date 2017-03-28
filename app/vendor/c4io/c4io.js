const fs        = require('fs');
const zlib      = require('zlib');
const {Transform, Writable} = require('stream');

const C4MagicBytesReadTransform = require('./C4MagicBytesReadTransform.js');

const FILENAME  = 'test/System.ocg';

class HexStream extends Transform {
  constructor(options) {
    super(options);
  }

  _transform(chunk, encoding, callback) {
    callback(null, chunk.toString('hex'));
  }
};

class HeadStream extends Transform {
  constructor(options) {
    super(options);

    this.npos = 0;
  }

  _transform(chunk, encoding, callback) {
    if(this.npos < 100) {
      callback(null, chunk.slice(0, 100));
      this.npos = 100;
    } else {
      callback(null, null);
    }
  }
};

class C4Group extends Writable {
  constructor(options) {
    super(options);

    this.data = [];
    this.on('finish', this._finish);
  }

  _write(chunk, encoding, callback) {
    this.data.push(chunk);
    callback(null);
  }

  _finish() {
    this.data = Buffer.concat(this.data);
    console.log("-> data length");
    console.log(this.data.length);

    this.header = this.data.slice(0, 204);

    console.log("-> header before scramble");
    console.log(this.header.length);
    console.log(this.header.toString('hex'));

    this._memScramble(this.header);

    console.log("-> header after scramble");
    console.log(this.header.length);
    console.log(this.header.toString('hex'));
    console.log(this.header.toString());
  }

  _memScramble(chunk) {
    for(let i = 0; i < chunk.length; i += 3) {
      [chunk[i], chunk[i + 2]] = [chunk[i+2], chunk[i]];
    }

    for(let i = 0; i < chunk.length; i++) {
      chunk[i] ^= 0xED;
    }
  }
};

let group = new C4Group;

let stream = fs.createReadStream(FILENAME)
  .pipe(new C4MagicBytesReadTransform)
  .pipe(zlib.createGunzip())
  .pipe(group);
