
/*
	templateDef.json structure: 
	{
		// name that will displayed in template selection
		"name": "Scenario.ocs",
		// autofills that are requested
		"input": "title|author|version|desc",
		// if there is only a single file to clone (e.g. Script.c) then this is the name of the file
		"single": "Script.c"
		// extension
		"ext": "ocs"
	}
*/

const {Transform} = require("stream")
const regexp = /(?:^|<)<\$(\w+)>>(?!\w)/gm

class AutofillStream extends Transform {
	constructor(options, fillIns) {
		super(options)
		
		this.fillIns = fillIns
	}
	
	_transform(buffer, encoding, callback) {		
		let data = buffer.toString().replace(regexp, (m, p1) => {							
			if(p1 === "author")
				return this.fillIns.author
			else if(p1 === "version")
				return this.fillIns.version
			else if(p1 === "title")
				return this.fillIns.title
			else if(p1 === "desc")
				return this.fillIns.desc
			
			return m
		})
		
		callback(null, data)
	}
}

class TemplateLoader {
	constructor() {
		this.templates = []
		
		this.loadTemplates(path.join(__rootdir, "templates"))
		this.loadTemplates(path.join(__appdir, "templates"))
	}
	
	/**
		load templates that get shipped with this program
	*/
	loadTemplates(dirpath) {
		
		let files
		try {
			files = fs.readdirSync(dirpath)
		}
		catch(err) {
			error(`Could not load templates from path ${dirpath} (${err})`)
			return
		}
		
		for(let i = 0; i < files.length; i++) {
			try {
				let tpath = path.join(dirpath, files[i])
				let json = fs.readFileSync(path.join(tpath, "templateDef.json"))
				
				let template = Template.fromJson(json)
				template.setPath(tpath)
				this.templates.push(template)
			}
			catch(err) {
				error(`Could not read template definition of directory ${files[i]} (${err})`)
			}
		}
	}
	
	/**
		@param {template} template to create from
		@param {tpath} destination path
		@param {fillIns} object containing value for the autofiller
		@param {callback} callback to execute after the creation has been performed
	*/
	createFromTemplate(template, parDir, fillIns, callback) {
		
		if(!fillIns.title || fillIns.title.length === 0)
			fillIns.title = template.name
		
		let ncp = require("ncp")
		// prevent overriding existing data
		let tpath = validateFilenameSync(path.join(parDir, fillIns.title + template.ext))
		
		if(template.single) {
			let read = fs.createReadStream(template.path)
			let trans = new AutofillStream(null, fillIns)
			let write = fs.createWriteStream(tpath)
			
			read.pipe(trans).pipe(write)
		}
		else {
			ncp(template.path, tpath,
				{
					filter: /templateDef.json/gi,
					transform: function (read, write) {log(read)
						read.pipe(new AutofillStream(null, fillIns)).pipe(write)
					},
				},
				(err) => {
					if(callback)
						callback(err)
				}
			)
		}
	}
	
	getTemplates() {
		return this.templates
	}
}

class Template {
	constructor(name, ext) {
		this.name = name
		this.ext = ext
	}
	
	setPath(p) {
		this.path = p
	}
	
	static fromJson(json) {
		let data = JSON.parse(json)
		
		if(!data)
			throw new Error("No json does not contain data to parse a template from")
		
		// require fields
		if(!data.name || !data.ext)
			throw new Error("Template json misses required properties.")
		
		let t = new Template(data.name, data.ext)
		// ensure autofill to be an array of strings
		if(data.autofill && data.autofill.length)
			t.autofill = data.autofill.split("|")
		else
			t.autofill = ["none"]
		
		// set if the template consists only of a single file
		if(data.single && data.single === "true")
			t.single = true
		
		return t
	}
}

module.exports = new TemplateLoader()