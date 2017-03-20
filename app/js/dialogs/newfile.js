module.exports = function(data, fnClose) {
	
	document.getElementById("overlay-content").innerHTML = 
	`<div style="padding: 20px" class="flex-fill flex-col">
		<p class="desc">Choose template</p>
		<div id="sel-temp"></div>
		<div class="flex-fill"></div>
		<div class="flex-row">
			<div id="overlay-cancel" class="btn flex-fill">Cancel</div>
		</div>
	</div>`
	
	let templates = require(path.join(__rootdir, "js", "templates.js")),
		tmps = templates.entries
	
	let SelectionList = require(path.join(__rootdir, "js", "lib", "sellist.js"))
	log(tmps)
	let sel = new SelectionList(tmps.length - 1)
	
	
	let fn = function(tempid) {
		let plate = tmps[tempid]
		
		let opts = new Set(plate.input.split("|"))
		
		document.getElementById("overlay-content").innerHTML = `
		<div class="flex-col flex-fill" style="padding: 20px">
			<div class='err-fill-in'></div><p class='desc'>Autofills: ${(plate.input || "none").split("|").join(", ")}</p>
			<p>Title: <span><input id="newfile-name" type="text" value="NewlyThere" required/></span><span style="color: grey">${plate.ext}</span></p>
			${opts.has("desc")?
				"<p class='desc'>Description:</p><textarea id='newfile-desc' class='flex-fill' rows='3'></textarea>":
				"<div class='flex-fill'></div>"}
			<div class="flex-row">
				<div id="overlay-cancel" class="btn flex-fill">Cancel</div>
				<div id="overlay-confirm" class="btn flex-fill">Create</div>
			</div>
		</div>`
		
		document.getElementById("overlay-cancel").addEventListener("click", fnClose)
		
		let btnConfirm = document.getElementById("overlay-confirm")
		
		btnConfirm.addEventListener("click", (e) => {
			let descEl = document.getElementById("newfile-desc")
			templates.create(plate, data, {
				title: document.getElementById("newfile-name").value || "",
				author: getConfig("author"),
				version: getConfig("ocver"),
				desc: descEl?descEl.value:""
			}, _  => fnClose(true))
		})
	}
	
	document.getElementById("sel-temp").appendChild(SelectionList.toHtml(
		sel,
		(val) => tmps[val].name,
		fn
	))
	
	document.getElementById("overlay-cancel").addEventListener("click", fnClose)
}