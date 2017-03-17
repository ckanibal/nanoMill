
module.exports.show = function() {
	let path = require("path")
	let templates = require(path.join(__rootdir, "js/templates")),
		tmps = templates.entries


	if(!tmps.length) {
		for(let i = 0; i < template_defs.length; i++)
			tmps[i] = require(template_defs[i])
	}

	let fn = function(tempid) {
		let plate = tmps[tempid]
		
		let opts = new Set(plate.input.split("|"))
		
		let body = document.createElement("div")
		body.className = "flex-col"
		body.innerHTML = `<div class='err-fill-in'></div><p class='desc'>Autofills: ${(plate.input || "none").split("|").join(", ")}</p>
			<p>Title: <span><input id="--RESV-title-input" class="--RESV-title-input" type="text" value="NewlyThere" required/></span></p>
			<p class='desc'>Destination:</p>
			<p class='url flex-row'>
				<span class='--RESV-dest flex-fill'>${getConfig("dftTempDir")}</span>
				<label for='--RESV-dest-pick'>Browse</label>
			</p>
			<input id="--RESV-dest-pick" type="file" style="display: none" webkitdirectory defaultValue="${getConfig("dftTempDir")}"/>`
		
		if(opts.has("desc"))
			body.insertAdjacentHTML("beforeend", `<p class='desc'>Description:</p>
					<textarea class='--RESV-desc-input' rows='3'></textarea>`)
		
		body.querySelector("#--RESV-dest-pick").addEventListener("change", function(e) {
			let val = this.files[0].path
			body.getElementsByClassName("--RESV-dest").innerHTML = val
			setConfig("dftTempDir", val)
		})
		
		// clear modal content
		document.getElementsByClassName("modal-content")[0].innerHTML = ""
		
		showModal("New " + plate.name, body)
		
		let btnConfirm = Elem.fromString(`<div class='modal-confirm'><label>Create</label></div>`)
		
		btnConfirm.addEventListener("click", (e) => {
			let picker = document.getElementById("--RESV-dest-pick")
			
			if(!picker.files)
				return
			
			let path = picker.files[0].path
			
			try {
				fs.lstatSync(path).isDirectory()
			}
			catch(e) {
				return
			}
			
			let title = document.getElementById("--RESV-title-input").value
			
			if(!title || !title.length)
				return
			
			templates.create(plate, path, {
				title,
				author: getConfig("author"),
				version: getConfig("ocver"),
				desc: body.getElementsByClassName("--RESV-desc-input")[0].value || ""
			})
			
			hideModal()
		})
		
		body.appendChild(btnConfirm)
	}

	let el = Elem.fromString(`<div class='--RESV-temp-list'><div class='--RESV-temp-list'></div></div>`)

	for(let i = 0; i < tmps.length; i++) {
		let id = i
		let entry = Elem.fromString(`<div class='--RESV-temp-entry'>${tmps[i].name}</div>`)
		entry.addEventListener("click", _ => fn(id))
		el.appendChild(entry)
		entry.style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
	}

	showModal("Create new content", el)
}