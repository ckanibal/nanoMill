/**

*/
class SelectionList {
	/**
		@param array of items; if a number is given instead
			enumerated items will be created until the number is reached
	*/
	constructor(items = []) {
		if(typeof items === "number") {
			this.items = []
			let i = 0
			while(i <= items) {
				this.items.push(i)
				i++
			}
		}
		else
			this.items = items
	}
	
	addItem(item) {
		this.items.push(item)
	}
	
	static toHtml(sel, labelCallback, fnOnClick) {
		let par = document.createElement("div")
		par.className = "sel-par"
		
		for(let i = 0; i < sel.items.length; i++) {
			let el = document.createElement("div")
			el.className = "sel-item"
			let label = labelCallback?labelCallback(sel.items[i]):sel.items[i]
			el.innerHTML = label
			
			el.dataset.value = sel.items[i]
			
			el.addEventListener("click", function(e) {
				// handle selected class
				let selected = par.getElementsByClassName("sel-selected")[0]
				if(selected)
					Elem.removeClass(selected, "sel-selected")
				
				Elem.addClass(this, "sel-selected")
				
				if(fnOnClick)
					fnOnClick(this.dataset.value)
			})
			
			par.appendChild(el)
		}
		
		return par
	}
}

module.exports = SelectionList