
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
		let $body = $("<div class='flex-col'></div>")
		$body.html(`<div class='err-fill-in'></div><p class='desc'>Autofills: ${(plate.input || "none").split("|").join(", ")}</p>
			<p>Title: <span><input id="--RESV-title-input" class="--RESV-title-input" type="text" value="NewlyThere" required/></span></p>
			<p class='desc'>Destination:</p>
			<p class='url flex-row'>
				<span class='--RESV-dest flex-fill'>${getConfig("dftTempDir")}</span>
				<label for='--RESV-dest-pick'>Browse</label>
			</p>
			<input id="--RESV-dest-pick" type="file" style="display: none" webkitdirectory defaultValue="${getConfig("dftTempDir")}"/>
		`)
		
		if(opts.has("desc"))
			$body.append(`<p class='desc'>Description:</p>
				<textarea class='--RESV-desc-input' rows='3'></textarea>
		`)
		
		$body.find("#--RESV-dest-pick").change(function(e) {
			let v = this.files[0].path
			$body.find(".--RESV-dest").html(v)
			setConfig("dftTempDir", v)
		})
		
		$("#modal").find(".modal-content").html("")
		showModal("New " + plate.name, $body[0])
		
		let $confirm = $(`<div class='modal-confirm'><label>Create</label></div>`)
		
		$confirm.click((e) => {
			let picker = document.getElementById("--RESV-dest-pick")
			
			if(!picker.files)
				return
			
			let path = picker.files[0].path
			
			try {
				_fs.lstatSync(path).isDirectory()
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
				desc: $body.find(".--RESV-desc-input").val() || ""
			})
			
			hideModal()
		})
		
		$body.append($confirm)
	}

	let $el = $("<div class='--RESV-temp-list'></div>")
	$el.append("<div class='desc'>Choose template:</div>")

	for(let i = 0; i < tmps.length; i++) {
		let id = i
		let $entry = $(`<div class='--RESV-temp-entry'>${tmps[i].name}</div>`)
		$entry.click(_ => fn(id))
		
		$el.append($entry)
		$entry[0].style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
	}

	showModal("Create new content", $el[0])
}