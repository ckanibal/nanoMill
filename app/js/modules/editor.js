


class EditorView extends Layout_Deck {

	constructor(modId) {
		super()
		
		this.files = []
		
		hook("onFileOpen", (res) => {
			
			if(res.stats.isDirectory())
				return

			_fs.readFile(res.path, 'utf8', (err, text) => {
				
				if(err)
					throw `Failed to read file in EditorView (${err})`
				
				if(this.interpretFile(res, text)) {
					execHook("onFileOpened", res)
					execHook("onOpenedFileSelect", res)
				}
			})
			
			return true
		}, modId)

		hook("onOpenedFileSelect", (file) => {
			this.showFile(file)
		}, modId)
		
		hook("closeOpenedFile", (file) => {
			let idx = this.getFileIndex(file)

			if(idx === -1)
				return false
			
			let child = this.children[idx]
			
			this.unregisterChild(child)
			
			return true
		}, modId)
		
		for(let i = 0; i < _dumped_editors.length; i++) {
			this.registerFile(_dumped_editors[i].file, _dumped_editors[i])
			this.registerChild(_dumped_editors[i])
		}
		
		execHook("onLayoutChange")
		_dumped_editors = []
	}

    interpretFile(file, text) {
        var mod, modIdx = -1

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
			case ".json":
				if(file.name !== "mesh.json")
					break
			case ".mesh":
				mod = addModule("meshviewer")
                this.registerChild(mod)
                mod.setup(file, JSON.parse(text))
                this.showChild(this.getChildIndex(mod))
			break;
			
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
        for(var i = 0; i < this.files.length; i++)
            if(this.files[i] === file)
                return true

        return false
    }

    getFileIndex(file) {
        for(var i = 0; i < this.files.length; i++)
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
	
	onDeletion() {
		cleanUpHooksOfMdl(this.id)
		
		for(let i = 0; i < this.files.length; i++)
			this.files[i].editor = null
		
		for(let i = 0; i < this.children.length; i++) {
			$("#submod-buffer").append(this.children[i].root)
			_dumped_editors.push(this.children[i])
		}
	}
}

EditorView.def = {
	alias: "editor",
	className: EditorView,
	title: "Editor"
}

registerModule(EditorView.def)

var _dumped_editors = []

/** entry points of c4meshloader.dll
	extern "C" char* load_mesh(const char* filename);
	extern "C" void free_mesh(char* text);
*/

function loadMesh() {
	let ffi = require('ffi'),
		ref = require('ref')
	
	let dll = ffi.Library(path(__dirname, "dlls/libc4meshloader32.dll"), {
		
	})
}