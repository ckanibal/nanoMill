


class EditorView extends Layout_Deck {

	constructor() {
		super()
		
		this.files = []
		
		hook("onFileOpen", (file) => {

			_fs.readFile(file.path, 'utf8', (err, text) => {
				
				if(err)
					throw err
				
				if(this.interpretFile(file, text))
					execHook("onFileOpened", file)
			})
				
			return true
		})

		hook("onOpenedFileSelect", (file) => {
			let idx = this.getFileIndex(file)

			if(idx === -1)
				return false

			this.showFile(idx)

			return true
		})
		
		hook("closeOpenedFile", (file) => {
			let idx = this.getFileIndex(file)

			if(idx === -1)
				return false
			
			let child = this.children[idx]
			
			this.unregisterChild(child)
			
			return true
		})
	}

    interpretFile(file, text) {
		
		let leaf = file.name.split(".").pop()
        var mod

        switch(leaf){
            case "c":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "ocscript")
                this.showChild(this.getChildIndex(mod))
            break
            case "txt":
                mod = addModule("texteditor")
                this.registerChild(mod)
                mod.setup(file, text, "text")
                this.showChild(this.getChildIndex(mod))
            break
        }

        this.files.push(file)

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
	
	showFile(index) {
		let children = $(this.root).find(".mod-body")[0].children
		
		for(let i = 0; i < children.length; i++)
			if(i === index)
				children[i].style.display = "initial"
			else
				children[i].style.display = "none"
	}
}

EditorView.def = {
	alias: "editor",
	className: EditorView,
	title: "Editor"
}

registerModule(EditorView.def)
