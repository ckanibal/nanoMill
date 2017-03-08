

class Contextmenu {
	constructor(x, y, props) {
		let focusedBefore = document.activeElement
		
		let div = document.createElement("div")
		div.className = "ctx-menu flex-col"
		
		// allow getting focused
		div.tabIndex = -1
		
		for(let i = 0; i < props.length; i++) {
			let prop = props[i]
			let item = document.createElement("div")
			item.className = "ctx-menu-item flex-row"
			item.innerHTML = `<div class="flex-col" style="justify-content: center">
								<div class="ctx-menu-icon ${prop.icon}"></div>
							</div>
							<div class="flex-col" style="justify-content: center">
								<div class="ctx-menu-label">${prop.label}</div>
							</div>`
			
			item.addEventListener("click", () => {
				if(prop.onclick)
					prop.onclick()
				
				div.blur()
				
				// restore the focus from before contextmenu creation
				if(focusedBefore)
					focusedBefore.focus()
			})
			
			div.appendChild(item)
		}
		
		document.body.appendChild(div)
		
		// set position
		let rect = div.getBoundingClientRect()
		if(x + rect.width > window.innerWidth)
			x = window.innerWidth - rect.width
		
		if(y + rect.height > window.innerHeight)
			y = window.innerHeight - rect.height
		
		div.style.left = x + "px"
		div.style.top = y + "px"
		
		div.focus()
		
		div.addEventListener("blur", (e) => {
			remove(div)
		})
	}
}