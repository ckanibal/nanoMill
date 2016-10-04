


class EditorView extends Layout_Deck {

	constructor(modId) {
		super()
		
		this.files = []
		
		hook("onFileOpen", (res) => {

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
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "text")
                this.showChild(this.getChildIndex(mod))
            break
        }
		
		file.editor = this
		file.mod = mod
		
        this.files.push({
			file, modIdx
		})

        return true
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
}

EditorView.def = {
	alias: "editor",
	className: EditorView,
	title: "Editor"
}

registerModule(EditorView.def)
