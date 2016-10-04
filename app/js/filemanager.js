
var filemanager = new (function() {

	this.resources = []
	this.resByPaths = {}
	
	this.addResource = function(p, stats) {
		
		if(!stats)
			stats = _fs.statSync(p)
		
		if(this.hasResourceOfPath(p))
			return false
		
		let res = {
			"path": p,
			stats,
			"name": path.basename(p),
			"leaf": path.extname(p)
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
	
	this.getResourcesCopy = function() {
        return this.resources.slice()
    }

    // TODO: init Watcher, detecting loss of linked files
})()

function getResourcesData() {
	
	let a = []
	
	let r = filemanager.getResourcesCopy()
	for(let i = 0; i < r.length; i++)
		a.push(r[i].path)
	
	return a
}