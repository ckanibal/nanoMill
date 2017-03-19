module.exports = function(data, fnClose) {
	
	document.getElementById("overlay-content").innerHTML = 
	`<div style="padding: 20px" class="flex-fill flex-col">
		<p class="desc">Enter filename</p>
		<input id="rename-field" style="margin: 10px 30px; border-bottom: 1px solid grey; text-align: center" type="text" value="${data}"></input>
		<div class="flex-fill"></div>
		<div class="flex-row">
			<div id="overlay-cancel" class="btn flex-fill">Cancel</div>
			<div id="overlay-confirm" class="btn flex-fill">Rename</div>
		</div>
	</div>`
	
	let input = document.getElementById("rename-field")
	
	let fnConfirm = _ => {
		fnClose(input.value)
	}
	// preselect file name without extension
	input.setSelectionRange(0, data.length - path.extname(data).length)
	input.addEventListener("keydown", (e) => {
		if(e.keyCode === 13)
			fnConfirm()
	})
	
	document.getElementById("overlay-cancel").addEventListener("click", fnClose)
	document.getElementById("overlay-confirm").addEventListener("click", fnConfirm)
}