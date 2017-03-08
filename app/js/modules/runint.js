class ConsoleView extends Layout_Module{

    init() {
		
		this.body.insertAdjacentHTML("beforeend", `<div class='abs-fill flex-col --RNINT-list'></div>`)
		this.list = this.body.firstChild
		
		hook("onStdOut", (s) => {
			this.print(s)
		}, this.modId)
		
		hook("clearAllRunInts", _ => this.clear(), this.modId)
	}
	
	print(s) {
		if(this.list.scrollHeight - this.list.scrollTop - parseInt(this.list.height()) < 11) {
			this.list.insertAdjacentHTML(`<p class='--RNINT-entry'>${s}</p>`)
			this.list.scrollTop = 1000000
		}
		else
			this.list.insertAdjacentHTML(`<p class='--RNINT-entry'>${s}</p>`)
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
}

ConsoleView.def = {
	alias: "console",
	className: ConsoleView,
	title: "Console"
}

defineModule(ConsoleView.def)

var _params = {}

var PORT = 300