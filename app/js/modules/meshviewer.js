class Meshviewer extends Layout_SubModule {
	
	constructor(modId) {
		super()
		
		this.root = document.createElement("div")
		this.root.className = "--MV-con flex-col"
		
		this.cnv = document.createElement("canvas")
		this.cnv.className = "--MV-cnv"
		this.cnv.width = 1
		this.cnv.height = 1
		$(this.root).append(this.cnv)
		
		this.$menu = $('<div class="flex-row --MV-menu"></div>')
		$(this.root).append(this.$menu[0])
		this.$menu.html(`
			<div class="--MV-play">play</div>
		`)
		
		this.$menu.find('--MV-play').click(_ => {
			this.scene.playAnimation()
		})
		
		hook("onLayoutChange", () => {
			let w = $(this.root).width(),
				h = $(this.root).height()
			
			this.scene.setSize(w, h)
		}, modId)
	}
	
	setup(file, obj) {
        let mv = require(path.join(__rootdir, "js/mv_meshviewer.js"))
		this.scene = mv.create(this.cnv)
		this.scene.load(obj)
		
		let w = $(this.root).width(),
			h = $(this.root).height()
		
		this.scene.setSize(w, h)
		this.scene.enableViewControls(this.root)
		
		log(obj)
    }
	
	performClose() {
		this.scene = false
		cleanUpHooksOfMdl(this.id)
	}
}


Meshviewer.def = {
	alias: "meshviewer",
	className: Meshviewer,
	title: "Meshviewer",
	isSub: true
}

registerModule(Meshviewer.def)

function doLittle() {
	for(let i = 0; i < _modules.length; i++)
		if(_modules[i].constructor.def.alias === "meshviewer") {
			_modules[i].scene.setAnimation(0)
			_modules[i].scene.playAnimation()
			return _modules[i].scene
		}
	
	return
		"none"
}