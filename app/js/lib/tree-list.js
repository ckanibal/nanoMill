
class TreeList {
	constructor(el) {
		
		if(!el)
			throw new Error("TreeList initiation failed, no wrapper object given.")
		
		this.wrapper = el
		
		// seize callbacks with an empty functionality
		let nofn = _ => {}
		
		this.onAddItem = nofn
		this.onRemoveItem = nofn
		this.onExpandItem = nofn
		
		// entry holder
		this.roots = []
	}
	
	addRoot() {
		let item = new TreeItem("entry")
		
		this.root.push(item)
		
		return root
	}
	
	static createItem(title = "unnamed") {
		return new TreeItem(title)
	}
}

class TreeItem {
	constructor(title) {
		this.el = $(`<div>${title}</div>`)[0]
	}
	
	addChild() {
		// if no children yet, create array and mark as parent
		if(!this.children)
			this.children = []
		
		$(this.el).addClass("--tree-par")
	}
}


module.exports = TreeList