var
    DIR_COL = 1,
    DIR_ROW = 2

class Layout_Element {
	constructor () {
		this.isLayout_Element = true
	}
	
	get root () {
		return this._el
	}
	
	set root (v) {
		this._el = v
	}
	
	get parent () {
		return this._parent
	}
	
	set parent (v) {
		this._parent = v
	}
	
	getLayoutInfo() {
		return { w: this.root.style.width, h: this.root.style.height }
	}
}

var _pages = []

function addPage() {
	let page = new Layout_Page()
	_pages.push(page)
	
	return page
}

class Layout_Page extends Layout_Element {
	constructor() {
		super()
		
		this.children = []
		
		this.flexer = new Flexer()
		this.flexer.setDir(DIR_ROW)
		
		this.flexer.adjustAppearance = function() { }
	}
	
	registerChild() {
		this.flexer.registerChild(...arguments)
    }

    unregisterChild() {
		this.flexer.unregisterChild(...arguments)
    }
	
	get root () {
		return this.flexer._el
	}
	
	set root (v) {
		this.flexer._el = v
	}
	
	getLayoutInfo() {
		let info = this.flexer.getLayoutInfo(...arguments)
		info.alias = "Page"
		return info
	}
}

class Layout_Flex extends Layout_Element {
	
	constructor() {
		
		super()
		
		this.children = []
		this.canContainChildren = true
	}

    setDir(dir) {
        if(dir === DIR_COL)
            $(this.root).addClass("flex-col").removeClass("flex-row")
        else
            $(this.root).addClass("flex-row").removeClass("flex-col")

        this._dir = dir
    }

    getDir() {
        return this._dir
    }

    registerChild(child, index) {

        if(!child)
            return error("No parameter given for registerChild")
        else if(!child.isLayout_Element)
            return log("Given child is not a Layout_Element")


        if(index === undefined) {
            $(this.root).append(child.root)

            this.children.push(child)
        }
        else {
            if(!this.children[index])
                index = this.children.length - 1

            $(this.children[index].root).before(child.root)

            this.children.splice(index, 0, child)
        }

        child.parent = this

        this.updateSplitters()
    }

    unregisterChild(mod) {
        var a = []

        for(var i = 0; i < this.children.length; i++)
            if(this.children[i] !== mod)
                a.push(this.children[i])

        this.children = a
		
		$("#mod-buffer").append(mod.root)
		mod.parent = false
		
        this.updateSplitters()
    }

    adjustAppearance() {

        if(!this.children.length) {
            $(this.root).remove()
            this.parent.unregisterChild(this)
        }
		else if(this.children.length === 1) {
			let child = this.children[0]
			let p = this.parent
			
			$("#mod-buffer").append(child.root)
			
			let root = this.root
			
			if(p.getDir() === DIR_ROW)
				child.root.style.width = root.style.width
			else
				child.root.style.height = root.style.height
			
			$(child.root).removeClass("flex-fill")
			$(root).remove()
			
			let idx = p.getChildIndex(this)
			p.unregisterChild(this)
			p.registerChild(child, idx)
		}
    }

    getChildIndex(mod) {

        for(var i = 0; i < this.children.length; i++)
            if(this.children[i] === mod)
                return i

        return -1
    }

    updateSplitters() {

        var prev, el = this.root.firstElementChild

        if($(el).hasClass("flex-splitter")) {
            $(el).remove()
            el = el.nextElementSibling
        }

        while(el) {
            if(!$(el).hasClass("flex-splitter")) {
                if(prev && !$(prev).hasClass("flex-splitter"))
                    $(prev).after("<div class='flex-splitter'></div>")
			}
			else if($(prev).hasClass("flex-splitter")) {
				$(el).remove()
				el = prev
			}

            prev = el
            el = el.nextElementSibling
        }

        if($(prev).hasClass("flex-splitter"))
            $(prev).remove()
		
		if(this.root.lastElementChild) {
			if(this.dir === DIR_ROW)
				$(this.root.lastElementChild).addClass("flex-fill")[0].style.width = ""
			else
				$(this.root.lastElementChild).addClass("flex-fill")[0].style.height = ""
		}
    }
	
	getLayoutInfo() {
		let o = {
			dir: this.getDir(),
			alias: this.constructor.name,
			chldrn: [],
			w: this.root.style.width,
			h: this.root.style.height
		}
		
		for(let i = 0; i < this.children.length; i++)
			o.chldrn.push(this.children[i].getLayoutInfo())
		
		return o
	}
}

class Layout_Module extends Layout_Element {

    constructor() {
		
		super()

        var $el = $(".mod-con.draft").clone()

        this.root = $el[0]

        log("module created - constructor name: " + this.constructor.def.alias)
        $el.removeClass("draft")

        for(var ali in _modDefs) {
            let def = _modDefs[ali]

            if(def.isSub)
                continue
			
            var $entry = $(`<div class='mod-sel-item
                       ${(def.alias === this.constructor.def.alias?" visible":"")}
                       '>${def.title}</div>`)

            $el.find(".mod-sel-list").append($entry)
			
            $entry.click(() => {
                $el.find(".mod-sel-list").find(".visible").removeClass("visible")
                $(this).addClass("visible")

                $(":focus").blur()

                this.redefine(def.alias)
            })

            $el.find(".mod-move").click(function() {
                $("#content").addClass("move-mod")

                var fn = (e) => {
                    e.stopPropagation()
                    $("#content").removeClass("move-mod")
                    this.removeEventListener("click", fn)
                    log("move happened")
                }

                $(".mod-body").each(function() {
                    this.addEventListener("click", fn, true)
                })

            })
        }

        $el.find(".mod-sett").click(() => {

            var $menu = $el.find(".mod-sett-menu")

            $menu.html("")

            var fn = function(defList) {

                if(!defList)
                    return

                for(var i = 0; i < defList.length; i++) {
                    var data = defList[i]
                    var $entry = $(`<div class='ALE-entry'>
                                        <div class='ALE-label'>${data.label}
                                        ${(data.icon?"<div class='flex-fill'></div>\
											<div class='ALE-icon-w'>\
                                                <div class='"+data.icon+"'></div>\
											</div>":"")}
										</div>
                                   </div>`)
                    if(data.fn)
                        $entry.click(data.fn.bind(this))
                    $menu.append($entry)
                }
            }

            fn.call(this, this.getBasicMenuProps())
            fn.call(this, this.getSpecialMenuProps())
        })
    }

    redefine(modAlias) {
        var p = this.parent

		p.registerChild(addModule(modAlias), p.getChildIndex(this))
		
        removeModule(this)
		execHook("onLayoutChange")
    }

    onDeletion() {
		cleanUpHooksOfMdl(this.id)
	}

    addSibling(fVertical) {

        let dir = fVertical?DIR_COL:DIR_ROW

        let p = this.parent

        if(p.getDir() === dir) {
            var mod = addModule("intro")
            p.registerChild(mod, p.getChildIndex(this) + 1)
        }
        else {
            var idx = p.getChildIndex(this)
            var flexer = addFlexer(dir)
			
            p.registerChild(flexer, idx)
			
			p.unregisterChild(this)
			
			flexer.registerChild(this)
			flexer.registerChild(addModule("intro"))
        }
		
		execHook("onLayoutChange")
    }

    deleteModule() {
        $(this._el).remove()
        this._parent.unregisterChild(this)
        this._parent.adjustAppearance()
    }
	
	getBasicMenuProps() {
		return [
			{
				label: "Close Frame",
				icon: "icon-x-s",
				fn: function() {
					let p = this.parent
					removeModule(this)
					p.adjustAppearance()
					$(":focus").blur()
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-v",
				fn: function() {
					this.addSibling(true)
					$(":focus").blur()
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-h",
				fn: function() {
					this.addSibling()
					$(":focus").blur()
				}
			}
		]
	}
	
	getSpecialMenuProps() {
		return []
	}
	
	isSub() { return false }
	
	getLayoutInfo() {
		return { alias: this.constructor.def.alias, w: this.root.style.width, h: this.root.style.height }
	}
}

class Layout_Deck extends Layout_Module {
	
	constructor() {
		super()
		
		this.children = []
	}

    registerChild(child) {

        if(!child)
            return error("No parameter given for registerChild")
        else if(!child.isLayout_Element)
            return log("Given child is not a Layout_Element")


        $(this.root).find(".mod-body").append(child.root)

        this.children.push(child)

        child.parent = this
    }

    unregisterChild(mod) {
        var a = []

        for(var i = 0; i < this.children.length; i++)
            if(this.children[i] !== mod)
                a.push(this.children[i])

        this.children = a

        mod.parent = false
    }

    getChildIndex(mod) {

        for(var i = 0; i < this.children.length; i++)
            if(this.children[i] === mod)
                return i

        return -1
    }

    showChild(idx) {		
        for(var i = this.children.length; i--;)
            if(i === idx)
                this.children[i].root.style.display = "initial"
            else
                this.children[i].root.style.display = "none"
    }
}

class Layout_SubModule extends Layout_Element{
	constructor() {
		super()
	}
	
	setup() { }
	
	isSub() { return true }
}

var _modules = []
var _modDefs = {}

function registerModule(def) {
	
	if(_modDefs[def.alias])
		error(`mod alias already defined (${def.alias}); registration rejected`)
	
    _modDefs[def.alias] = def
}

var modId = 0
function addModule(modAlias) {

    var def = _modDefs[modAlias]
	
    if(!def || !def.className)
        return error(`addModule: module alias '${modAlias}' not registered.`)

    var mod = new def.className(modId)

    _modules.push(mod)
	
	mod.id = modId++

    return mod
}

function removeModule(mod) {

    mod.onDeletion()
	
    var p = mod.parent
    if(p)
        p.unregisterChild(mod)

    var a = []

    for(var i = 0; i < _modules.length; i++)
        if(_modules[i] !== mod)
            a.push(_modules[i])

	$(mod.root).remove()
	
    _modules = a
}

var _flexers = []

class Flexer extends Layout_Flex {
	constructor(dir) {
		super()
		
		this.root = $("<div class='flexer flex-fill'></div>")[0]
		
		this.setDir(dir)
	}
}


function addFlexer(dir) {
    var flexer = new Flexer(dir)

    _flexers.push(flexer)

    return flexer
}

function getLayoutData() {
	
	let pages = []
	
	for(let i = 0; i < _pages.length; i++)
		pages[i] = _pages[i].getLayoutInfo()
	
	return pages
}
