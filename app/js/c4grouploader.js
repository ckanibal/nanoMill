/**
	small testing snippet to make our own thing instead of using c4group
*/

const zlib = require('zlib')

const {Transform} = require("stream")

class TStream extends Transform {
	_transform(data, enc, callback) {
		// change magic bytes on startup
		data[0] = 0x1f
		data[1] = 0x8b
		
		callback(null, data)
		
		// don't care about magic bytes anymore
		this._transform = function(data, enc, callback) {
			callback(null, data)
		}
	}
}

function gz() {
	let inp = fs.createReadStream(path.join("D:", "test", "Arena.ocf"))
	let out = fs.createWriteStream(path.join("D:", "test", "Arena.txt"))
	let gzip = zlib.createGunzip()
	let trans = new TStream()
	
	inp.pipe(trans).pipe(gzip).pipe(out)
}


module.exports = gz