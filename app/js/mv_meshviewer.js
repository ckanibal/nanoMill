/**
	TODO: to use less memory
	
	limit skinning palette matrices to 4v3s
*/

const
	FSHADER = 1,
	VSHADER = 2

const
	ZOOM_FACTOR = 0.1

function RGBToClr(r, g, b) {
	return (255 << 24) | (r & 255) << 16 | (g & 255) << 8 | (b & 255)
}

function RGBaToClr(r, g, b, a) {
	return (a << 24) | (r & 255) << 16 | (g & 255) << 8 | (b & 255)
}

function ClrToRGBa(clr) {
	return {
		r: (clr >> 16 ) & 255,
		g: (clr >> 8 ) & 255,
		b: (clr ) & 255,
		a: (clr >> 24 ) & 255
	}
}

function composeShaderString(flags) {
	
	if(flags & SHADER_OPTION_TYPE) {
		
		var str = ""
		
		str += "attribute vec3 aVertexPosition;\n"
		
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "attribute float barycentric;\n"+
				"varying vec3 vBC;\n"
		
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "varying vec2 uv;\n"+
					"attribute vec2 vUV;\n"
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "varying vec4 diffuse_color;\n"+
					"attribute vec4 vDiffuseColor;\n"
		
		if(flags & SHADER_OPTION_SKELETON) {
			var assignmentCounts = getMaxAssignmentsOfFlag(flags)
			for(let i = 0; i < assignmentCounts/4; i++) {
				str += "attribute vec4 boneWeights"+i+";\n"
				str += "attribute vec4 boneIndices"+i+";\n"
			}
			
			str += "uniform vec4 mBones[248];\n"
		}
		
		str += "uniform mat4 mWorld;\n"
		
		// <MAIN>
		str += "void main(void) {\n"
		
		if(flags & SHADER_OPTION_WIREFRAME) {
		str +=  "	if(barycentric == 0.0) {\n"+
				"		vBC = vec3(1, 0, 0); }\n"+
				"else if(barycentric == 1.0) {\n"+
				"		vBC = vec3(0, 1, 0); }\n"+
				"else {\n"+
				"		vBC = vec3(0, 0, 1); }\n"
		}
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "diffuse_color = vDiffuseColor;\n"
		
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "uv = vUV;\n"
				
		if(flags & SHADER_OPTION_SKELETON) {
			str += "vec4 pos = vec4(0.0);\n"
			
			str +=  "if(int(boneIndices0[0]) != -1) {\n"
			
			for(let assignmentGroupId = 0; assignmentGroupId < assignmentCounts/4; assignmentGroupId++) {
				let strIndices = "boneIndices"+assignmentGroupId,
					strWeights = "boneWeights"+assignmentGroupId
				
				let assignmentsInGroup = assignmentCounts - 4*assignmentGroupId
				if(assignmentsInGroup > 4)
					assignmentsInGroup = 4
				
				for(let i = 0; i < assignmentsInGroup; i++) {
					let strIndex = assignmentGroupId + i === 0?"int index":"index"
					
					str += 	"	"+strIndex+" = (int("+strIndices+"["+i+"])) * 4;\n"+
							"	pos += mat4(mBones[index], mBones[index + 1], mBones[index + 2], mBones[index + 3])"+
							"* vec4(aVertexPosition, 1.0) * "+strWeights+"["+i+"];\n"
				}
			}
			str +=	"}\n"+
					"else {\n"+
					"	pos = vec4(aVertexPosition, 1.0);\n"+
					"}\n"
			
			str += "gl_Position = mWorld * pos;\n"
		}
		else
			str += "gl_Position = mWorld * vec4(aVertexPosition, 1.0);\n"
		
		str += "}" // </MAIN>
		
		return str
	}
	else {		// fragment shader
		var str = "precision mediump float;\n"
		
		if(flags & SHADER_OPTION_TEXTURE)
			str += "uniform sampler2D sampTexture;\n"
		
		if(flags & SHADER_OPTION_OVERLAY)
			str += "uniform sampler2D sampOverlay;\n"+
					"uniform vec3 overlayColor;\n"
		
		// uv coords are needed for any sort of texture/overlay
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "varying vec2 uv;\n"
		
		if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			str += "varying vec4 diffuse_color;\n"
		
		// stolen func from the internet
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "varying vec3 vBC;\n"+
			"#extension GL_OES_standard_derivatives : enable\n"+
			"float edgeFactor(){\n"+
				"vec3 d = fwidth(vBC);\n"+
				"vec3 a3 = smoothstep(vec3(0.0), d*1.02, vBC);\n"+
				"return min(min(a3.x, a3.y), a3.z);\n"+
			"}\n\n"
		
		str += "\
			void main(void) {\n"
		
		if(flags & SHADER_OPTION_TEXTURE_LOD)
			var fnTexture = "texture2DLodEXT"
		else
			var fnTexture = "texture2D"
		
		if(flags & SHADER_OPTION_OVERLAY) {
			str += "vec4 overlayTexel = "+fnTexture+"(sampOverlay, uv);\n"
			
			if(flags & SHADER_OPTION_TEXTURE)
				str += "vec4 textureTexel = "+fnTexture+"(sampTexture, uv);\n"
		}
				
		var fragInput
		if(flags & SHADER_OPTION_TEXTURE) {
			if(flags & SHADER_OPTION_OVERLAY) {
				str += "vec4 overlay = vec4(overlayColor * overlayTexel.rgb, overlayTexel.a);"
				str += "float alpha0 = 1.0 - (1.0 - textureTexel.a) * (1.0 - overlay.a);"
			
				fragInput = "vec4(mix(textureTexel.rgb, overlay.rgb, overlay.a / alpha0), alpha0)"
				// fragInput = "vec4(mix(textureTexel.rgb, overlayTexel.rgb * overlayColor, overlayTexel.a), textureTexel.a)"
			}
			else
				fragInput = fnTexture+"( sampTexture, uv)"
		}
		else if(flags & SHADER_OPTION_OVERLAY) {
			if(flags & SHADER_OPTION_DIFFUSE_COLOR)
				fragInput = "mix(diffuse_color, vec4(overlayTexel.rgb * overlayColor, overlayTexel.a), overlayTexel.a)"
			else
				fragInput = "vec4(overlayTexel.rgb * overlayColor, overlayTexel.a)"
		}
		else if(flags & SHADER_OPTION_DIFFUSE_COLOR)
			fragInput = "diffuse_color"
		else // default color
			fragInput = "vec4(0.6, 0.6, 0.6, 1.0)"
		
		
		// compute frag color
		str += "gl_FragColor = "
		
		if(flags & SHADER_OPTION_WIREFRAME)
			str += "mix(vec4(0.2, 0.2, 0.2, 1.0), "+fragInput+", edgeFactor() * 0.5 + 0.5);\n"
		else
			str += fragInput+";\n"
		
		/*
		if(flags & (SHADER_OPTION_OVERLAY | SHADER_OPTION_TEXTURE))
			str += "if(gl_FragColor.a < 0.95)\n"+
					"	discard;\n"
		*/
		
		return str + "}" // close main()
	}
}

const
	SHADER_OPTION_WIREFRAME = 		1,
	SHADER_OPTION_OVERLAY = 		2,
	SHADER_OPTION_TEXTURE = 		4,
	SHADER_OPTION_SKELETON = 		8,
	SHADER_OPTION_TYPE = 	   	   16, // if set: vertexshader; otherwise: fragmentshader
	SHADER_OPTION_DIFFUSE_COLOR =  32,
	SHADER_OPTION_TEXTURE_LOD =	   64

const 
	RENDER_CAUSE_RENDER_ONCE = 	0,
	RENDER_CAUSE_ANIMATION = 	1,
	RENDER_CAUSE_MOUSE = 		2,
	RENDER_CAUSE_MOVEMENT = 	2

const
	RESOURCE_ERROR_INEXISTENT = 1,
	RESOURCE_ERROR_FAILED_TO_PARSE = 2

const
	MAX_ALLOWED_BONE_ASSIGNMENTS = 15,
	BONE_ASS_SHIFT = 8

function getMaxAssignmentsOfFlag(flags) {
	return (flags >> BONE_ASS_SHIFT) & MAX_ALLOWED_BONE_ASSIGNMENTS
}

function setMaxAssignmentsOfFlag(flags, maxAssignments) {
	if(!maxAssignments)
		return false
	
	return (flags | (maxAssignments << BONE_ASS_SHIFT))
}

const
	R2D = 180/Math.PI,
	D2R = Math.PI/180

class Scene {
	constructor(gl, cnv) {
		this.mats = require(path.join(__rootdir, "js/mv_matmanager.js"))
		
		this._callStack = new Array(10)
		this._currentCallStackIndex = 0
		gl = WebGLDebugUtils.makeDebugContext(gl, this.onGlError.bind(this), this.glTraceCallstack.bind(this))
		
		this.gl = gl
		/* gl setup */
		if(gl.getExtension('OES_standard_derivatives') !== null)
			this.extFlags = this.extFlags & SHADER_OPTION_WIREFRAME
		
		if(gl.getExtension('GL_EXT_shader_texture_lod') !== null)
			this.extFlags = this.extFlags & SHADER_OPTION_TEXTURE_LOD
		
		gl.enable(gl.DEPTH_TEST)
		gl.depthFunc(gl.LEQUAL)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.enable(gl.BLEND)
		gl.disable(gl.DEPTH_TEST)
		
		// gl.enable(gl.CULL_FACE)
		// gl.cullFace(gl.BACK)
		
		gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight)
		
		this.mouseControl = false
		this._ctrl = {}
		
		this.flags = SHADER_OPTION_WIREFRAME
		this._sprograms = []
		this.activeProgram = false
		
		this.zoomLevel = 0.8
		this.zoomFactor = 0.64
		
		this.trans_x = 0
		this.trans_y = 0
		
		this.overlayColor = [1, 0, 0]
		
		this.mesh = []
		
		this.renderCause = 0
		
		this.recentBoneData = new Float32Array()
		
		this.animTimeOffset = 0
		this.animGlobalStartTime = 0
		
		this.playsAnimation = false
		this._anim
		
		
		this.xRot = 0
		this.yRot = 0
		this.qRot = quat.create()
		this.vTrans = vec3.create()
		this.qAxisSwap = quat.create()
		
		quat.rotateY(this.qAxisSwap, this.qAxisSwap, 90*D2R)
		
		this.canvas = cnv
		this.width = cnv.width
		this.height = cnv.height
		
		this.viewportCorrectionX = 1
		this.viewportCorrectionY = 1
		
		this.useShaderByFlags(this.flags)
	}
	
	initRenderLoop(iCause) {
		if(this.renderCause && iCause)
			this.renderCause = this.renderCause | iCause
		else if(iCause) {
			this.renderCause = iCause
			var fn = () => {
				if(!this.renderCause)
					return
				
				this.renderStep()
				window.requestAnimationFrame(fn)
			}
			
			window.requestAnimationFrame(fn)
		}
		else
			this.renderStep()
	}
	
	renderStep() {
		let currentShaderFlags = this.shader.flags,
			gl = this.gl
		
		
		// clear color and depth buffer
		//gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
		gl.enable(gl.DEPTH_TEST)
		
		gl.depthFunc(gl.LEQUAL)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
		gl.enable(gl.BLEND)
		gl.disable(gl.DEPTH_TEST)
		gl.enable(gl.DEPTH_TEST)
		
		this.prepareBoneData()
		
		let combinationMask = SHADER_OPTION_SKELETON | SHADER_OPTION_TEXTURE_LOD
		
		for(let i = 0; i < this.mesh.submeshes.length; i++) {
			let m = this.mesh.submeshes[i]
			let combinedMask = ((m.flags | this.flags) & ~combinationMask) | (m.flags & this.flags)
			
			if(combinedMask !== currentShaderFlags) {
				this.useShaderByFlags(combinedMask)
				currentShaderFlags = m.flags
				
				this.currentRenderFlags = currentShaderFlags
			}
			
			this.setMatrixUniforms()
			m.setUpForRenderProcess(gl, combinedMask, this.shader)
			gl.drawArrays(gl.TRIANGLES, 0, m.faceCount*3)
		}
	}
	
	stopRenderLoop(iCause) {
		this.renderCause = this.renderCause & ~iCause
	}
	
	interventRenderLoop() {
		this.renderCause = 0
	}
	
	setOverlayColor(value) {
		this.overlayColor = [value[0]/255, value[1]/255, value[2]/255]
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
	
	setShader(shader) {
		this.shader = shader
		
		this.useShader(this.shader)
	}
	
	getShader() {
		return this.shader
	}
			
	setSkeleton(skeleton) {
		if(typeof this.onskeletonset === "function")
			this.onskeletonset(skeleton, !!this.skeleton)
		
		this.skeleton = skeleton
		
		this.flags = this.flags | SHADER_OPTION_SKELETON
		
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
			
	getBoneMatrices() {
		if(!this.skeleton || !this.skeleton.isSkeleton)
			return mat4.create()
		
		let bonePalette = this.skeleton.getBonePalette(this.getAnimationTime()/1000),
			palette = [],
			l = bonePalette.length
		
		for(let i = 0; i < l; i++)
			palette.push.apply(palette, bonePalette[i])
		
		return palette
	}
									
	setMatrixUniforms() {
		let prog = this.getCurrentProgram(),
			gl = this.gl
		
		let loc = gl.getUniformLocation(prog, "mWorld")
		gl.uniformMatrix4fv(loc, false, new Float32Array(this.getWorldMatrix()))
		
		loc = gl.getUniformLocation(prog, "mBones")
		
		if(loc != -1 && loc != null)
			gl.uniform4fv(loc, this.recentBoneData)
	}
			
	prepareBoneData() {
		if(!(this.flags & SHADER_OPTION_SKELETON))
			return
		
		this.recentBoneData = new Float32Array(this.getBoneMatrices())
	}
			
	getWorldMatrix() {
		
		var m = mat4.create(),
			t = mat4.create()
		
		var rot = quat.clone(this.qRot),
			cRot = quat.create()
		
		quat.rotateX(cRot, cRot, this.xRot)
		quat.rotateY(cRot, cRot, this.yRot)
		quat.normalize(cRot, cRot)
		
		quat.multiply(rot, cRot, rot)
		quat.multiply(rot, rot, this.qAxisSwap)
		
		mat4.fromRotationTranslation(t, rot, this.vTrans)
		
		mat4.scale(m ,m, [
			 -this.zoomFactor * this.viewportCorrectionX, 
			 this.zoomFactor * this.viewportCorrectionY,
			-this.zoomFactor
			])
		mat4.multiply(m, m, t)
		
		var ortho = mat4.create()
		// with y-axis flipped so that 0 is at the top
		mat4.ortho(ortho, -1, 1, -1, 1, -5, 5)
		mat4.multiply(m, ortho, m)
		
		return m
	}
	
	setAnimation(index) {
		this._anim = this.skeleton.setAnimation(index)
		
		this.animTimeOffset = 0
		
		return this._anim
	}
			
	setAnimationPosition(iPerc) {
		this.animTimeOffset = this._anim.length*10*iPerc // /100*1000
		
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
	
	playAnimation() {
		this.animGlobalStartTime = (new Date()).getTime()
		this.playsAnimation = true
		
		this.initRenderLoop(RENDER_CAUSE_ANIMATION)
	}
	
	pauseAnimation() {
		this.playsAnimation = false
		
		this.animTimeOffset += (new Date()).getTime() - this.animGlobalStartTime
		this.stopRenderLoop(RENDER_CAUSE_ANIMATION)
	}
	
	getAnimationTime() {
		if(this.playsAnimation)
			return this.animTimeOffset + (new Date()).getTime() - this.animGlobalStartTime
		else
			return this.animTimeOffset
	}
	
	getAnimationPosition() {
		var v = this.getAnimationTime()
		v /= 1000
		
		if(v > this._anim.length)
			v = this._anim.length
		
		return v/this._anim.length*100
	}
	
	resetView() {
		quat.set(this.qRot, 0, 0, 0, 1)
		vec3.set(this.vTrans, 0, 0, 0)
		
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
	
	onViewRotation(x, y) {
		this.xRot = -y/100
		this.yRot = x/100
	}
	
	onViewRotationStop(x, y) {
		var qNewRot = quat.create()
		
		quat.rotateX(qNewRot, qNewRot, -y/100)
		quat.rotateY(qNewRot, qNewRot, x/100)
		
		quat.multiply(this.qRot, qNewRot, this.qRot)
		quat.normalize(this.qRot, this.qRot)
		
		this.xRot = 0
		this.yRot = 0
	}
	
	onViewTranslation(x, y) {
		
		let m = 2/this.zoomFactor
		var transX = -x/this.canvas.width*m/this.viewportCorrectionX,
			transY = -y/this.canvas.height*m/this.viewportCorrectionY
		
		vec3.add(this.vTrans, this.vTrans, vec3.fromValues(transX, transY, 0))
	}

	/**
	 *	function to get current transformation
	 *  in a c4script compitable format
	 */
	getIngameTransformationFormat(precision = 10) {
		
		var strRot = "",
			strRotX = "",
			strRotY = "",
			strTrans = ""
		
		// rotation back to angle-axis representation
		var qx = this.qRot[0],
			qy = this.qRot[1],
			qz = this.qRot[2],
			qw = this.qRot[3]
		// if there is a rotation
		
		if(qw !== 0 && qw !== 1) {
			// to axis-angle representation
			var angle = 2 * Math.acos(qw)
			qw = Math.sqrt(1-qw*qw)
			var x = qx / qw
			var y = qy / qw
			var z = qz / qw
			
			// Rotate_X/Y fromat
			var angleX = Math.acos(vec3.dot([0, 1, 0], [0, y, z])),
				angleY = Math.acos(vec3.dot([1, 0, 0], [x, 0, z]))
			
			angleX = Math.round(angleX*R2D)
			angleY = Math.round(angleY*R2D)
			
			strRotX = "Trans_Rotate("+angleX+", 1, 0, 0)"
			strRotY = "Trans_Rotate("+angleY+", 0, 1, 0)"
			
			// Rotate(angle, axis) format
			var smallest = 1
			if(x !== 0)
				smallest = Math.abs(x)
			if(y !== 0 && Math.abs(y) < smallest)
				smallest = Math.abs(y)
			if(z !== 0 && Math.abs(z) < smallest)
				smallest = Math.abs(z)
			
			if(smallest > 0.1) {
				x /= smallest
				y /= smallest
				z /= smallest
			}
			
			x = Math.round(x * precision)
			y = Math.round(y * precision)
			z = Math.round(z * precision)
			
			angle = Math.round(angle*R2D)
			
			strRot = "Trans_Rotate(" + angle + ", " + x + ", "+ y +", " + z + ")"
		}
		
		if(this.vTrans[0] || this.vTrans[1] || this.vTrans[2]) {
			var tx = this.vTrans[0],
				ty = this.vTrans[1],
				tz = this.vTrans[2]
			
			tx = parseInt(tx * 1000)
			ty = parseInt(ty * 1000)
			tz = parseInt(tz * 1000)
			
			strTrans = "Trans_Translate("+tx+", "+ty+", "+tz+")"
		}
		
		if(strRot.length && strTrans.length)
			return { 
				rotateAxis: "Trans_Mul("+strTrans+", "+strRot+")",
				rotateXY: "Trans_Mul("+strTrans+", "+strRotX+", "+strRotY+")",
			}
		else if(strRot.length)
			return { 
				rotateAxis: strRot,
				rotateXY: "Trans_Mul("+strRotX+", "+strRotY+")",
			}
		else if(strTrans.length)
			return strTrans
		
		return false
	}
	
	zoom(addend) {
		if(this.zoomLevel + addend < 0)
			return
		
		this.zoomLevel += addend
		this.zoomFactor = this.zoomLevel*this.zoomLevel
	}
	
	show() {		
		this.useShader(this.shader)
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
	
	hasSkeletonRequirements() {
		return this.flags & SHADER_OPTION_SKELETON
	}
	
	useAsMatDef(file, materialName) {
	}
	
	// session part
	onGlError(e, funcName, args) {
		let util = require("util")
		RenderError(WebGLDebugUtils.glEnumToString(e) + " was caused by calling '" + funcName + "'\n" + util.inspect(args) +
			"\n" + this.excertCallStack(),
			this
		)
		error(bumpFlags(this.currentRenderFlags) + "\n----------------\n" +
			composeShaderString(this.currentRenderFlags | SHADER_OPTION_TYPE) + "\n----------------\n" +
			composeShaderString(this.currentRenderFlags)
		)
		this.stopRenderLoop()
	}
	
	glTraceCallstack(functionName, args) {
		let util = require("util")
		this._callStack[this._currentCallStackIndex] = `${functionName}:\n ${util.inspect(args)}`
		this._currentCallStackIndex = (this._currentCallStackIndex + 1) % 10
	}
		
	excertCallStack() {
		let s = "WebGl CallStack:\n"
		for(let i = 0; i < 10; i++)
			s += this._callStack[(this._currentCallStackIndex + i) % 10] + "\n"
		
		return s + "-callstack end-\n"
	}
	
	load(obj) {
		let mesh = new Mesh(this, obj["bounding-box"], obj["bounding-radius"])
		this.mesh = mesh
		
		for(let i = 0; i < obj.submeshes.length; i++)
			mesh.createSubmesh(this.gl).setData(obj.submeshes[i], this.gl)
		
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
		
		this.loadSkeleton(obj.skeleton)
	}
	
	loadSkeleton(data) {
		let sk = new Skeleton()
		
		sk.setBones(data.bones)
		
		/** [{
				length,
				name,
				tracks: [{
					bone-index,
					frames: [{
						position,
						transformation: [{
							pos,
							rot,
							scale
						},{...}]
					},{...}]
				},{...}]
			},
			{...}]
		*/
		let anims = data.animations
		let t, a, l, set
		
		for(let i = 0; i < anims.length; i++) {
			for(t = 0; t < anims[i].tracks.length; t++) {
				set = anims[i].tracks[t]
				a = []
				a[set["bone-index"]] = set["frames"]
				
				anims[i].tracks[t] = a
			}
		}
		
		sk.setAnimations(anims)
		
		this.setSkeleton(sk)
	}
	
	setOption(name, value) {
		switch(name) {
			case "OVERLAY_COLOR":				
				this.setOverlayColor(value)
			break
			
			case "SHOW_WIREFRAME":
				if(value)
					this.flags = this.flags | SHADER_OPTION_WIREFRAME
				else
					this.flags = this.flags & ~SHADER_OPTION_WIREFRAME
			break
			
			case "SHOW_BOUNDING_BOX":
			break
		}
		
		this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
	
	setSize(x, y) {
		this.canvas.width = x
		this.canvas.height = y
		this.gl.viewport(0, 0, x, y)
		
		this.width = x
		this.height = y
		
		this.setViewportCorrection(x, y)
	}
	
	setViewportCorrection(w = 1, h = 1) {
		let d = w/h
		
		if(d > 1) { // if screen is wider than high
			this.viewportCorrectionX = 1/d
			this.viewportCorrectionY = 1
		}
		else { // else screen is higher than wide
			this.viewportCorrectionX = 1
			this.viewportCorrectionY = 1/d
		}
	}
	
	loadTexture(src, mesh, key, matName) {
		var img = new Image()
		
		var tu
		if(this.ontextureload)
			tu = this.ontextureload(mesh, key, src, img, matName)
		
		img.onload = _ => {
			var texture = gl.createTexture()
			
			gl.bindTexture(gl.TEXTURE_2D, texture)
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST)
			gl.generateMipmap(gl.TEXTURE_2D)
			gl.bindTexture(gl.TEXTURE_2D, null)
			
			if(this.ontextureloadsucces)
				this.ontextureloadsucces(tu)
			
			mesh.setTexture(texture, key)
		}
		
		if(this.ontextureloaderror)
			img.onerror = _ => this.ontextureloaderror(tu)
		log(src)
		img.src = encodeURI("file:" + src).replace(/#/g, "%23")
	}
	
	addShader(vs, fs, flags) {
		if(!vs || !fs)
			return error("Initializing Program failed, at least one (vertex- or fragment-shader) hasn't been identified")
		
		let id = this._sprograms.length
		
		this._sprograms[id] = new Shader(vs, fs, flags, this, this.gl)
		
		return this._sprograms[id]
	}
	
	getShaderByFlags(searchFlags) {
		for(let id = 0; id < this._sprograms.length; id++)
			if(this._sprograms[id].flags == searchFlags)
				return this._sprograms[id]
		
		return false
	}
	
	createShaderByFlags(flags) {
		return this.addShader(
			this.parseShader(composeShaderString(flags | SHADER_OPTION_TYPE), VSHADER),
			this.parseShader(composeShaderString(flags), FSHADER),
			flags
		)
	}
	
	useShaderByFlags(flags) {
		let shader = this.getShaderByFlags(flags)
		
		if(!shader)
			shader = this.createShaderByFlags(flags)
		
		if(!shader)
			return false
		
		this.gl.useProgram(shader.program)
		this.shader = shader
		
		shader.setAttrLocs(this.gl)
		
		return true
	}
	
	useShader(shader) {
		if(!shader || !shader.isShader)
			return
		
		gl.useProgram(shader.program)
		this.shader = shader
		
		shader.setAttrLocs(this.gl)
	}
	
	createShaderProgram(vs, fs) {
		// Create the shader program
		let gl = this.gl,
			prog = gl.createProgram()
		gl.attachShader(prog, vs)
		gl.attachShader(prog, fs)
		gl.linkProgram(prog)

		// If creating the shader program failed, alert
		if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
			error("Unable to initialize the shader program.")
		
		return prog
	}
	
	parseShader(string, type) {
		
		let shader, gl = this.gl
		
		if (type === 1)
			shader = gl.createShader(gl.FRAGMENT_SHADER)
		else if (type === 2)
			shader = gl.createShader(gl.VERTEX_SHADER)
		else// TODO: err msg
			return false
		
		// set shader source
		gl.shaderSource(shader, string)
		
		// Compile the shader program
		gl.compileShader(shader)
		
		// See if it compiled successfully
		if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
			RenderError("An error occurred compiling the shaders: \n" + gl.getShaderInfoLog(shader) + numberString(string), this)
			return false;  
		}
		return shader
	}
	
	getCurrentProgram() {
		return this.shader.program
	}		
	
	enableViewControls(target) {
		$(target).mousedown((e) => {
			// if already operating with the mouse
			if(this._ctrl.mouseControl != e.which && this._ctrl.mouseControl)
				return
			
			this._ctrl.mouseControl = e.which
			
			this._ctrl.mousemoveOriginX = e.clientX
			this._ctrl.mousemoveOriginY = e.clientY
			
			this.initRenderLoop(RENDER_CAUSE_MOUSE)
		})
		
		$(target).mousemove((e) => {
			if(!this._ctrl.mouseControl)
				return
			
			if(this._ctrl.mouseControl == 1)
				this.onViewRotation(
					e.clientX - this._ctrl.mousemoveOriginX, 
					e.clientY - this._ctrl.mousemoveOriginY
				)
			else { // == 2
				this.onViewTranslation(
					e.clientX - this._ctrl.mousemoveOriginX, 
					e.clientY - this._ctrl.mousemoveOriginY
				)
			
				this._ctrl.mousemoveOriginX = e.clientX
				this._ctrl.mousemoveOriginY = e.clientY
			}
		})
		
		$(target).mouseup((e) => {
			
			if(!this._ctrl.mouseControl)
				return
			
			this._ctrl.mouseControl = 0
			this.onViewRotationStop(
				e.clientX - this._ctrl.mousemoveOriginX, 
				e.clientY - this._ctrl.mousemoveOriginY
			)
			
			this.stopRenderLoop(RENDER_CAUSE_MOUSE)
			this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
		})
		
		target.addEventListener("mousewheel", (e) => {
			this.zoom(e.wheelDelta < 0? -ZOOM_FACTOR : ZOOM_FACTOR)
			this.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
		}, false)
	}
}

class Mesh {
	constructor(scene, box, radius) {
		this._scene = scene
		this.box = box
		this.boxRadius = radius
		
		this.submeshes = []
	}
	
	createSubmesh(gl) {
		var id = this.submeshes.length
		this.submeshes[id] = new Submesh(id, this, gl)
		return this.submeshes[id]
	}
	
	queueMaterialFile(pathDir, mName, subMesh) {
		/*
		return Materials.get(mName, pathDir).then(function(mat) {
			
			if(_mesh._scene._sess.onmatload)
				_mesh._scene._sess.onmatload(mat, _mesh._scene.id, mName)
			
			if(!mat)
				return
			
			var t_units =  mat.find("texture_unit")
			
			for(var i in t_units) {
				if(t_units[i].texture && t_units[i].texture.length)
					if(t_units[i].name == "Overlay")
						_mesh._scene._sess.loadTexture(pathDir + "/" + t_units[i].texture[0], subMesh, "overlay", mName)
					else
						_mesh._scene._sess.loadTexture(pathDir +"/"+ t_units[i].texture[0], subMesh, "texture", mName)
			}
		});*/
	}		
}
var S = 0
class Submesh {
	constructor(id, parent, gl) {
		this.positionBuffer = gl.createBuffer()
		this.barycentricBuffer = gl.createBuffer()
		this.flags = 0
		this.id = id
		this.parentMesh = parent
	}
	
	setData(data, gl) {
		let apos = [],
			abary = [],
			auv = [],
			abi = [],
			abw = [],
			fcs = data.faces,
			fcount = fcs.length,
			vtcs = data.vertices,
			v1, v2, v3,
			maxBones = 0, b
		
		for(let i = 0; i < vtcs.length; i++)
			if(vtcs[i]["bone-indices"].length > maxBones)
				maxBones = vtcs[i]["bone-indices"].length
		
		if(maxBones > 0 && maxBones < 5)
			maxBones = 4
		else if(maxBones > 4)
			maxBones = 8
		
		/**
			bone-indices: Array[n]
			bone-weights: Array[n]
			normal:	Array[3]
			pos: Array[3]
			texcoord: Array[2]
		*/
		
		for(let i = 0; i < fcount; i++) {
			v1 = vtcs[fcs[i][0]]
			v2 = vtcs[fcs[i][1]]
			v3 = vtcs[fcs[i][2]]
			
			apos.push(v1.pos[0])
			apos.push(v1.pos[1])
			apos.push(v1.pos[2])
			
			apos.push(v2.pos[0])
			apos.push(v2.pos[1])
			apos.push(v2.pos[2])
			
			apos.push(v3.pos[0])
			apos.push(v3.pos[1])
			apos.push(v3.pos[2])
			
			abary.push(0)
			abary.push(1)
			abary.push(2)
			
			abary.push(0)
			abary.push(1)
			abary.push(2)
			
			abary.push(0)
			abary.push(1)
			abary.push(2)
			
			auv.push(v1.texcoord[0])
			auv.push(v1.texcoord[1])
			
			auv.push(v2.texcoord[0])
			auv.push(v2.texcoord[1])
			
			auv.push(v3.texcoord[0])
			auv.push(v3.texcoord[1])
			
			for(b = 0; b < maxBones; b++) {
				abi.push(v1["bone-indices"][b] || -1)
				abw.push(v1["bone-weights"][b] || 0)
			}
			
			for(b = 0; b < maxBones; b++) {
				abi.push(v2["bone-indices"][b] || -1)
				abw.push(v2["bone-weights"][b] || 0)
			}
			
			for(b = 0; b < maxBones; b++) {
				abi.push(v3["bone-indices"][b] || -1)
				abw.push(v3["bone-weights"][b] || 0)
			}
		}
		
		this.setPositionBufferData(gl, apos, fcount)
		this.setBarycentricBufferData(gl, abary)
		this.setUVBufferData(gl, auv)
		
		this.setVertexAssignments(gl, abi, abw, maxBones)
	}
	
	setPositionBufferData(gl, array, faceCount) {
		this.faceCount = faceCount
		
		if(!(array instanceof Float32Array))
			array = new Float32Array(array)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW)
	}
	
	setBarycentricBufferData(gl, array) {
		if(!(array instanceof Float32Array))
			array = new Float32Array(array)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentricBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW)
	}
	
	setUVBufferData(gl, array) {
		if(!this.uvBuffer)
			this.uvBuffer = gl.createBuffer()
		
		if(!(array instanceof Float32Array))
			array = new Float32Array(array)
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW)
	}
	
	setDiffuseColorBufferData(gl, array) {
		if(!this.colorBuffer)
			this.colorBuffer = gl.createBuffer()
		
		if(!(array instanceof Float32Array))
			array = new Float32Array(array)
	
		gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, array, gl.STATIC_DRAW)
		
		this.flags = this.flags | SHADER_OPTION_DIFFUSE_COLOR
	}
	
	setVertexAssignments(gl, buffer_Indices, buffer_Weights, maxAssignments) {
		
		if(!(buffer_Indices instanceof Float32Array))
			buffer_Indices = new Float32Array(buffer_Indices)
		
		if(!(buffer_Weights instanceof Float32Array))
			buffer_Weights = new Float32Array(buffer_Weights)
		
		if(!this.bWeightsBuffer)
			this.bWeightsBuffer = gl.createBuffer()
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, buffer_Weights, gl.STATIC_DRAW)
		
		if(!this.bIndicesBuffer)
			this.bIndicesBuffer = gl.createBuffer()
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer)
		gl.bufferData(gl.ARRAY_BUFFER, buffer_Indices, gl.STATIC_DRAW)
		this.flags = setMaxAssignmentsOfFlag(this.flags, maxAssignments)
		
		this.flags = this.flags | SHADER_OPTION_SKELETON
	}
	
	reloadTexture(gl, key, img) {
		gl.bindTexture(gl.TEXTURE_2D, this.getTexture(key))
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img)
		gl.bindTexture(gl.TEXTURE_2D, null)
	}
	
	setUpForRenderProcess(gl, combinedFlags, shader) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer)
		gl.enableVertexAttribArray(shader.attrPos)
		gl.vertexAttribPointer(shader.attrPos, 3, gl.FLOAT, false, 0, 0)
		
		if(combinedFlags & SHADER_OPTION_WIREFRAME) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.barycentricBuffer)
			gl.enableVertexAttribArray(shader.attrBary)
			gl.vertexAttribPointer(shader.attrBary, 1, gl.FLOAT, false, 0, 0)
		}
		
		if(combinedFlags & SHADER_OPTION_DIFFUSE_COLOR) {
			gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBuffer)
			gl.enableVertexAttribArray(shader.attrColor)
			gl.vertexAttribPointer(shader.attrColor, 4, gl.FLOAT, false, 0, 0)
		}
		
		if(combinedFlags & SHADER_OPTION_SKELETON) {
			var assignmentsCount = getMaxAssignmentsOfFlag(this.flags)
			if(assignmentsCount > 4) {
				var secondaryAssignments = assignmentsCount - 4
				assignmentsCount = 4
			}
			else
				var secondaryAssignments = 0
			
			var stride = 4 * secondaryAssignments + 4 * assignmentsCount
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer)
			gl.enableVertexAttribArray(shader.attrBWeights0)
			gl.vertexAttribPointer(shader.attrBWeights0, assignmentsCount, gl.FLOAT, false, stride, 0)
			
			gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer)
			gl.enableVertexAttribArray(shader.attrBIndices0)
			gl.vertexAttribPointer(shader.attrBIndices0, assignmentsCount, gl.FLOAT, false, stride, 0)
			
			if(secondaryAssignments) {
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bWeightsBuffer)
				gl.enableVertexAttribArray(shader.attrBWeights1)
				gl.vertexAttribPointer(shader.attrBWeights1, secondaryAssignments, gl.FLOAT, false, stride, 0)
				
				gl.bindBuffer(gl.ARRAY_BUFFER, this.bIndicesBuffer)
				gl.enableVertexAttribArray(shader.attrBIndices1)
				gl.vertexAttribPointer(shader.attrBIndices1, secondaryAssignments, gl.FLOAT, false, stride, 0)
			}
		}
		
		if(!(combinedFlags & (SHADER_OPTION_TEXTURE | SHADER_OPTION_OVERLAY)))
			return
		
		gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
		gl.enableVertexAttribArray(shader.attrUV)
		gl.vertexAttribPointer(shader.attrUV, 2, gl.FLOAT, false, 0, 0)
		
		let tId = 0
		
		if(this.texTexture) {
			gl.activeTexture(gl.TEXTURE0)
			gl.bindTexture(gl.TEXTURE_2D, this.texTexture)
			gl.uniform1i(gl.getUniformLocation(shader.program, "sampTexture"), 0)
			
			tId = 1
		}
		
		if(this.texOverlay) {
			gl.activeTexture(gl["TEXTURE" + tId])
			gl.bindTexture(gl.TEXTURE_2D, this.texOverlay)
			gl.uniform1i(gl.getUniformLocation(shader.program, "sampOverlay"), tId)
			
			let loc = gl.getUniformLocation(this.getCurrentProgram(), "overlayColor")
			gl.uniform3fv(loc, new Float32Array(this.parent._scene.overlayColor))
		}
	}
		
	setTexture(texture, key) {
		if(key == "texture") {
			this.texTexture = texture
			this.flags = this.flags | SHADER_OPTION_TEXTURE
		}
		else if(key == "overlay") {
			this.texOverlay = texture
			this.flags = this.flags | SHADER_OPTION_OVERLAY
		}
		
		this.parent._scene.initRenderLoop(RENDER_CAUSE_RENDER_ONCE)
	}
		
	getTexture(key) {
		if(key === "overlay")
			return this.texOverlay
		else
			return this.texTexture
	}
}

class Shader {	
	constructor(vs, fs, flags, scene, gl) {
		this.flags = flags
		
		// insert into program
		this.program = scene.createShaderProgram(vs, fs)
		gl.useProgram(this.program)
		
		this.isShader = true
	}
	
	setAttrLocs(gl) {
		if(this.attrBary)
			return
		// attribute position
		this.attrPos = gl.getAttribLocation(this.program, "aVertexPosition")
		gl.enableVertexAttribArray(this.attrPos)
		
		// attribute wireframe
		this.attrBary = gl.getAttribLocation(this.program, "barycentric")
		if(this.attrBary != -1)
			gl.enableVertexAttribArray(this.attrBary)
		
		// attribute uv
		this.attrUV = gl.getAttribLocation(this.program, "vUV")
		
		if(this.attrUV != -1)
			gl.enableVertexAttribArray(this.attrUV)
		
		// attribute vDiffuseColor
		this.attrColor = gl.getAttribLocation(this.program, "vDiffuseColor")
		
		if(this.attrColor != -1)
			gl.enableVertexAttribArray(this.attrColor)
		
		// attribute boneIndices
		this.attrBIndices0 = gl.getAttribLocation(this.program, "boneIndices0")
		
		if(this.attrBIndices0 != -1)
			gl.enableVertexAttribArray(this.attrBIndices0)
		
		// attribute boneWeights
		this.attrBWeights0 = gl.getAttribLocation(this.program, "boneWeights0")
		
		if(this.attrBWeights0 != -1)
			gl.enableVertexAttribArray(this.attrBWeights0)
			
			// attribute boneIndices
		this.attrBIndices1 = gl.getAttribLocation(this.program, "boneIndices1")
		
		if(this.attrBIndices1 != -1)
			gl.enableVertexAttribArray(this.attrBIndices1)
		
		// attribute boneWeights
		this.attrBWeights1 = gl.getAttribLocation(this.program, "boneWeights1")
		
		if(this.attrBWeights1 != -1)
			gl.enableVertexAttribArray(this.attrBWeights1)
	}
}

class Skeleton {
	constructor() {
		this.bones = []
		
		this.isSkeleton = true
		this.boneAmount = 0
		
		this.animations = []
		this._a = -1
	}
	
	setAnimation(id = 0) {
	
		if(id === -1)
			this._a = -1
		this._a = this.animations[id]
		log(this)
		return this._a
	}
	
	getBonePalette(time) {
		
		if(this._a === -1) {
			var r = []
			for(var i = 0; i < this.boneAmount; i++)
				r[i] = mat4.create()
			
			return r
		}
		
		var tracks = this._a.tracks,
			result = [],
			mTransformation,
			parentBindNTrans = {}
		
		if(time > this._a.length)
			time = this._a.length
		
		for(var iBone = 0; iBone < this.boneAmount; iBone++) {
			
			let bone = this.bones[iBone]
			
			// get animations tracks
			let trackData = tracks[iBone]
			
			mTransformation = mat4.create()
			
			// if track for this bone exists
			// TODO: Make much more progressive (don't iterate through all keyframes each render step, smarten it
			// 		ECMA 6 INCOMING!!
			
			if(trackData) {
				var l = trackData.length,
					last = -1
				
				// calculate current keyframe transformation, if any
				for(let i = 0; i < l; i++) {
					// iterate to the right anim keyframeset
					if(trackData[i].position >= time) {
						
						// calculate animation weight depending on the given time value
						var t = 1 - (time - trackData[last].position)/
							(trackData[i].position - trackData[last].position)
						
						var rot = quat.create(),
							trans = vec3.create()
						
						vec3.lerp(trans, trackData[i].transformation.pos, trackData[last + 1], t)
						quat.slerp(rot, trackData[i + 2], trackData[last + 2], t)
						
						mat4.fromRotationTranslation(mTransformation, rot, trans)
						break
					}
					else
						last = i
				}
			}
			
			mat4.multiply(mTransformation, bone.local, mTransformation)
			
			if(bone.parent != undefined)
				mat4.multiply(mTransformation, parentBindNTrans[bone.parent], mTransformation)
			
			parentBindNTrans[iBone] = mat4.clone(mTransformation)
			
			mat4.multiply(mTransformation, mTransformation, bone.inverse)
			
			result[bone.origId] = mTransformation
			
		} // <<end of bone iteration
		if(!S) {
			S++
			log(result)
		}
		return result
	}
	
	setBones(bones) {
		if(bones) {
			this.bones = bones
			this.boneAmount = bones.length
		}
	}
	
	setAnimations(a) {
		this.animations = a
		this.setAnimation(0)
	}
}


var RENDER_REPORT_PRINTED = false

function RenderError(string, scene) {
	if(RENDER_REPORT_PRINTED)
		var o = {}
	else {
		var o = new RenderReport(scene.gl)
		RENDER_REPORT_PRINTED = true
	}
	if(!Object.keys(o).length)
		log(string)
	else {
		o.errorMessage = string
		log(o)
	}
}

function numberString(str) {
	var i = 0
	
	return "\n0: " + str.replace(/(\r\n|\n|\r)/g, function(match) {
		i++
		return match + i +": "
	})
}

function bumpFlags(flags) {
	let str = ""
	
	while(flags) {
		str = (flags & 1?"1":"0") + str
		flags = flags >> 1
	}
	
	return str
}

class RenderReport {
	constructor(gl) {
		this.maxVectors = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)
		this.vendor = gl.getParameter(gl.VENDOR)
		this.supportedExt = gl.getSupportedExtensions()
		
		var dbgRenderInfo = gl.getExtension("WEBGL_debug_renderer_info")
		if (dbgRenderInfo != null) {
			this.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL)
			this.unmaskedVendor   = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL)
		}
	}
}

module.exports.create = function(cnv) {
	let gl
	
	try {
		gl = cnv.getContext("webgl")
	}
	catch(e) {
		error("WebGL doesn't work..., for reasons...")
	}
	
	if(!gl)
		return false
	
	return new Scene(gl, cnv)
}


// coding space