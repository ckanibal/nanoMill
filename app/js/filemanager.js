
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
		this.wspaces = []
		
		// restore workspaces by config
		let a = getConfig("workspaces")
		
		if(a)
			a.forEach(this.addWorkspace.bind(this))
	}
	
	/**
	 * returns a copy of the internal workspace holder
	*/
	getWorkspaces() {
		return this.wspaces.slice()
	}
	
	/**
	* creates a workspaces directing at the given path
	*/
	addWorkspace(p) {
		let ws = new Workspace(p)
		this.wspaces.push(ws)
		
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
	
	getIndexOf(workspace) {
		for(let i = 0; i < this.wspaces.length; i++)
			if(workspace === this.wspaces[i])
				return i
		
		return -1
	}
	
	getWorkspace(index) {
		return this.wspaces[index]
	}
}

/**
* a workspace holds information about a specific folder inon the user's drive
* and collects data about editable components in the folder
*/

class Workspace {
	constructor(dir_path) {
		this.path = dir_path
		// file info storage
		this.finfo = []
		// represents the directory hierarchy with indices for finfo
		this.tree = null
		// holder of indices of opened files
		this.opened = new Set()
		
		this.loaded = false
		
		// collect directory information
		fs.readdir(dir_path, (err, files) => {
			if(err) {
				error( "Could not list the directory.", err )
				return
			}
			
			let LinkedTree = require(path.join(__dirname, "js/lib/linkedtree.js"))
			
			// make a recursive call to iterate all directories and fill in the linked tree
			let fn = (files, dir, tree) => {
				for(let i = 0; i < files.length; i++) {
										
					let p = path.join(dir, files[i])
					
					let stat = fs.statSync(p)
					if(!stat || !(stat.isDirectory() || Workspace.isAcceptedFileType(path.extname(files[i]))))
						continue
					
					// add information about the file to local info holder
					// and save its array index into the linked tree
					let idx = this.addFileInfo(new FileInfo(p, stat, files[i]))
					let branch = new LinkedTree(idx)
					tree.addChild(branch)
					
					// subdirectory to take a look into
					if(stat.isDirectory()) {
						
						let subdir = path.join(dir, files[i])
						
						let items = fs.readdirSync(subdir)
						
						if(items)
							fn(items, subdir, branch)
						
						// if there are no valid files found in subdirectory,
						// still assign an assign to branch, so it gets recoginized as
						// a parent tree item
						if(!branch.children)
							branch.children = []
						// otherwise sort in an clonk typical manner
						
						// ...
						
					}
				}
			}
			
			this.tree = new LinkedTree("root")
			fn(files, dir_path, this.tree)
			
			this.loaded = true
			wmaster.saveInConfig()
		
			execHook("onWorkspaceLoad", this)
		})
	}
	
	unlinkFile(i) {
		// sanity check
		if(!this.finfo[i])
			return
		
		fs.unlink(this.finfo[i].path)
		
		this.finfo[i] = null
		
		// remove from linked tree
		let fn = (tree) => {
			for(let i = 0; i < tree.children; i++) {
				if(tree.children[i].value === i) {
					tree.removeChild(tree.children[i])
					break
				}
				else
					fn(tree.children[i])
			}
		}
		
		fn(this.tree)
	}
	
	/**
		getter of name property, if no name set returns the basename of the specified path instead
	*/
	getName() {
		if(!this.name)
			return path.basename(this.path)
		
		return name
	}
	
	addFileInfo(finfo) {
		let i = this.finfo.length
		
		this.finfo[i] = finfo
		
		return i
	}
	
	fileOpened(i) {
		return this.opened.has(i)
	}
	
	openFile(i) {
		if(this.fileOpened(i))
			return
		
		// execute listeners
		execHook("onFileOpen", this.finfo[i])
		
		this.opened.add(i)
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
	// (and show newly added files, could be checked when window gets the focused)
}


var wmaster = new WorkspaceMaster()

class FileInfo {
	constructor(p, stat, name) {
		this.path = p
		this.stat = stat
		this.name = name
		this.ext = path.extname(name)
		this.leaf = this.ext // deprecated
	}
}

// coding space