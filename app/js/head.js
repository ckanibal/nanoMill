const cprocess = require("child_process")
const __rootdir = __dirname
const fs = require('fs')
const path = require('path')
const {remote} = require('electron')

// get constants and functions from main process
const {__appDir, config, printLog, inDevMode, setConfig, getConfig, wipeConfig, hideMenu, dialog, toggleDevMode } = remote.getGlobal("communicator")

const MOUSE_LEFT = 1

{
	setTimeout(_ => {
		require('ncp')
		require('./js/templates')
	}, 6000)
	
	if(inDevMode && false)
		setTimeout(_ => reloadCss(), 1000)
}


var _hookList = {}

function hook(name, fn, modId) {
	
	if(!modId && modId !== 0)
		modId = -1
	
    if(!_hookList[name])
        _hookList[name] = []

    _hookList[name].push({ fn, modId })
}

function execHook(name, ...args) {
    for(var fnName in _hookList[name])
        if(_hookList[name][fnName].fn(...args))
            return
}

function cleanUpHooksOfMdl(modId) {
	for(let hookName in _hookList) {
		let a = []
		let fnList = _hookList[hookName]
		for(let i = 0; i < fnList.length; i++)
			if(fnList[i].modId !== modId)
				a.push(fnList[i])
		
		_hookList[hookName] = a
	}
}

var log, warn, error

function _delegateLog() {
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
	_delegateLog()

var _prf = {
	keys: {},
	
	start: function(key) {
		this.keys[key] = (new Date()).getTime()
	},
	stop: function(key, fprint) {
		var t = (new Date()).getTime() - this.keys[key]
		
		if(fprint)
			log("Profiled [" + key + "] : " + t + "ms")
		
		return t
	}
}