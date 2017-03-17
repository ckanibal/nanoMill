/**
	the navigator view shows the opened files;
	you can open and close files by clicking on them
*/
class Navigator extends layout.Module {

	init(state) {
		this.entries = []
		
		hook("onFileOpened", this.insertFileEntry.bind(this), this.modId)
		
		hook("onOpenedFileSelect", (file) => {
			Elem.removeClass(this.root.getElementsByClassName("selected-file")[0])
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === file)
					Elem.addClass(this.entries[i].el, "selected-file")
		}, this.modId)
		
		// TODO: get opened files
		let rList = [] 

		for(let i = 0; i < rList.length; i++)
			if(rList[i].editor)
				this.insertFileEntry(rList[i])
		
		for(let i = 0; i < this.entries.length; i++)
			this.entries[i].el.style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
		
		hook("onCurrEditorSet", (mod, res) => {
			let curr = this.root.getElementsByClassName("current-file")
			if(curr)
				Elem.removeClass(curr, "current-file")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					Elem.addClass(this.entries[i].el, "current-file")
					break
				}
		}, this.modId)
		
		hook("onFileClosed", (res) => {
			let a  = []
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res)
					Elem.remove(this.entries[i].el)
				else
					a.push(this.entries[i])
			
			this.entries = a
		}, this.modId)
		
		hook("onFileChangeStateChange", (res, clean) => {
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					if(clean)
						Elem.removeClass(this.entries[i].el, "unsaved")
					else
						Elem.addClass(this.entries[i].el, "unsaved")
					break
				}
		}, this.modId)
	}
	
	insertFileEntry(file) {
		let dirname = path.basename(path.dirname(file.path))
		
		this.body.insertAdjacentHTML("beforeend", `
			<div class='--NAV-entry'>
				<div class='ALE-label'>
					<div class='--NAV-fdir'>${dirname}/</div>
					${file.name}<span class='unsaved-mark'>*</span>
				</div>
				<div class='--NAV-entry-close flex-col'><div class='icon-x-s'></div></div>
			</div>`)
		
		let el = this.body.lastChild
		el.addEventListener("click", function(e) {
			execHook("onOpenedFileSelect", file)
			e.stopPropagation()
		})
		
		el.lastElementChild.addEventListener("click", function(e) {
			if(file.mod) {
				if(file.mod.close())
					execHook("onFileClosed", file)
			}
			else
				execHook("onFileClosed", file)
			
			e.stopPropagation()
			e.preventDefault()
		})
		
		this.entries.push({ el, file })
	}
}

Navigator.def = {
	alias: "navigator",
	className: Navigator,
	title: "Opened Documents",
}

layout.setModuleDef(Navigator.def)
