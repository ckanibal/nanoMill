

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

class HookList {
	constructor() {
		this.list = []
	}
	
	in(name, fn, modId) {
		
		if(!modId && modId !== 0)
			modId = -1
		
		if(!_hookList[name])
			_hookList[name] = []

		_hookList[name].push({ fn, modId })
	}
	
	/**
		deletes all referenced functions from  a specific module
	*/
	freeOfModule() {
		for(let hookName in _hookList) {
			let a = []
			let fnList = _hookList[hookName]
			for(let i = 0; i < fnList.length; i++)
				if(fnList[i].modId !== modId)
					a.push(fnList[i])
			
			_hookList[hookName] = a
		}
	}
}

/// var hook = new HookList()

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

/**
 * This function restores the predefined layout, to allow users to get back
 * to viable layout if the customized one failed to any sort of bugs (e.g. failing to load old state or accidently rumping it up)
*/
function restoreDefaultLayout(byUser) {
	var page = addPage(),
		subFlex = addFlexer(DIR_COL)

	$("#mod-wrapper").append(page.root)

	subFlex.root.style.width = `${$("#mod-wrapper").width()/5*2 || 500}px`
	
	page.registerChild(subFlex)
	
	let mod = addModule("navigator")
	subFlex.registerChild(mod)
	mod.root.style.height = `${$("#mod-wrapper").height()/3 || 200}px`
	subFlex.registerChild(addModule("explorer"))

	mod = addModule("editor")	
	page.registerChild(mod)
	
	page.root.style.animation = "fade-in 0.3s"
	warn("Default layout used (Forced by user: " + (byUser || "false") + ")")
}

function resetLayout() {
	_pages = []
	_modules = []
	_flexers = []
	document.getElementById("mod-wrapper").innerHTML = ""
	
	restoreDefaultLayout(...arguments)
}

var currentEditorMod, _focussedRes

var mouseX = 0, mouseY = 0
var mouseOffX, mouseOffY, dragSplitterTarget, origDim

{
	/**
		Initializer block.
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
	
	hook("onResFocus", (res) => {
		_focussedRes = res
		setConfig("focussedRes", res.path)
	})
	
	/*
		handling moduleframe resizing when dragging the splitters inbetween
	*/
    $(document).on('mousedown', '.flex-splitter', function(e) {
        dragSplitterTarget = this

        var fn = function() {
            if(!dragSplitterTarget)
                return

            if($(dragSplitterTarget).parent().hasClass("flex-col"))
                dragSplitterTarget.previousElementSibling.style.height =
                        origDim + mouseY - mouseOffY + "px"
            else
                dragSplitterTarget.previousElementSibling.style.width =
                        origDim + mouseX - mouseOffX + "px"

            requestAnimationFrame(fn)
        }
		
		$(dragSplitterTarget).addClass("dragged")

        mouseOffX = mouseX
        mouseOffY = mouseY

        var $prev = $(dragSplitterTarget.previousElementSibling)
        if($(this).parent().hasClass("flex-row")) {
            origDim = parseFloat($prev.width())
            $prev.width(origDim + "px")
        }
        else {
            origDim = parseFloat($prev.height())
            $prev.height(origDim + "px")
        }

        $prev.removeClass("flex-fill")

        requestAnimationFrame(fn)

        e.preventDefault()
        e.stopPropagation()
    })

	// track mouse position
    $(document).mousemove(function(e) {
        mouseX = e.clientX
        mouseY = e.clientY
    })

	// stop dragging splitters
    $(document).mouseup(function(e) {
		if(dragSplitterTarget) {
			$(dragSplitterTarget).removeClass("dragged")
			
			execHook("onLayoutChange")
		}
		
        dragSplitterTarget = false
    })

	// open file button
    $("#openf").click(openFilePicker)
	
	document.ondragover = document.ondrop = (e) => {
		e.preventDefault()
	}

	document.body.ondrop = (e) => {
		let files = e.dataTransfer.files
		
		for(let i = 0; i < files.length; i++)
			receiveLocalResource(files[i].path)
		
		e.preventDefault()
	}
	
    $("#savef").click(save)
	
	$("#c4GroupPath").html(getConfig("c4group") || "not set")
	
	document.getElementById("c4GroupPicker").onchange = function(e) {
		let p = this.files[0].path
		
		if(path.basename(p).match(/^c4group/gi)) {
			setConfig("c4group", p)
			document.getElementById("c4GroupPath").innerHTML = p
		}
	}
	
	$("#ocExePath").html(getConfig("ocexe") || "not set")
	
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
		
		let a = []
		let r = config.resources
			
		config.resources = []
		
		let pages = getConfig("pages")
		
		if(pages && pages.length) {
			let handleLayoutInput = function(data, par) {
				// whitelist modules for additional safety
				// and take care of layout interpretation
				switch(data.alias) {
					case "page":
						let page = addPage(data.dir)
						$("#mod-wrapper").append(page.root)
						page.setDir(data.dir)
						
						for(let i = 0; i < data.chldrn.length; i++)		
							handleLayoutInput(data.chldrn[i], page)
					break;
					case "flexer":
						let flexer = addFlexer(data.dir)
						
						par.registerChild(flexer)
						flexer.root.style.width = data.w
						flexer.root.style.height = data.h
						
						for(let i = 0; i < data.chldrn.length; i++)
							handleLayoutInput(data.chldrn[i], flexer)
					break;
					case "editor":
					case "intro":
					case "console":
					case "navigator":
					case "explorer":
						let mod = addModule(data.alias, data.state)
						if(!mod)
							break;
												
						par.registerChild(mod)
						mod.root.style.width = data.w
						mod.root.style.height = data.h
					break;
				}
			}
			
			for(let i = 0; i < config.pages.length; i++)	
				handleLayoutInput(config.pages[i])
		}
		else
			createDefaultLayout()
			
	}
	catch(e) {
		error(`Failed to load config (${e})`)
		resetLayout()
	}
	
	window.addEventListener("beforeunload", _ => {
		setConfig("pages", getLayoutData())
	})
	
	document.getElementById("newstuff").addEventListener("click", _ => {
		require("./js/template_modal.js").show()
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
// deprecated
function receiveLocalResource(p) {
	warn("using deprecated function")
	let name = path.basename(p),
		leaf = path.extname(p)
	
	if(name.match(/^c4group/gi))
		return setConfig("c4group", p)
	else if(name.match(/^openclonk/gi))
		return setConfig("ocexe", p)

	let res = filemanager.addResource(p)
	
	if(res)
		execHook("onFileOpen", res)
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
	for(var i = 0; i < files.length; i++) {
		let res = filemanager.addResource(paths)
		if(res)
			execHook("onFileOpen", res)
	}
}

function showModal(title, contentEl) {
	$modal = $("#modal")
	$modal.find(".modal-title").html(title)
	$modal.find(".modal-content").append(contentEl)
	$modal.show()
}

function hideModal() {
	$("#modal").hide()
	$("#modal").find(".modal-content").html("")
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
		let $el = $(`<div class="flex-row"><p class="url flex-fill">${txt}</p><div class="url-browse">Browse</div></div>`)
		
		$el.find(".url-browse").click(_ => {
			let p = remote.dialog.showOpenDialog({
				properties: ['openDirectory']
			})
			
			if(!p)
				return
			
			$el.find(".url").html(p[0])
			
			if(callback)
				callback(p[0])
		})
		
		return $el[0]
	}
}

var editor_proc

function startEditor(args) {
	if(!editor_proc) {
		if(args)
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`, ...args])
		else
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`])
		
		editor_proc.stdout.on('data', function (data) {
			execHook("onStdOut", RuntimeInterface.validateStdout(data.toString()))
		})
		
		editor_proc.on('exit', function (code) {
			if(code)
				log('child process exited with code ' + code.toString())
			
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

function opC4group(args, fListenStdOut) {
	if(!args)
		return false
	
	if(!fListenStdOut)
		cprocess.spawn(getConfig("c4group"), args)
	else {
		let proc = cprocess.spawn(getConfig("c4group"), args)
		
		proc.stdout.on('data', function (data) {
			execHook("onStdOut", Console.validateStdout(data.toString()))
		})
		
		proc.on('exit', function (code) {
			if(code)
				log('child process exited with code ' + code.toString())
		})
	}
	
	return true
}