const cprocess = require("child_process")
const __rootdir = __dirname
const fs = require('fs')
const path = require('path')
const {remote} = require('electron')

var {__appDir, config, printLog, inDevMode, setConfig, getConfig, wipeConfig, hideMenu, dialog, toggleDevMode } = remote.getGlobal("communicator")

{
	setTimeout(_ => {
		require('ncp')
		require('./js/templates')
	}, 6000)
	
	if(inDevMode && false)
		setTimeout(_ => reloadCss(), 1000)
}