
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
}

var wmaster = new WorkspaceMaster()

/**
* a workspace holds information about a specified folder in on the users drive
* and collects data about editable components in the folder
*/

class Workspace {
	constructor(dir_path) {
		this.openedFiles = new Set()
		this.files = []
		this.dirs = []
		
		this.loaded = false
		
		// load data
		
	}
	
	getOpenedFiles() {
		
	}
	// TODO: watcher, detecting removal or change of opened files and inform user (n++ style)
}

/**
* a class that represents a directory
*/
class Directory {
	constructor() {
		
	}
}


// coding space