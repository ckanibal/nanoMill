

module.exports = function(par, size) {
	let svg = Elem.fromString(`<svg class="the-mill" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="${size}" height="${size}" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve">
	 <defs>
		<filter id="filter-shadow" x="0" y="0" width="100%" height="100%">
			<feOffset result="offOut" in="SourceAlpha" dx="0" dy="2" />
			<feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
		</filter>
	</defs>
	<path fill="steelblue" filter="url(#filter-shadow)" d="M29.48,24.609l-0.03,-0.829l-0.229,-5.47l-0.021,-0.451l-0.43,-0.119l-6.89,-1.83l6.07,-9.39l0.45,-0.7l-0.8,-0.22l-5.28,-1.47l-0.43,-0.12l-0.24,0.38l-3.881,6l-7.049,-8.67l-0.52,-0.64l-0.47,0.68l-3.04,4.56l-0.24,0.38l0.28,0.35l4.51,5.54l-10.45,4.03l-0.77,0.3l0.51,0.65l3.41,4.3l0.28,0.35l0.42,-0.159l6.68,-2.58l0.61,11.16l0.05,0.829l0.78,-0.29l5.141,-1.91l0.42,-0.16l-0.021,-0.45l-0.39,-7.13l10.79,2.87l0.78,0.209Zm-13.48,-11.633c1.669,0 3.024,1.355 3.024,3.024c0,1.669 -1.355,3.024 -3.024,3.024c-1.669,0 -3.024,-1.355 -3.024,-3.024c0,-1.669 1.355,-3.024 3.024,-3.024Z"/>
	<circle cx="16" cy="16" r="16" fill="steelblue" />
	</svg>`)
	
	par.appendChild(svg)
}