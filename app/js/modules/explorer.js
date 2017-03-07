class Explorer extends Layout_Module {
	
	constructor(modId) {
		super()
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
		
		hook("onWorkspaceLoad", (wspace) => {
			if(this.wspace === wspace)
				this.showWorkspace(wspace)
		}, modId)
	}
	
	showWorkspace(wspace) {
		// clear content
		this.body.innerHTML = null
		
		let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))
		
		this.body.appendChild(LinkedTree.toHtmlList(wspace.tree))
	}
	
	showWorkspaceContent(ws) {
		// keep reference
		this.wspace = ws
		
		// if workspace is yet to be loaded, do nothing at let hook callbacks do the job
		if(!ws.loaded)
			return
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
			exp.showWorkspaceContent(ws)
			
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
					ResView.showModal()
				}
			},
			{
				label: "New workspace",
				icon: "icon-plus",
				fn: _ => {
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
}

Explorer.def = {
	alias: "explorer",
	className: Explorer,
	title: "Explorer",
}

registerModule(Explorer.def)