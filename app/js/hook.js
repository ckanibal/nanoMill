let hooks = {}

function hook(name, fn, modId) {
	
	if(!modId && modId !== 0)
		modId = -1
	
    if(!hooks[name])
        hooks[name] = []

    hooks[name].push({ fn, modId })
}

function execHook(name, ...args) {
    for(let fnName in hooks[name])
        if(hooks[name][fnName].fn(...args))
            return
}

function removeByModuleId(modId) {
	for(let hookName in hooks) {
		let a = []
		let fnList = hooks[hookName]
		for(let i = 0; i < fnList.length; i++)
			if(fnList[i].modId !== modId)
				a.push(fnList[i])
		
		hooks[hookName] = a
	}
}

module.exports = {
	exec: execHook,
	in: hook,
	removeByModuleId
}