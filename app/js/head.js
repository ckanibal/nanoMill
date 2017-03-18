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
	copies an array without the specified value
*/
function copyArrayWIO(ary, val) {
	let a = []
	let i = ary.length
	while(--i)
		if(ary[i] !== val)
			a[i] = ary[i]
	
	return a
}

function openDialog(fileName, width, height, initData, callback) {
	Elem.addClass(document.getElementById("win-overlay"), "shown")
	let con = document.getElementById("overlay-content")
	con.style.width = width + "px"
	con.style.height = height + "px"
	
	let dlg = require(path.join(__rootdir, "dialogs", fileName))
	dlg(initData, function() {
		Elem.removeClass(document.getElementById("win-overlay"), "shown")
		con.innerHTML = ""
		
		if(callback)
			callback(...arguments)
	})
}