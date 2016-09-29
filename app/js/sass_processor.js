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

var sassCounter = 0, sassText = ""

function addToSassList(text) {

    sassCounter++

    sassText += text + "\n\n"

    if(sassCounter === sass_defs.length) {
        Sass.compile(sassText, function(result) {

            if(result.message)
                log("Sass error: " + result.message, ERR)
            else {
                $(document.head).append("<style type='text/css'>"+result.text+"</style>")
				
				_fs.writeFile(path.join(__dirname, 'compiled.css'), result.text, 'utf-8', (err) => {
					if(err)
						throw err
					
					log("Created compiled.css", INFO)
				})
            }
        })
    }
}

var _prf = {
	keys: {},
	
	start: function(key) {
		this.keys[key] = (new Date()).getTime()
	},
	stop: function(key, fprint) {
		var t = (new Date()).getTime() - this.keys[key]
		
		if(fprint)
			log("Profiled [" + key + "] : " + t)
		
		return t
	}
}

// change to async iterator function with sync file operations

{
	if(Sass) {
		for(var i in sass_defs) {
		   _fs.readFile(path.join(__dirname, sass_defs[i].src), 'utf8', function(err, text) {
			   if(err)
				   throw err
			   
			   if(sass_defs[i].mod)
				   text = modSassString(text, sass_defs[i].mod)

			   addToSassList(text)
		   })
		}
	}
	else
		log("SassProcessor: Sass required", WARN)
}

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