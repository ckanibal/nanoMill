

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
	warn = s => printLog(s)
	error = s => printLog(s)
	window.onerror = (msg, file, line) => error(msg + "\n" + file + " in line: " + line)
}

if(inDevMode) {
	log = console.log.bind(console)
	warn = console.warn.bind(console)
	error = console.error.bind(console)
}
else 
	_delegateLog()
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

var currentEditorMod

function setCurrentEditorModule() {

}

var mouseX = 0, mouseY = 0
var mouseOffX, mouseOffY, dragSplitterTarget, origDim

{
	log("initialize...")	
	log("Node version: " + process.versions.node)
	log("Chromium version: " + process.versions.chrome)
	log("Electron version: " + process.versions.electron)
	log("Arch: " + process.arch)

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

    $("#openf").click(function() {

		pickFile(function(e) {
			let files = this.files
			
			for(let i = 0; i < files.length; i++)
				receiveLocalResource(files[i].path)
		})
    })
	
	document.ondragover = document.ondrop = (e) => {
		e.preventDefault()
	}

	document.body.ondrop = (e) => {
		let files = e.dataTransfer.files
		
		for(let i = 0; i < files.length; i++)
			receiveLocalResource(files[i].path)
		
		e.preventDefault()
	}
	
    $("#savef").click(function() {
		
        if(!currentEditorMod)
            return

    })
	
	try {
		if(!config)
			throw "No config given"
		
		let a = []
		let r = config.resources
		
		for(let i = 0; i < r.length; i++)
			if(r[i]) {
				let p = r[i]
				_fs.stat(r[i], (err, stat) => {
					if(err)
						error(`Failed to reload resource (${err})\n${p}`)
					else
						filemanager.addResource(p, stat)
				})
			}
			
		config.resources = []
		
		let handleLayoutInput = function(data, par) {
		}
		/*/
		for(let i = 0; i < config.pages.length; i++)
			handleLayoutInput(config.pages)
		*/
	}
	catch(e) {
		error(`Failed to load config (${e})`)
		
		var page = addPage(),
			subFlex = addFlexer(DIR_COL)

		$("#mod-wrapper").append(page.root)

		page.registerChild(subFlex)
		subFlex.registerChild(addModule("resview"))
		subFlex.registerChild(addModule("navigator"))

		page.registerChild(addModule("editor"))
		
		page.root.style.animation = "fade-in 0.3s"
	}
	
	window.addEventListener("beforeunload", _ => {
		config.resources = getResourcesData()
		config.layout = getLayoutData()
	})

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
		setConfig("c4group", p)

	
	let res = filemanager.addResource(p)
	if(res)
		execHook("onFileOpen", res)
}

function openFile(res) {
	execHook("onFileOpen", res)
}

function openFiles(paths) {
	for(var i = 0; i < files.length; i++) {
		let res = filemanager.addResource(paths)
		if(res)
			execHook("onFileOpen", res)
	}
}
