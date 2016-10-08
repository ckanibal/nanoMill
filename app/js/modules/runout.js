class RuntimeInterface extends Layout_Module{

    constructor() {
		super()
		
		this.$wrap = $(`<div class='--RNINT-wrap flex-col'></div>`)
		this.$list = $(`<div class='flex-fill --RNINT-list'></div>`)
		let $el = $(`<div class='--RNINT-cmdline'></div>`)
		this.$cmd = $(`<input type='text' class='--RNINT-cmdinput'/>`)
		
		$(this.root).find('.mod-body').append(this.$wrap)
		this.$wrap.append(this.$list).append($el)
		$el.append(this.$cmd)
		
		this.$cmd.keyup((e) => {
			if(e.which === 13 && e.target.value.length)
				RuntimeInterface.interpretCommand(e.target.value, this)
		})
		
		// hook on scen start
		// hook on scen output
	}
	
	print(s) {
		this.$list.append(`<p class='--RNINT-entry'>${s}</p>`)
	}
	
	clear() {
		this.$list.html('')
	}
	
	getSpecialMenuProps() {
		return [
			{
				label: "Start editor",
				icon: "icon-plus",
				fn: _ => {
					$(":focus").blur()
					startEditor()
				}
			}
		]
	}
	
	static interpretCommand(cmds, mod) {
		let args = []
		
		let main = cmds.match(/^\w+/g)[0]
		let results = cmds.match(/(?:^|\W)--(\w+)(?!\w)/g)
		
		if(results)
			results.forEach(function(v) {
				v = v.trim()
				
				if(v === "--sel") {
					let cur = ResView.getCurrent()
					if(!cur) {
						mod.print("nothing selected to use '--sel' placeholder")
						return
					}
					else
						args.push(cur.path)
					
					return
				}
				else if(v === "--fscreen") {
					args.push("--fullscreen")
				}
				else if(v === "--deep") {
					args.push("--x")
				}
				
				args.push(v)
			})
		
		if(main === "run") {
			if(!getConfig("ocexe"))
				if(mod)
					mod.print("path to openclonk application is undefined")
				else
					return false
			
			startEditor(args)
		}
		else if(main === "pack") {
			if(!getConfig("c4group"))
				if(mod)
					mod.print("path to c4group is undefined")
				else
					return false
			
			args.push("-p")
			opC4group(args)
		}
		else if(main === "unpack") {
			if(!getConfig("c4group"))
				if(mod)
					mod.print("path to c4group is undefined")
				else
					return false
			
			args.push("-x")
			opC4group(args)
		}
		else if(main === "unzip") {			
			gunzip(argse)
		}
		else if(main === "help" && mod)
			mod.print(helpInfo())
		else if(main === "clear" && mod)
			mod.clear()
		else if(main === "clearall" && mod)
			mod.clear()
		else if(mod)
			mod.print(`unknown command '${main}'`)
		else
			return false
	}
}

RuntimeInterface.def = {
	alias: "runout",
	className: RuntimeInterface,
	title: "Runtime interface"
}

registerModule(RuntimeInterface.def)

let cprocess = require('child_process')
var editor_proc

function startEditor(args) {
	if(!editor_proc) {
		if(args)
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`, ...args])
		else
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`])
		
		editor_proc.stdout.on('data', function (data) {log(arguments)
			console.log(data)
		})
		
		editor_proc.stdout.on('end', function (data) {
			console.log(data)
		})

		editor_proc.stderr.on('data', function (data) {
			console.log('stderr: ' + data.toString())
		})

		editor_proc.on('exit', function (code) {
			console.log('child process exited with code ' + code.toString())
			editor_proc = false
		})
	}
}

function opC4group(args, mod) {
	if(!args)
		return false
	
	cprocess.spawn(getConfig("c4group"), args)
	
	return true
}

function gunzip(args) {/*
	let zlib = require("zlib")
	let tar = require("tar-fs")
	let unzip = zlib.createUnzip()
	let inp = _fs.createReadStream(args[0])
	let out = __appDir
	
	inp.pipe(unzip).pipe(tar.extract(out))
	
	return true*/
}

function helpInfo() {
	return "\
commands:\n\
run 				starts openclonk with given parameters - by default in windowed mode\n\
help				shows additional information for commandline usage\n\
clear				clears log\n\
clearall			clears all logs (not yet)\n\
\n\
pseudo-switches:\n\
--sel				path to currently selected resource\n\
--fscreen			alias for --fullscreen\n\
".replace(/\n/gi, "<br>")
}