class ResView extends Layout_Module {
	
	constructor(modId) {
		super()
		this.itemWrapper = $("<div class='flex-col'></div>")[0]
		
		this.entries = []
		
		$(this.root).find(".mod-body").append(this.itemWrapper)
		
		hook("onResourceAdded", (res) => {
			this.addResLink(res)
		}, modId)
		
		let rList = filemanager.getResourcesCopy()

		for(let i = 0; i < rList.length; i++)
			this.addResLink(rList[i], i)
		
		hook("onResFocus", (res) => {
			$(this.root).find(".focussed").removeClass("focussed")
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].res === res) {
					this.entries[i].$el.addClass('focussed')
					return
				}
		}, modId)
	}
	
	addResLink(res, styleDelay) {
		
		if(resIsEditable(res) && false) {
			return
		}
		
		var $el = $(`
			<div class='--RESV-entry' tabindex='5'>
				<div class='--RESV-fname'>${res.name.substr(0, res.name.length - res.leaf.length)}</div>
				<div class='--RESV-fext'>${res.leaf}</div>
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
		
		$el.focus((e) => {
			if($(this.root).find(".focussed")[0] === e.target)
				return
			
			execHook("onResFocus", res)
		})
		
		$el[0].style.animation = `list-item-in 0.3s ease-out 0.${styleDelay || 0}s 1 normal both`
		
		this.entries.push({$el, res})
	}
	
	static getCurrent() {
		return _focussedRes
	}
	
	static getCurrentPath() {
		return _focussedRes?_focussedRes.path:""
	}
	
	static showModal() {
		require(path.join(__rootdir, "js/template_modal.js")).show()
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
			}
		]
	}
}

ResView.def = {
	alias: "resview",
	className: ResView,
	title: "Linked resources",
}

registerModule(ResView.def)