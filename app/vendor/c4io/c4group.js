const fs                    = require('fs');
const path                  = require('path');
const zlib                  = require('zlib');
const {Transform, Writable} = require('stream');

const C4MagicBytesReadTransform = require('./c4magicbytes.js');

class C4Group {
  static fromFile(filename) {
    return new C4FileGroup(filename);
  }

  static fromBuffer(buffer) {
    return new C4BufferGroup(buffer);
  }
};

class StreamReader extends Writable {
  constructor(options) {
    super(options);

    this.options = options;
    this.data = [];

    this.on('finish', this._finish);
  }

  _write(chunk, encoding, callback) {
    this.data.push(chunk);
    callback(null);
  }

  _finish() {
    this.data = Buffer.concat(this.data);
    this.options.onFinish(this.data);
  }
};

class C4FileGroup extends C4Group {
  constructor(filename) {
    super();
    this.filename = filename;
  }

  open() {
    return new Promise(function(resolve, reject) {
      fs.createReadStream(this.filename)
        .pipe(new C4MagicBytesReadTransform)
        .pipe(zlib.createGunzip())
        .pipe(new StreamReader({
            onFinish: (buffer) => {
              resolve(C4Group.fromBuffer(buffer))
            }
        }));
    }.bind(this));
  }
};

const assert = require('assert');

class C4GroupHeader {
  constructor(buffer) {
    assert.equal(buffer.length, 204);
    this.data = buffer;
    this.memScramble(this.data);
    assert.equal(this.data.toString('utf8', 0, 24), 'RedWolf Design GrpFolder');
    this.NumEntries = this.data.readUInt32LE(36);
  }

  memScramble(chunk) {
    for(let i = 0; i < chunk.length; i += 3) {
      [chunk[i], chunk[i + 2]] = [chunk[i+2], chunk[i]];
    }

    for(let i = 0; i < chunk.length; i++) {
      chunk[i] ^= 0xED;
    }
  }
};

String.prototype.cut = function () {
  var c = this.indexOf('\0');
  if (c >- 1) {
    return this.substr(0, c);
  } else {
    return this;
  }
}

class C4GroupEntry {
  constructor(buffer) {
    this.Buffer = buffer;
    this.FileName = this.Buffer.toString('utf8', 0, 256).cut();
//    assert.notEqual(this.data.readUInt32LE(260), 0);
    this.IsFolder = this.Buffer.readUInt32LE(264) != 0;
    this.FileSize = this.Buffer.readUInt32LE(268);
    this.Offset = this.Buffer.readUInt32LE(276);
    this.CRCType = this.Buffer.readUInt8(284);
    this.CRC = this.Buffer.readUInt32LE(285);
    this.Executable = this.Buffer.readUInt8(289) != 0;

    this.Entry = null;
  }

  get data() { return this._data; }
  set data(data) {
    this._data = data;
  }

  get() {
    if(!this.Entry) {
      switch(path.extname(this.FileName)) {
        case "ocs":
        case "ocf":
        case "ocd":
        case "ocg":
          this.Entry = C4Group.fromBuffer(this.data);
          break;
        default:
          this.Entry = this.data;
          break;
      }
    }
    return this.Entry;
  }
}

class C4BufferGroup extends C4Group {
  constructor(buffer) {
    super();
    this.data = buffer;
    this.Header = new C4GroupHeader(this.data.slice(0, 204));
    this.EntryTable = Array.from(new Array(this.Header.NumEntries), (x,i) => i)
      .map((i) => 204 + i*316)
      .map((offset) => { return new C4GroupEntry(this.data.slice(offset, offset+316)); });

    this.EntryTable.forEach(e => {
      let offset = 204 + this.Header.NumEntries * 316 + e.Offset;
      e.data = this.data.slice(offset, offset + e.FileSize);
    });
  }

  get(filename) {
    let entry = this.EntryTable.find(e => e.FileName == filename);
    assert.ok(entry);
    return entry.get();
  }
};

module.exports = C4Group;
