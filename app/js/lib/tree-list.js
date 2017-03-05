
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
		this._entries = []
	}
	
	addItem(par) {
		
		// if no parent object given, add entry on top level
		if(!par)
			par = this.wrapper
		
		let item = new TreeItem("entry")
		
		this._entries.push(item)
		
		
	}
}

class TreeItem {
	constructor(title) {
		this.el = $('<div>${title}</div>')[0]
	}
}


module.exports = TreeList