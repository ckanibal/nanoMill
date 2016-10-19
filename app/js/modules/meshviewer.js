class Meshviewer extends Layout_SubModule {
	
	constructor(modId) {
		super()
		
	}
	
	setup(file, txt, mode) {

        let mv = require(path.join(__rootdir, "js/mv_meshviewer.js"))
    }
	
	performClose() {
		this.scene = false
		cleanUpHooksOfMdl(this.id)
	}
}


Meshviewer.def = {
	alias: "meshviewer",
	className: Meshviewer,
	title: "Meshviewer,,
	isSub: true
}

registerModule(Meshviewer.def)
