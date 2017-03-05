class RuntimeInterface extends Layout_Module{

    constructor(modId) {
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
		
		hook("onStdOut", (s) => {
			this.print(s)
		}, modId)
		
		hook("clearAllRunInts", _ => this.clear(), modId)
	}
	
	print(s) {
		let $e = this.$list
		if($e[0].scrollHeight - $e[0].scrollTop - parseInt($e.height()) < 11) {
			$e.append(`<p class='--RNINT-entry'>${s}</p>`)
			$e[0].scrollTop = 1000000
		}
		else
			$e.append(`<p class='--RNINT-entry'>${s}</p>`)
	}
	
	clear() {
		this.$list.html('')
	}
	
	clearInput() {
		this.$cmd.val("")
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
	
	static validateStdout(s) {
		s = s.replace(/\\/g, "/")
		s = s.replace(/\[(.+?)\]/, function(m, v1) {
			return `<span class="--RUNINT-time-stamp">${v1}</span>`
		})
		
		s = s.replace(/ERROR\:\s*.+/, function(m) {			
			m = m.replace(/\(([^)']+?)\)/, function(m2, v1) {
				return `<span class="--RUNINT-link" onclick="RuntimeInterface.openTextAt('${v1}')">${m2}</span>`
			})
			
			return `<span class="--RUNINT-error">${m}</span>`
		})
		
		s = s.replace(/by\:\s*.+/, function(m) {
			return `<span class="--RUNINT-stack-trace">${m}</span>`
		})
		
		return s
	}
	
	static openTextAt(s) {log(s)
		let [p, l, c] = s.split(":")
		p = p.match(/[^\s]+$/)[0]
		
		
	}
	
	static interpretCommand(cmds, mod) {
		if(mod)
			mod.print('> ' + cmds)
		
		let args = []
		
		let main = cmds.match(/^\w+/g)
		if(!main) {
			if(mod)
				mod.print("syntax error - type command first. try 'help'")
			return
		}
		else
			main = main[0]
		
		let results = cmds.match(/(?:^|\W)-+(\w+)(?!\w)/g)
		
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
				else if(v === "--fsc") {
					args.push("--fullscreen")
				}
				else if(v === "--deep") {
					args.push("--x")
				}
				else if(v === "--debug") {
					args.push("--debug=" + PORT)
				}
				else
					args.push(v)
			})
		
		if(_params[main])
			args = _params[main].slice().concat(args)
		
		if(main === "run") {
			if(!getConfig("ocexe"))
				if(mod)
					mod.print("path to openclonk application is undefined")
				else
					return false
			
			startEditor(args)
			if(mod)
				mod.clearInput()
		}
		else if(main === "kill") {
			if(mod) {
				if(editor_proc) {
					mod.print("killing child openclonk process")
					editor_proc.kill()
				}
				else
					mod.print("there is no child process of openclonk to kill")
				
				mod.clearInput()
			}
			else if(editor_proc)
				editor_proc.kill()				
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
		else if(main === "c4group") {
			if(!getConfig("c4group"))
				if(mod)
					mod.print("path to c4group is undefined")
				else
					return false
			
			if(mod)
				opC4group(args, mod, true)
		}
		else if(main === "help" && mod) {
			mod.print(helpInfo())
			mod.clearInput()
		}
		else if(main === "clear" && mod) {
			mod.clear()
			mod.clearInput()
		}
		else if(main === "setp") {
			let cmd = cmds.substring(main.length + 1).match(/^\w+/g)
			
			if(!cmd && !(cmd === "run" || cmd === "pack" || cmd === "unpack"))
				mod.print(`failed to set params for '${cmd}'`)
			else {
				_params[cmd[0]] = [...args]
				mod.clearInput()
			}
		}
		else if(main === "getp") {
			let cmd = cmds.substring(main.length + 1).match(/^\w+/g)
			
			if(!cmd)
				mod.print(`failed to get set params of '${cmd}'`)
			else if(_params[cmd]) {
				mod.print(_params[cmd].join(" "))
				mod.clearInput()
			}
			else
				mod.print(`no params set for cmd '${cmd}'`)
		}
		else if(main === "clearall") {
			execHook("clearAllRunInts")
			if(mod)
				mod.clearInput()
		} 
		else if(main === "siedlerclonk") {
			toggleDevMode()
			
			if(mod)
				mod.clearInput()
		}
		else if(mod)
			mod.print(`unknown command '${main}'`)
		else
			return false
	}
}

RuntimeInterface.def = {
	alias: "runint",
	className: RuntimeInterface,
	title: "Runtime interface"
}

registerModule(RuntimeInterface.def)

var editor_proc

function startEditor(args) {
	if(!editor_proc) {
		if(args)
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`, ...args])
		else
			editor_proc = cprocess.spawn(getConfig("ocexe"), [`--editor`])
		
		editor_proc.stdout.on('data', function (data) {
			execHook("onStdOut", RuntimeInterface.validateStdout(data.toString()))
		})
		
		editor_proc.on('exit', function (code) {
			if(code)
				log('child process exited with code ' + code.toString())
			
			editor_proc = false
		})
	}
}

/**
Commands: -l List
          -x Explode
          -u Unpack
          -p Pack
          -t [filename] Pack To
          -y [ppid] Apply update (waiting for ppid to terminate first)
          -g [source] [target] [title] Make update
          -s Sort

Options:  -v Verbose -r Recursive
          -i Register shell -u Unregister shell
          -x:<command> Execute shell command when done

Examples: c4group pack.ocg -x
          c4group update.ocu -g ver1.ocf ver2.ocf New_Version
          c4group -i
*/

function opC4group(args, mod, fListenStdOut) {
	if(!args)
		return false
	
	if(!fListenStdOut)
		cprocess.spawn(getConfig("c4group"), args)
	else {
		let proc = cprocess.spawn(getConfig("c4group"), args)
		
		proc.stdout.on('data', function (data) {
			execHook("onStdOut", RuntimeInterface.validateStdout(data.toString()))
		})
		
		proc.on('exit', function (code) {
			if(code)
				log('child process exited with code ' + code.toString())
		})
	}
	
	return true
}

function helpInfo() {
	return "\
commands:\n\
run 				starts openclonk with given parameters - by default in windowed mode\n\
kill				closes openclonk\n\
help				shows additional information for commandline usage\n\
clear				clears log\n\
clearall			clear all logs\n\
pack				packs target\n\
unpack				unpacks target \n\
setp <cmd_name>		sets default parameters of a command\n\
getp <cmd_name>		returns the set default parameters of a command\n\
\n\
pseudo-switches:\n\
--sel				path to currently selected resource\n\
--fsc				alias for --fullscreen\n\
\n\
hotkeys:\n\
ctrl+r				executes 'run --sel' in pseudo-console\n\
ctrl+q				executes 'kill' in pseudo-console\n\
".replace(/\n/gi, "<br>")
}
/**
to be undocumented

siedlerclonk		toggles devMode; needs restart of app to take effect
*/

var _params = {}

var PORT = 300