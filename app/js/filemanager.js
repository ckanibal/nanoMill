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
		
		this.loadDirectory(dir_path, (tree) => {
			this.loaded = true
			wmaster.saveInConfig()
			this.tree = tree
			execHook("onWorkspaceLoad", this)
		})
	}
	
	/**
		loads data of a directory into internal file info holder
		and invokes a callback with a linked tree as paramter, which reperesents the file hiearchy
	*/
	loadDirectory(dir_path, callback) {		
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
						//else
						// ...
						
					}
				}
			}
			
			let tree = new LinkedTree("root")
			fn(files, dir_path, tree)
			
			if(callback)
				callback(tree)
		})
	}
	
	unlinkFile(idx) {
		// sanity check
		if(!this.finfo[idx])
			return
		
		fs.unlink(this.finfo[idx].path)
		
		this.finfo[idx] = undefined
		// detach from tree
		let branch = this.tree.removeElementOfVal(idx)
		// dereference any file info object, which is referenced by the descendants
		// of branch
		branch.forEach((idx) => {
			this.finfo[idx] = undefined
		})
		
		execHook("onWorkspaceChange", this)
	}
	
	/*
		executes the c4group executable to unpack the file, given by the index
		of the local file info holder
	*/
	packFile(idx) {
		// command the c4group(.exe) to unpack our targeted file
		runC4Group([this.finfo[idx].path, "-p"], false, () => {
			// find element in tree
			let branch = this.tree.getElementByVal(idx)
			// remove all file infos referenced by the found element's children
			branch.forEach((val) => {
				this.finfo[val] = undefined
			})
			// detach children from element
			branch.removeChildren()
			// update file info
			this.finfo[idx].updateSync()
			// update workspace views
			execHook("onWorkspaceChange", this)
		})
	}
	
	/*
		executes the c4group executable to unpack the file, given by the index
		of the local file info holder
	*/
	unpackFile(idx) {
		runC4Group([this.finfo[idx].path, "-u"], false, () => {
			// branch to update
			let branch = this.tree.getElementByVal(idx)
			
			let unpack_dir = this.finfo[idx].path
			this.loadDirectory(unpack_dir, (tree) => {
				branch.children = tree.children
				
				// update stat
				this.finfo[idx].updateSync()
				
				// update workspace views
				execHook("onWorkspaceChange", this)
			})
		})
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
	
	updateSync() {
		this.stat = fs.statSync(this.path)
	}
	
	update() {
		fs.statSync(this.path, (stat) => {
			this.stat = stat
		})
	}
}

// coding space