class Explorer extends Layout_Module {
	
	constructor(modId) {
		super()
		
		// entry wrapper
		//this.itemWrapper = $("<div class='flex-col'></div>")[0]
		//$(this.root).find(".mod-body").append(this.itemWrapper)
		
		// relative to index.html
		// this.tree = new require('./js/lib/tree-list.js')
		
		let wspaces = wmaster.getWorkspaces()
		
		// if no workspaces set, show button to create one
		if(!wspaces.length) {
			// create parent object that fills the module body
			let p = $(`<div class="abs-fill flex-col" style="justify-content: center"></div>`)
			$(this.body).append(p)
			
			// add desc/button to it
			let el = $(`<div style="align-self: center">No workspace targeted,<br>click to add one.</div>`)[0]
			
			el.onclick = this.modalNewWorkspace.bind(this)
			p.append(el)
		}
	}
	
	showWorkspace(wspace) {
		// remove contenet
		$(this.root).html("")
		
	}
	
	readDirectory() {
		return;
		let callback = (list) => {
			// convert byteStream to string
			list = list.toString()
			log(list)
		}
		
		_fs.readdir(this.tpath, (err, files) => {
			if(err) {
				error( "Could not list the directory.", err )
				return
			}
			
			for(let i = 0; i < files.length; i++) {
				
				if(!Explorer.isEditableExt(path.extname(files[i])))
					continue
				
				let p = path.join(this.tpath, files[i])
				
				_fs.stat(p, (err, stat) => {
					if(err)
						error(`Failed to read explorer object (${err})\n${p}`)
					else {
						Explorer.getDefinitionList(p, callback)
					}
				})
			}
		})
	}
	
	addResLink(res, styleDelay) {
		/*
		if(resIsEditable(res) && false) {
			return
		}
		
		var $el = $(`
			<div class='--RESV-entry' tabindex='5'>
				<div class='--RESV-label flex-row flex-fill'>
					<div class='--RESV-fdir'>${path.basename(res.dirName)}/</div>
					<div class='--RESV-fname'>${res.name.substr(0, res.name.length - res.leaf.length)}</div>
					<div class='--RESV-fext'>${res.leaf}</div>
					<div class='flex-fill'></div>
				</div>
				<div class='--RESV-entry-close flex-col'><div class='icon-x-s'></div></div>
			</div>`)
		$(this.itemWrapper).append($el[0])
		
		if(_focussedRes === res)
			$el.addClass("focussed")
		
		$el.dblclick(() => {
			if(!res.editor) {
				openFile(res)
				
				if(res.leaf === ".ocs")
					RuntimeInterface.interpretCommand("run --sel")
			}
			else
				execHook("onOpenedFileSelect", res)
		})
		
		$el.find(".--RESV-entry-close").click((e) => {
			if(res.mod) {
				if(res.mod.requestClose()) {
					res.mod.performClose()
					execHook("onFileClosed", res)
					this.dropResource(res)
				}
			}
			else {
				execHook("onFileClosed", res)
				this.dropResource(res)
			}
			
			e.stopPropagation()
			e.preventDefault()
		})
		
		$el.focus((e) => {
			if($(this.root).find(".focussed")[0] === e.target)
				return
			
			execHook("onResFocus", res)
		})
		
		$el[0].style.animation = `list-item-in 0.3s ease-out 0.${styleDelay || 0}s 1 normal both`
		
		this.entries.push({$el, res})*/
	}
	
	dropResource(res) {
		/*
		let a = []
		
		for(let i = 0; i < this.entries.length; i++)
			if(this.entries[i].res === res) {
				this.entries[i].$el.remove()
				this.entries[i].res = null
			}
			else
				a.push(this.entries[i])
		
		this.entries = a
		
		filemanager.dropResource(res)
		*/
	}
	
	modalNewWorkspace() {
		let $el = $(`<div><p class="desc">Select workspace directory</p>
		<p class="desc">suggest directories...</p>
		<div class="confirm-modal"><label>Confirm</label></div></div>`)
		
		let url = ui.urlPicker(undefined, () => {
			$el.find(".confirm-modal")[0].dataset.url
		})
		
		$el.find(".desc").eq(0).after(url)
		
		let exp = this
		$el.find(".confirm-modal").click(function() {
			let ws = wmaster.addWorkspace(this.dataset.url)
			exp.showWorkspaceContent(ws)
			hideModal()
		})
		
		showModal("Select working space", $el[0])
	}
	
	showWorkspaceContent(ws) {
		// keep reference
		this.wspace = ws
		
		// if workspace is yet to be loaded, do nothing at let hook callbacks do the job
		if(!ws.loaded)
			return
	}
	
	static isEditableExt(ext) {log(ext)
		switch(ext) {
			case ".ocf":
			case ".ocd":
			case ".ocg":
			case ".ocs":
			case ".txt":
			case ".glsl":
				return true;
			default:
				return false;
		}
	}
	
	static getDefinitionList(path, callback) {
		let proc = cprocess.spawn(getConfig("c4group"), [path, "-l"])
		proc.stdout.on('data', callback)
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