

{
	let template_defs = [
		"templates/Particle.ocd/templateDef.json",
		"templates/BasicObject.ocd/templateDef.json",
		"templates/StaticBack.ocd/templateDef.json",
		"templates/Scenario.ocs/templateDef.json"
	]
	
	let list = []
	
	for(let i = 0; i < template_defs.length; i++) {
		list[i] = require("../" + template_defs[i])
		list[i].path = template_defs[i].replace("/templateDef.json", "")
		list[i].ext = path.extname(list[i].path)
	}
	
	list.push({
		single: "true",
		path: "templates/Script.c",
		ext: ".c",
		input: "author|title",
		name: "Script.c"
	})
	
	module.exports.entries = list
}


module.exports.create = function(template, pth, {
	title, desc, author, version, ext
}, callback) {
	let ncp = require("ncp")
	let path = require("path")
	
	temppath = path.join(__rootdir, template.path)
	
	pth = path.join(pth, title + template.ext)
	
	if(template.single) {		
		let txt = fs.readFileSync(temppath, 'utf8')
					
		txt = txt.replace(/(?:^|<)<\$(\w+)>>(?!\w)/gm, (m, p1) => {
			
			if(p1 === "author")
				return author
			else if(p1 === "version")
				return version
			else if(p1 === "title")
				return title
			else if(p1 === "desc")
				return desc
			
			return m
		})
		
		fs.writeFileSync(pth, txt, 'utf8')
		
		return
	}
	
	fs.mkdirSync(pth)
	
	ncp(temppath, pth, 
		{ filter: /.*/ },// /^(?!templateDef).*$/gi },
		(err) => {
			if(err)
				throw err
			
			console.log(`created new resource from template '${template.path}'`)
			
			if(template.target && template.target.length) {
				let list = template.target.split("|")
				
				for(let i = 0; i < list.length; i++) {
					let targetpath = path.join(pth, list[i])
					let txt = fs.readFileSync(targetpath, 'utf8')
					
					txt = txt.replace(/(?:^|<)<\$(\w+)>>(?!\w)/gm, (m, p1) => {
						
						if(p1 === "author")
							return author
						else if(p1 === "version")
							return version
						else if(p1 === "title")
							return title
						else if(p1 === "desc")
							return desc
						
						return m
					})
					
					fs.writeFileSync(targetpath, txt, 'utf8')
				}
			}
			
			if(callback)
				callback()
		}
	)
}