

/**
 * This function restores the predefined layout, to allow users to get back
 * to viable layout if the customized one failed to any sort of bugs (e.g. failing to load old state or accidently rumping it up)
*/
function resetLayout(byUser) {	
	lyt = layout.Layout.fromData([{
		alias: "page", children: [{
			alias: "flexer",
			dir: layout.DIR_COL,
			size: window.innerWidth/3 + "px",
			children: [{
				alias: "navigator",
				size: window.innerHeight/3 + "px"
			}, {
				alias: "explorer",
				size: ""
			}]
		}, {
			alias: "flexer",
			dir: layout.DIR_COL,
			size: "",
			children: [{
				alias: "editor",
				size: window.innerHeight/3*2 + "px"
			}, {
				alias: "console",
				size: ""
			}]
		}]
	}])[0]
	let mwrapper = document.getElementById("mod-wrapper")
	mwrapper.innerHTML = ""
	mwrapper.appendChild(lyt.root)
	
	warn("Default layout used (Forced by user: " + (byUser || "false") + ")")
}

var currentEditorMod, _focussedRes

var lyt

{
	/**
		Initializing block.
		This does take care of basic ui layout binding and reads out
		layout preferences.
	*/
	log("initialize...")	
	log("Node version: " + process.versions.node)
	log("Chromium version: " + process.versions.chrome)
	log("Electron version: " + process.versions.electron)
	log("Arch: " + process.arch)
	
	hook("onCurrEditorSet", (mod, res) => {
		currentEditorMod = mod
	})
	
	document.getElementById("tb-file").addEventListener("click", function(e) {
		let rect = this.getBoundingClientRect()
		new Contextmenu(rect.left, rect.bottom, [{
			label: "Open file",
			onclick: _ => openFilePicker()
		}])
	})
	
	document.getElementById("minimizeWindow").addEventListener("click", _ => remote.getCurrentWindow().minimize())
	document.getElementById("toggleWindowMode").addEventListener("click", _ => {
		let win = remote.getCurrentWindow()
		
		if(win.isMaximized())
			win.unmaximize()
		else
			win.maximize()
	})
	document.getElementById("closeWindow").addEventListener("click", _ => remote.getCurrentWindow().close())
	
	// window controls
	
	document.ondragover = document.ondrop = (e) => {
		e.preventDefault()
	}

	document.body.ondrop = (e) => {
		let files = e.dataTransfer.files
		
		for(let i = 0; i < files.length; i++)
			receiveLocalResource(files[i].path)
		
		e.preventDefault()
	}
	
	document.getElementById("c4GroupPath").innerHTML = getConfig("c4group") || "not set"
	
	document.getElementById("c4GroupPicker").onchange = function(e) {
		let p = this.files[0].path
		
		if(path.basename(p).match(/^c4group/gi)) {
			setConfig("c4group", p)
			document.getElementById("c4GroupPath").innerHTML = p
		}
	}
	
	document.getElementById("ocExePath").innerHTML = getConfig("ocexe") || "not set"
	
	document.getElementById("ocExePicker").onchange = function(e) {
		let p = this.files[0].path
		
		if(path.basename(p).match(/^openclonk/gi)) {
			setConfig("ocexe", p)
			document.getElementById("ocExePath").innerHTML = p
			
			// start openclonk for a very short time and extract
			// version number from stdout
			var cp = cprocess.spawn(p, [`--editor`])
			var _inittime = (new Date()).getTime()
			
			cp.stdout.on('data', function (data) {
				let m = data.toString().match(/Version:\s*(.*?)\s/)
				if(m && m[1]) {
					setConfig("ocver", m[1])
					document.getElementById("version-input").value = m[1]
					cp.kill()
				} // if things did not happen as expected and reach 100ms, stop try
				else if((new Date()).getTime() - _inittime > 100)
					cp.kill()
			})
		}
	}
	
	// setting up settings-page visibilty toggle
	document.getElementById("sett-page-toggle").addEventListener("click", function () {
		let el = document.getElementById("settings")
		el.style.display = ""
		Elem.toggleClass(el, 'visible')
	})
	
	document.getElementById("author-input").onchange = function(e) {
		if(!this.value || !this.value.length)
			this.value = getConfig("author")
		else
			setConfig("author", this.value)
	}
	
	document.getElementById("author-input").value = getConfig("author")
	
	document.getElementById("version-input").onchange = function(e) {
		if(!this.value || !this.value.length)
			this.value = getConfig("ocver")
		else
			setConfig("ocver", this.value)
	}
	
	document.getElementById("version-input").value = getConfig("ocver")
	
	document.getElementById("ace-font-size").onchange = function(e) {
		if(!this.value || !this.value.length)
			this.value = getConfig("acefontsize") || "12"
		else {
			setConfig("acefontsize", this.value)
			
			// delegate new value
			// don't use instance of, but check for equal alias since instanceof would throw
			// an error if such a class is not defined
			for(let i = 0; i < _modules.length; i++)
				if(_modules[i].constructor.def.alias === "texteditor")
					_modules[i].setFontSize(this.value)
		}
	}
	
	document.getElementById("ace-font-size").value = getConfig("acefontsize") || "12"
	
	try {
		if(!config)
			throw "No config given"
		
		let pages = getConfig("pages")
		lyt = layout.Layout.fromData(pages)[0]
		document.getElementById("mod-wrapper").appendChild(lyt.root)
	}
	catch(e) {
		error(`Failed to restore layout from config (${e})`)
		resetLayout()
		
		// TODO: inform user
	}
	
	window.addEventListener("beforeunload", _ => {
		setConfig("pages", [lyt.getLayoutInfo()])
	})
	
	require("./js/keybinding.js")
	
    log("end of initialize")
}

/**
	opens the file-picker dialog and executes the given callback on completion
*/
function pickFile(callback) {
	let el = document.getElementById("filepicker")
	
	el.onchange = callback
	el.click()
}

function receiveLocalResource(p) {
	warn("using deprecated function")
	let name = path.basename(p),
		leaf = path.extname(p)
	
	if(name.match(/^c4group/gi))
		return setConfig("c4group", p)
	else if(name.match(/^openclonk/gi))
		return setConfig("ocexe", p)

	// open globally
	// ...
}

function extIsEditable(ext) {
	if( ext === ".c" ||
		ext === ".txt" ||
		ext === ".ocm" ||
		ext === ".glsl" ||
		ext === ".material")
		return true
	
	return false
}


function openFiles(paths) {
	/*
	for(var i = 0; i < files.length; i++) {
		let res = filemanager.addResource(paths)
		if(res)
			execHook("onFileOpen", res)
	}
	*/
}

function showModal(title, contentEl) {
	modal = document.getElementById("modal")
	modal.getElementsByClassName("modal-title")[0].innerHTML = title
	modal.getElementsByClassName("modal-content")[0].appendChild(contentEl)
	modal.style.display = ""
}

function hideModal() {
	let modal = document.getElementById("modal")
	modal.style.display = "none"
	modal.getElementsByClassName("modal-content")[0].innerHTML = ""
}

function insertTemplateSpecials(s) {
	let author = getConfig("author")
	
	return s.replace(/<<\$(.*?)>>/gi, function(m, p1) {
		if(p1 === "author")
			return author
		
		return m
	})
}

function reloadCss() {
	require('./js/sass_processor.js').parseScss()
}

function save() {
	if(!currentEditorMod)
		return
	
	currentEditorMod.save()
}

function openFilePicker() {
	pickFile(function(e) {
		let files = this.files
		
		for(let i = 0; i < files.length; i++)
			receiveLocalResource(files[i].path)
	})
}

// checks weather "ocexe" is set in configs,
// to indicate that we can give operations to it (e.g. running the game)
function hasExecutable() {
	return !!getConfig("ocexe")
}

// checks weather "c4group" is set in configs,
// to indicate that we can give operations to it (e.g. unpacking, ...)
function hasC4group() {
	return !!getConfig("c4group")
}

/** ui object containing small layout items to fill any page */
var ui = {
	urlPicker: function(txt = "...", callback) {
		let el = Elem.fromString(`<div class="flex-row"><p class="url flex-fill">${txt}</p><div class="url-browse">Browse</div></div>`)
		
		el.getElementsByClassName("url-browse")[0].addEventListener("click", _ => {
			let p = remote.dialog.showOpenDialog({
				properties: ['openDirectory']
			})
			
			if(!p)
				return
			
			el.getElementsByClassName("url-browse")[0].innerHTML = p[0]
			
			if(callback)
				callback(p[0])
		})
		
		return el
	}
}

let editor_proc

function runOCEditor(args) {
	if(!editor_proc) {
		if(args)
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`, ...args])
		else
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`])
		
		editor_proc.stdout.on('data', function (data) {
			execHook("onStdOut", ConsoleView.validateStdout(data.toString()))
		})
		
		editor_proc.on('exit', function (code) {
			editor_proc = false
		})
	}
}

/**
Commands: -l List
          -x Explode
          -u Unpack
          -p Pack
          -t [filename] Pack To
          -y [ppid] Apply update (waiting for ppid to terminate first)
          -g [source] [target] [title] Make update
          -s Sort

Options:  -v Verbose -r Recursive
          -i Register shell -u Unregister shell
          -x:<command> Execute shell command when done

Examples: c4group pack.ocg -x
          c4group update.ocu -g ver1.ocf ver2.ocf New_Version
          c4group -i
*/

function runC4Group(args, fListenStdOut, callback) {
	if(!args)
		return false
	
	let proc = cprocess.spawn(getConfig("c4group"), args)
	
		
	if(fListenStdOut) {
		proc.stdout.on('data', function (data) {
			execHook("onStdOut", Console.validateStdout(data.toString()))
		})
	}
	
	proc.on('exit', function (code) {
		if(callback)
			callback(code)
	})
	
	return true
}