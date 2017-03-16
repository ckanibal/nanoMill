/**
	this file provides a static class, which has different of the most common
	html operations as method, trying to replace jquery, while still keeping things short and
	natural
*/


class Elem {
	/**
		toggles a given class of an element
		@param el the element to change
		@param cl the class to toggle
	*/
	static toggleClass(el, cl) {
		let cname = el.className
		let i = cname.indexOf(cl)
		
		if(i === -1)
			el.className += ' ' + cl
		else
			el.className = el.className.replace(new RegExp(`(?:^|\\s*)${cl}(?!\\S)(?:$|\\s*)`, "g"), " ").trim()
	}
	
	static remove(el) {
		if(el.parentNode)
			el.parentNode.removeChild(el)
	}
	
	static fromString(str) {
		let div = document.createElement("div")
		div.innerHTML = str
		
		return div.firstChild
	}
	
	static hasClass(el, cl) {
		return el.className.indexOf(cl) !== -1
	}
	
	static addClass(el, cl) {
		if(!Elem.hasClass(el, cl))
			el.className += " " + cl
	}
	
	static removeClass(el, cl) {
		el.className = el.className.replace(new RegExp(`(?:^|\\s*)${cl}(?!\\S)(?:$|\\s*)`, "g"), " ").trim()
	}
	
	static insertBefore(par, el, ref = null) {
		par.insertBefore(el, ref)
	}
	
	static insertAfter(par, el, ref = null) {
		if(ref === null || ref === par.lastChild)
			par.appendChild(el)
		else
			par.insertBefore(el, ref.nextElementSibling)
	}
	
	static prepend(par, el) {
		par.insertBefore(el, null)
	}
	
	static append(par, el) {
		par.appendChild(el)
	}
}