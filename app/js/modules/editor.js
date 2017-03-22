

class EditorView extends layout.Deck {

	init(state) {
		this.files = []
		
		this.hookIn("onFileOpen", (finfo) => {
			
			fs.readFile(finfo.path, 'utf8', (err, text) => {
				if(err)
					throw `Failed to read file in EditorView (${err})`
				
				if(this.openFileInModule(finfo, text)) {
					hook.exec("onFileOpened", finfo)
					hook.exec("onOpenedFileSelect", finfo)
				}
			})
			
			// prevent furthur event execution
			return true
		})

		this.hookIn("onOpenedFileSelect", (file) => {
			this.showFile(file)
		})
		
		this.hookIn("closeOpenedFile", (file) => {
			let idx = this.getFileIndex(file)

			if(idx === -1)
				return false
			
			let child = this.children[idx]
			
			this.unregisterChild(child)
			
			return true
		})
		
		for(let i = 0; i < _dumped_editors.length; i++) {
			this.registerFile(_dumped_editors[i].file, _dumped_editors[i])
			this.registerChild(_dumped_editors[i])
		}
		
		hook.exec("onLayoutChange")
		_dumped_editors = []
	}

    openFileInModule(finfo, text) {
        let mod, modIdx = -1
		let mode, mdlType
        switch(finfo.ext){
            case ".c":
				mdlType = "texteditor"
				mode = "ocscript"
            break
            case ".txt":
				mode = "text"
				
				if( finfo.name === "DefCore.txt" ||
					finfo.name === "Scenario.txt" ||
					finfo.name === "ParameterDefs.txt" ||
					finfo.name === "Teams.txt" ||
					finfo.name === "Particle.txt" ||
					finfo.name === "Objects.txt" ||
					finfo.name === "PlayerControls.txt"
				)
					mode = "ini"
				
                mdlType = "texteditor"
            break
			case ".glsl":
				mode = "glsl"
                mdlType = "texteditor"
            break
			case ".material":
                mode = "txt"
                mdlType = "texteditor"
            break
			case ".ocm":
                mode = "ini"
                mdlType = "texteditor"
            break
			
			default:
				return
        }
		
		mod = this.source.createModule(mdlType)
		this.registerChild(mod)
		mod.setup(finfo, text, mode)
		this.showChild(this.getChildIndex(mod))
		
		this.hookIn("onFileClosed", (finfo) => {
			finfo.editor = null
			finfo.mod = null
		})
		
		this.registerFile(finfo, mod)

        return true
    }
	
	registerFile(file, mod) {
		file.editor = this
		file.mod = mod
		
		this.files.push(file)
	}

    hasFile(file) {
        for(let i = 0; i < this.files.length; i++)
            if(this.files[i] === file)
                return true

        return false
    }

    getFileIndex(file) {
        for(let i = 0; i < this.files.length; i++)
            if(this.files[i] === file)
                return i

        return -1
    }
	
	showFile(file) {
		let idx = this.getChildIndex(file.mod)

		if(idx === -1)
			return
		
		this.showChild(idx)
		this.shownFile = file
	}
	
	onChildShow(idx) {
		this.children[idx].focus()
	}
	
	onClose() {
		for(let i = 0; i < this.files.length; i++)
			this.files[i].editor = null
		
		// rescue submodules into global buffer (probably a global array, to prevent extra serialization)
		for(let i = 0; i < this.children.length; i++) {
			document.getElementById("submod-buffer").appendChild(this.children[i].root)
			_dumped_editors.push(this.children[i])
		}
	}
}

EditorView.def = {
	alias: "editor",
	className: EditorView,
	title: "Editor"
}

layout.setModuleDef(EditorView.def)

let _dumped_editors = []