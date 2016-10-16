class IntroScreen extends Layout_Module{

    constructor() {
		super()
		
		$(this.root).find(".mod-body").html(
"<div class='flex-col mod-fill-body' style='animation: fade-in 1s ease-out 0s 1 normal both'>\
	<div class='flex-fill'></div>\
		<span style='text-align: center; text-shadow: 0 1px 0 black'>Welcome .</span><br>\
		<span style='text-align: center; color: #1d1d1d; font-size: 32px; text-shadow: 0 -1px 0 #101010, 0 -2px 0 #1f1f1f, 0 -3px 0 #2b2b2b, 0 1px 0 #404040' class='icon-the-mill'></span>\
	<div class='flex-fill'></div>\
</div>"
		)
	}
}

IntroScreen.def = {
	alias: "intro",
	className: IntroScreen,
	title: "Introduction"
}

registerModule(IntroScreen.def)
