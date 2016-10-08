class ResView extends Layout_Module {
	
	constructor(modId) {
		super()
		this.itemWrapper = $("<div class='flex-col'></div>")[0]
		
		this.entries = []
		
		$(this.root).find(".mod-body").append(this.itemWrapper)
		
		hook("onResourceAdded", (res) => {
			this.addResLink(res)
		}, modId)
		
		let rList = filemanager.getResourcesCopy()

		for(let i = 0; i < rList.length; i++)
			this.addResLink(rList[i], i)
		
		hook("onResFocus", (res) => {
			$(this.root).find(".focussed").removeClass("focussed")
			_focussedRes = res
			
			for(let i = 0; i < this.entries.length; i++)
				if(this.entries[i].res === res) {
					this.entries[i].$el.addClass('focussed')
					return
				}
			
		}, modId)
	}
	
	addResLink(res, styleDelay) {
		var $el = $(`
			<div class='--RESV-entry' tabindex='5'>
				<div class='--RESV-fname'>${res.name.substr(0, res.name.length - res.leaf.length)}</div>
				<div class='--RESV-fext'>${res.leaf}</div>
			</div>`)
		$(this.itemWrapper).append($el[0])
		
		$el.dblclick(() => {
			if(!res.editor)
				openFile(res)
			else
				execHook("onOpenedFileSelect", res)
		})
		
		$el.focus((e) => {
			if($(this.root).find(".focussed")[0] === e.target)
				return
			
			execHook("onResFocus", res)
		})
		
		$el[0].style.animation = `list-item-in 0.3s ease-out 0.${styleDelay || 0}s 1 normal both`
		
		this.entries.push({$el, res})
	}
	
	static getCurrent() {
		return _focussedRes
	}
	
	static getCurrentPath() {
		return _focussedRes?_focussedRes.path:""
	}
	
	static showModal() {
		
		if(!_templates.length) {
			for(let i = 0; i < template_defs.length; i++)
				_templates[i] = require(template_defs[i])
		}
		
		let fn = function(tempid) {
			let plate = _templates[tempid]
			let $body = $("<div class=''></div>")
			$body.html(`<p class='desc'>Autofills: ${(plate.input || "none").split("|").join(", ")}</p>
			<p>Title: <span><input class="--RESV-title-input" type="text" value="NewlyThere" required/></span></p>
			<p class='desc'>Destination:</p>
			<p class='url flex-row'><span class='--RESV-dest flex-fill'>?</span><label for='--RESV-dest-pick'>Browse</label></p>
			<input id="--RESV-dest-pick" type="file" style="display: none" webkitdirectory />
			`)
			
			$body.find("#--RESV-dest-pick").change(function(e) {
				$body.find(".--RESV-dest").html(this.files[0].path)
			})
			
			$("#modal").find(".modal-content").html("")
			showModal("New " + plate.name, $body[0])
			
			let $confirm = $("<div class='' style='align-self: flex-end'><label>Confirm</label></div>")
			
			$confirm.click((e) => {
				let path = $body.find("#--RESV-dest-pick").value
				
				if(!_fs.lstatSync(path).isDirectory())
					return
				
				let title = $body.find("#--RESV-title-input").value
				
				if(!title || !title.length)
					return
				
				createFromTemplate(plate, path, {
					title,
					author: getConfig("author"),
					version: getConfig("ocver")
				})
			})
			
			$body.append($confirm)
		}
		
		let $el = $("<div class='--RESV-temp-list'></div>")
		$el.append("<div class='desc'>Choose template:</div>")
		
		for(let i = 0; i < _templates.length; i++) {
			let id = i
			let $entry = $(`<div class='--RESV-temp-entry'>${_templates[i].name}</div>`)
			$entry.click(_ => fn(id))
			
			$el.append($entry)
			$entry[0].style.animation = `list-item-in 0.3s ease-out 0.${i}s 1 normal both`
		}
		
		showModal("Create new content", $el[0])
	}
	
	getSpecialMenuProps() {
		return [
			{
				label: "New...",
				icon: "icon-plus",
				fn: _ => {
					$(":focus").blur()
					ResView.showModal()
				}
			}
		]
	}
}

ResView.def = {
	alias: "resview",
	className: ResView,
	title: "Resources",
}

registerModule(ResView.def)

var _focussedRes

let template_defs = [
	"./templates/Particle.ocd/templateDef.json",
	"./templates/BasicObject.ocd/templateDef.json",
	"./templates/Scenario.ocs/templateDef.json"
]
var _templates = []

setTimeout(function() {
	if(_templates.length)
		return
	
	for(let i = 0; i < template_defs.length; i++)
		_templates[i] = require(template_defs[i])
}, 1500)

function createFromTemplate(plate, pth, {
	title, desc, author, version
}) {
}