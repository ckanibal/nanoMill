let Dialog = require(path.join(__rootdir, "js", "dialogs", "dialog.js"))

class Dialog_NewFile extends Dialog {
	init(dirParent, fnOnCreation) {
		console.assert(typeof dirParent === "string", {"message":"created Dialog_NewFile without a path as argument"})
		
		// first page: selection of a template
		this.body.innerHTML = 
			`<p class="desc">Choose template</p>
			<div id="sel-temp"></div>
			<div class="flex-fill"></div>`
	
		this.footer.innerHTML = `<div id="overlay-cancel" class="btn flex-fill">Cancel</div>`
		
		let templateLoader = require(path.join(__rootdir, "js", "templateLoader.js")),
			tmps = templateLoader.getTemplates()
		
		let SelectionList = require(path.join(__rootdir, "js", "lib", "sellist.js"))
		let sel = new SelectionList(tmps.length - 1)
		
		
		// second page: fillout autofill form and submit dialog
		let fn = (tempid) => {
			let template = tmps[tempid]
			
			let opts = new Set(template.input)
			
			this.body.innerHTML = 
				`<div class='err-fill-in'></div><p class='desc'>Autofills: ${template.autofill.join(", ")}</p>
				<p>Title: <span><input id="newfile-name" type="text" value="NewlyThere" required/></span><span style="color: grey">${template.ext}</span></p>
				${opts.has("desc")?
				"<p class='desc'>Description:</p><textarea id='newfile-desc' class='flex-fill' rows='3'></textarea>":""}`
			
			this.footer.innerHTML =
				`<div class="flex-row">
					<div id="overlay-cancel" class="btn flex-fill">Cancel</div>
					<div id="overlay-confirm" class="btn flex-fill">Create</div>
				</div>`
			
			document.getElementById("overlay-cancel").addEventListener("click", _ => this.close())
			
			let btnConfirm = document.getElementById("overlay-confirm")
			
			btnConfirm.addEventListener("click", (e) => {
				let title = document.getElementById("newfile-name").value
				let descEl = document.getElementById("newfile-desc")
				templateLoader.createFromTemplate(template, dirParent, {
					title,
					author: getConfig("author"),
					version: getConfig("ocver"),
					desc: descEl?descEl.value:""
				}, _  => fnOnCreation(true))
				
				this.close()
			})
		}
		// second page end
		
		document.getElementById("sel-temp").appendChild(SelectionList.toHtml(
			sel,
			(val) => tmps[val].name,
			fn
		))
		
		document.getElementById("overlay-cancel").addEventListener("click", _ => this.close())
		
		this.show()
	}
}

module.exports = Dialog_NewFile