SLIDES.push({
	id: "credits",
	onstart: function(self){	
		self.add({ id:"bg", type:"Background", color:"#222" });

		// Circular Wordbox
		self.add({
			id:"text", type:"TextBox",
			x:0, y:5, width:960, height:400, align:"center", // АРЕНА: было y:35 — место для кнопки бонуса
			text_id:"credits", color:"#fff"
		});

		// АРЕНА: бонусная глава
		self.add({
			id:"arena_button", type:"Button", x:304, y:482, size:"long",
			text_id:"arena_credits_btn",
			onclick: function(){ publish("slideshow/scratch", ["arena"]); }
		});
	}
});