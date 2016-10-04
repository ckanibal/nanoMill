


class Navigator extends Layout_Module {

	constructor(modId) {
		super()
		
		this.entries = []
		
		hook("onFileOpened", this.insertFileEntry.bind(this), modId)
		
		hook("onOpenedFileSelect", (file) => {
			$(this.root).find(".selected-file").removeClass("selected-file")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].file === file)
					this.entries[i].$el.addClass("selected-file")
		}, modId)
		
		let rList = filemanager.getResourcesCopy()

		for(let i = 0; i < rList.length; i++)
			if(rList[i].editor)
				this.insertFileEntry(rList[i])
		
		for(let i = 0; i < this.entries.length; i++)
			this.entries[i].$el[0].style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
	}
	
	insertFileEntry(file) {
		var $root = $(this.root)

		var $el = $(`<div class='--NAV-entry'><div class='ALE-label'>${file.name}<span class='unsaved-mark'>*</span></div>
					<div class='--NAV-entry-close flex-col'><div class='icon-x-s'></div></div></div>`)

		$root.find(".mod-body").append($el[0])

		$el.click(function(e) {
			execHook("onOpenedFileSelect", file)
			e.stopPropagation()
		})

		$el.find(".--NAV-entry-close").click(function(e) {
			e.stopPropagation()
			e.preventDefault()
			execHook("closeOpenedFile", file)
		})
		
		this.entries.push({ $el, file })
	}
}

Navigator.def = {
	alias: "navigator",
	className: Navigator,
	title: "Opened Documents",
}

registerModule(Navigator.def)
