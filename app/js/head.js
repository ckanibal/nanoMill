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