const
    DIR_COL = 1,
    DIR_ROW = 2

// id counter for creating a unique identifier for each module
let mdlId = 0

class Layout_Element {
	constructor () {
	}
	
	get isLayoutElement() { return true }
	
	set isLayoutElement(v) {}
	
	getLayoutInfo() {
		return { size: this.parent.dir === DIR_ROW ? this.root.style.width : this.root.style.height }
	}
}

class Layout extends Layout_Element {
	constructor() {
		super()
		
		this.mdls = []
		
		this.children = []
		
		this.flexer = new Flexer(DIR_ROW)
		
		Elem.addClass(this.flexer.root, "flex-fill")
		
		// override functon, to prevent flexer from removing itself, when empty
		this.flexer.adjustAppearance = function() {}
	}
	
	createModule(mdlAlias, stateinfo) {
		let def = getModuleDef(mdlAlias)
		
		if(!def || !def.className)
			return error(`createModule: module alias '${mdlAlias}' not registered.`)

		let mdl = new def.className(mdlId)

		this.mdls.push(mdl)
		mdl.source = this
		
		mdl.id = mdlId++
		
		// initialize module with saved info, if any
		mdl.init(stateinfo)
		
		return mdl
	}
	
	removeFromModuleList(mdl) {
		let a = []
		for(let i = 0; i < this.mdls.length; i++)
			if(this.mdls[i] !== mdl)
				a.push(this.mdls[i])
		
		this.mdls = a
	}
	
	getSaveData() {	
		let pdata = []
		
		for(let i = 0; i < pages.length; i++)
			pdata[i] = pages[i].getLayoutInfo()
		
		return pdata
	}
	
	clear() {
		this.pages = []
		this.flexer = []
		this.mdls = []
		document.getElementById("mod-wrapper").innerHTML = ""
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
	
	get dir() {
		return this.flexer.dir
	}
	
	set dir(v) {
		this.flexer.dir = v
	}
	
	getLayoutInfo() {
		let info = this.flexer.getLayoutInfo(...arguments)
		info.alias = "page"
		return info
	}
	
	setDir(v) { this.flexer.setDir(v) }
	
	getDir() { return this.flexer.getDir() }
	
	getModuleOfBody(el) {
		for(let i = 0; i < _modules.length; i++)
			if(_modules[i].body === el)
				return _modules[i]
	}
	
	static fromData(data) {
		let lyts = []
		let fn = (data, par, lyt) => {
			let propName
			// whitelist modules for additional safety
			// and take care of layout interpretation
			switch(data.alias) {
				case "page":
					lyt = new Layout()
					lyts.push(lyt)
					
					for(let i = 0; i < data.children.length; i++)		
						fn(data.children[i], lyt, lyt)
				break
				case "flexer":
				
					let flexer = new Flexer(data.dir)
					par.registerChild(flexer)
					
					if(data.size && data.size.length !== 0)
						flexer.root.style[par.dir === DIR_ROW ? "width" : "height"] = data.size
					
					for(let i = 0; i < data.children.length; i++)
						fn(data.children[i], flexer, lyt)
				break
				case "editor":
				case "intro":
				case "console":
				case "navigator":
				case "explorer":
					let mod = lyt.createModule(data.alias, data.state)
					if(!mod)
						break
					
					par.registerChild(mod)
					
					if(data.size && data.size.length !== 0)
						mod.root.style[par.dir === DIR_ROW ? "width" : "height"] = data.size
				break
			}
		}
		
		for(let i = 0; i < data.length; i++)
			fn(data[i])
		
		return lyts
	}
}

class Layout_Flex extends Layout_Element {
	
	constructor() {
		super()
		
		this.children = []
		this.canContainChildren = true
	}

    set dir(dir) {
        if(dir === DIR_COL) {
			Elem.addClass(this.root, "flex-col")
			Elem.removeClass(this.root, "flex-row")
		}
        else {
			Elem.addClass(this.root, "flex-row")
			Elem.removeClass(this.root, "flex-col")
		}

        this._dir = dir
    }

    get dir() {
        return this._dir
    }

    registerChild(child, index) {
        if(!child)
            return error("No parameter given for registerChild")
        else if(!child.isLayoutElement)
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
        let a = []

        for(let i = 0; i < this.children.length; i++)
            if(this.children[i] !== mod)
                a.push(this.children[i])

        this.children = a
		
		// save in buffer object
		document.getElementById("mod-buffer").appendChild(mod.root)
		mod.parent = false
		
        this.updateSplitters()
    }
	
	replaceChild(newChild, oldChild) {
		// replace in children array
		for(let i = 0; i < this.children.length; i++)
            if(this.children[i] === oldChild) {
                this.children[i] = newChild
				break
			}
		
		// dereference parent
		oldChild.parent = null
		
		// transfer dimensions
		newChild.root.style.width = oldChild.root.style.width
		newChild.root.style.height = oldChild.root.style.height
		
		// replace root elements in dom tree
		this.root.replaceChild(newChild.root, oldChild.root)
		
		// assign parent to child element
		newChild.parent = this
	}

    adjustAppearance() {
		// remove flexer without children
        if(!this.children.length) {
            this.parent.unregisterChild(this)
			Elem.remove(this.root)
        }
		// when having only a single child, remove the flexer too
		// but apply important properties to the child
		else if(this.children.length === 1) {
			let child = this.children[0]
			let p = this.parent			
			p.replaceChild(child, this)
		}
    }

    getChildIndex(mod) {
        for(let i = 0; i < this.children.length; i++)
            if(this.children[i] === mod)
                return i

        return -1
    }

    updateSplitters() {

        let prev, el = this.root.firstElementChild
		
		if(!el)
			return
		
		if(Elem.hasClass(el, "flex-splitter")) {
			Elem.remove(el)
			el = el.nextSibling
		}
		
		while(el) {
			// if element is not a splitter ...
			if(!Elem.hasClass(el, "flex-splitter")) {
				// ... and previous one hasn't been a splitter too
				if(prev && !Elem.hasClass(prev, "flex-splitter"))
					// insert one in between
					prev.insertAdjacentHTML("afterend", `<div class='flex-splitter'></div>`)
			}
			else if(Elem.hasClass(prev, "flex-splitter")) {
				Elem.remove(el)
				el = prev
			}
			
			prev = el
			el = el.nextElementSibling
		}
		
		if(prev && Elem.hasClass(prev, "flex-splitter"))
			Elem.remove(prev)
    }
	
	getLayoutInfo() {
		let o = {
			dir: this.dir,
			alias: this.constructor.name.toLowerCase(),
			children: []
		}
		
		if(this.parent)
			o.size = this.parent.dir === DIR_ROW ? this.root.style.width : this.root.style.height
		
		for(let i = 0; i < this.children.length; i++)
			o.children.push(this.children[i].getLayoutInfo())
		
		return o
	}
}

class Layout_Module extends Layout_Element {
	
	/**
		don't overload constructor, use init()-callback instead
	*/
    constructor() {
		
		super()

		let el = document.querySelector(".mod-con.draft").cloneNode(true)
		let $el = $(el)
		
        this.root = el
		this.body = el.getElementsByClassName("mod-body")[0]

        log("module created - constructor name: " + this.constructor.def.alias)
		Elem.removeClass(el, "draft")

        for(let item of mdlDefs) {
            let def = item[1]
			
			// submodules are handled differently, the user is not allowed
			// to switch to them manually
            if(def.isSub)
                continue
			
            let entry = Elem.fromString(`<div class='mod-sel-item
				   ${(def.alias === this.constructor.def.alias?" visible":"")}
				   '>${def.title}</div>`)
			
			el.getElementsByClassName("mod-sel-list")[0].appendChild(entry)
			
            entry.addEventListener("click", (e) => {
				// when the type of the current module has been selected, do nothing
				if(this.constructor.def.alias === def.alias) {
					document.activeElement.blur()
					return
				}
				
				Elem.removeClass(el.querySelector(".mod-sel-list .visible"), "visible")
				Elem.addClass(e.target, "visible")
				// blur selection parent element
                document.activeElement.blur()
                this.redefine(def.alias)
            })
        }
		
		$el.find(".mod-move").click(_ => {
			Elem.addClass(document.getElementById("content"), "move-mod")

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
				
				Elem.removeClass(document.getElementById("content"))
				
				let bodies = document.getElementsByClassName("mod-body")
				for(let i = 0; i < bodies.length; i++)
					bodies[i].removeEventListener("click", fn, true)
			}

			let bodies = document.getElementsByClassName("mod-body")
			for(let i = 0; i < bodies.length; i++)
				bodies[i].addEventListener("click", fn, true)

		})
		
		// create context menu on settings button
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
		stub that's invoked when the module gets constructed
		@param state: data that has been saved according to the getSaveData() method, to restore the recent session
	*/
	init(state) {}

    redefine(modAlias) {
		if(modAlias === this.constructor.def.alias)
			return
		
        var p = this.parent,
			w = this.root.style.width,
			h = this.root.style.height,
			mod = this.source.createModule(modAlias)

		p.registerChild(mod, p.getChildIndex(this))
		
        this.close()
		
		mod.root.style.width = w
		mod.root.style.height = h
		
		execHook("onLayoutChange")
    }
	
	/**
		overrideable callback
		@return when true, the closing procedure will be stopped
	*/
	onClosePrevent() { return false }
	
	close() {
		// call stub, which might abort closing this module
		if(this.onClosePrevent())
			return false
		
		let par = this.parent
		Elem.remove(this.root)
		this.parent.unregisterChild(this)
		par.adjustAppearance()
		
		// detach any callbacks of hook-system with reference to this module
		cleanUpHooksOfMdl(this.id)
		this.source.removeFromModuleList(this)
		
		this.onClose()
		
		return true
	}
	
	/**
		overrideable callback when the module gets closed
	*/
	onClose() {}

    addSibling(fVertical) {

        let dir, mainDim, crossDim
		if(fVertical) {
			dir = DIR_COL
			mainDim = "height"
			crossDim = "width"
		}
		else {
			dir = DIR_ROW
			mainDim = "width"
			crossDim = "height"
		}
		
        let p = this.parent
		
		// if the new module has to be positioned
		// in the same direction the parent flexer is laid out
		// just append a new flexer
        if(p.dir === dir) {
            let mod = this.source.createModule("intro")
            p.registerChild(mod, p.getChildIndex(this) + 1)
			let half = this.root.getBoundingClientRect()[mainDim]/2
			mod.root.style[mainDim] = half + "px"
			this.root.style[mainDim] = half + "px"
        }
		// otherwise move this module and the new one
		// into a new flexer with the given direction
        else {
			// remember where to put the flexer
            let idx = p.getChildIndex(this)
            let flexer = new Flexer(dir)
			
			let half = this.root.getBoundingClientRect()[mainDim]/2
			p.registerChild(flexer, idx)
			
			p.unregisterChild(this)
			
			let mod = this.source.createModule("intro")
			flexer.registerChild(this)
			flexer.registerChild(mod)
			
			// split up dimensions across the direction into half
			this.root.style[mainDim] = half + "px"
			
			// clear dimension on cross axis of module
			// but apply it to the flexer
			flexer.root.style[crossDim] = this.root.style[crossDim]
			this.root.style[crossDim] = ""
        }
		
		execHook("onLayoutChange")
    }
	
	getBasicMenuProps() {
		return [
			{
				label: "Close Frame",
				icon: "icon-x-s",
				onvalidate: _ => {
					// do not close if this is the last module shown
					return this.source.flexer.children.length !== 1
				},
				onclick: _ => {
					this.close()
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-v",
				onclick: _ => {
					this.addSibling(true)
				}
			},
			{
				label: "Add Frame",
				icon: "icon-add-flex-h",
				onclick: _ => {
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
		return {
			alias: this.constructor.def.alias,
			size: this.parent.dir === DIR_ROW ? this.root.style.width : this.root.style.height,
			state: this.getSaveData()
		}
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
        else if(!child.isLayoutElement)
            return log("Given child is not a layout element")
		
		this.body.appendChild(child.root)
		
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
	
	save() {}
	
	onfocus() {}
	
	isSub() { return true }
	
	setup() {}
	
	/**
		callback stub
		returning true, will prevent the module from getting closed
	*/
	onClosePrevent() { return false }
	
	close() {
		// call stub, which might abort closing this module
		if(this.onClosePrevent())
			return false
		
		Elem.remove(this.root)
		let par = this.parent
		par.unregisterChild(this)
		
		// detach any callbacks of hook-system with reference to this module
		cleanUpHooksOfMdl(this.id)
		layout.removeFromModuleList(this)
		
		this.onClose()
		
		return true
	}
	
	/**
		callback stub
	*/
	onClose() {}
	
	getSaveData() {}
}

class Flexer extends Layout_Flex {
	constructor(dir) {
		super()
		
		// construct root element
		this.root = document.createElement("div")
		this.root.className = "flexer"
		
		// set direction of the flex layout
		this.dir = dir
	}
}

let mdlDefs = new Map()

function setModuleDef(def) {
	if(mdlDefs.has(def.alias))
		warn(`mod alias already defined (${def.alias}); registration rejected`)
	
	mdlDefs.set(def.alias, def)
}

function getModuleDef(alias) {
	return mdlDefs.get(alias)
}

/*
	handle moduleframe resizing when dragging splitters
*/
let mouseX = 0, mouseY = 0
let mouseOffX, mouseOffY, dragSplitterTarget, origDim
{
    document.addEventListener('mousedown', function(e) {
		if(!Elem.hasClass(e.target, "flex-splitter"))
			return
		
		dragSplitterTarget = e.target
		
        let fn = function() {
            if(!dragSplitterTarget)
                return
			
            if(Elem.hasClass(dragSplitterTarget.parentNode, "flex-col"))
                dragSplitterTarget.previousElementSibling.style.height =
                        origDim + mouseY - mouseOffY + "px"
            else
                dragSplitterTarget.previousElementSibling.style.width =
                        origDim + mouseX - mouseOffX + "px"

            requestAnimationFrame(fn)
        }
		
		Elem.addClass(dragSplitterTarget, "dragged")

        mouseOffX = mouseX
        mouseOffY = mouseY

		let prev = dragSplitterTarget.previousSibling
        
		if(Elem.hasClass(dragSplitterTarget.parentNode, "flex-row")) {
			let rect = prev.getBoundingClientRect()
			origDim = rect.width
            prev.style.width = origDim + "px"
		}
		else {
			let rect = prev.getBoundingClientRect()
			origDim = rect.height
            prev.style.height = origDim + "px"
		}
		
		Elem.removeClass(prev, "flex-fill")

        requestAnimationFrame(fn)

        e.preventDefault()
        e.stopPropagation()
    })

	// track mouse position
	document.addEventListener("mousemove", (e) => {
		mouseX = e.clientX
        mouseY = e.clientY
	})

	// stop dragging splitters
	document.addEventListener("mouseup", (e) => {
		if(dragSplitterTarget) {
			$(dragSplitterTarget).removeClass("dragged")
			
			execHook("onLayoutChange")
		}
		
        dragSplitterTarget = false
	})
}

module.exports = {
	Layout: Layout,
	Module: Layout_Module,
	SubModule: Layout_SubModule,
	Deck: Layout_Deck,
	setModuleDef,
	DIR_COL,
	DIR_ROW
}