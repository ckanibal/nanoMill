
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
		and makes directories expandable
	*/
	static toHtmlList(root) {
		
		let fn = function(tree, par) {
			
			let html = `<div class="tree-item"><div class="tree-label">${tree.value}</div></div>`
			
			par.insertAdjacentHTML('beforeEnd', html)
			
			if(tree.children) {
				tree.children.forEach(child => {
					fn(child, par.lastChild)
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