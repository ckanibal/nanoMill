

class Contextmenu {
	constructor() {
		this.init(...arguments)
	}
	
	init(x, y, props) {
		this.focusedBefore = document.activeElement
		
		this.createContent(props)
		
		document.body.appendChild(this.el)
		
		this.setPosition(x, y)
		
		this.el.focus()
		
		this.el.addEventListener("blur", (e) => {
			Elem.remove(e.target)
		})
	}
	
	setPosition(x, y) {
		let rect = this.el.getBoundingClientRect()
		if(x + rect.width > window.innerWidth)
			x = window.innerWidth - rect.width
		
		if(y + rect.height > window.innerHeight)
			y = window.innerHeight - rect.height
		
		this.el.style.left = x + "px"
		this.el.style.top = y + "px"
	}
	
	createContent(props) {
		let div = document.createElement("div")
		div.className = "ctx-menu flex-col"
		this.el = div
		
		// allow getting focused
		div.tabIndex = -1
		
		for(let i = 0; i < props.length; i++) {
			let prop = props[i]
			let item = document.createElement("div")
			item.className = "ctx-menu-item flex-row"
			item.innerHTML = `<div class="flex-col" style="justify-content: center">
								<div class="ctx-menu-icon ${prop.icon}"></div>
							</div>
							<div class="flex-col flex-fill" style="justify-content: center">
								<div class="ctx-menu-label">${prop.label}</div>
							</div>`
			
			if(prop.submenu)
				item.insertAdjacentHTML("beforeend", `<div class="flex-col" style="justify-content: center"><div class="ctx-menu-indicator">></div></div>`)
			
			// when failing validation skip event binding and apply class
			if(prop.onvalidate && !prop.onvalidate())
				item.className += " invalid"
			else {
				// bind click handler
				if(prop.onclick) {
					item.addEventListener("click", () => {
						if(prop.onclick)
							prop.onclick()
						
						// blur root menu
						document.activeElement.blur()
						
						// restore the focus from before contextmenu creation
						if(this.focusedBefore)
							this.focusedBefore.focus()
					})
				}
				
				// bind sub menu
				if(prop.submenu) {
					item.addEventListener("mouseenter", _ => {
						let sub = new Submenu(item, prop.submenu)
						
						let fn = _ => {
							item.removeEventListener("mouseleave", fn)
							sub.remove()
						}
						
						item.addEventListener("mouseleave", fn)
					})
				}
			}
			
			div.appendChild(item)
		}
	}
}

class Submenu extends Contextmenu {
	init(par, props) {
		this.focusedBefore = document.activeElement
		this.createContent(props)
		
		// remove tab index, to not receive focus (which would close our root menu)
		this.el.removeAttribute("tabIndex")
		
		par.appendChild(this.el)
		
		this.setPosition(par)
	}
	
	setPosition(par) {
		let parRect = par.getBoundingClientRect(),
			ownRect = this.el.getBoundingClientRect()
		
		let x, y
		
		// if submenu would exceed window frame, display on the other side of parent menu
		if(parRect.right + ownRect.width > window.innerWidth)
			x = -ownRect.width
		else
			x = parRect.width
		
		// exceeds window height, snap it to bottom of window
		if(parRect.top + ownRect.height > window.innerHeight)
			y = parRect.height - ownRect.height
		else
			y = 0
		
		// make positions relative to parent element
		
		this.el.style.left = x + "px"
		this.el.style.top = y + "px"
	}
	
	remove() {
		Elem.remove(this.el)
	}
}