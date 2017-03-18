

module.exports = function(par, size) {
	let svg = Elem.fromString(`<svg class="the-mill" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 width="${size}" height="${size}" viewBox="0 0 32 32" enable-background="new 0 0 32 32" xml:space="preserve">
	<path fill="steelblue" d="M29.48,24.609l-0.03-0.829l-0.229-5.47L29.2,17.859L28.77,17.74l-6.89-1.83l6.07-9.39l0.45-0.7L27.6,5.6
		L22.32,4.13l-0.43-0.12l-0.24,0.38l-3.881,6L10.72,1.72L10.2,1.08L9.73,1.76L6.69,6.32L6.45,6.7l0.28,0.35l4.51,5.54L0.79,16.62
		l-0.77,0.3l0.51,0.65l3.41,4.3l0.28,0.35l0.42-0.159l6.68-2.58l0.61,11.16l0.05,0.829l0.78-0.29l5.141-1.91l0.42-0.16L18.3,28.66
		l-0.39-7.13L28.7,24.4L29.48,24.609z M17.757,14.982l0.088,2.175l-0.3,0.106l-2.052,0.761l-0.212-0.267l-1.326-1.679l0.212-0.319
		l1.185-1.804l0.336,0.089l2.051,0.566L17.757,14.982z"/>
	<circle cx="16" cy="16" r="16" fill="steelblue" />
	</svg>`)
	
	par.appendChild(svg)
}