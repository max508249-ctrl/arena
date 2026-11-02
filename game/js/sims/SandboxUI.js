function SandboxUI(config){

	var self = this;
	self.id = config.id;
	self.slideshow = config.slideshow;

	// Create DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	var dom = self.dom;

	/////////////////////////////////////////
	// BUTTONS for playing //////////////////
	/////////////////////////////////////////

	var playButton = new Button({
		x:172, y:135, text_id:"label_start", size:"short",
		onclick: function(){
			if(slideshow.objects.tournament.isAutoPlaying){
				publish("tournament/autoplay/stop");
			}else{
				publish("tournament/autoplay/start");
			}
		}
	});
	listen(self, "tournament/autoplay/stop",function(){
		playButton.setText("label_start");
	});
	listen(self, "tournament/autoplay/start",function(){
		playButton.setText("label_stop");
	});
	dom.appendChild(playButton.dom);

	var stepButton = new Button({
		x:172, y:135+70, text_id:"label_step", message:"tournament/step", size:"short"
	});
	dom.appendChild(stepButton.dom);
	
	var resetButton = new Button({x:172, y:135+70*2, text_id:"label_reset", message:"tournament/reset", size:"short"});
	dom.appendChild(resetButton.dom);

	/////////////////////////////////////////
	// Create TABS & PAGES //////////////////
	/////////////////////////////////////////

	// Tabs
	var tabs = document.createElement("div");
	tabs.id = "sandbox_tabs";
	dom.appendChild(tabs);

	// Tab Hitboxes
	var _makeHitbox = function(label, x, width, pageIndex){

		label = label.toUpperCase();

		var hitbox = document.createElement("div");
		hitbox.className = "hitbox";
		hitbox.style.left = x+"px";
		hitbox.style.width = width+"px";
		hitbox.innerHTML = label;
		tabs.appendChild(hitbox);

		(function(pageIndex){
			hitbox.onclick = function(){
				_goToPage(pageIndex);
			};
		})(pageIndex);

	};
	_makeHitbox(Words.get("label_population"), 30, 100, 0);
	_makeHitbox(Words.get("label_payoffs"), 220, 100, 1);
	_makeHitbox(Words.get("label_rules"), 366, 100, 2);

	// Pages
	var pages = [];
	var _makePage = function(){
		var page = document.createElement("div");
		page.className = "sandbox_page";
		tabs.appendChild(page);
		pages.push(page);
	};
	for(var i=0; i<3; i++) _makePage(); // make three pages

	// Go To Page
	var _goToPage = function(showIndex){

		// Background
		tabs.style.backgroundPosition = (-showIndex*500)+"px 0px";

		// Show page
		for(var i=0; i<pages.length; i++) pages[i].style.display = "none";
		pages[showIndex].style.display = "block";

	};
	_goToPage(0);

	/////////////////////////////////////////
	// PAGE 0: POPULATION ///////////////////
	/////////////////////////////////////////

	var page = pages[0];

	// АРЕНА: на странице популяции три группы — персонажи игры, модели и твой ученик (переключаются ссылками)
	var charsBox = document.createElement("div");
	charsBox.className = "arena_pop_group";
	page.appendChild(charsBox);
	var modelsBox = document.createElement("div");
	modelsBox.className = "arena_pop_group";
	modelsBox.style.display = "none";
	page.appendChild(modelsBox);
	var studentBox = document.createElement("div");
	studentBox.className = "arena_pop_group";
	studentBox.style.display = "none";
	page.appendChild(studentBox);
	var popTarget = charsBox;
	var _arenaFreePop = false; // АРЕНА: из главы 10 ползунки независимые (см. _adjustPopulation и наборы ниже)

	// Labels
	charsBox.appendChild(_makeLabel("sandbox_population", {x:0, y:0, w:433}));

	// Create an icon, label, and slider... that all interact with each other.
	var sliders = [];
	var popSliderConfigs = []; // АРЕНА: чтобы менять max вместе с размером популяции
	var _makePopulationControl = function(x, y, peepID, defaultValue){

		// DOM
		var popDOM = document.createElement("div");
		popDOM.className = "sandbox_pop";
		popDOM.style.left = x;
		popDOM.style.top = y;
		popTarget.appendChild(popDOM);

		// Message
		var message = "sandbox/pop/"+peepID;

		// Icon
		var popIcon = document.createElement("div");
		popIcon.className = "sandbox_pop_icon";
		popIcon.style.backgroundPosition = (-PEEP_METADATA[peepID].frame*40)+"px 0px";
		popDOM.appendChild(popIcon);

		// Label: Name
		var popName = document.createElement("div");
		popName.className = "sandbox_pop_label";
		popName.innerHTML = Words.get("label_short_"+peepID).toUpperCase();
		popName.style.color = PEEP_METADATA[peepID].color;
		popDOM.appendChild(popName);

		// Label: Amount
		var popAmount = document.createElement("div");
		popAmount.className = "sandbox_pop_label";
		popAmount.style.textAlign = "right";
		popAmount.style.color = PEEP_METADATA[peepID].color;
		popDOM.appendChild(popAmount);
		listen(self, message, function(value){
			popAmount.innerHTML = value;
		});

		// Slider
		(function(peepID){
			var popSliderConfig = {
				x:0, y:35, width:200,
				min:0, max:Tournament.POPULATION, step:1, // АРЕНА: было max:25
				message: message,
				onselect: function(){
					_anchorPopulation(peepID);
				},
				onchange: function(value){
					_adjustPopulation(peepID, value);
				}
			};
			popSliderConfigs.push(popSliderConfig);
			var popSlider = new Slider(popSliderConfig);
			sliders.push(popSlider);
			popSlider.slideshow = self.slideshow;
			popDOM.appendChild(popSlider.dom);
		})(peepID);

		// Default value!
		publish(message, [defaultValue]);

	};
	var xDiff = 220;
	var yDiff = 80;
	var yOff = 40;
	_makePopulationControl(    0, yOff+0,       "tft",		3);
	_makePopulationControl(xDiff, yOff+0,       "all_d",	3);
	_makePopulationControl(    0, yOff+yDiff,   "all_c",	3);
	_makePopulationControl(xDiff, yOff+yDiff,   "grudge",	3);
	_makePopulationControl(    0, yOff+yDiff*2, "prober",	3);
	_makePopulationControl(xDiff, yOff+yDiff*2, "tf2t",		3);
	_makePopulationControl(    0, yOff+yDiff*3, "pavlov",	3);
	_makePopulationControl(xDiff, yOff+yDiff*3, "random",	4);

	// АРЕНА: модели — на второй странице популяции
	popTarget = modelsBox;
	modelsBox.appendChild(_makeLabel("arena_sandbox_models", {x:0, y:0, w:433}));
	_makePopulationControl(    0, yOff+0,       "claude5",		0);
	_makePopulationControl(xDiff, yOff+0,       "kimi5",		0);
	_makePopulationControl(    0, yOff+yDiff,   "deepseek",		0);

	// АРЕНА: твой ученик — на третьей странице популяции: сколько учеников и чему ты их учишь
	popTarget = studentBox;
	studentBox.appendChild(_makeLabel("arena_sandbox_student", {x:0, y:0, w:433}));
	_makePopulationControl(0, yOff+0, "student", 0);
	studentBox.appendChild(_makeLabel("arena_sandbox_student_hint", {x:xDiff, y:yOff, w:213, size:"15px", color:"#999"}));
	var lessons = new ArenaLessons({
		x:0, y:yOff+yDiff-8,
		onchange: function(){ publish("tournament/reset"); } // новые уроки — турнир заново, как при смене популяции
	});
	studentBox.appendChild(lessons.dom);
	popTarget = charsBox;

	// АРЕНА: переключение «персонажи ↔ модели ↔ твой ученик» (true — модели, false — персонажи)
	var _showPopGroup = function(which){
		if(which===true) which = "models";
		if(which===false) which = "chars";
		charsBox.style.display = (which=="chars") ? "block" : "none";
		modelsBox.style.display = (which=="models") ? "block" : "none";
		studentBox.style.display = (which=="student") ? "block" : "none";
	};
	var toModels = new ArenaLink({
		x:283, y:0, width:150, align:"right", text_id:"arena_sandbox_to_models",
		onclick: function(){ _showPopGroup("models"); }
	});
	charsBox.appendChild(toModels.dom);
	var toChars = new ArenaLink({
		x:283, y:0, width:150, align:"right", text_id:"arena_sandbox_to_chars",
		onclick: function(){ _showPopGroup("chars"); }
	});
	modelsBox.appendChild(toChars.dom);
	// С моделей — к ученику: в свободной клетке сетки, рядом со значком его кепки
	var toStudentIcon = document.createElement("div");
	toStudentIcon.className = "sandbox_pop_icon arena_pop_go";
	toStudentIcon.style.left = xDiff+"px";
	toStudentIcon.style.top = (yOff+yDiff*2)+"px";
	toStudentIcon.style.backgroundPosition = (-PEEP_METADATA.student.frame*40)+"px 0px";
	toStudentIcon.onclick = function(){ _showPopGroup("student"); };
	modelsBox.appendChild(toStudentIcon);
	var toStudent = new ArenaLink({
		x:xDiff+50, y:yOff+yDiff*2+8, width:163, text_id:"arena_sandbox_to_student",
		onclick: function(){ _showPopGroup("student"); }
	});
	modelsBox.appendChild(toStudent.dom);
	var toModelsBack = new ArenaLink({
		x:283, y:0, width:150, align:"right", text_id:"arena_sandbox_to_models_back",
		onclick: function(){ _showPopGroup("models"); }
	});
	studentBox.appendChild(toModelsBack.dom);

	// АРЕНА: кнопок наборов «как на арене» / «как в игре» больше нет (автор, 01.11.2026):
	// из главы 10 набор ставится сам при входе (_applyPreset — ниже, после устава)

	// Adjust the WHOLE population...
	/******************************

	Adjust by SCALING. (and in the edge case of "all zero", scale equally)
	Round to integers. (if above or below 25 in total, keep adding/subtracting 1 down the line)

	******************************/
	var _population;
	var _remainder;
	var _anchoredIndex;
	var _anchorPopulation = function(peepID){

		if(_arenaFreePop) return; // АРЕНА: ползунки независимые — держать остальных не нужно

		// Which index should be anchored?
		_anchoredIndex = Tournament.INITIAL_AGENTS.findIndex(function(config){
			return config.strategy==peepID;
		});
		var initValue = Tournament.INITIAL_AGENTS[_anchoredIndex].count;

		// SPECIAL CASE: THIS IS ALREADY FULL
		if(initValue==Tournament.POPULATION){ // АРЕНА: было 25

			// Pretend it was 1 for all others IN ITS GROUP, the rest for this.
			// (АРЕНА: группа — персонажи игры или модели; для персонажей это, как и было, 7 по 1 и 18 у этого)
			var group = _arenaGroup(peepID);
			_population = [];
			_remainder = 0;
			for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
				var strategy = Tournament.INITIAL_AGENTS[i].strategy;
				if(i!=_anchoredIndex && group.indexOf(strategy)>=0){
					_population.push(1);
					_remainder++;
				}else{
					_population.push(0);
				}
			}
			_population[_anchoredIndex] = Tournament.POPULATION-_remainder;

		}else{

			// Create array of all initial agents...
			_population = [];
			for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
				var conf = Tournament.INITIAL_AGENTS[i];
				_population.push(conf.count);
			}

			// Remainder sum of those NOT anchored (25-anchor.count)
			_remainder = Tournament.POPULATION-initValue; // АРЕНА: было 25

		}

	};
	var _adjustPopulation = function(peepID, value){

		// АРЕНА (01.11.2026, автор): в песочнице из главы 10 ползунки независимые — меняется только этот вид,
		// остальные не трогаем; всего игроков — не больше ARENA_POP_MAX (больше круг не читается и турнир тормозит)
		if(_arenaFreePop){
			var conf = Tournament.INITIAL_AGENTS.find(function(config){ return config.strategy==peepID; });
			var others = 0;
			for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
				if(Tournament.INITIAL_AGENTS[i]!==conf) others += Tournament.INITIAL_AGENTS[i].count;
			}
			var v = Math.max(0, Math.min(value, ARENA_POP_MAX-others));
			conf.count = v;
			if(v!=value) publish("sandbox/pop/"+peepID, [v]); // упёрлись в предел — ползунок остаётся на пределе
			_arenaShowTotal();
			publish("tournament/reset");
			return;
		}

		// Change the anchored one
		Tournament.INITIAL_AGENTS.find(function(config){
			return config.strategy==peepID;
		}).count = value;
		
		// What's the scale for the rest of 'em?
		var newRemainder = Tournament.POPULATION-value; // АРЕНА: было 25
		var scale = newRemainder/_remainder;

		// Adjust everyone to scale, ROUNDING.
		var total = 0;
		for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){

			// do NOT adjust anchor.
			var conf = Tournament.INITIAL_AGENTS[i];
			if(conf.strategy==peepID) continue;

			var initCount = _population[i];
			var newCount = Math.round(initCount*scale);
			conf.count = newCount;

			// Count total!
			total += newCount;

		}
		total += value; // total

		// Difference... 
		var diff = Tournament.POPULATION-total; // АРЕНА: было 25
		// If negative, remove one starting from BOTTOM, skipping anchor.
		// (UNLESS IT'S ZERO)
		if(diff<0){
			for(var i=Tournament.INITIAL_AGENTS.length-1; i>=0 && diff<0; i--){
				// do NOT adjust anchor.
				var conf = Tournament.INITIAL_AGENTS[i];
				if(conf.strategy==peepID) continue;
				if(conf.count==0) continue; // DON'T DO IT IF IT'S ZERO
				conf.count--; // REMOVE
				diff++; // yay
			}
		}
		// If positive, add one starting from TOP, skipping anchor.
		// (UNLESS IT'S ZERO)
		var everyoneElseWasZero = true;
		if(diff>0){
			for(var i=0; i<Tournament.INITIAL_AGENTS.length && diff>0; i++){
				// do NOT adjust anchor.
				var conf = Tournament.INITIAL_AGENTS[i];
				if(conf.strategy==peepID) continue;
				if(conf.count==0) continue; // DO NOT ADD IF ZERO
				everyoneWasZero = false;
				conf.count++; // ADD
				diff--; // yay
			}
		}
		// ...edge case. fine w/e
		if(everyoneElseWasZero){
			for(var i=0; i<Tournament.INITIAL_AGENTS.length && diff>0; i++){
				// do NOT adjust anchor.
				var conf = Tournament.INITIAL_AGENTS[i];
				if(conf.strategy==peepID) continue;
				if(_arenaGroup(conf.strategy)!=_arenaGroup(peepID)) continue; // АРЕНА: только своя группа
				// if(conf.count==0) continue; // DO NOT ADD IF ZERO
				// everyoneWasZero = false;
				conf.count++; // ADD
				diff--; // yay
			}
		}

		// NOW adjust UI
		for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
			// do NOT adjust anchor.
			var conf = Tournament.INITIAL_AGENTS[i];
			if(conf.strategy==peepID) continue;
			publish("sandbox/pop/"+conf.strategy, [conf.count]);
		}

		// Reset!
		publish("tournament/reset");

	};

	/////////////////////////////////////////
	// PAGE 1: PAYOFFS //////////////////////
	/////////////////////////////////////////

	var page = pages[1];

	// Labels
	page.appendChild(_makeLabel("sandbox_payoffs", {x:0, y:0, w:433}));
	
	// PAYOFFS
	var payoffsUI = new PayoffsUI({x:84, y:41, scale:0.9, slideshow:self});
	page.appendChild(payoffsUI.dom);

	// Reset
	var resetPayoffs = new Button({
		x:240, y:300, text_id:"sandbox_reset_payoffs",
		message:"pd/defaultPayoffs"
	});
	page.appendChild(resetPayoffs.dom);

	/////////////////////////////////////////
	// PAGE 2: RULES ////////////////////////
	/////////////////////////////////////////

	var page = pages[2];

	// Rule: Number of turns (1 to 50)
	var rule_turns = _makeLabel("sandbox_rules_1", {x:0, y:0, w:433});
	var slider_turns = new Slider({
		x:0, y:35, width:430,
		min:1, max:50, step:1,
		message: "rules/turns",
		onchange: function(){ _setRandomTurns(false); } // АРЕНА: длину задали ползунком — случайная выключается
	});
	sliders.push(slider_turns);
	slider_turns.slideshow = self.slideshow;
	var _showTurns = function(value){
		if(Tournament.RANDOM_TURNS){ // АРЕНА: случайная длина матча — свой текст
			rule_turns.innerHTML = Words.get("arena_rules_1_random");
			return;
		}
		if(value===undefined) value = Tournament.NUM_TURNS; // АРЕНА
		var words = Words.get(_arenaPlural(value, "sandbox_rules_1_single", "arena_rules_1_few", "sandbox_rules_1")); // АРЕНА: три формы по-русски (было: 1 — «раунд», иначе — «раундов»)
		words = words.replace(/\[N\]/g, value+""); // replace [N] with the number value
		rule_turns.innerHTML = words;
	};
	listen(self, "rules/turns", _showTurns);
	page.appendChild(rule_turns);
	page.appendChild(slider_turns.dom);

	// Rule: Eliminate/Reproduce how many? (1 to 12)
	var rule_evolution = _makeLabel("sandbox_rules_2", {x:0, y:100, w:433});
	var slider_evolution = new Slider({
		x:0, y:165, width:430,
		min:1, max:10, step:1,
		message: "rules/evolution"
	});
	sliders.push(slider_evolution);
	slider_evolution.slideshow = self.slideshow;
	listen(self, "rules/evolution",function(value){
		var words = (value==1) ? Words.get("sandbox_rules_2_single") : Words.get("sandbox_rules_2"); // plural?
		words = words.replace(/\[N\]/g, value+""); // replace [N] with the number value
		rule_evolution.innerHTML = words;
	});
	page.appendChild(rule_evolution);
	page.appendChild(slider_evolution.dom);

	// Rule: Noise (0% to 50%)
	var rule_noise = _makeLabel("sandbox_rules_3", {x:0, y:225, w:433});
	var slider_noise = new Slider({
		x:0, y:290, width:430,
		min:0.00, max:0.50, step:0.01,
		message: "rules/noise"
	});
	sliders.push(slider_noise);
	slider_noise.slideshow = self.slideshow;
	listen(self, "rules/noise",function(value){
		value = Math.round(value*100);
		var words = Words.get("sandbox_rules_3");
		words = words.replace(/\[N\]/g, value+""); // replace [N] with the number value
		rule_noise.innerHTML = words;
	});
	page.appendChild(rule_noise);
	page.appendChild(slider_noise.dom);

	// АРЕНА: случайная длина матча, 8–12 раундов, как на арене
	var _setRandomTurns = function(value){
		Tournament.RANDOM_TURNS = value;
		randomTurns.set(value);
		_showTurns();
	};
	var randomTurns = new ArenaToggle({
		x:0, y:345, width:433, text_id:"arena_rules_random",
		value: Tournament.RANDOM_TURNS,
		onchange: function(value){ _setRandomTurns(value); }
	});
	page.appendChild(randomTurns.dom);

	// DEFAULTS
	publish("rules/turns", [10]);
	publish("rules/evolution", [5]);
	publish("rules/noise", [0.05]);

	// АРЕНА: наборы для песочницы (ARENA_PRESETS — в js/sims/ArenaUI.js). Из главы 10 — и независимые ползунки:
	// у каждого вида от 0 до ARENA_POP_ONE, всего — не больше ARENA_POP_MAX; под вкладками — «всего игроков: N»
	var totalLabel = null;
	var _arenaShowTotal = function(){
		var total = 0;
		for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++) total += Tournament.INITIAL_AGENTS[i].count;
		Tournament.POPULATION = total;
		if(totalLabel) totalLabel.innerHTML = Words.get("arena_pop_total").replace(/\[N\]/g, total+"").replace(/\[MAX\]/g, ARENA_POP_MAX+"");
	};
	var _applyPreset = function(name){
		var preset = ARENA_PRESETS[name];
		Tournament.POPULATION = preset.population;
		Tournament.ARENA_SIZES = true; // человечки — по числу игроков (Tournament.js)
		_arenaFreePop = true;
		if(!totalLabel){
			totalLabel = _makeLabel("arena_pop_total", {x:493, y:462, w:433, color:"#999", size:"15px"});
			self.dom.appendChild(totalLabel);
		}
		for(var i=0; i<popSliderConfigs.length; i++) popSliderConfigs[i].max = ARENA_POP_ONE;
		for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
			var conf = Tournament.INITIAL_AGENTS[i];
			conf.count = preset.agents[conf.strategy] || 0;
			publish("sandbox/pop/"+conf.strategy, [conf.count]);
		}
		publish("pd/defaultPayoffs");
		publish("rules/turns", [preset.turns]);
		publish("rules/evolution", [preset.evolution]);
		publish("rules/noise", [preset.noise]);
		_setRandomTurns(preset.randomTurns);
		_arenaShowTotal();
		publish("tournament/reset");
	};

	// АРЕНА: пришли из бонусной главы — сразу набор: «как на арене» — страница моделей,
	// «твой ученик» (правая дорога второго камня) — страница ученика
	if(_.arenaPreset){
		var _preset = _.arenaPreset;
		_applyPreset(_preset);
		_.arenaPreset = null;
		_showPopGroup(_preset=="student" ? "student" : "models");
	}

	/////////////////////////////////////////
	// Add & Remove Object //////////////////
	/////////////////////////////////////////
	
	// Add...
	self.add = function(){
		_add(self);
	};

	// Remove...
	self.remove = function(){
		payoffsUI.remove();
		//for(var i=0;i<numbers.length;i++) unlisten(numbers[i]);
		for(var i=0;i<sliders.length;i++) unlisten(sliders[i]);
		unlisten(self);
		_remove(self);
	};

}