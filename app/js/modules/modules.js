var
    DIR_COL = 1,
    DIR_ROW = 2

class Layout_Element {
	constructor () {
		this.isLayout_Element = true
	}
	
	getLayoutInfo() {
		return { w: this.root.style.width, h: this.root.style.height }
	}
}

var _pages = []

function addPage(dir) {
	let page = new Layout_Page()
	_pages.push(page)
	page.setDir(dir)
	
	return page
}

class Layout_Page extends Layout_Element {
	constructor() {
		super()
		
		this.children = []
		
		this.flexer = new Flexer()
		
		$(this.flexer.root).addClass("flex-fill")
		
		// override functon, to prevent flexer from removing itself, when empty
		this.flexer.adjustAppearance = function() { }
	}
	
	registerChild() {
		this.flexer.registerChild(...arguments)
    }

    unregisterChild() {
		this.flexer.unregisterChild(...arguments)
    }
	
	get root () {
		return this.flexer.root
	}
	
	set root (v) {
		this.flexer.root = v
	}
	
	getLayoutInfo() {
		let info = this.flexer.getLayoutInfo(...arguments)
		info.alias = "page"
		return info
	}
	
	setDir(v) { this.flexer.setDir(v) }
	
	getDir(v) { return this.flexer.getDir() }
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
            return error("Given child is not a Layout_Element")


        if(index === undefined || !this.children.length) {
            this.root.appendChild(child.root)

            this.children.push(child)
        }
        else {
            if(this.children[index]) {
                index = this.children.length - 1
				$(this.children[index].root).before(child.root)
			}
			else {
				index = this.children.length
				$(this.children[index - 1].root).after(child.root)
			}
			
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
			log(p)
			log(this)
			if(p.getDir() === DIR_ROW) {
				child.root.style.width = root.style.width
				child.root.style.height = ""
			}
			else {
				child.root.style.height = root.style.height
				child.root.style.width = ""
			}
			
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
    }
	
	getLayoutInfo() {
		let o = {
			dir: this.getDir(),
			alias: this.constructor.name.toLowerCase(),
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
	
	/**
		don't overload constructor if possible, use init() instead
	*/
    constructor() {
		
		super()

        var $el = $(".mod-con.draft").clone()

        this.root = $el[0]
		this.body = $el.find(".mod-body")[0]

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
				if(this.constructor.def.alias === def.alias) {
					$(":focus").blur()
					return
				}
				
                $el.find(".mod-sel-list").find(".visible").removeClass("visible")
                $(this).addClass("visible")

                $(":focus").blur()

                this.redefine(def.alias)
            })
        }
		
		$el.find(".mod-move").click(_ => {
			$("#content").addClass("move-mod")

			var _self = this
			
			var fn = function(e) {
				
				let p1 = _self.parent

				let idx1 = p1.getChildIndex(_self),
					w = _self.root.style.width,
					h = _self.root.style.height
				
				let mod2 = getModuleOfBody(this),
					p2 = mod2.parent,
					idx2 = p2.getChildIndex(mod2)
				
				if(idx2 < idx1) {
					_self.parent.unregisterChild(_self)
					p2.registerChild(_self, idx2)
					mod2.parent.unregisterChild(mod2)
					p1.registerChild(mod2, idx1)
				}
				else {
					mod2.parent.unregisterChild(mod2)
					p1.registerChild(mod2, idx1)
					_self.parent.unregisterChild(_self)
					p2.registerChild(_self, idx2)
				}
				
				_self.root.style.width = mod2.root.style.width
				_self.root.style.height = mod2.root.style.height
				
				mod2.root.style.width = w
				mod2.root.style.height = h
				
				execHook("onLayoutChange")
				
				e.stopPropagation()
				$("#content").removeClass("move-mod")
				
				$(".mod-body").each(function() {
					this.removeEventListener("click", fn, true)
				})
			}

			$(".mod-body").each(function() {
				this.addEventListener("click", fn, true)
			})

		})
		
		// create context menu on settings button
		// TODO: imeplement splitters: "<hr style='margin: 3px 5px; border-bottom-width: 0'>"
		this.root.getElementsByClassName("mod-sett")[0].addEventListener("click", (e) => {
			
			let x = e.clientX - e.offsetX,
				y = e.clientY + e.offsetY
			
			let props = this.getBasicMenuProps()
			let props2 = this.getSpecialMenuProps()
			
			if(props2)
				props = props.concat(props2)
			new Contextmenu(x, y, props)
		})
    }
	
	/**
		stub that's called when the module gets initialized
		@param state: data that has been saved according to the getSaveData() method, to restore the recent session
	*/
	init(state) { }

    redefine(modAlias) {
		if(modAlias === this.constructor.def.alias)
			return
		
        var p = this.parent,
			w = this.root.style.width,
			h = this.root.style.height,
			mod = addModule(modAlias)

		p.registerChild(mod, p.getChildIndex(this))
		
        this.close()
		
		mod.root.style.width = w
		mod.root.style.height = h
		
		execHook("onLayoutChange")
    }
	
	/**
		overrideable callback
		return true, will prevent the module from getting closed
	*/
	onClosePrevent() {
		return false
	}
	
	close() {
		// call stub, which might abort closing this module
		if(this.onClosePrevent())
			return false
		
		let par = this.parent
		$(this.root).remove()
		this.parent.unregisterChild(this)
		par.adjustAppearance()
		
		// detach any callbacks of hook-system with reference to this module
		cleanUpHooksOfMdl(this.id)
		// remove global reference
		removeFromModuleList(this)
		
		this.onClose()
		
		return true
	}
	
	/**
		overrideable callback
	*/
	onClose() { }

    addSibling(fVertical) {

        let dir, property
		
		if(fVertical) {
			dir = DIR_COL
			property = "height"
		}
		else {
			dir = DIR_ROW
			property = "width"
		}
		
        let p = this.parent

        if(p.getDir() === dir) {
            let mod = addModule("intro")
            p.registerChild(mod, p.getChildIndex(this) + 1)
			let half = $(this.root)[property]()/2
			mod.root.style[property] = half + "px"
			this.root.style[property] = half + "px"
        }
        else {
            let idx = p.getChildIndex(this)
            let flexer = addFlexer(dir)
			
			let half = $(this.root)[property]()/2
			log(this.root.style[property])
            p.registerChild(flexer, idx)
			
			p.unregisterChild(this)
			
			let mod = addModule("intro")
			flexer.registerChild(this)
			flexer.registerChild(mod)

			mod.root.style[property] = half + "px"
			this.root.style[property] = half + "px"
        }
		
		execHook("onLayoutChange")
    }
	
	getBasicMenuProps() {
		return [
			{
				label: "Close Frame",
				icon: "icon-x-s",
				onclick: () => {
					this.close()
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-v",
				onclick: () => {
					this.addSibling(true)
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-h",
				onclick: () => {
					this.addSibling()
				}
			}
		]
	}
	
	getSpecialMenuProps() {
		return false
	}
	
	isSub() { return false }
	
	getLayoutInfo() {
		return { alias: this.constructor.def.alias, w: this.root.style.width, h: this.root.style.height, state: this.getSaveData() }
	}
	
	getSaveData() {}
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
            return log("Given child is not a layout element")
		
		this.root.getElementsByClassName("mod-body")[0].appendChild(child.root)

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
		
		this.onChildShow(idx)
    }
	
	onChildShow(idx) {}
}

class Layout_SubModule extends Layout_Element {
	constructor() {
		super()
		
		this.root = document.createElement("div")
	}
	
	setup() { }
	
	save() { }
	
	onfocus() { }
	
	isSub() { return true }
	
	
	/**
		callback stub
		returning true, will prevent the module from getting closed
	*/
	onClosePrevent() {
		return false
	}
	
	close() {
		// call stub, which might abort closing this module
		if(this.onClosePrevent())
			return false
		
		$(this.root).remove()
		this.parent.unregisterChild(this)
		this.parent.adjustAppearance()
		
		// detach any callbacks of hook-system with reference to this module
		cleanUpHooksOfMdl(this.id)
		// remove global reference
		removeFromModuleList(this)
		
		this.onClose()
		
		return true
	}
	
	/**
		callback stub
	*/
	onClose() { }
	
	getSaveData() {}
}

var _modules = []
var _modDefs = {}

function defineModule(def) {
	
	if(_modDefs[def.alias])
		error(`mod alias already defined (${def.alias}); registration rejected`)
	
    _modDefs[def.alias] = def
}

var modId = 0
function addModule(modAlias, stateinfo) {

    var def = _modDefs[modAlias]
	
    if(!def || !def.className)
        return error(`addModule: module alias '${modAlias}' not registered.`)

    var mod = new def.className(modId)

    _modules.push(mod)
	
	mod.id = modId++
	
	// initialize module with saved info, if any
	mod.init(stateinfo)
	
    return mod
}

function removeFromModuleList(mod) {
    var a = []

    for(var i = 0; i < _modules.length; i++)
        if(_modules[i] !== mod)
            a.push(_modules[i])
	
    _modules = a
}

var _flexers = []

class Flexer extends Layout_Flex {
	constructor(dir) {
		super()
		
		this.root = $("<div class='flexer'></div>")[0]
		
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

function getModuleOfBody(el) {
	for(let i = 0; i < _modules.length; i++)
		if($(_modules[i].root).find(".mod-body")[0] === el)
			return _modules[i]
}	