const fadeouttime = 200 // time dialog needs to fadeout; to remove it after animatoin played

class Dialog {
	constructor(width, height, ...args) {
		this.modal = document.createElement("div")
		this.modal.className = "dlg-modal"
		
		this.modal.innerHTML = `<div class="dlg-container flex-col"><div class="dlg-body"></div><div class="flex-fill"></div><div class="dlg-footer"></div></div>`
		
		let con = this.modal.firstChild
		this.body = con.firstChild
		this.footer = con.lastChild
		
		con.style.width = width + "px"
		con.style.height = height + "px"
		
		document.body.appendChild(this.modal)
		
		this.init(...args)
	}
	
	init() {}
	
	show() {
		this.modal.className += " shown"
	}
	
	close() {
		Elem.removeClass(this.modal, "shown")
		setTimeout(_ => {
			Elem.remove(this.modal)
		}, fadeouttime)
	}
}

module.exports = Dialog