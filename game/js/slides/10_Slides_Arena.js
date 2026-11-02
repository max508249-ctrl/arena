/*
БОНУС: АРЕНА МОДЕЛЕЙ — дополнение к «Эволюции доверия».
Новые персонажи (стратегии, которые написали языковые модели) и дуэль с ними в автомате.
Персонажи — js/sims/ArenaStrategies.js, объекты — js/sims/ArenaUI.js.
Слайды с nodot не получают своей точки внизу, chapter — какую точку подсвечивать.

Глава начинается с камня на распутье (слайд arena). Главная дорога — направо, «Claude на матч позовёшь» (сразу матч);
налево — узнать игру (дуб: игроки, «Кто сильнее», свитки), прямо — турнир. С каждого экрана есть дорога назад.
*/

// Ссылка «← к камню» — на всех экранах главы
var _arenaBackToStone = function(self, x, y){
	self.add({
		id:"toStone", type:"ArenaLink",
		x:x, y:y, width:200,
		text_id:"arena_back_stone",
		onclick: function(){
			publish("slideshow/scratch", ["arena"]);
		}
	});
};

// Назад ко второму камню (экран турнира): со ставки — с него на неё и пришли
var _arenaBackToStone2 = function(self, x, y){
	self.add({
		id:"toStone", type:"ArenaLink",
		x:x, y:y, width:220,
		text_id:"arena_back_stone2",
		onclick: function(){
			publish("slideshow/scratch", ["arena_tour"]);
		}
	});
};

// Песочница оригинала (глава 7) с набором из главы 10: SandboxUI сам применит набор (_.arenaPreset).
// Сама песочница — из оригинала; когда в неё пришли из главы 10, внизу слева появляется «← к камню».
// Примечание оригинала («режим песочницы опционален… как закончишь, мы повторим») — про путь оригинала
// и стоит на том же месте, поэтому в главе 10 его убираем, а «← к камню» ставим вместо него.
var _arenaToSandbox = function(preset){
	_.arenaPreset = preset;
	_.arenaInSandbox = true;
	publish("slideshow/scratch", ["sandbox"]);
};
subscribe("slideshow/slideChange", function(id){
	if(id!="sandbox" || !_.arenaInSandbox) return;
	_.arenaInSandbox = false;
	if(!window.slideshow) return;
	if(slideshow.objects.label_next) slideshow.remove("label_next");
	if(!slideshow.objects.toStone) _arenaBackToStone(slideshow, 40, 495);
});

// Клавиши слайда: {keyCode: функция}. Снимаются в onend (_arenaKeysOff)
var _arenaKeys = null;
var _arenaKeysOn = function(map){
	_arenaKeysOff();
	_arenaKeys = function(event){
		var fn = map[event.keyCode];
		if(fn){ fn(); event.preventDefault(); }
	};
	window.addEventListener("keydown", _arenaKeys);
};
var _arenaKeysOff = function(){
	if(_arenaKeys) window.removeEventListener("keydown", _arenaKeys);
	_arenaKeys = null;
};
var _arenaHasKeyboard = function(){ // подсказки о клавишах — только там, где есть клавиатура и мышь
	return !!(window.matchMedia && window.matchMedia("(pointer: fine)").matches);
};

// 1. Камень на распутье. Главная дорога — направо: сразу матч с Claude 5.0 (сначала почувствовать игру,
// объяснения — потом). Налево — узнать игру (дуб со свитками), прямо — турнир.
// Мелкая строка под ними — для новичков: начать с оригинала Ники Кейса (глава 1), как свиток «Оригинал» на дубе
var ARENA_WAYS = {left:"arena_oak", up:"arena_tour", right:"arena_duel", first:"oneoff"};
SLIDES.push({
	id: "arena",
	onstart: function(self){

		var _gone = false; // одна дорога за раз: второе нажатие во время перехода не считается
		var _go = function(way){
			if(_gone) return;
			_gone = true;
			if(way=="right"){ // «Claude на матч позовёшь»: дуэль с Claude 5.0, как выбрать его на выборе соперника
				var D = _arenaDuel();
				D.opp = "claude5";
				D.blind = false;
				D.tour = false;
			}
			publish("slideshow/scratch", [ARENA_WAYS[way]]);
		};

		self.add({id:"stone", type:"ArenaStone", x:0, y:0, onpick:_go});
		self.add({
			id:"title", type:"TextBox",
			x:30, y:4, width:900, height:40, align:"center", size:28,
			text_id:"arena_stone_title"
		});
		self.add({
			id:"sub", type:"TextBox",
			x:80, y:42, width:800, height:26, align:"center", size:17, color:"#999",
			text_id:"arena_stone_sub"
		});

		// Клавиши ← ↑ → — по дорогам (с подсветкой надписи, как при щелчке)
		var _press = function(way){
			return function(){
				if(_gone) return;
				Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
				_go(way);
			};
		};
		_arenaKeysOn({37:_press("left"), 38:_press("up"), 39:_press("right")});
		if(_arenaHasKeyboard()){
			self.add({
				id:"keys", type:"TextBox",
				x:545, y:478, width:250, height:24, color:"#aaa", size:15,
				text_id:"arena_stone_keys"
			});
		}

	},
	onend: function(self){
		_arenaKeysOff();
		self.clear();
	}
});

// 2. Налево: дуб у корней с сундуком — узнать игру. Плоды — игроки (нажал — карточка),
// табличка на верхушке и свитки в сундуке разворачиваются поверх дуба (✕, щелчок мимо или Esc — свернуть).
SLIDES.push({
	id: "arena_oak", chapter: "arena", nodot: true,
	onstart: function(self){

		var _close = function(){
			if(self.objects.scroll) self.remove("scroll");
		};
		var _open = function(which){
			_close();
			self.add({
				id:"scroll", type:"ArenaScroll", which:which,
				onclose: _close,
				onaction: function(slide){ publish("slideshow/scratch", [slide]); }
			});
		};
		self.add({
			id:"oak", type:"ArenaOak", x:0, y:0,
			onpick: function(kind, id){
				if(kind=="card"){
					_.arenaCard = id;
					publish("slideshow/scratch", ["arena_card"]);
				}else{
					_open(id);
				}
			}
		});
		_arenaBackToStone(self, 40, 505);
		_arenaKeysOn({27:_close});

	},
	onend: function(self){
		_arenaKeysOff();
		self.clear();
	}
});

// 3. Карточка игрока целиком: ‹ › (или ← →) — соседние, «сыграть один на один» — дуэль с ним
var ARENA_ALL = ARENA_CHARACTERS.concat(ARENA_GAME_CHARS);
SLIDES.push({
	id: "arena_card", chapter: "arena", nodot: true,
	onstart: function(self){

		var id = (ARENA_ALL.indexOf(_.arenaCard)>=0) ? _.arenaCard : ARENA_ALL[0];
		var _gone = false; // одно перелистывание за раз
		var _flip = function(step){
			return function(){
				if(_gone) return;
				_gone = true;
				_.arenaCard = ARENA_ALL[(ARENA_ALL.indexOf(id)+step+ARENA_ALL.length)%ARENA_ALL.length];
				publish("slideshow/scratch", ["arena_card"]);
			};
		};

		self.add({id:"card", type:"ArenaCardBig", x:130, y:40, character:id});
		self.add({
			id:"prev", type:"ArenaLink",
			x:52, y:190, width:60, align:"center",
			text_id:"arena_card_prev", onclick:_flip(-1)
		});
		self.add({
			id:"next", type:"ArenaLink",
			x:848, y:190, width:60, align:"center",
			text_id:"arena_card_next", onclick:_flip(1)
		});
		self.objects.prev.dom.classList.add("arena_flip");
		self.objects.next.dom.classList.add("arena_flip");
		self.add({
			id:"play", type:"Button", x:304, y:440, size:"long",
			text_id:"arena_card_play",
			onclick: function(){
				var D = _arenaDuel();
				D.opp = id;
				D.blind = false;
				D.tour = false;
				publish("slideshow/scratch", ["arena_duel"]);
			}
		});
		self.add({
			id:"all", type:"ArenaLink",
			x:40, y:495, width:200,
			text_id:"arena_back_oak",
			onclick: function(){
				publish("slideshow/scratch", ["arena_oak"]);
			}
		});
		_arenaKeysOn({37:_flip(-1), 39:_flip(1)});

	},
	onend: function(self){
		_arenaKeysOff();
		self.clear();
	}
});

// 4. Направо: выбор соперника
SLIDES.push({
	id: "arena_pick", chapter: "arena", nodot: true,
	onstart: function(self){

		var D = _arenaDuel();

		self.add({
			id:"title", type:"TextBox",
			x:30, y:15, width:900, height:60, align:"center",
			text_id:"arena_pick_title"
		});

		self.add({
			id:"picker", type:"ArenaPicker", x:0, y:85,
			onpick: function(id){
				D.opp = id;
				D.blind = false;
				D.tour = false;
				publish("slideshow/scratch", ["arena_duel"]);
			}
		});

		self.add({
			id:"noise", type:"ArenaToggle", x:40, y:455, width:300,
			text_id:"arena_pick_noise", value:D.noise,
			onchange: function(value){ D.noise = value; }
		});
		self.add({
			id:"speed", type:"ArenaSpeed", x:40, y:483, width:340, size:17,
			value: D.speed || "normal",
			onchange: function(value){ D.speed = value; }
		});

		self.add({
			id:"blind", type:"Button", x:382, y:468,
			text_id:"arena_pick_blind",
			onclick: function(){
				var all = ARENA_CHARACTERS.concat(ARENA_GAME_CHARS);
				D.opp = all[Math.floor(Math.random()*all.length)];
				D.blind = true;
				D.tour = false;
				publish("slideshow/scratch", ["arena_duel"]);
			}
		});

		_arenaBackToStone(self, 730, 482);
		self.objects.toStone.dom.style.textAlign = "right";

	},
	onend: function(self){
		self.clear();
	}
});

// 5. Дуэль в автомате
SLIDES.push({
	id: "arena_duel", chapter: "arena", nodot: true,
	onstart: function(self){

		var o = self.objects;
		var D = _arenaDuel();

		// Новый матч: длину заранее не знает никто — ни ты, ни соперник (8–12 раундов, как на арене).
		// Длина, ошибки и монетка соперника выпадают сразу на весь матч — чтобы на экране итогов
		// переиграть этот же матч с Claude 5.0 и Kimi 5.0 на твоём месте (js/sims/ArenaUI.js)
		// Турнир «как на арене» (слайд arena_tour): соперник — очередной вид, ошибки есть всегда.
		// Кто соперник, в турнире не видно (как на арене), если перед турниром не включено «знать соперника».
		var T = (D.tour && _.arenaTour && _.arenaTour.i < _.arenaTour.order.length) ? _.arenaTour : null;
		if(!T) D.tour = false;
		if(T){ D.opp = T.order[T.i]; D.blind = !_.arenaTour.know; }

		// Скорость (до конца слайда): «обычно»; «быстро» — анимации втрое быстрее;
		// «мгновенно» — ход засчитывается сразу, без анимации: кнопки не гаснут, клавишу можно держать.
		// В турнире — своя (по умолчанию «быстро»), в дуэли — своя (по умолчанию «обычно»: сначала увидеть автомат)
		var speed = T ? (T.speed || "fast") : (D.speed || "normal");
		_arenaSpeed = _arenaSpeedOf(speed);

		_arenaNewMatch(D);
		D.round = 0;
		D.ys = 0;
		D.os = 0;
		D.done = false;
		D.history = []; // сыгранные раунды (info каждого) — для экрана итогов

		Tournament.resetGlobalVariables(); // выплаты по умолчанию

		// Автомат и соперник. В турнире «сам» слева — арена (ArenaRing), автомат — справа и меньше (0,74)
		self.add({id:"iterated", type:"Iterated", x:(T ? 440 : 130), y:(T ? 190 : 183)});
		if(T){
			o.iterated.dom.style.transform = "scale(0.74)";
			o.iterated.dom.style.transformOrigin = "0 0";
		}
		o.iterated.dehighlightPayoff();
		o.iterated.chooseOpponent(D.opp);
		_arenaSeededLogic(o.iterated.opponentLogic, D);
		if(D.blind) o.iterated.playerB.hat.gotoAndStop(ARENA_MYSTERY_HAT);
		if(speed!="instant") o.iterated.introMachine(); // заставка автомата (мигает клетками) — не в «мгновенно»

		// Табло и подпись над ним
		self.add({id:"scoreboard", type:"IteratedScoreboard", x:(T ? 470 : 378), y:(T ? 78 : 85)});

		// Полоска сыгранных раундов (справа от табло): за что наказали — видно всегда.
		// Ошибки соперника — только после матча: во время матча ты, как стратегия на арене, видишь только его ходы.
		self.add({id:"history", type:"ArenaHistory", x:(T ? 690 : 595), y:(T ? 92 : 95)});
		self.add({
			id:"info", type:"TextBox",
			x:(T ? 440 : 130), y:2, width:(T ? 520 : 700), height:80, align:"center", size:17
		});
		var _showInfo = function(info){
			var name = D.blind
				? _arenaWord("arena_duel_blind")
				: "<span class='"+D.opp+"'>"+_arenaWord("label_"+D.opp)+"</span>";
			if(T && D.blind && D.done){ // турнир вслепую: матч сыгран — кто это был (он же открылся на арене слева)
				name = "<span class='"+D.opp+"'>"+_arenaWord("label_"+D.opp)+"</span> " + _arenaWord("arena_duel_was_blind");
			}
			var html = _arenaWord("arena_duel_opponent").replace(/\[NAME\]/g, name) + "<br>";
			html += _arenaWord("arena_duel_round").replace(/\[N\]/g, D.round+"");
			html += " &#8226; " + _arenaWord(D.noiseNow ? "arena_duel_noise_on" : "arena_duel_noise_off");
			if(D.done && D.noiseNow){ // матч сыгран: где ошибался соперник
				html += "<br><span class='arena_mistake'>" + _arenaTheirMistakesText(D.history) + "</span>";
			}else if(info && info.youMistake){ // своя ошибка видна сразу: ты знаешь, что нажал
				html += "<br><span class='arena_mistake'>"
					+ _arenaWord(info.you==PD.CHEAT ? "arena_duel_you_slip" : "arena_duel_you_coin") + "</span>";
			}
			o.info.setText(html);
		};
		_showInfo();

		// В турнире слева — арена: сколько сыграно, с кем ты сейчас (вслепую — «?»), твои сыгранные матчи
		if(T){
			self.add({id:"ring", type:"ArenaRing", x:0, y:0});
			o.ring.show(T, "live");
		}

		// Скорость можно поменять прямо в матче (под панелью турнира; в дуэли — там же, слева от табло).
		// Она запоминается до конца сеанса: в турнире — для следующих матчей и турниров, в дуэли — для следующих дуэлей
		var _keysHint = function(){}; // подсказка о клавишах (ниже), зависит от скорости
		self.add({
			id:"speed", type:"ArenaSpeed", x:(T ? 446 : 130), y:(T ? 462 : 100), width:(T ? 500 : 205), size:15, br:true, muted:true,
			label_id: (T ? "arena_speed_round" : null), // в турнире подпись объясняет, что такое скорость
			value: speed,
			onchange: function(value){
				speed = value;
				if(T){
					T.speed = value;
					if(_.arenaTourOpts) _.arenaTourOpts.speed = value;
				}else{
					D.speed = value;
				}
				_arenaSpeed = _arenaSpeedOf(value);
				_keysHint();
			}
		});

		// Первая дуэль за сеанс — коротко правила, как в первой главе оригинала (новичок пришёл сразу с камня)
		if(!T && !_.arenaRulesSeen){
			self.add({
				id:"rules", type:"TextBox",
				x:130, y:150, width:200, height:120, size:15, color:"#888",
				text_id:"arena_duel_rules"
			});
		}

		// Кнопки, как в главе «Повторяющаяся игра»
		var _busy = false, _dimmed = false;
		var _move = function(move){
			if(_busy || D.done) return;
			var noise = D.noiseNow ? 0.05 : 0;
			if(speed=="instant"){ // ход засчитывается сразу: конец раунда (слушатель ниже) — прямо внутри этого вызова
				o.iterated.playOneRoundWithMistakes(move, noise, D.rolls[D.round], true, true);
				return;
			}
			_busy = _dimmed = true;
			publish("arenaCheat/deactivate");
			publish("arenaCooperate/deactivate");
			o.iterated.playOneRoundWithMistakes(move, noise, D.rolls[D.round], true); // соперник не спотыкается
		};

		// Финал турнира — на этом же экране: автомат уходит, на арене остальные играют друг с другом,
		// потом ✕ у троих худших и +1 у троих лучших; дальше — итог поколения (с той же таблицей: тот же жребий)
		var _finale = function(){
			T.table = _arenaTourTable(T, null);
			var ids = ["iterated", "scoreboard", "history", "info", "speed", "keys", "tourNext"];
			for(var j=0; j<ids.length; j++) if(o[ids[j]]) self.remove(ids[j]);
			var N = T.order.length, pairs = N*(N-1)/2;
			self.add({
				id:"finText", type:"TextBox",
				x:460, y:110, width:480, height:240, align:"center", size:19,
				text: _arenaWord("arena_fin_play").replace(/\[M\]/g, N+"").replace(/\[P\]/g, pairs+"")
			});
			o.ring.play(T, 2400, function(){
				o.ring.marks(T.table);
				var me = T.table;
				var place = (me.tied ? _arenaWord("arena_tour_place_tied") : _arenaWord("arena_tour_place"))
					.replace(/\[P\]/g, me.place+"").replace(/\[Q\]/g, (me.place+me.tied)+"").replace(/\[N\]/g, me.n+"");
				var verdict = _arenaWord(me.top ? "arena_tour_top" : (me.out ? "arena_tour_out" : "arena_tour_stay"));
				o.finText.setText(_arenaWord("arena_fin_done").replace(/\[PLACE\]/g, place).replace(/\[VERDICT\]/g, verdict));
				self.add({
					id:"tourNext", type:"Button", x:527, y:380, size:"long",
					text_id:"arena_fin_btn",
					onclick: function(){ publish("slideshow/scratch", ["arena_tour_result"]); }
				});
				_hide(o.tourNext); _fadeIn(o.tourNext, 100);
				if(_arenaHasKeyboard()){
					self.add({
						id:"keys", type:"TextBox",
						x:440, y:452, width:520, height:24, align:"center", color:"#aaa", size:15,
						text_id:"arena_tour_keys_next"
					});
				}
			});
		};

		// Турнир: матч сыгран — записать его, открыть соперника на арене и дать перейти к следующему (или к финалу)
		var _tourDone = function(){
			T.matches.push({opp:D.opp, who:T.who[T.i], L:D.L, seed:D.seed, rolls:D.rolls, history:D.history.slice(), ys:D.ys, os:D.os});
			o.ring.show(T, "done");
			if(o.keys) o.keys.setText(_arenaWord("arena_tour_keys_next"));
			self.remove("arenaCheat");
			self.remove("arenaCooperate");
			var last = (T.i+1 >= T.order.length), gone = false;
			var _next = function(){ // кнопка, клавиша или «без остановок» — переход только один раз
				if(gone) return;
				gone = true;
				clearTimeout(_.arenaDuelTimer);
				T.i++;
				if(last) _finale();
				else publish("slideshow/scratch", ["arena_duel"]);
			};
			self.add({
				id:"tourNext", type:"Button", x:527, y:400, size:"long",
				text_id: last ? "arena_tour_finish" : "arena_tour_next",
				onclick: _next
			});
			_hide(o.tourNext); _fadeIn(o.tourNext, 300);
			// «Мгновенно» — без остановок: через секунду (увидеть итог матча) — следующий матч или итог турнира сам
			if(speed=="instant"){
				_.arenaDuelTimer = setTimeout(function(){
					if(speed=="instant") _next();
				}, 1000);
			}
		};
		self.add({
			id:"arenaCheat", type:"Button", x:(T ? 476 : 275), y:(T ? 400 : 453), uppercase:true,
			text_id:"label_cheat",
			onclick: function(){ _move(PD.CHEAT); }
		});
		self.add({
			id:"arenaCooperate", type:"Button", x:(T ? 712 : 495), y:(T ? 397 : 450), uppercase:true,
			text_id:"label_cooperate",
			onclick: function(){ _move(PD.COOPERATE); }
		});

		// Клавиши: ← — обмануть, → — довериться (нажатие той же кнопки: со звуком и только когда она активна);
		// в турнире Enter или пробел — следующий матч
		var _press = function(id){
			return function(){
				var hitbox = o[id] && o[id].dom.querySelector("#hitbox");
				if(hitbox && hitbox.onclick) hitbox.onclick();
			};
		};
		_arenaKeysOn({37:_press("arenaCheat"), 39:_press("arenaCooperate"), 13:_press("tourNext"), 32:_press("tourNext")});

		// Выйти назад (внизу слева): из дуэли — к камню; из турнира — к экрану турнира,
		// вторым нажатием (первое спрашивает «точно?»: доигранные матчи турнира пропадут)
		if(!T){
			_arenaBackToStone(self, 40, 495);
		}else{
			var _sure = false;
			self.add({
				id:"exitTour", type:"ArenaLink",
				x:40, y:490, width:225,
				text_id:"arena_tour_exit",
				onclick: function(){
					if(!_sure){
						_sure = true;
						o.exitTour.dom.innerHTML = Words.get("arena_tour_exit_sure");
						return;
					}
					D.tour = false;
					publish("slideshow/scratch", ["arena_tour"]);
				}
			});
		}
		if(_arenaHasKeyboard()){
			self.add({
				id:"keys", type:"TextBox",
				x:(T ? 440 : 235), y:512, width:(T ? 520 : 490), height:24, align:"center", color:"#aaa", size:15,
				text_id:"arena_duel_keys"
			});
			_keysHint = function(){ // в «мгновенно» клавишу можно держать: ходы идут подряд
				if(!D.done) o.keys.setText(_arenaWord(speed=="instant" ? "arena_duel_keys_instant" : "arena_duel_keys"));
			};
			_keysHint();
		}

		// Конец раунда
		listen(self, "iterated/round/end", function(payoffA, payoffB, info){

			D.round++;
			D.ys += payoffA;
			D.os += payoffB;
			o.scoreboard.addScore(payoffA, payoffB);
			o.history.addRound(info, true);
			D.history.push(info);

			if(D.round >= D.L){
				D.done = true;
				o.history.revealThem(); // матч сыгран — теперь видно, где ошибался соперник
				_showInfo(info);
				if(T){
					_tourDone();
				}else{
					_.arenaRulesSeen = true; // правила в следующих дуэлях уже не нужны
					_.arenaDuelTimer = setTimeout(function(){
						publish("slideshow/scratch", ["arena_result"]);
					}, 1800/_arenaSpeed);
				}
			}else{
				_showInfo(info);
				_busy = false;
				if(_dimmed){ // в «мгновенно» кнопки не гасли
					_dimmed = false;
					publish("arenaCheat/activate");
					publish("arenaCooperate/activate");
				}
			}

		});

	},
	onend: function(self){
		clearTimeout(_.arenaDuelTimer);
		_arenaKeysOff();
		_arenaSpeed = 1;
		unlisten(self);
		self.clear();
	}
});

// 6. Итог матча: счёт; тот же матч с моделями на твоём месте (Claude 5.0, Kimi 5.0, с 02.11.2026 и DeepSeek); все ходы; кто был соперником
var _arenaSigned = function(x){
	return (x<0 ? "&minus;" : "") + Math.abs(x);
};
var _arenaName = function(id){
	return "<span class='"+id+"'>"+_arenaWord("label_"+id)+"</span>";
};
// Вердикт: больше / столько же / меньше, чем у каждой модели на твоём месте в этом же матче.
// scores — счёт каждой модели на твоём месте; модели с одинаковым ответом идут одной группой:
// «Это больше, чем у Claude 5.0 и Kimi 5.0 на твоём месте, и меньше, чем у DeepSeek».
var _arenaVerdict = function(you, scores){
	var rel = function(x){ return (you>x) ? "more" : ((you==x) ? "equal" : "less"); };
	var groups = {more:[], equal:[], less:[]};
	ARENA_CHARACTERS.forEach(function(id){
		if(scores[id]!==undefined) groups[rel(scores[id])].push(_arenaName(id));
	});
	var used = ["more", "equal", "less"].filter(function(r){ return groups[r].length; });
	if(used.length==1) return _arenaWord("arena_result_all_"+used[0]);
	var list = function(a){ return (a.length==1) ? a[0] : a.slice(0, -1).join(", ")+" и "+a[a.length-1]; };
	var parts = used.map(function(r){ return _arenaWord("arena_result_rel_"+r)+" у "+list(groups[r]); });
	var text = parts[0]+" "+_arenaWord("arena_result_seat")
		+ ((parts.length==2) ? ", и "+parts[1] : ", "+parts[1]+" и "+parts[2]);
	return _arenaWord("arena_result_mixed").replace(/\[PARTS\]/g, text);
};
SLIDES.push({
	id: "arena_result", chapter: "arena", nodot: true,
	onstart: function(self){

		var D = _arenaDuel();
		var L = D.L || 0;
		var per = L ? D.ys/L : 0;

		// Тот же матч — те же раунды, те же ошибки, тот же соперник — с каждой моделью на твоём месте
		var fair = !!(D.rolls && D.seed && D.history);
		var C = fair ? _arenaReplay("claude5", D) : null;
		var K = fair ? _arenaReplay("kimi5", D) : null;
		var S = fair ? _arenaReplay("deepseek", D) : null;

		// Счёт крупно, как в главе «Повторяющаяся игра»
		self.add({
			id:"score1", type:"TextBox",
			x:24, y:32, width:243, height:26,
			text_id:"arena_result_start"
		});
		self.add({
			id:"score2", type:"TextBox",
			x:114, y:44, width:151, height:132, align:"right", size:123,
			text: _arenaSigned(D.ys)
		});

		// Сколько и как это по сравнению с моделями на твоём месте
		var text = _arenaWord("arena_result_text");
		text = text.replace(/\[L\]/g, L+"");
		text = text.replace(/\[PER\]/g, _arenaNumber(per));
		text = text.replace(/\[THEM\]/g, _arenaSigned(D.os));
		if(fair) text += "<br><br>" + _arenaVerdict(D.ys, {claude5:C.ys, kimi5:K.ys, deepseek:S.ys});
		self.add({
			id:"score3", type:"TextBox",
			x:290, y:50, width:640, height:130,
			text: text
		});

		// Все ходы матча: твои и моделей на твоём месте (значки и уголки ошибок — как в дуэли)
		if(fair){
			self.add({
				id:"rows", type:"TextBox",
				x:130, y:182, width:700, height:24, align:"center", color:"#999", size:16,
				text_id:"arena_result_rows"
			});
			var rows = [
				{label:_arenaWord("arena_result_you"), history:D.history, score:D.ys},
				{label:_arenaName("claude5"), history:C.history, score:C.ys},
				{label:_arenaName("kimi5"), history:K.history, score:K.ys},
				{label:_arenaName("deepseek"), history:S.history, score:S.ys}
			];
			for(var i=0; i<rows.length; i++){
				var y = 208 + i*34;
				self.add({
					id:"row_label_"+i, type:"TextBox",
					x:130, y:y+3, width:150, height:28, align:"right", size:18,
					text: rows[i].label
				});
				self.add({id:"row_strip_"+i, type:"ArenaHistory", x:292, y:y, row:true});
				for(var r=0; r<rows[i].history.length; r++) self.objects["row_strip_"+i].addRound(rows[i].history[r]);
				self.add({
					id:"row_score_"+i, type:"TextBox",
					x:300+12*32, y:y+3, width:120, height:28, size:18,
					text: "<b>"+_arenaSigned(rows[i].score)+"</b>"
				});
			}
		}

		// Кто это был (имя — ссылка на его карточку) и где он ошибался
		var whoY = fair ? 350 : 212; // под четырьмя полосками ходов: ты и три модели
		self.add({
			id:"whoPeep", type:"TextBox",
			x:300, y:whoY, width:80, height:82,
			text: _arenaPeep(D.opp, 80, 0, 0)
		});
		var who = _arenaWord(D.blind ? "arena_result_blind" : "arena_result_who")
			.replace(/\[NAME\]/g, "<span class='arena_who_link "+D.opp+"'>"+_arenaWord("label_"+D.opp)+"</span>");
		if(D.noiseNow) who += "<br><span class='arena_mistake'>"+_arenaTheirMistakesText(D.history)+"</span>";
		self.add({
			id:"who", type:"TextBox",
			x:388, y:whoY+12, width:500, height:60, size:20,
			text: who
		});
		self.objects.who.dom.querySelector(".arena_who_link").onclick = function(){
			Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
			_.arenaCard = D.opp;
			publish("slideshow/scratch", ["arena_card"]);
		};

		_arenaBackToStone(self, 40, 490);
		self.add({ // после матча — объяснения: дуб со свитками
			id:"learn", type:"ArenaLink",
			x:40, y:462, width:200,
			text_id:"arena_result_learn",
			onclick: function(){
				publish("slideshow/scratch", ["arena_oak"]);
			}
		});

		// Ещё раз или другой соперник
		self.add({
			id:"again", type:"Button", x:250, y:478,
			text_id:"arena_result_again",
			onclick: function(){
				D.blind = false;
				publish("slideshow/scratch", ["arena_duel"]);
			}
		});
		self.add({
			id:"other", type:"Button", x:515, y:478,
			text_id:"arena_result_other",
			onclick: function(){
				publish("slideshow/scratch", ["arena_pick"]);
			}
		});

	},
	onend: function(self){
		self.clear();
	}
});

// 7. Ставка (прямо, от вступления турнира): кто будет лидером через 10 поколений турнира «как на арене»
SLIDES.push({
	id: "arena_bet", chapter: "arena", nodot: true,
	onstart: function(self){

		self.add({
			id:"text", type:"TextBox",
			x:130, y:170, width:700, height:60, align:"center",
			text_id:"arena_bet_text"
		});

		// Ставки: портреты с подсказками, как ставки в главах 4–6
		var _addBet = function(character, x, y, tooltipPos){
			(function(character, x, y, tooltipPos){
				self.add({
					id:"bet_"+character, type:"Button", x:x, y:y,
					text_id:"icon_"+character,
					tooltip:"who_"+character,
					onclick:function(){
						_.arenaBet = character;
						publish("slideshow/scratch", ["arena_bet_run"]);
					}
				});
				// Левой колонке подсказка вправо: позиция left обрезается краем окна
				if(tooltipPos){
					self.objects["bet_"+character].dom.setAttribute("data-balloon-pos", tooltipPos);
				}
			})(character, x, y, tooltipPos);
		};
		_addBet("claude5", 250, 260, "right"); _addBet("kimi5", 510, 260);
		_addBet("tft", 250, 330, "right"); _addBet("deepseek", 510, 330);

		self.add({
			id:"forgot", type:"TextBox",
			x:380, y:430, width:200, height:50,
			align:"center", color:"#aaa", size:15,
			text_id:"forgot_whos_who"
		});
		_arenaBackToStone2(self, 40, 495); // на ставку пришли со второго камня

	},
	onend: function(self){
		self.clear();
	}
});

// 8. Турнир «как на арене»: через 10 поколений — ответ на ставку
SLIDES.push({
	id: "arena_bet_run", chapter: "arena", nodot: true,
	onstart: function(self){

		var o = self.objects;
		var bet = _.arenaBet;

		// Набор «как на арене»: сначала настройки, потом объект турнира
		Tournament.resetGlobalVariables();
		var preset = ARENA_PRESETS.arena;
		for(var i=0; i<Tournament.INITIAL_AGENTS.length; i++){
			var conf = Tournament.INITIAL_AGENTS[i];
			conf.count = preset.agents[conf.strategy] || 0;
		}
		Tournament.POPULATION = preset.population;
		Tournament.RANDOM_TURNS = preset.randomTurns;
		Tournament.SELECTION = preset.evolution;
		PD.NOISE = preset.noise;
		self.add({id:"tournament", type:"Tournament", x:-20, y:20});

		// Ставка крупно
		var words = Words.get("arena_bet_run_text");
		words = words.replace(/\[CHAR\]/g, "<span class='"+bet+"'>"+Words.get("label_"+bet)+"</span>");
		self.add({
			id:"text", type:"TextBox",
			x:510, y:30, width:450, height:160,
			text: words
		});

		// Кнопки управления, как в главе «Ашипки»
		var x = 172;
		var y = 175;
		var dy = 70;
		self.add({
			id:"playButton", type:"Button", size:"short",
			x:x, y:y, text_id:"label_start",
			onclick: function(){
				if(o.tournament.isAutoPlaying){
					publish("tournament/autoplay/stop");
				}else{
					publish("tournament/autoplay/start");
				}
			}
		});
		listen(self, "tournament/autoplay/stop", function(){
			o.playButton.setText("label_start");
		});
		listen(self, "tournament/autoplay/start", function(){
			o.playButton.setText("label_stop");
		});
		self.add({
			id:"stepButton", type:"Button", size:"short",
			x:x, y:y+dy, text_id:"label_step", message:"tournament/step"
		});
		self.add({
			id:"resetButton", type:"Button", size:"short",
			x:x, y:y+dy*2, text_id:"label_reset", message:"tournament/reset"
		});

		// Ответ после 10 поколений
		var reproduceSteps = 0;
		var answered = false;
		listen(self, "tournament/reset", function(){
			reproduceSteps = 0;
			answered = false;
			if(o.answer) self.remove("answer");
			if(o.toSandbox) self.remove("toSandbox");
			if(o.toTour) self.remove("toTour");
		});
		listen(self, "tournament/step/completed", function(step){
			if(step!="reproduce" || answered) return;
			reproduceSteps++;
			if(reproduceSteps!=10) return;
			answered = true;

			publish("tournament/autoplay/stop");

			// Лидеры по численности (ничья: все с максимумом)
			var counts = {};
			o.tournament.agents.forEach(function(a){
				counts[a.strategyName] = (counts[a.strategyName]||0)+1;
			});
			var max = 0;
			for(var s in counts) max = Math.max(max, counts[s]);
			var leaders = Object.keys(counts).filter(function(s){ return counts[s]==max; });
			var correct = (leaders.indexOf(bet) >= 0);
			var names = leaders.map(function(s){
				return "<span class='"+s+"'>"+Words.get("label_"+s)+"</span>";
			}).join(" "+_arenaWord("arena_bet_and")+" ");

			var w = Words.get(correct ? "arena_bet_correct" : "arena_bet_wrong");
			w = w.replace(/\[LEADER\]/g, names);
			w += "<br><br>" + Words.get("arena_bet_facts");
			self.add({
				id:"answer", type:"TextBox",
				x:510, y:150, width:450,
				text: w
			});
			_hide(o.answer); _fadeIn(o.answer, 100);

			// Проверить самому — песочница с этим набором
			self.add({
				id:"toSandbox", type:"ArenaLink",
				x:510, y:470, width:450,
				text_id:"arena_bet_sandbox",
				onclick: function(){ _arenaToSandbox("arena"); }
			});
			_hide(o.toSandbox); _fadeIn(o.toSandbox, 300);

			// …или сыграть в этом турнире самому
			self.add({
				id:"toTour", type:"ArenaLink",
				x:510, y:442, width:450,
				text_id:"arena_bet_tour",
				onclick: function(){
					publish("slideshow/scratch", ["arena_tour"]);
				}
			});
			_hide(o.toTour); _fadeIn(o.toTour, 300);

		});

		_arenaBackToStone2(self, 510, 498);

	},
	onend: function(self){
		unlisten(self);
		self.clear();
	}
});

/*******************************

Ты в турнире «как на арене» — одно поколение с тобой (подсчёт — js/sims/ArenaUI.js, _arenaTourTable).
9. Второй камень → 17 матчей в автомате (слайд дуэли в режиме турнира, D.tour: слева арена, справа автомат;
после последнего матча — финал там же) → 10. Итог поколения.
Кто соперник, во время матчей не видно (как на арене), если перед турниром не включено «знать соперника».

*******************************/

// Значок вида с подписью под ним (ячейка ряда)
var _arenaCell = function(id, below, cls, title){
	var face = (id=="you")
		? "<span class='arena_you'>"+_arenaWord("arena_result_you")+"</span>"
		: "<span class='"+id+"'><span class='icon'></span></span>";
	return "<span class='arena_cell"+(cls ? " "+cls : "")+"'"+(title ? " title='"+title+"'" : "")+">"+face+below+"</span>";
};
var _arenaPlain = function(id){
	return _arenaWord("label_"+id).replace(/<[^>]*>/g, "");
};

// Место словами: «7-м» или, если поровну с другими, «7–9-м»
var _arenaPlaceWord = function(t){
	return t.tied ? (t.place+"–"+(t.place+t.tied)+"-м") : (t.place+"-м");
};

// 9. Прямо: второй камень — турнир «как на арене». Надпись в рифму: налево — сам в турнир (13 матчей в автомате),
// направо — урок: твой ученик играет за тебя в песочнице (набор «твой ученик»), назад — к первому камню.
// Под левым указателем — настройки турнира: знать соперника и скорость (с пояснением, что это).
SLIDES.push({
	id: "arena_tour", chapter: "arena", nodot: true,
	onstart: function(self){

		// Настройки турнира (запоминаются до конца сеанса): кто соперник — не видно, как на арене;
		// скорость — «быстро» (ещё есть «обычно» и «мгновенно»: ход засчитывается сразу, без анимации)
		if(!_.arenaTourOpts) _.arenaTourOpts = {know:false, speed:"fast"};
		var opts = _.arenaTourOpts;

		var _gone = false; // одна дорога за раз: второе нажатие во время перехода не считается
		var _go = function(way){
			if(_gone) return;
			_gone = true;
			if(way=="left"){ // сам в турнир
				var T = _arenaNewTour();
				T.know = opts.know;
				T.speed = opts.speed;
				var D = _arenaDuel();
				D.tour = true;
				D.blind = !T.know;
				publish("slideshow/scratch", ["arena_duel"]);
			}else if(way=="right"){ // урок: ученик сыграет за тебя — песочница с учениками
				_arenaToSandbox("student");
			}else{ // назад — к первому камню
				publish("slideshow/scratch", ["arena"]);
			}
		};

		self.add({id:"stone", type:"ArenaStone2", x:0, y:0, onpick:_go});
		self.add({
			id:"title", type:"TextBox",
			x:130, y:4, width:700, height:40, align:"center", size:28,
			text_id:"arena_stone2_title"
		});
		self.add({
			id:"sub", type:"TextBox",
			x:130, y:42, width:700, height:26, align:"center", size:17, color:"#999",
			text_id:"arena_stone2_sub"
		});

		// Настройки — под левым указателем: они для турнира, в который идёшь сам
		self.add({
			id:"know", type:"ArenaToggle", x:20, y:428, width:360, size:17,
			text_id:"arena_opt_know", value:opts.know,
			onchange: function(value){ opts.know = value; }
		});
		self.add({
			id:"speed", type:"ArenaSpeed", x:20, y:455, width:380, size:17,
			value:opts.speed,
			onchange: function(value){ opts.speed = value; }
		});
		self.add({
			id:"speedHint", type:"TextBox",
			x:20, y:481, width:380, height:22, size:14, color:"#999",
			text_id:"arena_speed_hint"
		});

		self.add({
			id:"bet", type:"ArenaLink",
			x:548, y:505, width:300,
			text_id:"arena_tour_bet",
			onclick: function(){
				if(_gone) return;
				_gone = true;
				publish("slideshow/scratch", ["arena_bet"]);
			}
		});

		// Клавиши ← → ↓ — по дорогам (со звуком, как при щелчке)
		var _press = function(way){
			return function(){
				if(_gone) return;
				Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
				_go(way);
			};
		};
		_arenaKeysOn({37:_press("left"), 39:_press("right"), 40:_press("back")});
		if(_arenaHasKeyboard()){
			self.add({
				id:"keys", type:"TextBox",
				x:560, y:478, width:200, height:24, color:"#aaa", size:15,
				text_id:"arena_stone2_keys"
			});
		}

	},
	onend: function(self){
		_arenaKeysOff();
		self.clear();
	}
});

// 10. Итог поколения: твоё место из 35, кто выбывает и кто получает копию, твои матчи, модели на твоём месте
SLIDES.push({
	id: "arena_tour_result", chapter: "arena", nodot: true,
	onstart: function(self){

		var T = _.arenaTour;
		var D = _arenaDuel();
		D.tour = false;

		// Ещё раз или к выбору соперника
		var _buttons = function(){
			self.add({
				id:"again", type:"Button", x:250, y:470,
				text_id:"arena_tour_again",
				onclick: function(){ publish("slideshow/scratch", ["arena_tour"]); }
			});
			self.add({
				id:"other", type:"Button", x:515, y:470,
				text_id:"arena_tour_back",
				onclick: function(){ publish("slideshow/scratch", ["arena"]); }
			});
		};

		// Пришли сюда, не доиграв турнир
		if(!T || T.matches.length < T.order.length){
			self.add({
				id:"title", type:"TextBox",
				x:130, y:200, width:700, height:60, align:"center",
				text_id:"arena_tour_unfinished"
			});
			_buttons();
			return;
		}

		var me = T.table || _arenaTourTable(T, null); // та же таблица, что в финале турнира (тот же жребий)
		var c5 = _arenaTourTable(T, "claude5");
		var k5 = _arenaTourTable(T, "kimi5");
		var d5 = _arenaTourTable(T, "deepseek");

		// Место и вердикт
		var title = (me.tied ? _arenaWord("arena_tour_place_tied") : _arenaWord("arena_tour_place"))
			.replace(/\[P\]/g, me.place+"")
			.replace(/\[Q\]/g, (me.place+me.tied)+"")
			.replace(/\[N\]/g, me.n+"");
		self.add({
			id:"title", type:"TextBox",
			x:30, y:12, width:900, height:40, align:"center", size:30,
			text: "<b>"+title+"</b>"
		});
		var verdict = _arenaWord(me.top ? "arena_tour_top" : (me.out ? "arena_tour_out" : "arena_tour_stay"));
		if(me.lot) verdict += " " + _arenaWord("arena_tour_lot");
		verdict += "<br>" + _arenaWord("arena_tour_score")
			.replace(/\[S\]/g, _arenaSigned(me.total))
			.replace(/\[BEST\]/g, _arenaSigned(me.rows[0].total))
			.replace(/\[WORST\]/g, _arenaSigned(me.rows[me.rows.length-1].total));
		self.add({
			id:"verdict", type:"TextBox",
			x:80, y:56, width:800, height:52, align:"center", size:17,
			text: verdict
		});

		// Лестница поколения: 18 мест слева направо, от лучшего к худшему
		var lad = "", S = ARENA_TOUR.selection;
		for(var i=0; i<me.rows.length; i++){
			var r = me.rows[i];
			var cls = (i<S ? "top" : (i>=me.rows.length-S ? "out" : ""));
			if(r.you) cls += " you";
			var name = r.you ? _arenaWord("arena_result_you") : _arenaPlain(r.id);
			lad += _arenaCell(r.id, _arenaSigned(r.total), cls, (i+1)+". "+name+": "+_arenaSigned(r.total));
		}
		self.add({
			id:"ladder", type:"TextBox",
			x:25, y:112, width:910, height:60,
			text: "<div class='arena_cells arena_lad'>"+lad+"</div>"
		});
		self.add({
			id:"legend", type:"TextBox",
			x:25, y:172, width:910, height:22, align:"center", size:14, color:"#999",
			text_id:"arena_tour_legend"
		});

		// Твои матчи: по порядку, твои очки и (серым) очки соперника — каждый матч засчитан один раз
		var mine = "";
		for(var m=0; m<T.matches.length; m++){
			var M = T.matches[m];
			mine += _arenaCell(M.opp, _arenaSigned(M.ys)+"<br><span class='arena_x'>"+_arenaSigned(M.os)+"</span>", "", _arenaPlain(M.opp));
		}
		self.add({
			id:"mineTitle", type:"TextBox",
			x:25, y:204, width:910, height:22, align:"center", size:15, color:"#999",
			text_id:"arena_tour_matches"
		});
		self.add({
			id:"mine", type:"TextBox",
			x:25, y:228, width:910, height:80,
			text: "<div class='arena_cells arena_mine'>"+mine+"</div>"
		});

		// Те же матчи с Claude 5.0 и Kimi 5.0 на твоём месте
		var seats = _arenaWord("arena_tour_seats")
			.replace(/\[C\]/g, _arenaName("claude5"))
			.replace(/\[K\]/g, _arenaName("kimi5"))
			.replace(/\[PC\]/g, _arenaPlaceWord(c5))
			.replace(/\[PK\]/g, _arenaPlaceWord(k5))
			.replace(/\[S\]/g, _arenaName("deepseek"))
			.replace(/\[PS\]/g, _arenaPlaceWord(d5));
		self.add({
			id:"seats", type:"TextBox",
			x:130, y:330, width:700, height:60, align:"center", size:18,
			text: seats
		});
		self.add({
			id:"note", type:"TextBox",
			x:130, y:394, width:700, height:60, align:"center", size:15, color:"#999",
			text_id:"arena_tour_note"
		});

		_buttons();

	},
	onend: function(self){
		self.clear();
	}
});

// 11. Чему научила арена: выводы эстафеты (карточка 4; ссылка — из свитка на дубе)
SLIDES.push({
	id: "arena_lessons", chapter: "arena", nodot: true,
	onstart: function(self){

		self.add({
			id:"title", type:"TextBox",
			x:30, y:18, width:900, height:44, align:"center", size:30,
			text_id:"arena_lessons_title"
		});
		self.add({
			id:"intro", type:"TextBox",
			x:130, y:64, width:700, height:44, align:"center", size:16, color:"#999",
			text_id:"arena_lessons_intro"
		});

		// Уроки: заголовок цветом, как в «Заключении», под ним текст с числом из летописи
		var _lesson = function(num, y, color){
			self.add({
				id:"l"+num+"h", type:"TextBox",
				x:60, y:y, width:840, height:26, size:21, color:color,
				text_id:"arena_lessons_"+num+"h"
			});
			self.add({
				id:"l"+num+"t", type:"TextBox",
				x:60, y:y+30, width:840, height:60, size:16,
				text_id:"arena_lessons_"+num+"t"
			});
		};
		_lesson(1, 122, "#4089DD");
		_lesson(2, 214, "#efc701");
		_lesson(3, 306, "#DD4040");
		_lesson(4, 398, "#4089DD");

		self.add({
			id:"back", type:"ArenaLink",
			x:600, y:520, width:330, align:"right",
			text_id:"arena_back_oak",
			onclick: function(){
				publish("slideshow/scratch", ["arena_oak"]);
			}
		});

	},
	onend: function(self){
		self.clear();
	}
});

// Адрес с #arena (ярлык «Арена моделей» на рабочем столе): игра сразу открывается на камне на распутье,
// без заставки — как будто нажали «ИГРАТЬ», а потом последнюю точку внизу.
if(/^#arena$/i.test(window.location.hash)){
	subscribe("preloader/done", function(){
		setTimeout(function(){
			if(!slideshow || !slideSelect) return;
			slideSelect.dom.style.display = "block"; // точки внизу и без переводов — как после «ИГРАТЬ» (js/main.js)
			$("#translations").style.display = "none";
			Loader.sounds.bg_music.volume(0.75).loop(true).play();
			publish("slideshow/scratch", ["arena"]);
		}, 0);
	});
}
