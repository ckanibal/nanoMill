let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_Rename extends Dialog {
	init(data, fnClose) {
		this.body.innerHTML =
			`<p class="desc">Enter filename</p>
			<input id="rename-field" style="margin: 10px 30px; border-bottom: 1px solid grey; text-align: center" type="text" value="${data}"></input>`
		
		this.footer.innerHTML = 
			`<div class="flex-row">
				<div id="dlg-cancel" class="btn flex-fill">Cancel</div>
				<div id="dlg-confirm" class="btn flex-fill">Rename</div>
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
		
		document.getElementById("dlg-cancel").addEventListener("click", _ => {
			fnClose()
			this.close()
		})
		document.getElementById("dlg-confirm").addEventListener("click", fnConfirm)
		
		this.show()
		setTimeout(_ => {
			input.focus()
			input.setSelectionRange(0, data.length - path.extname(data).length)
		}, 0)
	}
}

module.exports = Dialog_Rename