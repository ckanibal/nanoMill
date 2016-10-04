var sass_defs = [
    {
        src: "sass/main.scss"
    },
    {
        src: "sass/icomoon.css",
        mod: "iconsToMixins"
    },
    {
        src: "sass/flex.scss"
    },
    {
        src: "sass/mod.scss"
    },
    {
        src: "sass/mod_nav.scss"
    },
    {
        src: "sass/mod_res_view.scss"
    },
    {
        src: "sass/mod_ace.scss"
    },
    {
        src: "sass/mod_ace_theme.scss"
    }
]

function processSassFiles(defs) {
	
	if(!Sass)
		return warn("Cannot pre-process css-file; Sass not given")
	
	let readFn = function*(defs) {
		for(let i = 0; i < defs.length; i++) {
			let txt = _fs.readFileSync(path.join(__dirname, defs[i].src), 'utf8')
			
			if(defs[i].mod)
				txt = modSassString(txt, defs[i].mod)
			
			yield txt
		}
	}
	
	_prf.start("sass")
	
	let whole = ""
	
	for(let single of readFn(defs))
		whole += single + "\n\n"
	
	Sass.compile(whole, (result) => {
		if(result.message) {
			error("Sass error: " + result.message)
			window._failedSassString = whole
		}
		else {
			$(document.head).append("<style type='text/css'>"+result.text+"</style>")
			
			_fs.writeFile(path.join(__dirname, 'compiled.css'), result.text, 'utf-8', (err) => {
				if(err)
					throw err
				
				log("Sass done (" + _prf.stop("sass") + "ms)")
			})
		}
	})
}

processSassFiles(sass_defs)

function modSassString(str, mod) {
    // specific icomoon-generated-content modifier
    if(mod === "iconsToMixins") {
        var result = ""
        str.replace(/\.icon-(?:\s*\S+\s*{[^}]*})+/gim, function(m) {
            result += m.replace(/\.icon-/gi, "@mixin -").replace(/\:before/gi, "()") + "\n";
        })

        str += result
    }

    return str
}

function listAllZIndices() {
    window._idc = {}

    var items = document.getElementsByTagName("*"),
        z

    for (var i = items.length; i--;) {
        z = getComputedStyle(items[i]).zIndex

        if(z) {
            if(!_idc[z])
                _idc[z] = []
            _idc[z].push(items[i])
        }
    }
}