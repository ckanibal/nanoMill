
class LinkedTree {
	constructor(val) {
		this.value = val
	}
	
	add(child) {		
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
	static toHtmlList(root) {
		
		let fn = function(tree, par) {
			
			let html = `<div class="tree-item"><div class="tree-label">${tree.value}</div><div class="tree-children"></div></div>`
			
			par.insertAdjacentHTML('beforeEnd', html)
			
			// add functionality to expand and collapse the children holder
			if(tree.children) {
				let item = par.lastChild
				item.className += ' tree-parent tree-collapsed'
				item.firstChild.addEventListener('click', function(e) {
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