/**
	The WorkspaceMaster manages and stores the single Workspace instances
	and handles opening single files.
*/
class WorkspaceMaster {
	constructor() {
		this.wspaces = []
		
		// restore workspaces by config
		let a = getConfig("workspaces")
		
		if(a)
			a.forEach(this.addWorkspace.bind(this))
		
		this.opened = []
		
		// remove finfo from file opened list
		hook.in("onFileClosed", (finfo) => {
			removeArrayItem(this.opened, finfo)
		})
	}
	
	/**
		Opens a file in editor
		@param {FileInfo} finfo - FileInfo Object to open
		@return {boolean} returns weather the file is already opened
	*/
	openFile(finfo) {
		// don't try to open directories
		if(finfo.stat.isDirectory())
			return false
		
		// check if this file allowed to be opened in our app
		if(!WorkspaceMaster.isEditableExt(finfo.ext))
			return false
		
		if(this.fileOpened(finfo.path)) {
			hook.exec("onOpenedFileSelect", finfo)
			return true
		}
		
		this.opened.push(finfo)
		hook.exec("onFileOpen", finfo)
		
		return false
	}
	
	/**
		Checks if a file of the given path
		is already opened
		@param {string} p - path to check
	*/
	fileOpened(p) {
		for(let i = 0; i < this.opened.length; i++)
			if(this.opened[i].path === p)
				return this.opened[i]
		
		return false
	}
	
	/**
		Returns the opened files
	*/
	getOpenedFiles() {
		return this.opened
	}
	
	/**
		Opens a file by its path.
		If the file is already opened, an event is emitted to it instead.
		@param {string} p - The path of the file to open
	*/
	openFileByPath(p) {
		// check if file of this path is already opened
		let finfo = this.fileOpened(p)
		
		if(finfo) {
			hook.exec("onOpenedFileSelect", finfo)
			return
		}
		
		// otherwise create FileInfo and open the file
		fs.stat(p, (err, stat) => {
			if(err)
				throw err
			
			finfo = new FileInfo(p, stat)
			this.opened.push(finfo)
			hook.exec("onFileOpen", finfo)
		})
	}
	
	/**
		Returns a copy of the internal workspace holder
		@return {array} - Array of Workspace instances
	*/
	getWorkspaces() {
		return this.wspaces.slice()
	}
	
	/**
		Creates a workspace directing to the given path
		@param {string} p - The path to create a workspace from
	*/
	addWorkspace(p) {
		let ws = new Workspace(p)
		this.wspaces.push(ws)
		
		return ws
	}
	
	/**
		Stores paths of workspaces into thhe json config file
	*/
	saveInConfig() {
		let a = []
		
		for(let w of this.wspaces)
			a.push(w.path)
		
		setConfig('workspaces', a)
	}
	
	/**
		Returns the index of the given workspace
		@param {Workspace} workspace - Workspace instead to look for
	*/
	getIndexOf(workspace) {
		for(let i = 0; i < this.wspaces.length; i++)
			if(workspace === this.wspaces[i])
				return i
		
		return -1
	}
	
	/**
		Returns a workspace identified by its index
		@param {number} idx- Index of the workspace
	*/
	getWorkspace(idx) {
		return this.wspaces[idx]
	}
	
	/**
		Checks if the given extension is one, that we want
		to open in an EditoView
		@param {string} ext - Extension to check. Must have preceding "."
	*/
	static isEditableExt(ext) {
		if( ext === ".c" ||
			ext === ".txt" ||
			ext === ".ocm" ||
			ext === ".glsl" ||
			ext === ".material")
			return true
		
		return false
	}
}

/**
	A Workspace instance holds information about a specific folder on the user's drive
	and collects data about editable components in that folder.
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
		Loads data of a directory into internal file info holder
		and invokes a callback with a linked tree as paramter, which reperesents the file hiearchy
		@param {string} dir_path Path of the directory
		@param {function} callback - Callback that gets called when loading has finished.
				Takes a LinkedTree as argument holding the hierarchy of the files
				represented by the indices of their FileInfo objects.
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
		Deletes a file or folder with all its descendants
		@param {number} idx - Index of the FileInfo instance, which is to delete
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
		Executes the c4group application to unpack a file
		@param {number} idx - FileInfo index
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
		Executes the c4group executable to unpack the file, given by the index
		of the local file info holder
		@param {number} idx - FileInfo index
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
				if(!tree.children)
					tree.children = []
				else // otherwise do the cr typical sorting
					tree.children = this.sortFileIndicesByExt(tree.children)
				
				// transfer children
				branch.children = tree.children
				
				// update stat (sync, because we are already in an async thread)
				this.finfo[idx].updateSync()
				
				// update workspace views
				hook.exec("onWorkspaceChange", this)
			})
		})
	}
	
	/**
		Returns the name of the workspace.
		@return {string} Name of the workspace, otherwise the basename of its path
	*/
	getName() {
		if(!this.name)
			return path.basename(this.path)
		
		return name
	}
	
	/**
		Pushes a FileInfo instance to the internal array and returns
		its index in the array
		@param {FileInfo} finfo - FileInfo instance to add
	*/
	addFileInfo(finfo) {
		let i = this.finfo.length
		
		this.finfo[i] = finfo
		
		return i
	}
	
	/**
		Renames the file of the given index
		@param {number} idx - FileInfo index of the file
		@param {string} fname - New name of the file
	*/
	renameFile(idx, fname) {
		let finfo = this.finfo[idx]
		
		if(!finfo)
			return
		
		let newPath = path.join(path.dirname(finfo.path), fname)
		// check if file already exists
		fs.stat(newPath, (err) => {
			if(err) {
				fs.renameSync(finfo.path, newPath)
				finfo.setPath(newPath)
				finfo.updateSync()
				// update workspace views
				hook.exec("onWorkspaceChange", this)
			}
			else
				alert("Such file already exists.\n${newPath}")
		})
	}
	
	/**
		Checks weather the given extension is editable and
		can therefore be opened in the editor frame
		@param {string} ext - Extension to check. Requires preceding "."
	*/
	static isAcceptedFileType(ext) {
		switch(ext) {
			case ".png":
			case ".jpg":
			case ".jpeg":
			case ".bmp":
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
		Returns a score for file extensions, indicating where to place
		them in file hierarchy. The highigher a score is, the higher its meant
		to be placed in difference to others.
		@param {string} ext - Extension to get the score of. Requires preceding "."
		@return {number} The score of the extension
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
		Sorts an array of LinkedTrees with file indices as their values
		by their corresponding extension (cr editor sorting)
		@param {array} fa - Array of LinkedTree to sort
		@return {array} Sorted array of LinkedTrees
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
	/**
		@param {string} p - The path of the file
		@param {Stat} stat - The stat object returned by fs.stat*()
		@param {string} name - Name of the file. Can be omitted.
	*/
	constructor(p, stat, name) {
		this.path = p
		this.stat = stat
		this.name = name || path.basename(p)
		this.ext = path.extname(this.name)
	}
	
	/**
		Sets the and updates name and ext property based
		on that path
		@param {string} p - Path to the file
	*/
	setPath(p) {
		this.path = p
		this.name = path.basename(p)
		this.ext = path.extname(this.ext)
	}
	
	/**
		Updates the stat property by calling fs.statSync()
	*/
	updateSync() {
		this.stat = fs.statSync(this.path)
	}
	
	/**
		Updates the stat property given by fs.stat() asynchronously
		and invokes the given callback afterwards with the
		FileInfo instance as argument
	*/
	update(callback) {
		fs.statSync(this.path, (stat) => {
			this.stat = stat
			
			if(callback)
				callback(this)
		})
	}
}