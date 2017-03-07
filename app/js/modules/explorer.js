class Explorer extends Layout_Module {
	
	init(state) {
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
	}
	
	setWorkspace(wspace) {
		this.wspace = wspace
	}
	
	showWorkspace(wspace) {
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
		
		// bind double click behaviour to it
		let items = this.body.getElementsByClassName("tree-label")
		
		for(let i = 0; i < items.length; i++) {
			items[i].addEventListener("dblclick", (e) => {
				// get file index
				let index = e.target.parentNode.dataset.value
				let finfo = this.wspace.finfo[index]
				
				if(finfo.stat.isDirectory())
					return
				
				if(extIsEditable(finfo.leaf))
					this.wspace.openFile(index)
			})
		}
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
	
	getSpecialMenuProps() {
		return [
			{
				label: "New...",
				icon: "icon-plus",
				fn: _ => {
					$(":focus").blur()
					require(path.join(__rootdir, "js/template_modal.js")).show()
				}
			},
			{
				label: "New workspace",
				icon: "icon-plus",
				fn: _ => {
					this.modalNewWorkspace()
					$(":focus").blur()
				}
			},
			{
				label: "Change workspace",
				icon: "icon-plus",
				fn: _ => {
					$(":focus").blur()
				}
			}
		]
	}
	
	getSaveData() {
		return {workspace: wmaster.getIndexOf(this.wspace)}
	}
}


class FileTree {
	constructor(tree) {
	}
}

Explorer.def = {
	alias: "explorer",
	className: Explorer,
	title: "Explorer",
}

defineModule(Explorer.def)