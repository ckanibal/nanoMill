class IntroScreen extends layout.Module {

	init() {
		this.body.innerHTML = 
`<div class='flex-col mod-fill-body' style='animation: fade-in 1s ease-out 0s 1 normal both'>
	<div class='flex-fill'></div>
		<span style='text-align: center; text-shadow: 0 1px 0 black'>Welcome .</span><br>
		<span style='text-align: center; color: #353535; font-size: 32px;  0 0 1px rgb(16, 16, 16)' class='icon-the-mill'></span>
		<div class='flex-fill'></div>
</div>`
	}
}

IntroScreen.def = {
	alias: "intro",
	className: IntroScreen,
	title: "Introduction"
}

layout.setModuleDef(IntroScreen.def)