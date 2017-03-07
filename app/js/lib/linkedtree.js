
class LinkedTree {
	constructor(val) {
		this.value = val
	}
	
	addChild(child) {		
		if(!this.children)
			this.children = []
		
		this.children.push(child)
		
		return child
	}
	
	get firstChild() {
		if(this.children)
			return this.children[0]
		
		return undefined
	}
	
	/**
		this function creates an html list of the given LinkedTree
		where tree items with children are expandable
	*/
	static toHtmlList(root, labelCallback) {
		
		let fn = function(tree, par, expEvent = 'click') {
			let label = labelCallback?labelCallback(tree.value):tree.value
			let html = `<div class="tree-item"><div class="tree-label">${label}</div><div class="tree-children"></div></div>`
			
			par.insertAdjacentHTML('beforeEnd', html)
			// select newly create element
			let item = par.lastChild
			item.dataset.value = tree.value
			
			// add functionality to expand and collapse the children holder
			if(tree.children) {
				item.className += ' tree-parent tree-collapsed'
				item.firstChild.addEventListener(expEvent, function(e) {
					toggleClass(item, 'tree-collapsed')
				})
				
				// add child elements
				tree.children.forEach(child => {
					fn(child, item.lastChild)
				})
			}
			
			return par.lastChild
		}
		
		let div = document.createElement("div")
		fn(root, div)
		
		return div.firstChild
	}
}

module.exports = LinkedTree