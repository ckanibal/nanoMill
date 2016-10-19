

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

function createDefaultLayout(byUser) {
	/*
	var page = addPage(DIR_COL),
		subFlex = addFlexer(DIR_ROW)

	$("#mod-wrapper").append(page.root)

	subFlex.root.style.height = `${$("#mod-wrapper").height()/5*4 || 500}px`
	
	page.registerChild(subFlex)
	
	let mod = addModule("navigator")
	subFlex.registerChild(mod)
	mod.root.style.width = `${$("#mod-wrapper").width()/3 || 200}px`
	
	subFlex.registerChild(addModule("editor"))
	page.registerChild(addModule("runint"))
	*/
	var page = addPage(),
		subFlex = addFlexer(DIR_COL),
		subFlex2 = addFlexer(DIR_COL)

	$("#mod-wrapper").append(page.root)

	subFlex.root.style.width = `${$("#mod-wrapper").width()/5*2 || 500}px`
	
	page.registerChild(subFlex)
	page.registerChild(subFlex2)
	
	let mod = addModule("resview")
	subFlex.registerChild(mod)
	mod.root.style.height = `${$("#mod-wrapper").height()/2 || 200}px`
	subFlex.registerChild(addModule("navigator"))

	mod = addModule("editor")	
	subFlex2.registerChild(mod)
	mod.root.style.height = `${$("#mod-wrapper").height()/4*3 || 600}px`
	
	subFlex2.registerChild(addModule("runint"))
	
	page.root.style.animation = "fade-in 0.3s"
	warn("Default layout used (Forced by user: " + (byUser || "false") + ")")
}

function resetLayout() {
	_pages = []
	_modules = []
	_flexers = []
	$("#mod-wrapper").html("")
	
	createDefaultLayout(...arguments)
}

var currentEditorMod, _focussedRes

var mouseX = 0, mouseY = 0
var mouseOffX, mouseOffY, dragSplitterTarget, origDim

{
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

        e.preventDefault();
        e.stopPropagation();
    })

    $(document).mousemove(function(e) {
        mouseX = e.clientX
        mouseY = e.clientY
    })

    $(document).mouseup(function(e) {
		if(dragSplitterTarget) {
			$(dragSplitterTarget).removeClass("dragged")
			
			execHook("onLayoutChange")
		}
		
        dragSplitterTarget = false
    })

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
			
			var cp = cprocess.spawn(p, [`--editor`])
			
			var _inittime = (new Date()).getTime()
			
			cp.stdout.on('data', function (data) {
				let m = data.toString().match(/Version:\s*(.*?)\s/)
				if(m && m[1]) {
					setConfig("ocver", m[1])
					document.getElementById("version-input").value = m[1]
					cp.kill()
				}
				else if((new Date()).getTime() - _inittime > 100)
					cp.kill()
			})
		}
	}
	
	document.getElementById("sett-page-toggle").onclick = function() {
		let $el = $('#settings')
		$el[0].style.display = ""
		$el.toggleClass('visible')
	}
	
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
	
	try {
		if(!config)
			throw "No config given"
		
		let a = []
		let r = config.resources
		var cf = getConfig("focussedRes")
		
		for(let i = 0; i < r.length; i++)
			if(r[i]) {
				let p = r[i]
				_fs.stat(r[i], (err, stat) => {
					if(err)
						error(`Failed to reload resource (${err})\n${p}`)
					else {
						let res = filemanager.addResource(p, stat)
						if(p === cf)
							execHook("onResFocus", res)
					}
				})
			}
			
		config.resources = []
		
		let pages = getConfig("pages")
		
		if(pages && pages.length) {
			let handleLayoutInput = function(data, par) {
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
					case "resview":
					case "editor":
					case "intro":
					case "navigator":
					case "runint":
						let mod = addModule(data.alias)
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
		setConfig("resources", getResourcesData())
	})
	
	$("#newstuff").click(_ => {
		require("./js/template_modal.js").show()
	})
	
	require("./js/keybinding.js")
	
    log("end of initialize")
}

function pickFile(callback) {
	var el = document.getElementById("filepicker")
	
	el.onchange = callback
	el.click()
}

function receiveLocalResource(p) {
	
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

function openFile(res) {
	if(!resIsEditable(res))
		return
	
	execHook("onFileOpen", res)
}

function resIsEditable(res) {
	if(
		res.leaf === ".c" ||
		res.leaf === ".txt" ||
		res.leaf === ".ocm" ||
		res.leaf === ".glsl" ||
		res.leaf === ".mesh" ||
		res.leaf === ".json" ||
		res.leaf === ".material")
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