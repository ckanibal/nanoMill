var _nextTextEditorId = 0

class TextEditor extends Layout_SubModule {
	
	constructor(modId) {
		super()
		
		this.root = $("<div id='TE-" + _nextTextEditorId + "' class='ace_qtmill'></div>")[0]
		
		this.tid = _nextTextEditorId++
		
		hook("onLayoutChange", () => {
			this.editor.resize()
		}, modId)
	}

    setup(file, txt, mode) {

        if(!this.editor)
            this.editor = ace.edit("TE-"+this.tid)

		let editor = this.editor
		
        this.file = file

		this.isUnchanged = true
		
		editor.$blockScrolling = Infinity
		
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            wrapBehavioursEnabled: true,
			fontFamily: "SpaceMono",
			fontSize: getConfig("acefontsize") + "px" || "12px"
        })

        editor.getSession().setUseWrapMode(true)
        editor.getSession().setMode("ace/mode/" + mode)
		editor.session.setValue(txt, -1)
		
		editor.on("focus", _ => {
			execHook("onCurrEditorSet", this, this.file)
		})
		
		editor.on("change", _ => {
			setTimeout(this.checkFileState.bind(this), 1)
		})
		
		let langtools = ace.require("ace/ext/language_tools")
		langtools.setCompleters([langtools.snippetCompleter, langtools.keyWordCompleter])
    }
	
	setFontSize(size) {
		this.editor.setOptions({
		  fontSize: size + "px"
		})
	}
	
	checkFileState() {
		if(this.editor.getSession().getUndoManager().isClean() === this.isUnchanged)
			return
		
		this.isUnchanged = !this.isUnchanged
		
		execHook("onFileChangeStateChange", this.file, this.isUnchanged)
	}
	
	save() {
		_fs.writeFile(this.file.path, this.editor.getSession().getDocument().getValue(), 'utf8', (err) => {
			if(err)
				throw `Failed to save file (${err})`
			else {
				this.editor.getSession().getUndoManager().markClean()
				this.checkFileState()
			}
		})
	}
	
	focus() {
		this.editor.focus()
	}
	
	requestClose() {
		if(!this.editor)
			return true
		
		if(this.editor.getSession().getUndoManager().isClean())
			return true
		else {
			let r = dialog.showMessageBox({
					type: "question",
					buttons: ["Save", "Discard Changes", "Cancel"],
					defaultId: 0,
					title: "Unsaved changes",
					message: "The file you are about to close contains some unsaved changes.",
					cancelId: 2,
					noLink: true
				}
			)
			
			if(r === 0) {
				this.save()
				return true
			}
			else if(r === 1)
				return true
			else
				return false
		}
	}
	
	performClose() {
		this.editor.destroy()
		this.editor = false
		$("#TE-"+this.tid).remove()
		cleanUpHooksOfMdl(this.id)
	}
}

TextEditor.def = {
	alias: "texteditor",
	className: TextEditor,
	title: "Texteditor",
	isSub: true
}

registerModule(TextEditor.def)
