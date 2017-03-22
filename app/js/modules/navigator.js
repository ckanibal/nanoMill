/**
	the navigator view shows the opened files;
	you can open and close files by clicking on them
*/
class Navigator extends layout.Module {

	init(state) {
		this.entries = []
		
		this.hookIn("onFileOpened", this.insertFileEntry.bind(this))
		
		this.hookIn("onOpenedFileSelect", (file) => {
			let old = this.root.getElementsByClassName("selected-file")[0]
			if(old)
				Elem.removeClass(old)
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === file)
					Elem.addClass(this.entries[i].el, "selected-file")
		})
		
		// TODO: get opened files
		let finfos = wmaster.getOpenedFiles()

		for(let i = 0; i < finfos.length; i++)
			if(finfos[i].editor)
				this.insertFileEntry(finfos[i])
		
		for(let i = 0; i < this.entries.length; i++)
			this.entries[i].el.style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
		
		this.hookIn("onCurrEditorSet", (mod, res) => {
			let curr = this.root.getElementsByClassName("current-file")[0]
			if(curr)
				Elem.removeClass(curr, "current-file")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					Elem.addClass(this.entries[i].el, "current-file")
					break
				}
		})
		
		this.hookIn("onFileClosed", (finfo) => {
			let a  = []
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === finfo)
					Elem.remove(this.entries[i].el)
				else
					a.push(this.entries[i])
			
			this.entries = a
		})
		
		this.hookIn("onFileChangeStateChange", (res, clean) => {
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					if(clean)
						Elem.removeClass(this.entries[i].el, "unsaved")
					else
						Elem.addClass(this.entries[i].el, "unsaved")
					break
				}
		})
	}
	
	insertFileEntry(file) {
		let dirname = path.basename(path.dirname(file.path))
		
		this.body.insertAdjacentHTML("beforeend", 
			`<div class='--NAV-entry'>
				<div class='ALE-label'>
					<div class='--NAV-fdir'>${dirname}/</div>
					${file.name}<span class='unsaved-mark'>*</span>
				</div>
				<div class='--NAV-entry-close flex-col'><div class='icon-x-s'></div></div>
			</div>`)
		
		let el = this.body.lastChild
		el.addEventListener("click", function(e) {
			hook.exec("onOpenedFileSelect", file)
			e.stopPropagation()
		})
		
		el.lastElementChild.addEventListener("click", function(e) {
			if(file.mod) {
				if(file.mod.close())
					hook.exec("onFileClosed", file)
			}
			else
				hook.exec("onFileClosed", file)
			
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
