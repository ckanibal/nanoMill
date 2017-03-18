let sass_defs = [{
	destname: path.join(__rootdir, 'preprocessed.css'),
	sources: [
		{
			src: "../sass/fonts.scss"
		},
		{
			src: "../sass/head.scss"
		},
		{
			src: "../sass/icomoon.css",
			mod: "iconsToMixins"
		},
		{
			src: "../sass/main.scss"
		},
		{
			src: "../sass/tree_list.scss"
		},
		{
			src: "../sass/contextmenu.scss"
		},
		{
			src: "../sass/dialog-ui.scss"
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
			src: "../sass/mod_ace.scss"
		},
		{
			src: "../sass/mod_ace_theme.scss"
		},
		{
			src: "../sass/mod_console.scss"
		},
		{
			src: "../sass/mod_explorer.scss"
		}
	]}
]

module.exports.parseScss = function() {
	
	let processFile = function(fname, defs) {
		let worker = require(path.join(__rootdir, "external", "sass.worker.js"))
		let _sass = require(path.join(__rootdir, "external", "sass.js"))
		let Sass = new _sass(path.join(__rootdir, "external", "sass.worker.js"))
		
		if(!Sass)
			return warn("Cannot pre-process css-file; Sass not given")
		
		let readFn = function*(defs) {
			for(let i = 0; i < defs.length; i++) {
				let txt = fs.readFileSync(path.join(__dirname, defs[i].src), 'utf8')
				
				if(defs[i].mod)
					txt = modSassString(txt, defs[i].mod)
				
				yield txt
			}
		}
		
		console.time("sass")
		
		let whole = ""
		
		for(let single of readFn(defs))
			whole += single + "\n"
		
		Sass.compile(whole, (result) => {
			if(result.message) {
				error(`Sass compilation error: ${result.message}\n${result.formatted}\n`)
			}
			else {
				if(document.getElementById("compiled_style"))
					document.getElementById("compiled_style").innerHTML = result.text
				else
					document.head.insertAdjacentHTML("beforeend", `<style id='compiled_style' type='text/css'>${result.text}</style>`)
				
				fs.writeFile(fname, result.text, 'utf8', (err) => {
					if(err)
						throw err
					
					console.timeEnd("sass")
				})
			}
		})
	}
	
	for(let i = 0; i < sass_defs.length; i++)
		processFile(sass_defs[i].destname, sass_defs[i].sources)
}

function modSassString(str, mod) {
    // specific icomoon-generated-content modifier
    if(mod === "iconsToMixins") {
        let result = ""
        str.replace(/\.icon-(?:\s*\S+\s*{[^}]*})+/gim, function(m) {
            result += m.replace(/\.icon-/gi, "@mixin -").replace(/\:before/gi, "()") + "\n";
        })

        str += result
    }
	
    return str
}