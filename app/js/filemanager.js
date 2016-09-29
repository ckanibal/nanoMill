
var filemanager = new (function() {

	this.resources = []
	
	this.addResource = function(file) {
		if(this.hasResource(file))
			return false
		
		this.resources.push(file)
		
		execHook("onResourceAdded", file)
		
		return true
	}

	this.hasResource = function(file) {
		let r = this.resources,
			l = r.length
			
		for(var i = 0; i < l; i++)
			if(r[i] === file)
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