const cprocess = require("child_process")
const __rootdir = __dirname
const fs = require('fs')
const path = require('path')
const {remote} = require('electron')

// get constants and functions from main process
const {__appdir, config, printLog, inDevMode, setConfig, getConfig, wipeConfig, hideMenu, dialog, toggleDevMode } = remote.getGlobal("communicator")

const layout = require(path.join(__rootdir, "js", "modules", "layout.js"))
const hook = require(path.join(__rootdir, "js", "hook.js"))

const MOUSE_LEFT = 1

var log, warn, error

function writeConsoleOutputToFile() {
	log = printLog
	warn = s => printLog("WARN: " + s)
	error = s => printLog("ERR: " + s)
	window.onerror = (msg, file, line) => error(msg + "\n" + file + " in line: " + line)
}

if(inDevMode) {
	log = console.log.bind(console)
	warn = console.warn.bind(console)
	error = console.error.bind(console)
}
else
	writeConsoleOutputToFile()

/**
	Copies an array without the specified value
*/
function copyArrayWIO(ary, val) {
	let a = []
	
	for(let i = 0; i < ary.length; i++)
		if(ary[i] !== val)
			a.push(ary[i])
	
	return a
}

function removeArrayItem(ary, val) {
	for(let i = ary.length - 1; i >= 0; i--) {
		if(ary[i] === val) {
			ary.splice(i, 1)
			return
		}
	}
}

function removeArrayItems(ary, val) {
	for(let i = ary.length - 1; i >= 0; i--) {
		if(ary[i] === val) {
			ary.splice(i, 1)
			break
		}
	}
}

/**
	Checks if a file/or directory of the given path already
	exists; if so it checks for alternative with a " - n" suffix.
	Otherwise it returns the given path
	@param p path of tile
	@param callback after finding a valid name
*/
function validateFilename(p, callback, i) {
	if(typeof i === "number")
		p += " - " + i
	
	fs.stat(p, (err) => {
		// an error means, that the file does not exists
		if(err)
			callback(p)
		else {
			if(!i)
				validateFilename(p, callback, 1)
			else
				validateFilename(p, callback, i++)
		}
	})
}

/**
	Checks if a file/or directory of the given path already
	exists; if so it checks for alternative with a " - n" suffix.
	Otherwise it returns the given path
	@param p path of tile
*/
function validateFilenameSync(p) {
	let stat
	
	try {
		stat = fs.statSync(p)
	}
	catch(e) {
		return p
	}
	
	let altp
	let i = 1
	while(stat) {
		altp = p + " - " + i
		try {
			stat = fs.statSync(altp)
		}
		catch(e) {
			return altp
		}
		
		i++
	}
	
	return altp
}