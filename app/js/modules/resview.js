


class ResView extends Layout_Module{
	
	constructor(modId) {
		super()
		this.itemWrapper = $("<div class='flex-col'></div>")[0]
		
		$(this.root).find(".mod-body").append(this.itemWrapper)
		
		hook("onResourceAdded", (res) => {
			this.addResLink(res)
		}, modId)
		
		let rList = filemanager.getResourcesCopy()

		for(let i = 0; i < rList.length; i++)
			this.addResLink(rList[i], i)
	}
	
	addResLink(res, styleDelay) {
		var $el = $(`
			<div class='--RESV-entry'>
				<div class='--RESV-fname'>${res.name.substr(0, res.name.length - res.leaf.length)}</div>
				<div class='--RESV-fext'>${res.leaf}</div>
			</div>`)
		$(this.itemWrapper).append($el[0])
		
		$el.dblclick(() => {
			if(!res.editor)
				openFile(res)
			else
				execHook("onOpenedFileSelect", res)
		})
		
		$el[0].style.animation = `list-item-in 0.3s ease-out 0.${styleDelay || 0}s 1 normal both`
	}
}

ResView.def = {
	alias: "resview",
	className: ResView,
	title: "Resources",
}

registerModule(ResView.def)
