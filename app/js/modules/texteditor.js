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

		editor.$blockScrolling = Infinity
		
        editor.setOptions({
            enableBasicAutocompletion: true,
            enableSnippets: true,
            enableLiveAutocompletion: true,
            wrapBehavioursEnabled: true,
			fontFamily: "SpaceMono",
			fontSize: "11px"
        })

        editor.getSession().setUseWrapMode(true)
        editor.getSession().setMode("ace/mode/" + mode)
		editor.getSession().getDocument().setValue(txt)
    }
}

TextEditor.def = {
	alias: "texteditor",
	className: TextEditor,
	title: "Texteditor",
	isSub: true
}

registerModule(TextEditor.def)
