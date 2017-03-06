
var filemanager = new (function() {

	this.resources = []
	this.resByPaths = {}
	
	this.addResource = function(p, stats) {
		
		if(!stats)
			stats = _fs.statSync(p)
		
		if(this.hasResourceOfPath(p))
			return false
		
		let base = path.basename(p),
			res = {
			"path": p,
			stats,
			"name": base,
			"leaf": path.extname(p),
			"dirName": p.substring(0, p.length - base.length - 1)
		}
		
		this.resources.push(res)
		this.resByPaths[path] = res
		
		execHook("onResourceAdded", res)
		
		return res
	}

	this.hasResourceOfPath = function(p) {
		let r = this.resources,
			l = r.length
			
		for(var i = 0; i < l; i++)
			if(r[i].path === p)
				return true
		
		return false
	}
	
	this.getResourceOfPath = function(p) {
		let r = this.resources,
			l = r.length
		
		for(var i = 0; i < l; i++)
			if(r[i].path === p)
				return r[i]
		
		return false
	}
	
	this.getResourcesCopy = function() {
        return this.resources.slice()
    }
	
	this.dropResource = function(res) {
		let a = [],
			r = this.resources,
			l = r.length
		
		for(var i = 0; i < l; i++)
			if(r[i] !== res)
				a.push(r[i])
		
		this.resources = a
	}
})()

function getResourcesData() {
	
	let a = []
	
	let r = filemanager.getResourcesCopy()
	for(let i = 0; i < r.length; i++)
		a.push(r[i].path)
	
	return a
}

class WorkspaceMaster {
	constructor() {
		this.wspaces = new Set()
		
		// restore workspaces by config
		let a = getConfig("workspaces")
		
		a.forEach(this.addWorkspace.bind(this))
	}
	
	/**
	 * returns a copy of the internal workspace holder
	*/
	getWorkspaces() {
		return new Set(this.wspaces)
	}
	
	/**
	* creates a workspaces directing at the given path
	*/
	addWorkspace(p) {
		let ws = new Workspace(p)
		this.wspaces.add(ws)
		
		return ws
	}
	
	/**
		stores paths of workspaces in an array into our json config file
	*/
	saveInConfig() {
		let a = []
		
		for(let w of this.wspaces)
			a.push(w.path)
		
		setConfig('workspaces', a)
	}
}

/**
* a workspace holds information about a specific folder inon the user's drive
* and collects data about editable components in the folder
*/

class Workspace {
	constructor(dir_path) {
		this.openedFiles = new Set()
		
		this.items = []
		
		this.path = dir_path
		
		this.loaded = false
		
		// load data
		fs.readdir(dir_path, (err, files) => {
			if(err) {
				error( "Could not list the directory.", err )
				return
			}
			
			let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))
			
			// make a recursive call to iterate all directories and fill in the linked tree
			let fn = function(files, dir, tree) {
				for(let i = 0; i < files.length; i++) {
										
					let p = path.join(dir, files[i])
					
					let stat = fs.statSync(p)
					if(!stat)
						continue;
					
					if(stat.isDirectory()) {
						let branch = new LinkedTree(files[i])
						tree.add(branch)
						
						let subdir = path.join(dir_path, files[i])
						
						let items = fs.readdirSync(subdir)
						
						if(items)
							fn(items, subdir, branch)
						
						// do some oc specific sorting...
					}
					else if(Workspace.isAcceptedFileType(path.extname(files[i])))
						tree.add(new LinkedTree(files[i]))
				}
			}
			
			this.tree = new LinkedTree("root")
			fn(files, dir_path, this.tree)
			
			this.loaded = true
			wmaster.saveInConfig()
		
			execHook("onWorkspaceLoad", this)
		})
	}
	
	getOpenedFiles() {
		
	}
	
	static isAcceptedFileType(ext) {
		switch(ext) {
			case ".ocf":
			case ".ocd":
			case ".ocg":
			case ".ocs":
			case ".txt":
			case ".glsl":
			case ".c":
				return true;
			default:
				return false;
		}
	}
	// TODO: watcher, detecting removal or change of opened files and inform user (n++ style)
}


var wmaster = new WorkspaceMaster()


// coding space