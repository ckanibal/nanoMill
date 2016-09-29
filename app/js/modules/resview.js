


class ResView extends Layout_Module{
	
	constructor() {
		super()
		this.itemWrapper = $("<div class='flex-col'></div>")[0]
		
		$(this.root).find(".mod-body").append(this.itemWrapper)
		
		hook("onResourceAdded", (file) => {
			this.addResLink(file)
		})
	}
	
	addResLink(file) {
		var $el = $("<div class='--RESV-entry'>"+file.name+"</div>")
		$(this.itemWrapper).append($el[0])
	}
}

ResView.def = {
	alias: "resview",
	className: ResView,
	title: "Resources",
}

registerModule(ResView.def)
