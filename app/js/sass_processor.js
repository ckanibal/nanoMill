var sass_defs = [
    {
        src: "../sass/fonts.scss"
    },
	{
        src: "../sass/main.scss"
    },
    {
        src: "../sass/icomoon.css",
        mod: "iconsToMixins"
    },
    {
        src: "../sass/flex.scss"
    },
    {
        src: "../sass/mod.scss"
    },
    {
        src: "../sass/mod_nav.scss"
    },
    {
        src: "../sass/mod_res_view.scss"
    },
    {
        src: "../sass/mod_ace.scss"
    },
    {
        src: "../sass/mod_ace_theme.scss"
    },
    {
        src: "../sass/mod_runint.scss"
    },
    {
        src: "../sass/mod_meshviewer.scss"
    }
]

module.exports.parseScss = function() {
	
	let defs = sass_defs
	
	let path = require("path")
	let worker = require(path.join(__rootdir, "external", "sass.worker.js"))
	let _sass = require(path.join(__rootdir, "external", "sass.js"))
	let Sass = new _sass(path.join(__rootdir, "external", "sass.worker.js"))
	
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
			
			error(`Sass compilation error: ${result.message}\n${result.formatted}\n`)
			window._failedSassString = whole
		}
		else {
			if(document.getElementById("compiled_style"))
				document.getElementById("compiled_style").innerHTML = result.text
			else
				$(document.head).append("<style id='compiled_style' type='text/css'>"+result.text+"</style>")
			
			_fs.writeFile(path.join(__rootdir, 'compiled.css'), result.text, 'utf8', (err) => {
				if(err)
					throw err
				
				log("Sass done (" + _prf.stop("sass") + "ms)")
			})
		}
	})
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