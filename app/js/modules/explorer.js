	
class Explorer extends layout.Module {
	init(state) {
		this.body.style.overflowY = "auto"
		// restore workspace from saved index of the previous session
		if(state && state.workspace !== -1 && wmaster.getWorkspace(state.workspace))
			this.setWorkspace(wmaster.getWorkspace(state.workspace))
		// otherwise offer to select one
		else {
			let wspaces = wmaster.getWorkspaces()
			
			// if no workspaces set, show button to create one
			if(!wspaces.length) {
				// create parent object that fills the module body
				this.body.insertAdjacentHTML('beforeEnd', `<div class="abs-fill flex-col" style="justify-content: center"></div>`)
				
				// add desc/button to it
				let p = this.body.lastChild
				p.insertAdjacentHTML('beforeEnd', `<div style="align-self: center; text-align: center">No workspace targeted,<br>click to add one.</div>`)
				p.lastChild.onclick = this.modalNewWorkspace.bind(this)
			}
		}
		
		this.hookIn("onWorkspaceLoad", (wspace) => {
			if(this.wspace === wspace)
				this.showWorkspace(wspace)
		})
		
		this.hookIn("onWorkspaceChange", (wspace) => {
			if(this.wspace === wspace)
				this.showWorkspace(wspace)
		})
		
		// holds the selected items from the workspace representation
		this.selected = []
		// the currently active(or most recently selected) item
		this.activeItem = null
	}
	
	selectItem(item, multiSelect) {
		if(!multiSelect)
			this.deselectItems()
		
		this.selected.push(item)
		
		Elem.addClass(item, "tree-selected")
		
		// update active item
		if(this.activeItem)
			Elem.removeClass(this.activeItem, "tree-active")
		
		this.activeItem = item
		Elem.addClass(item, "tree-active")
	}
	
	deselectItem(item) {
		// recreate select array without the targeted item
		let a = []
		for(let i = 0; i < this.selected.length; i++)
			if(this.selected[i] !== item)
				a.push(this.selected[i])
		
		this.selected = a
		
		Elem.removeClass(item, "tree-selected")
		
		// if the item was active set it to the most recent element
		if(Elem.hasClass(item, "tree-active")) {
			Elem.removeClass(item, "tree-active")
			
			if(this.selected.length) {
				let active = this.selected[this.selected.length - 1]
				Elem.addClass(active, "tree-active")
				this.activeItem = active
			}
			else
				this.activeItem = null
		}
	}
	
	getSelectedItems() {
		
	}
	
	deselectItems() {
		for(let i = 0; i < this.selected.length; i++)
			Elem.removeClass(this.selected[i], "tree-selected")
		
		this.selected = []
		
		if(this.activeItem)
			Elem.removeClass(this.activeItem, "tree-active")
		this.activeItem = null
	}
	
	setWorkspace(wspace) {
		this.wspace = wspace
	}
	
	showWorkspace(wspace) {
		let expanded = []
		let selectedOld = []
		let oldScroll = 0
		// if we simply update the set workspace, store information 
		// to restore expanded and selected classes afterwards.
		// identify the elements by their value of file index
		if(this.wspace === wspace) {
			let items = this.body.getElementsByClassName("tree-item")
			for(let i = 0; i < items.length; i++) {
				let item = items[i]
				if(!Elem.hasClass(item, "tree-collapsed"))
					expanded[item.dataset.value] = true
				
				if(Elem.hasClass(item, "tree-selected"))
					selectedOld[item.dataset.value] = true
			}
			
			// remember scroll position
			oldScroll = this.body.scrollTop
		}
		
		// clear content
		this.body.innerHTML = null
		
		let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))
		
		// ignore root element and paste children as html tree lists
		let branches = wspace.tree.children
		for (var i = 0; i < branches.length; i++)
			this.body.appendChild(LinkedTree.toHtmlList(branches[i], idx => {
				// get file name form workspace file info holder
				let name = wspace.finfo[idx].name
				// wrap span around extension
				return name.replace(/(\.[^.]+?$)/, `<span style="color: grey">$1</span>`)
			}, 'dblclick'))
		
		
		let items = this.body.getElementsByClassName("tree-label")
		// reset internal selected holder, will be updated below
		this.selected = []
		
		// restore state and bind event handlers
		for(let i = 0; i < items.length; i++) {
			let item = items[i]
			// restore state for previously expanded...
			let par = item.parentNode
			if(expanded[par.dataset.value])
				Elem.removeClass(par, "tree-collapsed")
			// ...and select items
			if(selectedOld[par.dataset.value])
				this.selectItem(par, true)
			
			// select on single click
			item.addEventListener("click", (e) => {
				if(Elem.hasClass(par, "tree-selected") && e.ctrlKey)
					this.deselectItem(par)
				else
					this.selectItem(par, e.ctrlKey)
			})
			
			// open editable files; expand/collapse directories on dblclick
			item.addEventListener("dblclick", (e) => {
				// get file index
				let index = item.parentNode.dataset.value
				let finfo = this.wspace.finfo[index]
				
				if(Elem.hasClass(item.parentNode, "tree-parent"))
					return
				
				if(extIsEditable(finfo.ext))
					this.wspace.openFile(index)
			})
			
			// attach contextmenu on right click
			item.addEventListener("contextmenu", (e) =>  {
				this.selectItem(par, false)
				new Contextmenu(e.pageX, e.pageY, this.getTreeMenuProps(item))
			})
		}
		
		// restore scroll position
		this.body.scrollTop = oldScroll
		
		this.setWorkspace(wspace)
	}
	
	modalNewWorkspace() {
		let el = Elem.fromString(`<div><p class="desc">Select workspace directory</p>
		<p class="desc">suggest directories...</p>
		<div class="confirm-modal"><label>Confirm</label></div></div>`)
		
		let url = ui.urlPicker(undefined, (p) => {
			el.getElementsByClassName("confirm-modal")[0].dataset.valid = p
		})
		
		Elem.after(el.getElementsByClassName("desc")[0], url)
		
		let exp = this
		el.getElementsByClassName("confirm-modal")[0].addEventListener("click", function(e) {
			if(!this.dataset.valid)
				return
			
			let ws = wmaster.addWorkspace(this.dataset.valid)
			exp.setWorkspace(ws)
			
			// display loading indicator
			exp.body.innerHTML = `<div class="abs-fill flex-col" style="justify-content: center"><div style="align-self: center">...</dib></div>`
			hideModal()
		})
		
		showModal("Select working space", el)
	}
	
	getTreeMenuProps(el) {
		let props = []
		
		// get file info from workspace
		// explicit parse as integer, for the linked tree compares with ===
		let findex = parseInt(el.parentNode.dataset.value)
		let finfo = this.wspace.finfo[findex]
		
		// add run option for scenarios
		if(finfo.ext === ".ocs")
			props.push({
				label: "Run",
				icon: "icon-play",
				onclick: _ => runOCEditor([finfo.path]),
				onvalidate: _ => hasExecutable()
			})
		
		props.push({
			label: "New file",
			icon: "icon-plus",
			onclick: _ => {
				// the path where to place the file
				let tpath
				
				let findex = -1
				// if the element itself is a directory, create new file in it
				if(Elem.hasClass(el, "tree-parent")) {
					findex =  parseInt(el.dataset.value)
					tpath = this.wspace.finfo[findex].path
				}
				// otherwise locate the new file in the directory where this file is, respecting root element
				else {
					let par = el.parentNode.parentNode
					if(Elem.hasClass(par, "tree-parent")) {
						findex =  parseInt(el.dataset.value)
						tpath = this.wspace.finfo[findex].path
					}
					else
						tpath = this.wspace.path
				}
				
				openDialog("newfile.js", 450, 300, tpath, (result) => {
					// if(result === true) update wspace...
				})
			}
		})
		
		// add unpack/pack commands
		if(Explorer.isOcPackable(finfo.ext)) {
			props.push({
				label: "Pack",
				icon: "icon-pack",
				onclick: _ => { this.wspace.packFile(findex) },
				onvalidate: _ => hasC4group() && finfo.stat.isDirectory()
			})
			props.push({
				label: "Unpack",
				icon: "icon-unpack",
				onclick: () => { this.wspace.unpackFile(findex) },
				onvalidate: _ => hasC4group() && !finfo.stat.isDirectory()
			})
		}
		
		props.push({
			label: "Rename",
			icon: "icon-pencil",
			onclick: () => {
				openDialog("rename.js", 400, 200, finfo.name, (result) => {
					// check for valid file name
					if(result && typeof result === "string" && result !== finfo.name)
						this.wspace.renameFile(findex, result)
				})
			}
		})
		
		props.push({
			label: "Delete",
			icon: "icon-trashbin",
			onclick: _ => {this.wspace.unlinkFile(findex)}
		})
		
		return props
	}
	
	getSpecialMenuProps() {
		
		let sub_sel = []
		
		let workspaces = wmaster.getWorkspaces()
		for(let i = 0; i < workspaces.length; i++) {
			sub_sel.push({
				label: workspaces[i].getName(),
				onclick: _ => this.showWorkspace(workspaces[i])
			})
		}
		
		return [
			{
				label: "New file",
				icon: "icon-plus",
				onclick: _ => {					
					openDialog("newfile.js", 450, 300, this.wspace.path, (result) => {
						// if(result === true) update wspace...
					})
				}
			},
			{
				label: "New workspace",
				icon: "icon-add-workspace",
				onclick: _ => {
					this.modalNewWorkspace()
				}
			},
			{
				label: "Select workspace",
				icon: "icon-workspace",
				submenu: sub_sel,
				onvalidate: _ => {
					// only allow access if there are any workspaces
					return !!wmaster.getWorkspaces().length
				}
			}
		]
	}
	
	getSaveData() {
		return {workspace: wmaster.getIndexOf(this.wspace)}
	}
	
	/**
	*/
	static isOcPackable(ext) {
		if( ext === ".ocs" || 
			ext === ".ocd" ||
			ext === ".ocf" ||
			ext === ".ocg")
			return true
		
		return false
	}
}

Explorer.def = {
	alias: "explorer",
	className: Explorer,
	title: "Explorer",
}

layout.setModuleDef(Explorer.def)