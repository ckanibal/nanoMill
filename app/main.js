const {app, BrowserWindow} = require('electron')
const _fs = require('fs')

var output = _fs.createWriteStream(`${__dirname}/error.log`, {flags: "w", })

output.write(`Detected platform: ${process.platform}\n`)

process.on('uncaughtException', function (err) {
    output.write(`ERR: ${err}\n`)
})


// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
var wininfo = {}
function createWindow () {

	// Make sure to have valid values
	try {
	  
		let str = _fs.readFileSync(`${__dirname}/wininfo.json`)

		wininfo = JSON.parse(str)
		let opts = wininfo.opts

		if((typeof opts.x === "number" && typeof opts.y !== "number") ||
			(typeof opts.x !== "number" && typeof opts.y === "number"))
		  throw `Invalid window position (${JSON.stringify(opts)})`

		wininfo.opts.width = parseInt(opts.width) || 800
		wininfo.opts.height = parseInt(opts.height) || 600
	}
	catch(e) {
		output.write(`Default window setup will be used due to:\n(${e})\n`)
		wininfo.opts = {width: 800, height: 600, frame: true}
		wininfo.enableDevMode = true
	}

	wininfo.opts.icon = `${__dirname}/the-mill.ico`
	
	// Create the browser window.
	win = new BrowserWindow(wininfo.opts)
	win.setMenu(null)
	
	if(wininfo.opts.maximized)
		win.maximize()

	// and load the index.html of the app.
	win.loadURL(`file://${__dirname}/index.html`)

	// Open the DevTools.
	if(wininfo.enableDevMode)
		win.webContents.openDevTools()

	// Emitted when the window is closed.
  
	win.on("close", () => {
		let bounds = win.getBounds()
		wininfo.opts.width = bounds.width
		wininfo.opts.height = bounds.height
		wininfo.opts.x = bounds.x
		wininfo.opts.y = bounds.y
		wininfo.opts.maximized = win.isMaximized()
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
	_fs.writeFileSync(`${__dirname}/wininfo.json`, JSON.stringify(wininfo))
	output.end()
})