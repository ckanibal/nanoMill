let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_Rename extends Dialog {
	init(data, fnClose) {
		this.body.innerHTML =
			`<p class="desc">Enter filename</p>
			<input id="rename-field" style="margin: 10px 30px; border-bottom: 1px solid grey; text-align: center" type="text" value="${data}"></input>`
		
		this.footer.innerHTML = 
			`<div class="flex-row">
				<div id="overlay-cancel" class="btn flex-fill">Cancel</div>
				<div id="overlay-confirm" class="btn flex-fill">Rename</div>
			</div>`
		
		let input = document.getElementById("rename-field")
	
		let fnConfirm = _ => {
			this.close()
			fnClose(input.value)
		}
		// preselect file name without extension
		input.addEventListener("keydown", (e) => {
			if(e.keyCode === 13)
				fnConfirm()
		})
		
		document.getElementById("overlay-cancel").addEventListener("click", _ => {
			fnClose()
			this.close()
		})
		document.getElementById("overlay-confirm").addEventListener("click", fnConfirm)
		
		this.show()
		setTimeout(_ => {
			input.focus()
			input.setSelectionRange(0, data.length - path.extname(data).length)
		}, 0)
	}
}

module.exports = Dialog_Rename