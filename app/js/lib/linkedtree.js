
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
	
	removeChild(child) {
		// prevent from creating falsly an unneeded array
		if(!this.children)
			return
		
		let a = []
		for(let i = 0; i < this.children.length; i++)
			if(this.children[i] !== child)
				a.push(this.children[i])
		
		this.children = a
	}
	
	/**
		executes a given callback for every child and its children
	*/
	forEach(callback) {
		if(!callback || !this.children)
			return
		
		for(let i = 0; i < this.children.length; i++) {
			let child = this.children[i]
			callback(child.value)
			child.forEach(callback)
		}
	}
	
	// unsets the children array
	removeChildren() {
		this.children = undefined
	}
	
	get firstChild() {
		if(this.children)
			return this.children[0]
		
		return undefined
	}
	
	getElementByVal(val) {
		if(val === this.value)
			return this
		
		if(this.children) {
			for(let i = 0; i < this.children.length; i++) {
				let el = this.children[i].getElementByVal(val)
				if(el)
					return el
			}
		}
	}
	
	getElementsByVal(val, ary) {
		if(!ary)
			ary = []
		
		if(val === this.value)
			return ary.push(this)
		
		if(this.children) {
			for(let i = 0; i < this.children.length; i++) {
				this.children[i].getElementsByVal(val, ary)
			}
		}
	}
	
	removeElementsOfVal() {
		
	}
	
	/**
		removes the first element of the given value found and returns it
		
	*/
	removeElementOfVal(val) {
		if(!this.children)
			return null
		
		for(let i = 0; i < this.children.length; i++) {
			let child = this.children[i]
			if(child.value === val) {log(child.value)
				this.removeChild(child)
				return child
			}
			
			let grandchild = child.removeElementOfVal(val)
			if(grandchild)
				return grandchild
		}
		
		return null
	}
	
	/**
		this function creates an html list of the given LinkedTree
		where tree items with children are expandable
	*/
	static toHtmlList(root, labelCallback, expEvent = 'click') {
		
		let fn = function(tree, par) {
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
					Elem.toggleClass(item, 'tree-collapsed')
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