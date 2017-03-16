class ConsoleView extends layout.Module {

    init() {
		
		this.body.insertAdjacentHTML("beforeend", `<div class='abs-fill flex-col --RNINT-list'></div>`)
		this.list = this.body.lastElementChild
		
		hook("onStdOut", (s) => {
			this.print(s)
		}, this.modId)
	}
	
	print(s) {
		let rect = this.list.getBoundingClientRect()
		if(this.list.scrollHeight - this.list.scrollTop - parseInt(rect.height) < 11) {
			this.list.insertAdjacentHTML("beforeend", `<p class='--RNINT-entry'>${s}</p>`)
			this.list.scrollTop = 1000000
		}
		else
			this.list.insertAdjacentHTML("beforeend", `<p class='--RNINT-entry'>${s}</p>`)
	}
	
	clear() {
		this.list.innerHTML = ''
	}
	
	static validateStdout(s) {
		s = s.replace(/\\/g, "/")
		s = s.replace(/\[(.+?)\]/, function(m, v1) {
			return `<span class="--RUNINT-time-stamp">${v1}</span>`
		})
		
		s = s.replace(/ERROR\:\s*.+/, function(m) {			
			m = m.replace(/\(([^)']+?)\)/, function(m2, v1) {
				return `<span class="--RUNINT-link" onclick="ConsoleView.openTextAt('${v1}')">${m2}</span>`
			})
			
			return `<span class="--RUNINT-error">${m}</span>`
		})
		
		s = s.replace(/by\:\s*.+/, function(m) {
			return `<span class="--RUNINT-stack-trace">${m}</span>`
		})
		
		return s
	}
	
	static openTextAt(s) {log(s)
		let [p, l, c] = s.split(":")
		p = p.match(/[^\s]+$/)[0]
	}
	
	getSpecialMenuProps() {
		return [{
			label: "Clear",
			icon: "icon-console",
			onclick: _ => this.clear()
		}]
	}
}

ConsoleView.def = {
	alias: "console",
	className: ConsoleView,
	title: "Console"
}

layout.setModuleDef(ConsoleView.def)