/**
	this file provides a static class, which has different of the most common
	html operations as function, trying to replace jquery, while still keeping things short and
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
			el.className = cname.substr(0, i) + cname.substr(i + cname.length)
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
}