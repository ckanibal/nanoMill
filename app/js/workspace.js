/**
	The WorkspaceMaster manages and stores the single Workspace instances.
*/
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
	
	/**
		returns the index of the given workspace
	*/
	getIndexOf(workspace) {
		for(let i = 0; i < this.wspaces.length; i++)
			if(workspace === this.wspaces[i])
				return i
		
		return -1
	}
	
	/**
		returns a workspace identified by its index
	*/
	getWorkspace(index) {
		return this.wspaces[index]
	}
}

/**
* a workspace holds information about a specific folder on the user's drive
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
		// weather the first execution of loadDirectory has been finished
		this.loaded = false
		
		this.loadDirectory(dir_path, (tree) => {
			this.loaded = true
			wmaster.saveInConfig()
			this.tree = tree
			hook.exec("onWorkspaceLoad", this)
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
						else
							branch.children = this.sortFileIndicesByExt(branch.children)
					}
				}
			}
			
			let tree = new LinkedTree("root")
			fn(files, dir_path, tree)
			tree.children = this.sortFileIndicesByExt(tree.children)
			
			if(callback)
				callback(tree)
		})
	}
	
	/**
		deletes a file or folder with all its descendants
	*/
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
		
		hook.exec("onWorkspaceChange", this)
	}
	
	/**
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
			hook.exec("onWorkspaceChange", this)
		})
	}
	
	/**
		executes the c4group executable to unpack the file, given by the index
		of the local file info holder
	*/
	unpackFile(idx) {
		runC4Group([this.finfo[idx].path, "-u"], false, () => {
			// branch to update
			let branch = this.tree.getElementByVal(idx)
			
			let unpack_dir = this.finfo[idx].path
			this.loadDirectory(unpack_dir, (tree) => {
				// if there are no valid files found in subdirectory,
				// still assign an assign to branch, so it gets recoginized as
				// a parent tree item
				if(!branch.children)
					branch.children = []
				else
					branch.children = this.sortFileIndicesByExt(tree.children)
				
				// update stat (sync, because we are already in an async thread)
				this.finfo[idx].updateSync()
				
				// update workspace views
				hook.exec("onWorkspaceChange", this)
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
	
	/**
		pushes a FileInfo instance to the internal array and returns
		its index in the array
	*/
	addFileInfo(finfo) {
		let i = this.finfo.length
		
		this.finfo[i] = finfo
		
		return i
	}
	
	/**
		checks if the file of the given index is marked
		as opened or not
	*/
	fileOpened(i) {
		return this.opened.has(i)
	}
	
	/**
		opens the file of the given index
	*/
	openFile(i) {
		if(this.fileOpened(i))
			return
		
		// execute listeners
		hook.exec("onFileOpen", this.finfo[i])
		
		this.opened.add(i)
	}
	
	/**
		checks weather the given extension is editable and
		can therefore be opened in the editor frame
	*/
	static isAcceptedFileType(ext) {
		switch(ext) {
			case ".ogg":
			case ".wav":
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
	
	/**
		the higher the value for the specific file extension is, the higher
		it getes placed in the directory view
	*/
	static getExtSortValue(ext) {
		switch(ext) {
			case ".ocf":
			return 15
			case ".ocg":
			return 10
			case ".ocd":
			return 1
			
			default:
			return 5
		}
	}
	
	/**
		sorts an array of LinkedTrees with file indices as their values
		by their corresponding extension (cr editor sorting)
	*/
	sortFileIndicesByExt(fa) {
		if(!fa)
			return fa
		
		// copy input to not corrupt things outside this function
		fa = fa.slice()
		let a = []
		
		for(let q = 0; q < fa.length; q++) {
			let lowest
			let value = 0
			for(let i = 0; i < fa.length; i++) {
				let branch = fa[i]
				// ignore deleted entries
				if(branch !== null) {
					let val = Workspace.getExtSortValue(this.finfo[branch.value].ext)
					if(val > value) {
						lowest = i
						value = val
					}
				}
			}
			
			a.push(fa[lowest])
			// delete item from source list
			fa[lowest] = null
		}
		
		return a
	}
	
	// TODO: watcher: detecting removal or change of opened files and inform user (n++ style)
	// (and show newly added files, could be checked when window gets the focused)
}

// create a global instance
var wmaster = new WorkspaceMaster()

/**
	The file info class represents single files in a workspace, containing
	the most basic information of their files.
	The stat property, containg the result from from fs.stat* may not be up-to-date.
	Therefor you can use update() and updateSync() to achieve that.
*/
class FileInfo {
	constructor(p, stat, name) {
		this.path = p
		this.stat = stat
		this.name = name
		this.ext = path.extname(name)
	}
	
	/**
		updates the stat property given by fs.stat() synchronously
	*/
	updateSync() {
		this.stat = fs.statSync(this.path)
	}
	
	/**
		updates the stat property given by fs.stat() asynchronously
		and invokes the given callback afterwards with the FileInfo instance
		as parameter
	*/
	update(callback) {
		fs.statSync(this.path, (stat) => {
			this.stat = stat
			
			if(callback)
				callback(this)
		})
	}
}

// coding space