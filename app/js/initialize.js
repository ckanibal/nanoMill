

var _hookList = []

function hook(name, fn) {
    if(!_hookList[name])
        _hookList[name] = []

    _hookList[name].push(fn)
}

function execHook(name, ...args) {
    for(var fnName in _hookList[name])
        if(_hookList[name][fnName](...args))
            return
}

var
    INFO = 0,
    ERR = 1,
    WARN = 2

function log(msg, type) {
    var el = $("<div class='log-entry'></div>")[0]

    if(type === 2)
        $(el).addClass("warn")
    else if(type === 1)
        $(el).addClass("err")
    else
        $(el).addClass("info")

    $(el).html(msg)

    $("#log-entry-list").append(el)
}

var currentEditorMod

function setCurrentEditorModule() {

}

var mouseX = 0, mouseY = 0
var mouseOffX, mouseOffY, dragSplitterTarget, origDim

{
	
	log("initialize...", INFO)
	
	log("Node version: " + process.versions.node, INFO)
	log("Chromium version: " + process.versions.chrome, INFO)
	log("Electron version: " + process.versions.electron, INFO)

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

    $("#log-icon").click(function() {
        $("#internal-log").toggleClass("visible")
    })

    $("#openf").click(function() {

		pickFile(function(e) {
			let files = this.files
			
			for(var i = 0; i < files.length; i++)
				if(filemanager.addResource(files[i]))
					openFile(files[i])
		})
    })

    $("#savef").click(function() {
		
        if(!currentEditorMod)
            return

    })


    // default setup
    var page = addPage(),
        subFlex = addFlexer(DIR_COL)

    $("#mod-wrapper").append(page.root)

    page.registerChild(subFlex)
    subFlex.registerChild(addModule("resview"))
    subFlex.registerChild(addModule("navigator"))

    page.registerChild(addModule("editor"))
	
	window.addEventListener("beforeunload", saveConfig)

    log("end of initialize", INFO)
}

var _config = {}

function saveConfig() {

	_config.session = getSessionData()

	_fs.writeFile(path.join(__dirname, 'config.json'), JSON.stringify(_config), 'utf-8', (err) => {
		if(err)
			throw err
		
		log("Configurations saved.", INFO)
	})
}

function getRawConfig() {

}

function getSessionData() {

    return {
		resources: getResourcesData(),
		layout: getLayoutData(),
	}
}

function pickFile(callback) {
	var el = document.getElementById("filepicker")
	
	el.onchange = callback
	el.click()
}

function openFile(file) {
	execHook("onFileOpen", file)
}
