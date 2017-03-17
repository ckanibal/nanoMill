

class EditorView extends layout.Deck {

	init(state) {
		this.files = []
		
		this.hookIn("onFileOpen", (finfo) => {
			
			if(finfo.stat.isDirectory())
				return
			
			fs.readFile(finfo.path, 'utf8', (err, text) => {
				if(err)
					throw `Failed to read file in EditorView (${err})`
				
				if(this.interpretFile(finfo, text)) {
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

    interpretFile(file, text) {
        let mod, modIdx = -1

        switch(file.leaf){
            case ".c":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "ocscript")
                this.showChild(this.getChildIndex(mod))
            break
            case ".txt":
				let mode = "text"
				
				if(
					file.name === "DefCore.txt" ||
					file.name === "Scenario.txt" ||
					file.name === "ParameterDefs.txt" ||
					file.name === "Teams.txt" ||
					file.name === "Particle.txt" ||
					file.name === "Objects.txt" ||
					file.name === "PlayerControls.txt"
				)
					mode = "ini"
				
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, mode)
                this.showChild(this.getChildIndex(mod))
            break
			case ".glsl":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "glsl")
                this.showChild(this.getChildIndex(mod))
            break
			case ".material":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "text")
                this.showChild(this.getChildIndex(mod))
            break
			case ".ocm":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "ini")
                this.showChild(this.getChildIndex(mod))
            break
			
			default:
			return
        }
		
		hook("onFileClosed", (file) => {
			file.editor = null
			file.mod = null
		})
		
		this.registerFile(file, mod)

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