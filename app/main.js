const {app, BrowserWindow, dialog} = require('electron')
const fs = require('fs')

let output = fs.createWriteStream(`${app.getPath('userData')}/error.log`, {flags: "w", })

output.write(`Detected platform: ${process.platform}\n`)

process.on('uncaughtException', function (err) {
    output.write(`ERR: ${err}\n`)
	dialog.showErrorBox("Failed to launch app", `Error: ${err}`)
})

let defaultConfigVal = {
	author: "Twonky",
	ocver: "7,0",
	dftTempDir: "...",
	focussedRes: ""
}

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let config = {}
function createWindow () {
	
	communicator = {
		__appdir: app.getPath('userData'),
		printLog: (str) => {
			output.write(`${str}\n`)
		},
		setConfig: (key, value) => {
			config.config[key] = value
		},
		wipeConfig: (key) => {
			if(!key)
				return
			config.config[key] = undefined
		},
		getConfig: (key) => {
			return config.config[key] || defaultConfigVal[key]
		},
		hideMenu: _ => {
			win.setMenu(null)
		},
		toggleDevMode: _ => {
			config.inDevMode = !config.inDevMode;
		},
		dialog: dialog
	}
	
	// Make sure to have valid values
	try {
		let str = fs.readFileSync(`${app.getPath('userData')}/config.json`)

		if(!str)
			throw "Cannot read config file"
		
		config = JSON.parse(str)

		if(!config)
			throw "Failed to JSON.parse config"
		
		if((typeof config.window.x === "number" && typeof config.window.y !== "number") ||
			(typeof config.window.x !== "number" && typeof config.window.y === "number")) {
			config.window.x = undefined
			config.window.y = undefined
		}

		config.window.width = parseInt(config.window.width) || 800
		config.window.height = parseInt(config.window.height) || 600
	}
	catch(e) {
		output.write(`Failed to load config:\n(${e})\n`)
		config.window = {width: 800, height: 600, frame: true}
		config.inDevMode = false
		config.config = {
			resources: [],
			layout: []
		}
	}

	config.window.icon = `${__dirname}/the-mill.ico`
	config.window.show = false
	config.window.backgroundColor = "#282828"
	config.window.frame = false
	
	communicator.config = config.config
	communicator.inDevMode = config.inDevMode
	
	global.communicator = communicator
	
	// Create the browser window.
	win = new BrowserWindow(config.window)
	
	win.webContents.on('did-finish-load', _ => {
		win.show()
	})
	
	if(!config.inDevMode)
		win.setMenu(null)
	
	if(config.window.maximized)
		win.maximize()

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`)

	// Open the DevTools.
	if(config.inDevMode)
		win.webContents.openDevTools()

	// Emitted when the window is closed.
  
	win.on("close", () => {
		let bounds = win.getBounds()
		config.window.width = bounds.width
		config.window.height = bounds.height
		config.window.x = bounds.x
		config.window.y = bounds.y
		config.window.maximized = win.isMaximized()
	})
  
	win.on('closed', () => {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		win = null
	})
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin')
		app.quit()
})

app.on('activate', () => {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (win === null)
		createWindow()
})

app.on('before-quit', () => {
	fs.writeFileSync(`${app.getPath('userData')}/config.json`, JSON.stringify(config))
	output.end()
})