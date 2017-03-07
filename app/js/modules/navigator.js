


class Navigator extends Layout_Module {

	init(state) {
		this.entries = []
		
		hook("onFileOpened", this.insertFileEntry.bind(this), this.modId)
		
		hook("onOpenedFileSelect", (file) => {
			$(this.root).find(".selected-file").removeClass("selected-file")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === file)
					this.entries[i].$el.addClass("selected-file")
		}, this.modId)
		
		let rList = filemanager.getResourcesCopy()

		for(let i = 0; i < rList.length; i++)
			if(rList[i].editor)
				this.insertFileEntry(rList[i])
		
		for(let i = 0; i < this.entries.length; i++)
			this.entries[i].$el[0].style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
		
		hook("onCurrEditorSet", (mod, res) => {
			$(this.root).find(".current-file").removeClass("current-file")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					this.entries[i].$el.addClass("current-file")
					break;
				}
		}, this.modId)
		
		hook("onFileClosed", (res) => {
			let a  = []
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res)
					this.entries[i].$el.remove()
				else
					a.push(this.entries[i])
			
			this.entries = a
		}, this.modId)
		
		hook("onFileChangeStateChange", (res, clean) => {
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === res) {
					if(clean)
						this.entries[i].$el.removeClass('unsaved')
					else
						this.entries[i].$el.addClass('unsaved')
					break;
				}
		}, modId)
	}
	
	insertFileEntry(file) {
		var $root = $(this.root)

		var $el = $(`
			<div class='--NAV-entry'>
				<div class='ALE-label'>
					<div class='--NAV-fdir'>${path.basename(file.dirName)}/</div>
					${file.name}<span class='unsaved-mark'>*</span>
				</div>
				<div class='--NAV-entry-close flex-col'><div class='icon-x-s'></div></div>
			</div>`)

		$root.find(".mod-body").append($el[0])

		$el.click(function(e) {
			execHook("onOpenedFileSelect", file)
			e.stopPropagation()
		})

		$el.find(".--NAV-entry-close").click(function(e) {
			if(file.mod) {
				if(file.mod.requestClose()) {
					file.mod.performClose()
					execHook("onFileClosed", file)
				}
			}
			else
				execHook("onFileClosed", file)
			
			e.stopPropagation()
			e.preventDefault()
		})
		
		this.entries.push({ $el, file })
	}
	
	getEntryByFile(file) {
		for(let i = 0; i < this.entries.length; i++)
			if(this.entries[i].file === file)
				return this.entries[i]
		
		return -1
	}
}

Navigator.def = {
	alias: "navigator",
	className: Navigator,
	title: "Opened Documents",
}

defineModule(Navigator.def)
