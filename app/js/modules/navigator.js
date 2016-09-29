


class Navigator extends Layout_Module {

	constructor() {
		super()
		
		hook("onFileOpened", this.insertFileEntry.bind(this))
		
		let rList = filemanager.getResourcesCopy()

		rList.map(this.insertFileEntry, this)
	}
	
	insertFileEntry(file) {
		var $root = $(this.root)

		var $el = $(`<div class='--NAV-entry'><div class='ALE-label'>${file.name}</div>
					<div class='--NAV-entry-close flex-col'><div class='icon-x-s'></div></div></div>`)

		$root.find(".mod-body").append($el[0])

		$el.click(function(e) {
			execHook("onOpenedFileSelect", file)
			e.stopPropagation()
		})

		$el.find(".--NAV-entry-close").click(function(e) {
			execHook("closeOpenedFile", file)
			e.stopPropagation()
		})
	}
}

Navigator.def = {
	alias: "navigator",
	className: Navigator,
	title: "Opened Documents",
}

registerModule(Navigator.def)
