	
class Explorer extends Layout_Module {
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
		
		hook("onWorkspaceLoad", (wspace) => {
			if(this.wspace === wspace)
				this.showWorkspace(wspace)
		}, this.modId)
		
		hook("onWorkspaceChange", (wspace) => {
			if(this.wspace === wspace)
				this.showWorkspace(wspace)
		}, this.modId)
		
		this.selected = []
	}
	
	selectItem(item, multiSelect) {
		if(!multiSelect)
			this.deselectItems()
		
		this.selected.push(item)
		
		Elem.addClass(item, "tree-selected")
	}
	
	getSelectedItems() {
		
	}
	
	deselectItems() {
		for(let i = 0; i < this.selected.length; i++)
			Elem.removeClass(this.selected[i], "tree-selected")
		
		this.selected = []
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
				new Contextmenu(e.pageX, e.pageY, this.getTreeMenuProps(item))
			})
		}
		
		// restore scroll position
		this.body.scrollTop = oldScroll
		
		this.setWorkspace(wspace)
	}
	
	modalNewWorkspace() {
		let $el = $(`<div><p class="desc">Select workspace directory</p>
		<p class="desc">suggest directories...</p>
		<div class="confirm-modal"><label>Confirm</label></div></div>`)
		
		let url = ui.urlPicker(undefined, (p) => {
			$el.find(".confirm-modal")[0].dataset.valid = p
		})
		
		$el.find(".desc").eq(0).after(url)
		
		let exp = this
		$el.find(".confirm-modal").click(function() {
			if(!this.dataset.valid)
				return
			
			let ws = wmaster.addWorkspace(this.dataset.valid)
			exp.setWorkspace(ws)
			
			// display loading indicator
			exp.body.innerHTML = `<div class="abs-fill flex-col" style="justify-content: center"><div style="align-self: center">...</dib></div>`
			hideModal()
		})
		
		showModal("Select working space", $el[0])
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
				icon: "icon-plus",
				onclick: _ => runOCEditor([finfo.path]),
				onvalidate: _ => hasExecutable()
			})
			
		// add unpack/pack commands
		if(Explorer.isOcPackable(finfo.ext)) {
			props.push({
				label: "Pack",
				icon: "icon-plus",
				onclick: _ => { this.wspace.packFile(findex) },
				onvalidate: _ => hasC4group() && finfo.stat.isDirectory()
			})
			props.push({
				label: "Unpack",
				icon: "icon-plus",
				onclick: () => { this.wspace.unpackFile(findex) },
				onvalidate: _ => hasC4group() && !finfo.stat.isDirectory()
			})
		}
		
		props.push({
			label: "Rename",
			icon: "icon-plus",
			onclick: () => {
				let win = new remote.BrowserWindow({parent: remote.getCurrentWindow(), modal: true})
				log("asd")
			}
		})
		
		props.push({
			label: "Delete",
			icon: "icon-plus",
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
					require(path.join(__rootdir, "js/template_modal.js")).show()
				}
			},
			{
				label: "New workspace",
				icon: "icon-plus",
				onclick: _ => {
					this.modalNewWorkspace()
				}
			},
			{
				label: "Select workspace",
				icon: "icon-plus",
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

defineModule(Explorer.def)