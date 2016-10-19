class Meshviewer extends Layout_SubModule {
	
	constructor(modId) {
		super()
		
		this.root = document.createElement("div")
		
		this.cnv = document.createElement("canvas")
		this.cnv.width = 1
		this.cnv.height = 1
		$(this.root).append(this.cnv)
		
		hook("onLayoutChange", () => {
		}, modId)
	}
	
	setup(file, obj) {
        let mv = require(path.join(__rootdir, "js/mv_meshviewer.js"))
		this.scene = mv.create(this.cnv)
		this.scene.load(obj)
		
		if(!this.scene)
			return
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
