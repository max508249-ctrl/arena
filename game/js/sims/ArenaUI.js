/*
АРЕНА МОДЕЛЕЙ — объекты бонусной главы и наборы для песочницы.
Персонажи — js/sims/ArenaStrategies.js, слайды — js/slides/10_Slides_Arena.js.
*/

// Персонажи оригинальной игры (новые персонажи-модели — ARENA_CHARACTERS в ArenaStrategies.js)
var ARENA_GAME_CHARS = ["tft", "all_d", "all_c", "grudge", "prober", "tf2t", "pavlov", "random"];

// Группа персонажа: модели или персонажи игры (в песочнице у каждой группы своя страница)
var _arenaGroup = function(id){
	return (ARENA_CHARACTERS.indexOf(id)>=0) ? ARENA_CHARACTERS : ARENA_GAME_CHARS;
};

// Песочница из главы 10: ползунки независимые — у вида от 0 до ARENA_POP_ONE, всего — не больше ARENA_POP_MAX
var ARENA_POP_ONE = 20, ARENA_POP_MAX = 50;

// Наборы для песочницы: «как на арене» (34 игрока, длина матча 8–12), «как в игре»
// и «твой ученик» (правая дорога второго камня) — с 01.11.2026 половина арены, как в турнире «сам»
// (Claude 5.0 и Kimi 5.0 по трое, остальные по одному), и двое твоих учеников: 19 игроков, по трое выбывают
// и копируются; человечки в круге при 19 крупнее (автор: «со 19»), добавить игроков — ползунками, до 50
var ARENA_PRESETS = {
	arena: {
		population:34, turns:10, randomTurns:true, evolution:5, noise:0.05,
		agents:{tft:2, all_d:2, all_c:2, grudge:2, prober:2, tf2t:2, pavlov:2, random:2,
			claude5:6, kimi5:6, giga_tri:2, giga_shield:2, giga_start:2}
	},
	game: {
		population:25, turns:10, randomTurns:false, evolution:5, noise:0.05,
		agents:{tft:3, all_d:3, all_c:3, grudge:3, prober:3, tf2t:3, pavlov:3, random:4}
	},
	student: {
		population:19, turns:10, randomTurns:true, evolution:3, noise:0.05,
		agents:{tft:1, all_d:1, all_c:1, grudge:1, prober:1, tf2t:1, pavlov:1, random:1,
			claude5:3, kimi5:3, giga_tri:1, giga_shield:1, giga_start:1, student:2}
	}
};

/*******************************

Твой ученик — ты в малиновой кепке (правая дорога второго камня: «направо пойдёшь — урок проведёшь»).
Играет по урокам ARENA_STUDENT — пять ответов, как на карточках: что делать в первом раунде,
когда вы оба доверились, когда ты обманул, а он доверился, когда он обманул (доверюсь / обману /
потерплю раз / обижусь навсегда) и когда он ответил обманом на твою ошибку (прощу / отвечу обманом).
Уроки задаются в песочнице (ArenaLessons ниже); ученик читает их в начале каждого матча.
По умолчанию — как Имитатор: доверяется первым, дальше повторяет ход соперника.

*******************************/
PEEP_METADATA.student = {frame:14, color:"#C93468", hat:32}; // кадр 14 в листах турнира и значков (портрет — 15)
var ARENA_STUDENT_DEFAULT = {first:"C", cc:"C", dc:"C", d:"D", contrite:false};
var ARENA_STUDENT = JSON.parse(JSON.stringify(ARENA_STUDENT_DEFAULT));
function Logic_student(){
	var self = this;
	var C = PD.COOPERATE, D = PD.CHEAT;
	var s = JSON.parse(JSON.stringify(ARENA_STUDENT)); // уроки — на весь матч
	var _m = function(x){ return (x=="D") ? D : C; };
	var round = 0, grudge = false, streak = 0, myLast = C, hisLast = C, intended = C, prevMistake = false, justified = false;
	self.play = function(){
		var m;
		if(round===0) m = _m(s.first);
		else if(grudge) m = D;
		else if(hisLast==D && !justified){ // он обманул (и это не ответ на мою ошибку, если прощаю)
			if(s.d=="grudge"){ grudge = true; m = D; }
			else if(s.d=="tol") m = (streak>=2) ? D : C; // потерплю раз: отвечаю на второй обман подряд
			else m = _m(s.d);
		}
		else m = (myLast==D) ? _m(s.dc) : _m(s.cc);
		intended = m;
		return m;
	};
	self.remember = function(own, other){ // own, other — сыгранные ходы (с ошибками)
		justified = !!s.contrite && prevMistake && other==D; // он ответил обманом на мою ошибку
		round++;
		myLast = own;
		hisLast = other;
		streak = (other==D && !justified) ? streak+1 : 0;
		prevMistake = (own==D && intended==C); // хотел довериться, а вышел обман
	};
}

// На кого из персонажей игры ученик похож (если уроки дают ровно его игру), иначе null
var _arenaStudentLike = function(s){
	var cc = s.first+s.cc+s.dc;
	if(cc=="DDD" && s.d=="D") return "all_d";
	if(cc=="CCC"){
		if(s.d=="C") return "all_c";
		if(s.contrite) return null;
		if(s.d=="D") return "tft";
		if(s.d=="tol") return "tf2t";
		if(s.d=="grudge") return "grudge";
	}
	return null;
};

// Дуэль: что выбрано (соперник, ошибки, вслепую) и как прошёл матч
var _arenaDuel = function(){
	if(!_.arenaDuel) _.arenaDuel = {opp:"claude5", noise:true, blind:false};
	return _.arenaDuel;
};

// Число с запятой: 1.5 → «1,50»
var _arenaNumber = function(x){
	return (x<0 ? "&minus;" : "") + Math.abs(x).toFixed(2).replace(".", ",");
};

// Слово из words.html без переводов строк по краям — чтобы вставлять его внутрь фразы
var _arenaWord = function(id){
	return Words.get(id).trim();
};

// Форма слова при числе по-русски: 1, 21 — one; 2–4, 22–24 — few; 5–20, 25… — many
var _arenaPlural = function(n, one, few, many){
	var a = Math.abs(n)%100, b = a%10;
	if(a>10 && a<20) return many;
	if(b==1) return one;
	if(b>1 && b<5) return few;
	return many;
};

/*******************************

«Быстро»: анимации автомата втрое быстрее. Все анимации игры считают время через _s (helpers.js),
поэтому достаточно делить время на _arenaSpeed. Он не равен 1 только на слайде дуэли (10_Slides_Arena.js).

*******************************/
var _arenaSpeed = 1;
if(typeof _s!=="undefined") (function(){
	var _sOriginal = _s;
	_s = function(seconds){
		return _sOriginal(seconds/_arenaSpeed);
	};
})();

// Ошибки соперника в матче: номера раундов (с 1) — для строки после матча
var _arenaTheirMistakes = function(history){
	var rounds = [];
	for(var i=0; i<history.length; i++) if(history[i].themMistake) rounds.push(i+1);
	return rounds;
};
var _arenaTheirMistakesText = function(history){
	var r = _arenaTheirMistakes(history);
	if(r.length==0) return _arenaWord("arena_them_err_none");
	if(r.length==1) return _arenaWord("arena_them_err_one").replace(/\[R\]/g, r[0]+"");
	return _arenaWord("arena_them_err_many").replace(/\[R\]/g, r.join(", "));
};

/*******************************

Человечки во весь рост — портреты из peep_characters.png (кадры 300×325):
13 персонажей (кадр — PEEP_METADATA[id].frame), потом соперник вслепую (13), ты сам без шляпы (14)
и твой ученик — ты в малиновой кепке (15).
Смотрят вправо; flip — отразить, чтобы смотрел влево.

*******************************/
var ARENA_PEEP_EXTRA = {mystery:13, you:14, student:15};
var _arenaPeepFrame = function(id){
	return (ARENA_PEEP_EXTRA[id]!==undefined) ? ARENA_PEEP_EXTRA[id] : PEEP_METADATA[id].frame;
};
var _arenaPeep = function(id, h, x, y, flip){
	var w = h*300/325;
	var style = "width:"+Math.round(w)+"px;height:"+h+"px;"
		+ "background-position:"+(-_arenaPeepFrame(id)*w).toFixed(1)+"px 0;";
	if(x!==undefined) style += "left:"+Math.round(x)+"px;top:"+Math.round(y)+"px;";
	if(flip) style += "transform:scaleX(-1);";
	return "<div class='arena_peep' style='"+style+"'></div>";
};

// Замкнутая гладкая кривая через точки (Catmull-Rom → кривые Безье) — для SVG
var _arenaSmooth = function(pts){
	var n = pts.length, d = "M"+pts[0][0]+","+pts[0][1];
	for(var i=0; i<n; i++){
		var p0 = pts[(i-1+n)%n], p1 = pts[i], p2 = pts[(i+1)%n], p3 = pts[(i+2)%n];
		d += " C"+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+","+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)
			+" "+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+","+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)
			+" "+p2[0]+","+p2[1];
	}
	return d+" Z";
};

/*******************************

Честное сравнение в дуэли: всё случайное в матче выпадает заранее.
Длина матча и ошибки — на каждый раунд и каждое место (ты / соперник),
случайные ходы соперника (у Случайного) — из зерна матча.
Тогда на место игрока можно посадить Claude 5.0 или Kimi 5.0 и переиграть тот же матч:
те же раунды, те же ошибки, тот же соперник с той же монеткой.

*******************************/

// Генератор случайных чисел из строки-зерна (xmur3 + mulberry32)
var _arenaRng = function(seed){
	var h = 1779033703 ^ seed.length;
	for(var i=0; i<seed.length; i++){
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	var s = (h ^ (h >>> 16)) >>> 0;
	return function(){
		s = (s + 0x6D2B79F5) >>> 0;
		var t = s;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

// Вызвать fn так, чтобы Math.random внутри брал числа из зерна этого места и этого раунда
var _arenaWithRandom = function(seed, place, round, fn){
	var saved = Math.random;
	Math.random = _arenaRng(seed+":"+place+":"+round);
	try{ return fn(); }
	finally{ Math.random = saved; }
};

// Новый матч: длина (8–12, никто не знает заранее), ошибки на каждый раунд (если включены) и зерно.
// В турнире «как на арене» ошибки есть всегда, как на арене (переключатель дуэли не трогаем).
var _arenaNewMatch = function(D){
	D.L = 8 + Math.floor(Math.random()*5);
	D.seed = Math.random().toString(36).slice(2);
	D.rolls = [];
	D.noiseNow = !!(D.tour || D.noise);
	var noise = D.noiseNow ? 0.05 : 0;
	for(var i=0; i<12; i++){
		D.rolls.push({you: Math.random()<noise, them: Math.random()<noise});
	}
};

// Соперник в дуэли ходит из зерна матча — тогда при переигровке его монетка выпадет так же
var _arenaSeededLogic = function(logic, D){
	var play = logic.play;
	logic.play = function(){
		return _arenaWithRandom(D.seed, "them", D.round, function(){ return play.call(logic); });
	};
	return logic;
};

// Тот же матч, но на месте игрока — персонаж seat (Claude 5.0 или Kimi 5.0)
var _arenaReplay = function(seat, D){
	var me = new window["Logic_"+seat]();
	var them = new window["Logic_"+D.opp]();
	var res = {history:[], ys:0, os:0};
	for(var i=0; i<D.L; i++){
		var A = _arenaWithRandom(D.seed, "you", i, function(){ return me.play(); });
		var B = _arenaWithRandom(D.seed, "them", i, function(){ return them.play(); });
		var roll = D.rolls[i];
		if(roll.you) A = (A==PD.COOPERATE) ? PD.CHEAT : PD.COOPERATE;
		if(roll.them) B = (B==PD.COOPERATE) ? PD.CHEAT : PD.COOPERATE;
		var payoffs = PD.getPayoffs(A, B);
		me.remember(A, B);
		them.remember(B, A);
		res.ys += payoffs[0];
		res.os += payoffs[1];
		res.history.push({you:A, them:B, youMistake:roll.you, themMistake:roll.them});
	}
	return res;
};

/*******************************

Ты в турнире «как на арене» (левая дорога второго камня). С 01.11.2026 — арена вдвое меньше настоящей,
в тех же долях: Claude 5.0 и Kimi 5.0 по трое, остальные одиннадцать видов по одному — 17 игроков и ты.
Ты играешь с каждым из 17 свой матч, и каждый матч засчитан один раз. (Раньше было 13 матчей с видами,
засчитанных за все копии, — везение умножалось на число копий; замер — arena/tests/tour_size.js:
половина арены ближе всего к настоящей.) Остальные играют друг с другом на движке игры
(PD.playOneTournament): каждый с каждым, 8–12 раундов, ошибки 5 %. Итог — одно поколение:
трое худших выбывают, трое лучших получают копию (ближе всего к 5 из 35 на настоящей арене).

*******************************/
var ARENA_TOUR = {
	agents:{tft:1, all_d:1, all_c:1, grudge:1, prober:1, tf2t:1, pavlov:1, random:1,
		claude5:3, kimi5:3, giga_tri:1, giga_shield:1, giga_start:1},
	selection:3
};

// Сколько игроков каждого вида в турнире (без тебя)
var _arenaTourCounts = function(){
	return ARENA_TOUR.agents;
};

// Игроки турнира по номерам (виды — в порядке ARENA_TOUR, копии подряд): номер → вид
var _arenaTourIds = function(){
	var counts = _arenaTourCounts(), ids = [];
	for(var id in counts) for(var k=0; k<counts[id]; k++) ids.push(id);
	return ids;
};

// Новый турнир: соперники в случайном порядке (who — номер игрока, order — его вид), сыгранных матчей нет.
// place — где кто сидит на арене (место 1–17; место 0 — твоё): тоже случайно в каждом турнире,
// иначе вслепую соперника выдало бы место — виды сидели бы всегда в одном порядке
var _arenaNewTour = function(){
	var ids = _arenaTourIds(), who = [], place = [];
	for(var i=0; i<ids.length; i++){ who.push(i); place.push(i+1); }
	who = _shuffleArray(who);
	place = _shuffleArray(place);
	_.arenaTour = {who: who, order: who.map(function(i){ return ids[i]; }), place: place, i: 0, matches: [], base: null, table: null};
	return _.arenaTour;
};

// Остальные игроки — друг с другом, по правилам арены. Очки каждого (без матчей с тобой) — один раз на турнир.
// Порядок — как у _arenaTourIds: номер игрока в base — тот же, что в who.
var _arenaTourBase = function(tour){
	if(tour.base) return tour.base;
	var ids = _arenaTourIds(), agents = [];
	for(var i=0; i<ids.length; i++){
		(function(id){
			var a = {id:id, coins:0, logic:null};
			a.resetCoins = function(){ a.coins = 0; };
			a.resetLogic = function(){ a.logic = new window["Logic_"+id](); };
			a.play = function(){ return a.logic.play(); };
			a.remember = function(own, other){ a.logic.remember(own, other); };
			a.addPayoff = function(x){ a.coins += x; };
			agents.push(a);
		})(ids[i]);
	}
	var savedNoise = PD.NOISE, savedPayoffs = PD.PAYOFFS;
	PD.NOISE = ARENA_PRESETS.arena.noise;
	PD.PAYOFFS = JSON.parse(JSON.stringify(PD.PAYOFFS_DEFAULT));
	PD.playOneTournament(agents, function(){ return 8+Math.floor(Math.random()*5); });
	PD.NOISE = savedNoise;
	PD.PAYOFFS = savedPayoffs;
	tour.base = agents.map(function(a){ return {id:a.id, coins:a.coins}; });
	return tour.base;
};

// Таблица поколения: 18 строк по убыванию очков (ничьи — жребием, как в игре); у строки i — номер игрока (ты — −1).
// seat — кто на твоём месте: null — ты сам, "claude5" / "kimi5" — модель в тех же матчах (переигровка).
var _arenaTourTable = function(tour, seat){
	var base = _arenaTourBase(tour), got = [], mine = 0, S = ARENA_TOUR.selection;
	for(var i=0; i<base.length; i++) got.push(0);
	for(var m=0; m<tour.matches.length; m++){
		var M = tour.matches[m];
		var r = seat ? _arenaReplay(seat, M) : M;
		got[M.who] += r.os;
		mine += r.ys; // каждый матч — один раз
	}
	var rows = [];
	for(var i=0; i<base.length; i++) rows.push({id:base[i].id, i:i, total: base[i].coins + got[i]});
	var me = {id:"you", i:-1, you:true, total:mine};
	rows.push(me);
	rows = _shuffleArray(rows);
	rows.sort(function(a,b){ return b.total-a.total; });
	var above = 0, tied = 0;
	for(var i=0; i<rows.length; i++){
		if(rows[i]===me) continue;
		if(rows[i].total>mine) above++;
		else if(rows[i].total==mine) tied++;
	}
	var pos = rows.indexOf(me);
	return {
		rows: rows, total: mine, n: rows.length,
		place: above+1, tied: tied,            // место «как в спорте»: сколько выше + 1, и сколько с тем же счётом
		top: pos<S, out: pos>=rows.length-S,    // по порядку после жребия — как решает игра
		lot: tied>0 && ((above<S && above+tied>=S) || (above<rows.length-S && above+tied>=rows.length-S)) // ничья на границе
	};
};

/*******************************

Выбор соперника: портреты моделей и персонажей игры, щелчок — выбор.
config: {x, y, onpick: function(id){}}

*******************************/
function ArenaPicker(config){

	var self = this;
	self.id = config.id;

	// DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_pick");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	// Ряд портретов с подписью над ним
	var _makeRow = function(ids, x, y, spacing, labelID){

		var label = document.createElement("div");
		label.className = "arena_pick_label";
		label.style.left = x+"px";
		label.style.top = y+"px";
		label.innerHTML = Words.get(labelID);
		self.dom.appendChild(label);

		for(var i=0; i<ids.length; i++){
			(function(id, i){

				var cell = document.createElement("div");
				cell.className = "arena_pick_cell";
				cell.style.left = (x + i*spacing)+"px";
				cell.style.top = (y+28)+"px";
				cell.style.width = (spacing-10)+"px";
				self.dom.appendChild(cell);

				var peep = document.createElement("div");
				peep.className = "arena_pick_peep";
				peep.style.backgroundPosition = (-PEEP_METADATA[id].frame*105)+"px 0px";
				cell.appendChild(peep);

				var name = document.createElement("div");
				name.className = "arena_pick_name";
				name.classList.add(id);
				name.innerHTML = Words.get("label_"+id);
				cell.appendChild(name);

				cell.onclick = function(){
					Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
					config.onpick(id);
				};

			})(ids[i], i);
		}

	};
	_makeRow(ARENA_CHARACTERS, 85, 0, 160, "arena_pick_models");
	_makeRow(ARENA_GAME_CHARS, 25, 180, 115, "arena_pick_chars");

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Переключатель-строка: «☑ текст» / «☐ текст».
config: {x, y, width, size (размер шрифта), text_id, value, onchange: function(value){}}

*******************************/
function ArenaToggle(config){

	var self = this;
	self.id = config.id;
	self.value = !!config.value;

	// DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_toggle");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";
	if(config.width) self.dom.style.width = config.width+"px";
	if(config.size) self.dom.style.fontSize = config.size+"px";

	self.show = function(){
		self.dom.innerHTML = (self.value ? "&#9745; " : "&#9744; ") + Words.get(config.text_id);
	};
	self.set = function(value){ // без onchange
		self.value = !!value;
		self.show();
	};
	self.dom.onclick = function(){
		self.set(!self.value);
		Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
		if(config.onchange) config.onchange(self.value);
	};
	self.show();

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Уроки твоего ученика (песочница, страница «Твой ученик»): пять ситуаций, в каждой — ответы на выбор.
Выбранный ответ обведён; нажал другой — урок меняется в ARENA_STUDENT и вызывается onchange
(песочница начинает турнир заново). Внизу строка: на кого из персонажей игры ученик сейчас похож.
config: {x, y, onchange: function(){}}

*******************************/
var ARENA_LESSONS = [
	{key:"first", text:"arena_lesson_first", opts:[["C", "arena_lesson_trust", "c"], ["D", "arena_lesson_cheat", "d"]]},
	{key:"cc", text:"arena_lesson_cc", opts:[["C", "arena_lesson_trust", "c"], ["D", "arena_lesson_cheat", "d"]]},
	{key:"dc", text:"arena_lesson_dc", opts:[["C", "arena_lesson_trust", "c"], ["D", "arena_lesson_cheat", "d"]]},
	{key:"d", text:"arena_lesson_d", opts:[["C", "arena_lesson_trust", "c"], ["D", "arena_lesson_cheat", "d"],
		["tol", "arena_lesson_tol", "c"], ["grudge", "arena_lesson_grudge", "d"]]},
	{key:"contrite", text:"arena_lesson_contrite", opts:[[true, "arena_lesson_forgive", "c"], [false, "arena_lesson_answer", "d"]]}
];
function ArenaLessons(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "arena_lessons";
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	var rows = [], like;
	self.show = function(){
		for(var r=0; r<ARENA_LESSONS.length; r++){
			var L = ARENA_LESSONS[r], spans = rows[r].querySelectorAll(".arena_lesson_o");
			for(var i=0; i<L.opts.length; i++){
				spans[i].classList.toggle("on", ARENA_STUDENT[L.key]===L.opts[i][0]);
			}
		}
		var id = _arenaStudentLike(ARENA_STUDENT);
		like.innerHTML = id
			? _arenaWord("arena_lessons_like").replace(/\[NAME\]/g, "<span class='"+id+"'>"+_arenaWord("label_"+id)+"</span>")
			: _arenaWord("arena_lessons_own");
	};

	for(var r=0; r<ARENA_LESSONS.length; r++){
		var L = ARENA_LESSONS[r];
		var row = document.createElement("div");
		row.className = "arena_lesson";
		row.style.top = (r*48)+"px";
		row.setAttribute("lesson", L.key);
		var html = "<div class='arena_lesson_t'>"+_arenaWord(L.text)+"</div>";
		for(var i=0; i<L.opts.length; i++){
			html += "<span class='arena_lesson_o "+L.opts[i][2]+"' opt='"+i+"'>"+_arenaWord(L.opts[i][1])+"</span>";
		}
		row.innerHTML = html;
		(function(L){
			row.onclick = function(event){
				var i = event.target && event.target.getAttribute && event.target.getAttribute("opt");
				if(i===null || i===undefined) return;
				var v = L.opts[parseInt(i)][0];
				if(ARENA_STUDENT[L.key]===v) return;
				ARENA_STUDENT[L.key] = v;
				Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
				self.show();
				if(config.onchange) config.onchange();
			};
		})(L);
		self.dom.appendChild(row);
		rows.push(row);
	}
	like = document.createElement("div");
	like.className = "arena_lessons_like";
	like.style.top = (ARENA_LESSONS.length*48+2)+"px";
	self.dom.appendChild(like);
	self.show();

}

/*******************************

Скорость: «скорость: обычно · быстро · мгновенно» — выбранное слово подчёркнуто, остальные нажимаются.
«быстро» — анимации втрое быстрее; «мгновенно» — ход засчитывается сразу, без анимации (турнир и дуэль).
config: {x, y, width, size, align, br (слова — строкой ниже), muted (подпись серая, как панель турнира), label_id (своя подпись),
         value: "normal" | "fast" | "instant", onchange: function(value){}}

*******************************/
var ARENA_SPEEDS = ["normal", "fast", "instant"];
var _arenaSpeedOf = function(value){ // во сколько раз быстрее анимации (у «мгновенно» анимации раунда нет вовсе)
	return (value=="normal") ? 1 : 3;
};
function ArenaSpeed(config){

	var self = this;
	self.id = config.id;
	self.value = config.value || "fast";

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_speed");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";
	if(config.width) self.dom.style.width = config.width+"px";
	if(config.size) self.dom.style.fontSize = config.size+"px";
	if(config.align) self.dom.style.textAlign = config.align;
	if(config.muted) self.dom.classList.add("arena_speed_muted");

	self.show = function(){
		var html = "<span class='arena_speed_t'>"+_arenaWord(config.label_id || "arena_speed")+"</span>" + (config.br ? "<br>" : " ");
		for(var i=0; i<ARENA_SPEEDS.length; i++){
			var v = ARENA_SPEEDS[i];
			if(i>0) html += " &middot; ";
			html += "<span class='arena_speed_o"+(v==self.value ? " on" : "")+"' speed='"+v+"'>"+_arenaWord("arena_speed_"+v)+"</span>";
		}
		self.dom.innerHTML = html;
	};
	self.dom.onclick = function(event){
		var v = event.target && event.target.getAttribute && event.target.getAttribute("speed");
		if(!v || v==self.value) return;
		self.value = v;
		self.show();
		Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
		if(config.onchange) config.onchange(v);
	};
	self.show();

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Ссылка-текст: щелчок публикует сообщение или вызывает onclick.
config: {x, y, width, align, text_id, message, onclick}

*******************************/
function ArenaLink(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_link");
	_configText(config, self.dom);
	self.dom.innerHTML = Words.get(config.text_id);
	self.dom.onclick = function(){
		Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
		if(config.onclick) config.onclick();
		if(config.message) publish(config.message);
	};

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

История ходов в дуэли: полоска значков сыгранных раундов.
Значки — как в главе «Один турнир» (score_small), буква — по ходам:
оба доверились — R, ты обманул, он доверился — T, ты доверился, он обманул — S, оба обманули — P.
Ошибки помечены уголками: своя — снизу слева, соперника — сверху справа (подсказки — arena_hist_err_*).
Во время матча ошибки соперника не видны (addRound(info, true)): как и стратегия на арене,
ты видишь только его ходы. revealThem() — показать их, когда матч сыгран.
config: {x, y, row} — row: в одну строку и мельче (экран итогов)

*******************************/
function ArenaHistory(config){

	var self = this;
	self.id = config.id;

	// DOM
	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_history");
	if(config.row) self.dom.classList.add("arena_history_row");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	// Буква исхода — по ходам (уже с ошибками), не по числам
	var _payoffOf = function(info){
		if(info.you==PD.COOPERATE && info.them==PD.COOPERATE) return "R";
		if(info.you==PD.CHEAT && info.them==PD.COOPERATE) return "T";
		if(info.you==PD.COOPERATE && info.them==PD.CHEAT) return "S";
		return "P";
	};

	var _rounds = []; // [{span, info, hidden}]
	var _mark = function(r){
		var s = r.span, tips = [];
		s.classList.remove("err_you");
		s.classList.remove("err_them");
		if(r.info.youMistake){
			s.classList.add("err_you");
			tips.push(_arenaWord("arena_hist_err_you"));
		}
		if(r.info.themMistake && !r.hidden){
			s.classList.add("err_them");
			tips.push(_arenaWord("arena_hist_err_them"));
		}
		if(tips.length) s.title = tips.join("; ");
		else s.removeAttribute("title");
	};

	self.addRound = function(info, hideThem){
		var s = document.createElement("span");
		s.className = "score_small";
		s.setAttribute("payoff", _payoffOf(info));
		var r = {span:s, info:info, hidden:!!hideThem};
		_rounds.push(r);
		_mark(r);
		self.dom.appendChild(s);
	};

	self.revealThem = function(){
		for(var i=0; i<_rounds.length; i++){
			_rounds[i].hidden = false;
			_mark(_rounds[i]);
		}
	};

	self.reset = function(){
		_rounds = [];
		self.dom.innerHTML = "";
	};

	// Add & Remove
	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Арена слева от автомата (турнир «сам», 01.11.2026 — идея автора: видно, как ты играешь с каждым).
17 игроков и ты по кругу; ты — справа, ближе к автомату, в феске, как в автомате; остальные рассажены
случайно в каждом турнире (T.place). Стрелка — от тебя к нынешнему сопернику; вслепую она показывает
на человечка в сером цилиндре: где он, видно, а кто — только после матча (тогда цилиндр сменяется его шляпой,
стрелка остаётся и рядом появляется имя — понятно, с кем ты сыграл). Сыгранные матчи — тонкие серые линии,
снаружи круга — твой счёт в матче. Финал после всех матчей: остальные играют друг с другом
(линии появляются одна за другой), потом ✕ у троих худших и +1 у троих лучших.
config: {x, y}. show(T, state) — нарисовать по турниру T; state: "live" (true) — идёт матч T.i,
"done" (false) — матч T.i сыгран, "finale" — все сыграны; play(T, ms, done) — финал: матчи остальных
за ms миллисекунд; marks(table) — кто выбывает и кто получает копию.

*******************************/
function ArenaRing(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_ring_box");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	var K = ARENA_INK, CX = 222, CY = 258, R = 166, RL = R+32, H = 54, W = H*300/325, HY = 60, WY = HY*300/325; // человечки крупнее (автор, 01.11.2026)
	var ids = _arenaTourIds(), N = ids.length, seats = [], me = null, i;
	var _layout = function(T){ // место 0 — ты (справа), места 1–17 — по T.place
		seats = [{who:-1, id:"you", a:0}];
		for(var j=0; j<N; j++){
			var p = (T.place && T.place[j]) ? T.place[j] : j+1;
			seats.push({who:j, id:ids[j], a:2*Math.PI*p/(N+1)});
		}
		for(var j=0; j<seats.length; j++){
			seats[j].x = CX + R*Math.cos(seats[j].a);
			seats[j].y = CY + R*Math.sin(seats[j].a);
		}
		me = seats[0];
	};
	var _seat = function(who){ return seats[who+1]; };
	var _line = function(p, q, cut, extra){ // отрезок между человечками, не заходя на них
		var dx = q.x-p.x, dy = q.y-p.y, L = Math.sqrt(dx*dx+dy*dy);
		return "<line x1='"+(p.x+dx*cut/L).toFixed(1)+"' y1='"+(p.y+dy*cut/L).toFixed(1)+"' x2='"+(q.x-dx*cut/L).toFixed(1)+"' y2='"+(q.y-dy*cut/L).toFixed(1)+"' "+extra+"/>";
	};
	var _arrow = function(p, q, who){ // стрелка от тебя к сопернику: древко и наконечник у него
		var dx = q.x-p.x, dy = q.y-p.y, L = Math.sqrt(dx*dx+dy*dy), ux = dx/L, uy = dy/L;
		var x1 = p.x+ux*34, y1 = p.y+uy*34, x2 = q.x-ux*31, y2 = q.y-uy*31, bx = x2-ux*16, by = y2-uy*16;
		return "<g class='arena_ring_arrow' who='"+who+"'>"
			+ "<line x1='"+x1.toFixed(1)+"' y1='"+y1.toFixed(1)+"' x2='"+bx.toFixed(1)+"' y2='"+by.toFixed(1)+"' stroke='"+K+"' stroke-width='3.5' stroke-linecap='round'/>"
			+ "<path d='M"+x2.toFixed(1)+","+y2.toFixed(1)+" L"+(bx-uy*8).toFixed(1)+","+(by+ux*8).toFixed(1)+" L"+(bx+uy*8).toFixed(1)+","+(by-ux*8).toFixed(1)+" Z' fill='"+K+"' stroke='"+K+"' stroke-width='2' stroke-linejoin='round'/></g>";
	};
	var _text = function(cls, x, y, html, w, extra){
		return "<div class='"+cls+"' "+(extra||"")+" style='left:"+x.toFixed(1)+"px;top:"+y.toFixed(1)+"px;"+(w ? "width:"+w+"px;" : "")+"'>"+html+"</div>";
	};
	var _timer = null;

	self.show = function(T, state){
		if(state===true) state = "live";
		if(state===false || state===undefined) state = "done";
		_layout(T);
		var played = {}, total = 0, m, q;
		for(m=0; m<T.matches.length; m++){ played[T.matches[m].who] = T.matches[m]; total += T.matches[m].ys; }
		var blind = !T.know;
		// с кем матч сейчас (или только что сыгран): к нему — стрелка
		var now = (state!="finale" && T.i<T.who.length) ? T.who[T.i] : null;
		if(state=="done" && now!==null && !played[now]) now = null;

		// Дорожка арены, серые линии сыгранных матчей, подсветка и стрелка
		var svg = "<svg width='440' height='500' viewBox='0 0 440 500'>"
			+ "<circle cx='"+CX+"' cy='"+CY+"' r='"+R+"' fill='none' stroke='#EFE6D3' stroke-width='40'/>"
			+ "<g class='arena_ring_web'></g>";
		for(i=1; i<seats.length; i++){
			q = seats[i];
			if(played[q.who] && q.who!==now) svg += _line(me, q, 28, "class='arena_ring_line' who='"+q.who+"' stroke='#c8c8c8' stroke-width='2'");
		}
		if(now!==null){
			q = _seat(now);
			svg += "<circle cx='"+q.x.toFixed(1)+"' cy='"+q.y.toFixed(1)+"' r='31' fill='#FFE663'/>"
				+ "<circle cx='"+me.x.toFixed(1)+"' cy='"+me.y.toFixed(1)+"' r='35' fill='#FFE663'/>"
				+ _arrow(me, q, now);
		}
		svg += "</svg>";

		// Человечки: ты — в феске и с подписью; вслепую несыгранные — в сером цилиндре
		var html = svg;
		for(i=0; i<seats.length; i++){
			q = seats[i];
			var isMe = (q.who<0), h = isMe ? HY : H, w = isMe ? WY : W, flip = q.x > CX+1;
			var shown = isMe ? "you" : ((blind && !played[q.who]) ? "mystery" : q.id);
			html += "<div class='arena_ring_seat' who='"+q.who+"' shown='"+shown+"' style='left:"+(q.x-w/2).toFixed(1)+"px;top:"+(q.y-h/2-2).toFixed(1)+"px;width:"+w.toFixed(1)+"px;height:"+h+"px'>"
				+ _arenaPeep(shown, h, 0, 0, flip) + "</div>";
		}
		var hx = me.x - WY/2 + 0.46*WY, hy = me.y - HY/2 - 2 + 0.56*HY, r = 0.2*HY; // феска: голова смотрит влево
		html += "<svg width='440' height='500' viewBox='0 0 440 500'><path d='M"+(hx-0.62*r).toFixed(1)+","+(hy-0.78*r).toFixed(1)
			+ " L"+(hx+0.62*r).toFixed(1)+","+(hy-0.78*r).toFixed(1)+" L"+(hx+0.46*r).toFixed(1)+","+(hy-1.62*r).toFixed(1)
			+ " L"+(hx-0.46*r).toFixed(1)+","+(hy-1.62*r).toFixed(1)+" Z' fill='#E0463A' stroke='"+K+"' stroke-width='1.6' stroke-linejoin='round'/>"
			+ "<path d='M"+hx.toFixed(1)+","+(hy-1.62*r).toFixed(1)+" Q"+(hx-0.7*r).toFixed(1)+","+(hy-1.75*r).toFixed(1)+" "+(hx-0.75*r).toFixed(1)+","+(hy-1.05*r).toFixed(1)
			+ "' fill='none' stroke='"+K+"' stroke-width='1.6' stroke-linecap='round'/></svg>";
		html += _text("arena_ring_me", me.x+WY/2+1, me.y-11, _arenaWord("arena_result_you"));

		// Снаружи круга — твой счёт в каждом сыгранном матче (по бокам чуть дальше: там человечки шире)
		for(i=1; i<seats.length; i++){
			q = seats[i];
			if(!played[q.who]) continue;
			var lx = CX+(RL+8)*Math.cos(q.a), ly = CY+RL*Math.sin(q.a);
			html += _text("arena_ring_score", lx-20, ly-9, _arenaSigned(played[q.who].ys), 40);
		}
		// Матч сыгран — у стрелки его имя: понятно, с кем ты сыграл (вслепую — только теперь).
		// Имя — посередине стрелки; если стрелка идёт у самой дорожки (соперник недалеко от тебя) — ближе к середине
		// круга, чтобы не заслонить соседей
		if(state=="done" && now!==null){
			q = _seat(now);
			var mx = (me.x+q.x)/2, my = (me.y+q.y)/2, cx = mx-CX, cy = my-CY, cl = Math.sqrt(cx*cx+cy*cy), lim = R-80;
			if(cl>lim){ mx = CX+cx/cl*lim; my = CY+cy/cl*lim; }
			html += _text("arena_ring_name", mx, my, "<span class='"+q.id+"'>"+_arenaWord("label_short_"+q.id)+"</span>", 0, "who='"+now+"'");
		}

		// Подписи
		html += _text("arena_ring_title", 8, 2, _arenaWord("arena_ring_title").replace(/\[N\]/g, N+""))
			+ _text("arena_ring_sub", 8, 24, _arenaWord("arena_ring_sub").replace(/\[S\]/g, _arenaSigned(total)).replace(/\[M\]/g, T.matches.length+"").replace(/\[N\]/g, N+""))
			+ _text("arena_ring_legend", 8, 466, _arenaWord(blind ? "arena_ring_legend_blind" : "arena_ring_legend"));
		self.dom.innerHTML = html;
	};

	// Финал: остальные играют друг с другом — линии появляются одна за другой
	self.play = function(T, ms, done){
		self.show(T, "finale");
		var web = self.dom.querySelector(".arena_ring_web"), sub = self.dom.querySelector(".arena_ring_sub");
		var pairs = [];
		for(var a=0; a<N; a++) for(var b=a+1; b<N; b++) pairs.push([a, b]);
		pairs = _shuffleArray(pairs);
		var k = 0, steps = 30, per = Math.ceil(pairs.length/steps);
		var _tick = function(){
			var html = "";
			for(var j=0; j<per && k<pairs.length; j++, k++){
				html += _line(_seat(pairs[k][0]), _seat(pairs[k][1]), 26, "class='arena_ring_web_line' stroke='#bbb' stroke-width='1.2' opacity='0.5'");
			}
			web.insertAdjacentHTML("beforeend", html);
			sub.innerHTML = _arenaWord("arena_ring_fin_sub").replace(/\[K\]/g, k+"").replace(/\[P\]/g, pairs.length+"");
			if(k<pairs.length){
				_timer = setTimeout(_tick, ms/steps);
			}else{
				_timer = null;
				if(done) done();
			}
		};
		_tick();
	};

	// Итог поколения: ✕ — выбывают (трое худших), +1 — получают копию (трое лучших); ты — тоже
	self.marks = function(table){
		var S = ARENA_TOUR.selection, html = "", n = table.rows.length;
		for(var j=0; j<n; j++){
			var q = _seat(table.rows[j].i);
			if(j>=n-S){
				var el = self.dom.querySelector(".arena_ring_seat[who='"+table.rows[j].i+"']");
				if(el) el.classList.add("gone");
				html += _text("arena_ring_out", q.x-8, q.y-18, "&times;");
			}else if(j<S){
				if(table.rows[j].i<0) html += _text("arena_ring_top", me.x-14, me.y-HY/2-26, "+1"); // тебе — над головой (справа — подпись «ты»)
				else html += _text("arena_ring_top", CX+RL*Math.cos(q.a)-14, CY+RL*Math.sin(q.a)-9, "+1");
			}
		}
		self.dom.insertAdjacentHTML("beforeend", html);
		self.dom.querySelector(".arena_ring_sub").innerHTML = _arenaWord("arena_ring_fin_done");
		self.dom.querySelector(".arena_ring_legend").innerHTML = _arenaWord("arena_ring_fin_legend");
	};

	self.add = function(){ _add(self); };
	self.remove = function(){
		if(_timer) clearTimeout(_timer);
		_timer = null;
		_remove(self);
	};

}

/*******************************

Камень на распутье — первая страница главы. Надпись в рифму (01.11.2026). Главная дорога — направо: сразу матч с Claude 5.0
(«Claude на матч позовёшь»); налево — узнать игру (дуб со свитками, «у дуба ума наберёшь»), прямо — турнир («к арене дойдёшь»).
Надписи на камне и рисунки в конце каждой дороги — ссылки. Клавиши ← ↑ → — на слайде (10_Slides_Arena.js).
config: {x, y, onpick: function(way){}} — way: "left" | "up" | "right"

*******************************/
var ARENA_STONE = [[282,384],[262,344],[264,296],[281,254],[318,221],[372,203],[436,190],[498,194],[548,189],
	[600,198],[646,220],[680,252],[697,298],[698,344],[684,384],[610,393],[480,396],[350,393]];

// Указатели у дорог (вариант «Б»): доска на столбике — что там и сколько займёт. Надпись — ссылка (ArenaStone),
// доска и столбик — в пейзаже. x, y, w — доска; post — длина столбика под ней
var ARENA_SIGNS = [
	{way:"left", x:200, y:398, w:170, post:50},
	{way:"up", x:668, y:92, w:192, post:62},
	{way:"right", x:690, y:410, w:176, post:56}
];

// Рисунки пейзажа «от руки» (для обоих камней): облако, деревце, птицы, солнце, трава, цветок, камешек
var _arenaDraw = (function(){
	var K = "#2b2b2b", G = "#F1F6EA"; // K — как ARENA_INK
	var cloud = function(x, y, k){
		return "<path transform='translate("+x+","+y+") scale("+k+")' d='M-34,10 C-41,10 -43,0 -34,-4 C-34,-14 -22,-18 -14,-12 "
			+ "C-10,-24 10,-24 14,-12 C22,-18 34,-12 32,-2 C40,0 40,10 32,10 Z' fill='#fff' stroke='"+K+"' stroke-width='"+(3/k).toFixed(2)+"'/>";
	};
	var tree = function(x, y){
		return "<path d='M"+x+","+y+" V"+(y-22)+"' stroke='"+K+"' stroke-width='4'/>"
			+ "<path transform='translate("+x+","+(y-34)+")' d='M-16,8 C-24,6 -22,-8 -12,-8 C-12,-18 4,-20 8,-10 C18,-14 24,-2 16,6 "
			+ "C18,12 8,14 2,10 C-4,14 -12,14 -16,8 Z' fill='"+G+"' stroke='"+K+"' stroke-width='3'/>";
	};
	var birds = function(x, y){
		return "<path d='M"+x+","+y+" q6,-6 12,0 q6,-6 12,0 M"+(x+30)+","+(y-14)+" q5,-5 10,0 q5,-5 10,0' stroke='"+K+"' stroke-width='2.5' fill='none'/>";
	};
	var sun = function(x, y){
		var r = "<circle cx='"+x+"' cy='"+y+"' r='17' fill='#FFF2B3' stroke='"+K+"' stroke-width='3'/>";
		for(var a=0; a<8; a++){
			var c = Math.cos(a*Math.PI/4), d = Math.sin(a*Math.PI/4);
			r += "<path d='M"+(x+24*c).toFixed(1)+","+(y+24*d).toFixed(1)+" L"+(x+31*c).toFixed(1)+","+(y+31*d).toFixed(1)+"' stroke='"+K+"' stroke-width='2.5'/>";
		}
		return r;
	};
	var tuft = function(x, y){
		return "<path d='M"+x+","+y+" q-2,-9 -7,-13 M"+x+","+y+" q1,-12 4,-16 M"+x+","+y+" q4,-8 9,-10' stroke='"+K+"' stroke-width='2.5' fill='none'/>";
	};
	var flower = function(x, y){
		var f = "<path d='M"+x+","+y+" V"+(y+14)+"' stroke='"+K+"' stroke-width='2.5'/>";
		for(var a=0; a<5; a++) f += "<ellipse cx='"+x+"' cy='"+(y-5)+"' rx='3' ry='5' transform='rotate("+(a*72)+" "+x+" "+y+")' fill='#fff' stroke='"+K+"' stroke-width='1.8'/>";
		return f + "<circle cx='"+x+"' cy='"+y+"' r='2.6' fill='#F5C33B' stroke='"+K+"' stroke-width='1.5'/>";
	};
	var rock = function(x, y){
		return "<path d='M"+(x-16)+","+y+" C"+(x-16)+","+(y-12)+" "+(x-4)+","+(y-16)+" "+(x+6)+","+(y-12)+" C"+(x+16)+","+(y-10)+" "+(x+18)+","+(y-2)+" "+(x+16)+","+y+" Z' fill='#E8E4DB' stroke='"+K+"' stroke-width='2.5'/>";
	};
	return {cloud:cloud, tree:tree, birds:birds, sun:sun, tuft:tuft, flower:flower, rock:rock};
})();

// Пейзаж вокруг камня (31.10.2026, вариант «А» из arena/drafts/камень_варианты.png) — той же линией «от руки», что дуб:
// наверху холмы на горизонте, деревца, облака, солнце, птицы; внизу трава, цветы, камешки; указатели. Нажатия не ловит.
var _arenaLandscape = function(){
	var K = ARENA_INK, s = "", i;
	var cloud = _arenaDraw.cloud, tree = _arenaDraw.tree, birds = _arenaDraw.birds, sun = _arenaDraw.sun,
		tuft = _arenaDraw.tuft, flower = _arenaDraw.flower, rock = _arenaDraw.rock;
	// Наверху слева: горизонт с холмами, деревце, облака, птицы; справа — горизонт, деревце, солнце (и указатель к турниру)
	s += "<path d='M18,182 C70,152 118,150 162,172 C200,154 246,150 292,178' fill='none' stroke='"+K+"' stroke-width='3'/>"
		+ tree(78, 160) + cloud(118, 92, 1) + cloud(238, 118, 0.75) + birds(196, 82);
	s += "<path d='M668,184 C720,162 768,158 812,178 C850,160 906,158 946,182' fill='none' stroke='"+K+"' stroke-width='3'/>"
		+ tree(905, 168) + sun(910, 80);
	// Внизу: трава, цветы, камешки — в стороне от указателей и подсказки о клавишах
	var tufts = [[22,442],[96,478],[120,522],[200,500],[330,470],[330,526],[384,484],[52,506],
		[560,524],[700,516],[640,446],[840,522],[900,470],[944,446],[612,530],[870,526]];
	for(i=0; i<tufts.length; i++) s += tuft(tufts[i][0], tufts[i][1]);
	var flowers = [[150,492],[250,520],[40,520],[398,454],[612,452],[940,520],[676,512]];
	for(i=0; i<flowers.length; i++) s += flower(flowers[i][0], flowers[i][1]);
	s += rock(140, 445) + rock(870, 490) + rock(318, 506);
	// Указатели: столбик (как ветки дуба) и белая доска
	for(i=0; i<ARENA_SIGNS.length; i++){
		var g = ARENA_SIGNS[i], cx = g.x + g.w/2, post = "M"+cx+","+(g.y+46)+" V"+(g.y+46+g.post);
		s += "<path d='"+post+"' stroke='"+K+"' stroke-width='9'/><path d='"+post+"' stroke='#E4D6C2' stroke-width='4'/>"
			+ "<rect x='"+g.x+"' y='"+g.y+"' width='"+g.w+"' height='48' rx='8' fill='#fff' stroke='"+K+"' stroke-width='3'/>";
	}
	return "<g filter='url(#arena_wob_land)' stroke-linecap='round' stroke-linejoin='round'>"+s+"</g>";
};

// Арена у камня — стадион, дуэль — ринг (31.10.2026, вариант «А» из arena/drafts/поляны_варианты.png).
// Трибуны рисуются под всем (дорога к арене — как вход, указатель — поверх), свет и ринг — над полянами, под человечками.
var ARENA_STADIUM_LAMPS = [215, 250, 290, 325]; // где на краю трибун лампы (угол на эллипсе, градусы)
var _arenaStadiumAt = function(a, rx, ry){ // точка на эллипсе трибун вокруг поля арены (480, 140)
	return [480 + rx*Math.cos(a*Math.PI/180), 140 + ry*Math.sin(a*Math.PI/180)];
};
var _arenaStadiumDefs = function(){
	var Y = "#FFE27A", s = "", i, p;
	var radial = function(id, cx, cy, rx, ry, op){
		return "<radialGradient id='"+id+"' cx='"+cx+"' cy='"+cy+"' r='"+rx+"' gradientUnits='userSpaceOnUse' gradientTransform='translate(0,"
			+ (cy*(1-ry/rx)).toFixed(1)+") scale(1,"+(ry/rx).toFixed(3)+")'><stop offset='0' stop-color='"+Y+"' stop-opacity='"+op+"'/>"
			+ "<stop offset='1' stop-color='"+Y+"' stop-opacity='0'/></radialGradient>";
	};
	s += radial("arena_st_field", 480, 142, 160, 42, 0.5) + radial("arena_st_ring", 830, 326, 110, 22, 0.45);
	for(i=0; i<ARENA_STADIUM_LAMPS.length; i++){
		p = _arenaStadiumAt(ARENA_STADIUM_LAMPS[i], 198, 66);
		s += "<linearGradient id='arena_st_beam"+i+"' gradientUnits='userSpaceOnUse' x1='"+p[0].toFixed(1)+"' y1='"+p[1].toFixed(1)+"' x2='480' y2='168'>"
			+ "<stop offset='0' stop-color='"+Y+"' stop-opacity='0.45'/><stop offset='1' stop-color='"+Y+"' stop-opacity='0'/></linearGradient>";
	}
	return s;
};
// Трибуны: три яруса вокруг поля, зрители — точки, на краю — лампы
var _arenaStadiumBack = function(){
	var K = ARENA_INK, s = "", a, i, p;
	s += "<ellipse cx='480' cy='140' rx='198' ry='66' fill='#F3F3F3' stroke='"+K+"' stroke-width='3'/>"
		+ "<ellipse cx='480' cy='140' rx='186' ry='58' fill='none' stroke='#bbb' stroke-width='2'/>"
		+ "<ellipse cx='480' cy='140' rx='176' ry='52' fill='none' stroke='#bbb' stroke-width='2'/>";
	for(a=196; a<=344; a+=6.5){
		p = _arenaStadiumAt(a, 184, 57);
		s += "<circle cx='"+p[0].toFixed(1)+"' cy='"+p[1].toFixed(1)+"' r='3.2' fill='#fff' stroke='#999' stroke-width='1.6'/>";
		p = _arenaStadiumAt(a+3, 174, 51);
		s += "<circle cx='"+p[0].toFixed(1)+"' cy='"+p[1].toFixed(1)+"' r='3.2' fill='#fff' stroke='#999' stroke-width='1.6'/>";
	}
	for(i=0; i<ARENA_STADIUM_LAMPS.length; i++){
		a = ARENA_STADIUM_LAMPS[i];
		p = _arenaStadiumAt(a, 198, 66);
		s += "<g transform='translate("+p[0].toFixed(1)+","+p[1].toFixed(1)+") rotate("+((a-270)*0.6).toFixed(1)+")'>"
			+ "<rect x='-9' y='-8' width='18' height='12' rx='2' fill='#fff' stroke='"+K+"' stroke-width='2.5'/>"
			+ "<path d='M-6,4 Q0,9 6,4' fill='#FFF2B3' stroke='"+K+"' stroke-width='2'/></g>";
	}
	return "<g class='arena_stadium' filter='url(#arena_wob_land)' stroke-linejoin='round'>"+s+"</g>";
};
// Свет на поле арены: лучи от ламп
var _arenaStadiumLight = function(){
	var s = "", i, p, x;
	s += "<ellipse cx='480' cy='142' rx='160' ry='42' fill='url(#arena_st_field)'/>";
	for(i=0; i<ARENA_STADIUM_LAMPS.length; i++){
		p = _arenaStadiumAt(ARENA_STADIUM_LAMPS[i], 198, 66);
		x = 480 + (p[0]-480)*0.15;
		s += "<path d='M"+(p[0]-5).toFixed(1)+","+(p[1]+4).toFixed(1)+" L"+(p[0]+5).toFixed(1)+","+(p[1]+4).toFixed(1)
			+ " L"+(x+60).toFixed(1)+",168 L"+(x-60).toFixed(1)+",168 Z' fill='url(#arena_st_beam"+i+")'/>";
	}
	return s;
};
// Свет на поле арены и ринг у дуэли: пол, столбы, канаты сзади и по бокам (спереди — нет, чтобы не закрывать человечков)
var _arenaStadiumFront = function(){
	var K = ARENA_INK, s = _arenaStadiumLight();
	s += "<g class='arena_ring' filter='url(#arena_wob_land)' stroke-linejoin='round' stroke-linecap='round'>"
		+ "<path d='M726,300 L934,300 L952,348 L708,348 Z' fill='#FBF8F1' stroke='"+K+"' stroke-width='3'/>"
		+ "<path d='M726,300 V262 M934,300 V262 M708,348 V306 M952,348 V306' stroke='"+K+"' stroke-width='5'/>"
		+ "<path d='M726,272 H934 M726,286 H934 M726,272 L708,316 M726,286 L708,330 M934,272 L952,316 M934,286 L952,330' stroke='"+K+"' stroke-width='2' fill='none'/>"
		+ "<rect x='720' y='258' width='12' height='10' fill='#4089DD' stroke='"+K+"' stroke-width='2'/>"
		+ "<rect x='928' y='258' width='12' height='10' fill='#D96B3F' stroke='"+K+"' stroke-width='2'/></g>"
		+ "<ellipse cx='830' cy='326' rx='110' ry='22' fill='url(#arena_st_ring)'/>";
	return s;
};

function ArenaStone(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_stone");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	// Трибуны арены, пейзаж, дороги, поляны в их концах, свет и ринг, камень
	var road = "#EFE6D3";
	var svg = "<svg width='960' height='540' viewBox='0 0 960 540'><defs>"+_arenaWobble("arena_wob_land", 3)+_arenaStadiumDefs()+"</defs>"
		+ _arenaStadiumBack()
		+ _arenaLandscape()
		+ "<g fill='none' stroke='"+road+"' stroke-width='36' stroke-linecap='round'>"
		+ "<path d='M480,560 L480,408'/>"
		+ "<path d='M480,408 C392,410 250,396 150,326'/>"
		+ "<path d='M480,408 C568,410 710,396 810,326'/>"
		+ "<path d='M480,408 L480,150'/>"
		+ "</g>"
		+ "<g fill='"+road+"'>"
		+ "<ellipse cx='480' cy='142' rx='165' ry='44'/>"
		+ "<ellipse cx='135' cy='322' rx='108' ry='38'/>"
		+ "<ellipse cx='825' cy='322' rx='108' ry='38'/>"
		+ "</g>"
		+ _arenaStadiumFront()
		+ "<ellipse cx='480' cy='394' rx='228' ry='14' fill='rgba(0,0,0,0.07)'/>"
		+ "<path d='"+_arenaSmooth(ARENA_STONE)+"' fill='#E8E4DB' stroke='#333' stroke-width='4' stroke-linejoin='round'/>"
		+ "<g fill='none' stroke='#BDB6A9' stroke-width='2.5' stroke-linecap='round'>"
		+ "<path d='M330,226 l12,9 l-3,11'/>"
		+ "<path d='M598,206 l-6,10'/>"
		+ "<path d='M676,354 l-13,5 l-5,9'/>"
		+ "<path d='M300,372 l13,-3'/>"
		+ "</g>"
		+ "<g fill='#CFC8BB'><circle cx='420' cy='212' r='2.2'/><circle cx='640' cy='380' r='2.2'/><circle cx='283' cy='300' r='1.8'/></g>"
		+ "</svg>";
	self.dom.innerHTML = svg;

	var _go = function(way){
		return function(){
			Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
			config.onpick(way);
		};
	};
	var _place = function(cls, x, y, w, h, html, way){
		var d = document.createElement("div");
		d.className = cls;
		d.style.left = x+"px";
		d.style.top = y+"px";
		if(w) d.style.width = w+"px";
		if(h) d.style.height = h+"px";
		d.innerHTML = html;
		if(way){
			d.setAttribute("way", way);
			d.onclick = _go(way);
		}
		self.dom.appendChild(d);
		return d;
	};

	// Прямо: арена — все виды игроков по кругу (кто справа, смотрит влево — к середине)
	var ids = ARENA_GAME_CHARS.concat(ARENA_CHARACTERS), ring = [];
	for(var i=0; i<ids.length; i++){
		var t = 2*Math.PI*i/ids.length - Math.PI/2;
		ring.push({id:ids[i], x:480+132*Math.cos(t), y:140+28*Math.sin(t)});
	}
	ring.sort(function(a,b){ return a.y-b.y; });
	var html = "";
	for(var i=0; i<ring.length; i++){
		html += _arenaPeep(ring[i].id, 46, ring[i].x-21-300, ring[i].y-46-50, ring[i].x>485);
	}
	_place("arena_stone_go", 300, 50, 360, 140, html, "up");

	// Налево: узнать игру — маленький дуб той же линией, что дуб главы: на ветках человечки, у корней сундук
	var K = ARENA_INK;
	var crown = _arenaCircles([[90,34,26],[62,46,24],[118,46,24],[46,70,20],[134,70,20],[70,80,22],[110,80,22]]) + "<ellipse cx='90' cy='58' rx='58' ry='30'/>";
	var twigs = "M90,118 L90,52 M90,90 C80,84 68,76 58,72 M90,86 C100,80 112,72 122,68";
	var oak = "<svg width='180' height='140' style='position:absolute;left:0;top:0'><defs>"+_arenaWobble("arena_wob_stone", 2.5)+"</defs>"
		+ "<g filter='url(#arena_wob_stone)' stroke-linejoin='round' stroke-linecap='round'>"
		+ "<path d='M80,137 Q85,110 83,86 L97,86 Q95,110 100,137 Z' fill='#F2ECE4' stroke='"+K+"' stroke-width='3'/>"
		+ "<g stroke='"+K+"' stroke-width='6' fill='none'>"+crown+"</g><g fill='#F1F6EA'>"+crown+"</g>"
		+ "<path d='"+twigs+"' stroke='"+K+"' stroke-width='6.5' fill='none'/><path d='"+twigs+"' stroke='#E4D6C2' stroke-width='2.5' fill='none'/>"
		+ "<path d='M128,121 L131,110 Q144,106 157,110 L160,121 Z' fill='#9a9a9a' stroke='"+K+"' stroke-width='2.5'/>"
		+ "<rect x='124' y='119' width='40' height='19' rx='4' fill='#F2ECE4' stroke='"+K+"' stroke-width='2.5'/>"
		+ "<path d='M131,119 V138 M157,119 V138' stroke='"+K+"' stroke-width='2.5'/>"
		+ "<rect x='140' y='122' width='8' height='9' rx='2' fill='#F5C33B' stroke='"+K+"' stroke-width='2'/>"
		+ "</g></svg>"
		+ _arenaPeep("kimi5", 30, 44, 42) + _arenaPeep("claude5", 30, 76, 22) + _arenaPeep("tft", 30, 108, 38);
	_place("arena_stone_go", 46, 200, 180, 140, oak, "left");

	// Направо: один на один с Claude 5.0 — ты и он лицом к лицу
	_place("arena_stone_go", 735, 220, 190, 110,
		_arenaPeep("you", 92, 8, 12) + _arenaPeep("claude5", 92, 92, 12, true), "right");

	// Ты — у камня
	_place("arena_stone_hero", 434, 420, 0, 0, _arenaPeep("you", 100, 0, 0));

	// Надписи указателей: что там и сколько займёт; нажал — туда же, куда ведёт дорога
	for(var i=0; i<ARENA_SIGNS.length; i++){
		var g = ARENA_SIGNS[i];
		_place("arena_stone_sign", g.x, g.y+5, g.w, 40, Words.get("arena_sign_"+g.way), g.way);
	}

	// Надписи на камне — в рифму (01.11.2026): главная дорога (к Claude) — первой строкой, тем же шрифтом, что две другие.
	// Строки длиннее прежних — рамки шире и чуть ниже, где камень шире
	self.lines = {};
	self.lines.right = _place("arena_stone_line arena_stone_main", 270, 248, 420, 34, Words.get("arena_stone_right"), "right");
	self.lines.left = _place("arena_stone_line", 270, 283, 420, 34, Words.get("arena_stone_left"), "left");
	self.lines.up = _place("arena_stone_line", 270, 318, 420, 34, Words.get("arena_stone_up"), "up");
	// Для новичков — мелко: начать с оригинала (там всё объяснено с нуля)
	self.lines.first = _place("arena_stone_first", 290, 354, 380, 24, Words.get("arena_stone_first"), "first");

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Второй камень — экран турнира «как на арене» (прямая дорога первого камня). Надпись на камне — в рифму:
налево пойдёшь — сам в турнир попадёшь: ты сам идёшь по дороге на арену и играешь 13 матчей в автомате;
направо пойдёшь — урок проведёшь: ты с указкой у доски, твой ученик (ты в малиновой кепке) за партой,
а по дороге на арену вместо тебя идёт ученик — песочница с набором «твой ученик»;
назад пойдёшь — к первому камню придёшь.
Надписи на камне, указатели и рисунки у дорог — ссылки. Клавиши ← → ↓ — на слайде (10_Slides_Arena.js).
config: {x, y, onpick: function(way){}} — way: "left" | "right" | "back"

*******************************/
var ARENA_SIGNS2 = [ // указатели второго камня: доска без столбика (под левой — настройки турнира)
	{way:"left", x:20, y:372, w:172},
	{way:"right", x:768, y:440, w:184}
];
function ArenaStone2(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_stone");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	var K = ARENA_INK, road = "#EFE6D3", d = _arenaDraw, i;
	var steps = function(pts){ // следы на дороге
		var t = "";
		for(var i=0; i<pts.length; i++){
			var x = pts[i][0], y = pts[i][1], a = pts[i][2];
			t += "<ellipse cx='"+x+"' cy='"+y+"' rx='3.2' ry='5' transform='rotate("+a+" "+x+" "+y+")' fill='#C9BBA2'/>";
		}
		return t;
	};
	// Камень — тот же, что первый, чуть крупнее (надписи длиннее)
	var k = 1.08, stone = [];
	for(i=0; i<ARENA_STONE.length; i++) stone.push([480+(ARENA_STONE[i][0]-480)*k, 300+(ARENA_STONE[i][1]-292)*k]);

	var land = "<path d='M18,182 C70,152 118,150 162,172 C200,154 246,150 292,178' fill='none' stroke='"+K+"' stroke-width='3'/>"
		+ d.tree(78, 160) + d.cloud(118, 92, 1) + d.cloud(238, 118, 0.75) + d.birds(196, 82)
		+ "<path d='M668,184 C720,162 768,158 812,178 C850,160 906,158 946,182' fill='none' stroke='"+K+"' stroke-width='3'/>"
		+ d.sun(910, 80)
		+ d.tuft(230, 430) + d.tuft(350, 524) + d.tuft(616, 440) + d.tuft(700, 470) + d.tuft(930, 520)
		+ d.flower(404, 446) + d.flower(612, 470) + d.rock(396, 530);
	// Класс: доска (мелом — монетки и стрелка), парта с тетрадкой
	var bx = 878, by = 252, kx = 780, ky = 360;
	var classroom = "<rect x='"+bx+"' y='"+by+"' width='74' height='54' rx='3' fill='#3E5B4A' stroke='"+K+"' stroke-width='3'/>"
		+ "<path d='M"+(bx+4)+","+(by+58)+" H"+(bx+70)+"' stroke='"+K+"' stroke-width='4'/>"
		+ "<circle cx='"+(bx+16)+"' cy='"+(by+16)+"' r='6' fill='none' stroke='#FFE663' stroke-width='2'/>"
		+ "<path d='M"+(bx+27)+","+(by+16)+" h14 m-5,-4 l5,4 l-5,4' fill='none' stroke='#fff' stroke-width='2'/>"
		+ "<circle cx='"+(bx+54)+"' cy='"+(by+16)+"' r='6' fill='none' stroke='#ddd' stroke-width='2'/>"
		+ "<path d='M"+(bx+10)+","+(by+36)+" h8 M"+(bx+14)+","+(by+32)+" v8 M"+(bx+26)+","+(by+33)+" q4,-5 8,0 q-4,6 -8,7 h9' fill='none' stroke='#fff' stroke-width='2'/>"
		+ "<path d='M"+(bx+46)+","+(by+34)+" q6,-6 12,0 q-6,6 -12,0' fill='none' stroke='#fff' stroke-width='1.6'/>";
	var desk = "<path d='M"+(kx+6)+","+(ky+34)+" V"+(ky+58)+" M"+(kx+58)+","+(ky+34)+" V"+(ky+58)+"' stroke='"+K+"' stroke-width='5'/>"
		+ "<rect x='"+kx+"' y='"+(ky+12)+"' width='64' height='24' rx='3' fill='#F2ECE4' stroke='"+K+"' stroke-width='3'/>"
		+ "<path d='M"+(kx-4)+","+(ky+12)+" L"+(kx+68)+","+(ky+12)+"' stroke='"+K+"' stroke-width='5'/>"
		+ "<g transform='rotate(-8 "+(kx+50)+" "+(ky+8)+")'><rect x='"+(kx+40)+"' y='"+(ky+4)+"' width='20' height='8' rx='1' fill='#fff' stroke='"+K+"' stroke-width='2'/>"
		+ "<path d='M"+(kx+50)+","+(ky+4)+" V"+(ky+12)+"' stroke='"+K+"' stroke-width='1.5'/></g>";

	var svg = "<svg width='960' height='540' viewBox='0 0 960 540'><defs>"+_arenaWobble("arena_wob_land", 3)+_arenaStadiumDefs()+"</defs>"
		+ _arenaStadiumBack()
		+ "<g filter='url(#arena_wob_land)' stroke-linecap='round' stroke-linejoin='round'>"+land+"</g>"
		// дороги: налево — вокруг камня к арене, направо — мимо класса к арене
		+ "<g fill='none' stroke='"+road+"' stroke-width='32' stroke-linecap='round'>"
		+ "<path d='M480,560 L480,462 C380,462 210,462 158,392 C112,326 186,232 320,190'/>"
		+ "<path d='M480,462 C580,462 700,462 748,404 C792,344 752,240 640,190'/></g>"
		+ "<ellipse cx='480' cy='142' rx='165' ry='44' fill='"+road+"'/>"
		+ _arenaStadiumLight()
		+ steps([[158,420,-50], [146,404,-40], [138,386,-25], [134,368,-10]])
		+ steps([[752,330,-40], [744,312,-45], [734,296,-50], [722,282,-55]])
		// искорки у ученика: он идёт на арену вместо тебя
		+ "<g stroke='#F5C33B' stroke-width='3' stroke-linecap='round'><path d='M708,194 v8 M704,198 h8'/><path d='M774,232 v8 M770,236 h8'/></g>"
		// указатели: белые доски
		+ "<g filter='url(#arena_wob_land)'>";
	for(i=0; i<ARENA_SIGNS2.length; i++){
		var g = ARENA_SIGNS2[i];
		svg += "<rect x='"+g.x+"' y='"+g.y+"' width='"+g.w+"' height='48' rx='8' fill='#fff' stroke='"+K+"' stroke-width='3'/>";
	}
	svg += "</g>"
		// камень
		+ "<ellipse cx='480' cy='"+(300+100*k)+"' rx='"+(214*k)+"' ry='13' fill='rgba(0,0,0,0.07)'/>"
		+ "<path d='"+_arenaSmooth(stone)+"' fill='#E8E4DB' stroke='#333' stroke-width='4' stroke-linejoin='round'/>"
		+ "<g fill='none' stroke='#BDB6A9' stroke-width='2.5' stroke-linecap='round'><path d='M340,236 l12,9 l-3,11'/><path d='M594,214 l-6,10'/><path d='M668,352 l-13,5 l-5,9'/></g>"
		+ "</svg>";
	self.dom.innerHTML = svg;

	var _go = function(way){
		return function(){
			Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
			config.onpick(way);
		};
	};
	var _place = function(cls, x, y, w, h, html, way){
		var el = document.createElement("div");
		el.className = cls;
		el.style.left = x+"px";
		el.style.top = y+"px";
		if(w) el.style.width = w+"px";
		if(h) el.style.height = h+"px";
		el.innerHTML = html;
		if(way){
			el.setAttribute("way", way);
			el.onclick = _go(way);
		}
		self.dom.appendChild(el);
		return el;
	};

	// Арена: все виды игроков по кругу, как у первого камня (сюда ведут обе дороги — нажатия не ловит)
	var ids = ARENA_GAME_CHARS.concat(ARENA_CHARACTERS), ring = [], html = "";
	for(i=0; i<ids.length; i++){
		var t = 2*Math.PI*i/ids.length - Math.PI/2;
		ring.push({id:ids[i], x:480+132*Math.cos(t), y:140+28*Math.sin(t)});
	}
	ring.sort(function(a,b){ return a.y-b.y; });
	for(i=0; i<ring.length; i++) html += _arenaPeep(ring[i].id, 46, ring[i].x-21, ring[i].y-46, ring[i].x>485);
	_place("arena_stone_hero arena_stone_arena", 0, 0, 0, 0, html);

	// Налево: ты сам идёшь по дороге на арену
	_place("arena_stone_go", 92, 262, 78, 84, _arenaPeep("you", 84, 0, 0), "left");

	// Направо: урок — доска, ты с указкой (смотришь на ученика), ученик в кепке за партой;
	// и ученик уже идёт по дороге на арену вместо тебя
	var s2 = 0.82, sw = (3.4/s2).toFixed(2);
	var teacher = "<svg style='position:absolute;left:"+(838-770)+"px;top:"+(306-246)+"px;overflow:visible' width='"+(74*s2)+"' height='"+(96*s2)+"' viewBox='0 0 74 96'>"
		+ "<g filter='url(#arena_wob_land)' stroke='"+K+"' stroke-width='"+sw+"' stroke-linejoin='round' stroke-linecap='round'>"
		+ "<path d='M28,70 V92 M46,70 V92' fill='none'/><path d='M24,52 Q20,74 30,74 L44,74 Q54,74 50,52 Z' fill='#fff'/>"
		+ "<circle cx='37' cy='40' r='22' fill='#fff'/><circle cx='26' cy='41' r='2.8' fill='"+K+"' stroke='none'/><circle cx='38' cy='41' r='2.8' fill='"+K+"' stroke='none'/>"
		+ "<path d='M50,58 L62,48' fill='none'/>"
		+ "<path d='M60,50 L98,8' fill='none' stroke='#B5835A' stroke-width='"+(3/s2).toFixed(2)+"'/></g></svg>";
	var lesson = "<svg width='200' height='190' viewBox='770 246 200 190' style='position:absolute;left:0;top:0;overflow:visible'>"
		+ "<g filter='url(#arena_wob_land)' stroke-linejoin='round' stroke-linecap='round'>"+classroom+desk+"</g></svg>"
		+ teacher + _arenaPeep("student", 64, 784-770, 314-246);
	_place("arena_stone_go", 770, 246, 190, 180, lesson, "right");
	_place("arena_stone_go", 690, 186, 63, 68, _arenaPeep("student", 68, 0, 0, true), "right");

	// Ты — у развилки
	_place("arena_stone_hero", 437, 440, 0, 0, _arenaPeep("you", 92, 0, 0));

	// Надписи указателей: что там и сколько займёт; нажал — туда же, куда ведёт дорога
	for(i=0; i<ARENA_SIGNS2.length; i++){
		var g = ARENA_SIGNS2[i];
		_place("arena_stone_sign", g.x, g.y+5, g.w, 40, Words.get("arena_sign2_"+g.way), g.way);
	}

	// Надпись на камне — три строки одним шрифтом
	self.lines = {};
	self.lines.left = _place("arena_stone_line", 250, 246, 460, 34, Words.get("arena_stone2_left"), "left");
	self.lines.right = _place("arena_stone_line", 250, 282, 460, 34, Words.get("arena_stone2_right"), "right");
	self.lines.back = _place("arena_stone_line", 250, 318, 460, 34, Words.get("arena_stone2_back"), "back");

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

// Кто придумал: подпись на карточке игрока
var ARENA_CARD_BY = {claude5:"arena_by_claude", kimi5:"arena_by_kimi",
	giga_tri:"arena_by_giga", giga_shield:"arena_by_giga", giga_start:"arena_by_giga"};

// Цвет персонажа с прозрачностью: фон под портретом
var _arenaTint = function(id, a){
	var h = PEEP_METADATA[id].color.replace("#", "");
	return "rgba("+parseInt(h.substr(0,2),16)+","+parseInt(h.substr(2,2),16)+","+parseInt(h.substr(4,2),16)+","+a+")";
};

// Описание персонажа без имени в начале (имя на карточке и так крупно)
var _arenaCardText = function(id){
	return _arenaWord("character_"+id).replace(/^\s*<b>[^<]*<\/b>\s*(<br>)?\s*/i, "");
};

/*******************************

Карточка игрока целиком: портрет, имя, кто придумал, как играет.
config: {x, y, character}

*******************************/
function ArenaCardBig(config){

	var self = this;
	self.id = config.id;
	var id = config.character;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_card_big");
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	var by = ARENA_CARD_BY[id] || "arena_by_game";
	self.dom.innerHTML =
		"<div class='arena_card_big_pic' style='background:"+_arenaTint(id, 0.13)+"'>"
		+ _arenaPeep(id, 250, 10, 70) + "</div>"
		+ "<div class='arena_card_big_info'>"
		+ "<div class='arena_card_big_name "+id+"'>"+_arenaWord("label_"+id)+"</div>"
		+ "<div class='arena_card_big_by'>"+_arenaWord(by)+"</div>"
		+ "<div class='arena_card_big_desc'>"+_arenaCardText(id)+"</div>"
		+ "</div>";

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Дуб у корней с сундуком — путь «узнать игру» (налево от камня).
На ветках — 13 игроков: человечки в своих шляпах (нажал — его карточка), на верхушке — табличка «Кто сильнее»,
у корней — сундук со свитками «как и почему»; кот учёный коротко объясняет, что где.
Рисунок — линия «от руки», как у самой игры (вариант «Б», arena/drafts/варианты_рисунка.png).
config: {x, y, onpick: function(kind, id){}} — kind: "card" (id игрока) | "scroll" (какой свиток)

*******************************/
var ARENA_SCROLLS = ["rules", "how", "lessons", "original"];

// Рисунок дуба — как у самой игры (31.10.2026, вариант «Б» из arena/drafts/варианты_рисунка.png):
// линия «от руки», белое, цвет — только в шляпах. Дрожание линии даёт SVG-фильтр; id у каждого рисунка свой.
var ARENA_INK = "#2b2b2b";
var _arenaWobble = function(id, scale){
	return "<filter id='"+id+"' x='-3%' y='-3%' width='106%' height='106%'>"
		+ "<feTurbulence type='fractalNoise' baseFrequency='0.028' numOctaves='2' seed='7'/>"
		+ "<feDisplacementMap in='SourceGraphic' scale='"+scale+"' xChannelSelector='R' yChannelSelector='G'/></filter>";
};
var _arenaCircles = function(list){
	var s = "";
	for(var i=0; i<list.length; i++) s += "<circle cx='"+list[i][0]+"' cy='"+list[i][1]+"' r='"+list[i][2]+"'/>";
	return s;
};

// Кот учёный — белый человечек с ушами, в очках; (x, y) — середина головы
var _arenaCatSVG = function(x, y, k){
	var K = ARENA_INK;
	return "<g transform='translate("+x+","+y+") scale("+k+")' stroke='"+K+"' stroke-width='3.5' stroke-linejoin='round' stroke-linecap='round'>"
		+ "<path d='M18,46 Q46,50 46,24 Q46,10 33,12' fill='none'/>"
		+ "<path d='M-18,16 Q-30,55 -12,55 L12,55 Q30,55 18,16 Z' fill='#fff'/>"
		+ "<path d='M-6,36 V55 M6,36 V55' fill='none'/>"
		+ "<path d='M-21,-10 L-24,-40 L-5,-23 Z M21,-10 L24,-40 L5,-23 Z' fill='#fff'/>"
		+ "<circle cx='0' cy='0' r='24' fill='#fff'/>"
		+ "<circle cx='-7.5' cy='-1' r='2.8' fill='"+K+"' stroke='none'/><circle cx='7.5' cy='-1' r='2.8' fill='"+K+"' stroke='none'/>"
		+ "<circle cx='-8' cy='-1' r='7.2' fill='none' stroke-width='2.4'/><circle cx='8' cy='-1' r='7.2' fill='none' stroke-width='2.4'/>"
		+ "<path d='M-2.5,9 L2.5,9 L0,12 Z' fill='"+K+"' stroke-width='1.5'/>"
		+ "<path d='M-16,10 L-33,7 M-16,14 L-32,17 M16,10 L33,7 M16,14 L32,17' fill='none' stroke-width='2'/>"
		+ "</g>";
};

function ArenaOak(config){

	var self = this;
	self.id = config.id;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_stone"); // те же правила: рисунок не ловит нажатия, ссылки — ловят
	self.dom.style.left = config.x+"px";
	self.dom.style.top = config.y+"px";

	// Крона — объединение кругов (сначала контур, потом заливка). Ветки сужаются: толстые, средние, тонкие;
	// человечек-игрок стоит на конце ветки (ноги — на 27 px ниже середины плода).
	var K = ARENA_INK;
	var crown = _arenaCircles([[420,95,60],[340,110,58],[500,110,58],[260,150,60],[580,150,60],[200,205,58],[640,205,58],
		[270,255,55],[570,255,55],[350,270,55],[490,270,55],[420,275,50]]) + "<ellipse cx='420' cy='185' rx='235' ry='105'/>";
	var br = [
		["M420,300 C417,282 423,264 418,246 M419,280 C398,272 352,264 300,251 M421,274 C446,262 492,251 540,246", 13, 7],
		["M300,251 C266,251 228,245 186,231 M540,246 C580,240 616,238 652,231 M418,250 C425,206 413,160 420,109 M419,242 C396,234 374,220 346,211 "
			+ "M420,228 C444,221 470,214 494,211 M318,254 C306,228 264,194 226,171 M526,248 C550,226 580,196 612,171", 10.5, 5],
		["M300,251 C290,247 280,243 266,241 M540,246 C552,244 562,242 574,241 M258,196 C267,178 278,160 286,143 M586,188 C575,171 563,157 554,143 "
			+ "M419,182 C398,158 374,131 348,117 M419,160 C441,141 467,125 492,117", 8.5, 3]
	];
	var branches = "", leaves = "", chain = "", frames = "";
	for(var i=0; i<br.length; i++) branches += "<path d='"+br[i][0]+"' stroke='"+K+"' stroke-width='"+br[i][1]+"'/>";
	for(var i=0; i<br.length; i++) branches += "<path d='"+br[i][0]+"' stroke='#E4D6C2' stroke-width='"+br[i][2]+"'/>";
	var lv = [[300,234,-25],[545,234,205],[246,186,-60],[594,186,240],[398,224,-125],[442,224,-55],
		[404,146,-150],[436,146,-30],[210,226,-170],[630,226,-10],[352,250,70],[488,250,110]];
	for(var i=0; i<lv.length; i++){
		leaves += "<path transform='translate("+lv[i][0]+","+lv[i][1]+") rotate("+lv[i][2]+")' d='M0,0 C4,-7 13,-8 18,0 C13,8 4,7 0,0 Z M0,0 L15,0' fill='#DCEBC8' stroke='"+K+"' stroke-width='2.5'/>";
	}
	// «Златая цепь на дубе том»: звенья по дуге вокруг ствола
	for(var i=0; i<7; i++){
		var cx = (392+i*9.5).toFixed(1), cy = (374+6*Math.sin(Math.PI*(392+i*9.5-388)/64)).toFixed(1), rx = (i%2) ? 2.66 : 7;
		var link = "<ellipse cx='"+cx+"' cy='"+cy+"' rx='"+rx+"' ry='4.34' fill='none' stroke='";
		chain += link+K+"' stroke-width='5'/>" + link+"#F5C33B' stroke-width='3'/>";
	}
	// Свитки над сундуком — бумага с завитками по краям (надписи — поверх, ссылками)
	var rot = [-6, 3, -3, 4];
	for(var i=0; i<rot.length; i++){
		var y = 196+48*i;
		frames += "<g transform='rotate("+rot[i]+" 825 "+(y+18)+")'><rect x='735' y='"+y+"' width='180' height='36' rx='3'/>"
			+ "<rect x='723' y='"+(y-4)+"' width='13' height='44' rx='6.5'/><rect x='914' y='"+(y-4)+"' width='13' height='44' rx='6.5'/></g>";
	}
	self.dom.innerHTML = "<svg width='960' height='540' viewBox='0 0 960 540'><defs>"+_arenaWobble("arena_wob_oak", 4.5)+"</defs>"
		+ "<g filter='url(#arena_wob_oak)' stroke-linejoin='round' stroke-linecap='round'>"
		+ "<path d='M28,493 C200,489 380,496 560,491 S820,495 932,491' fill='none' stroke='"+K+"' stroke-width='3.5'/>"
		+ "<path d='M378,495 Q396,446 398,380 Q400,330 394,292 L446,292 Q440,330 442,380 Q444,446 462,495 Z' fill='#F2ECE4' stroke='"+K+"' stroke-width='4'/>"
		+ "<path d='M378,495 Q364,498 352,491 M462,495 Q476,498 488,491 M412,320 q5,16 0,32 M430,410 q-5,14 0,30' fill='none' stroke='"+K+"' stroke-width='3'/>"
		+ "<g stroke='"+K+"' stroke-width='9' fill='none'>"+crown+"</g><g fill='#F1F6EA'>"+crown+"</g>"
		+ "<g fill='none'>"+branches+"</g>" + leaves + chain
		+ "<rect x='330' y='6' width='180' height='34' rx='10' fill='#fff' stroke='"+K+"' stroke-width='3.5'/>"
		+ "<path d='M744,424 L758,378 Q815,364 872,378 L886,424 Z' fill='#9a9a9a' stroke='"+K+"' stroke-width='3.5'/>"
		+ "<path d='M753,420 L764,384 Q815,372 866,384 L877,420 Z' fill='#7a7a7a' stroke='"+K+"' stroke-width='2.5'/>"
		+ "<rect x='730' y='420' width='170' height='73' rx='8' fill='#F2ECE4' stroke='"+K+"' stroke-width='3.5'/>"
		+ "<path d='M732,444 H898 M732,468 H898' stroke='"+K+"' stroke-width='2.5' fill='none'/>"
		+ "<g fill='#D6D6D6' stroke='"+K+"' stroke-width='3'><rect x='754' y='420' width='12' height='73'/><rect x='864' y='420' width='12' height='73'/></g>"
		+ "<rect x='804' y='428' width='22' height='24' rx='4' fill='#F5C33B' stroke='"+K+"' stroke-width='3'/><path d='M815,436 V445' stroke='"+K+"' stroke-width='3'/>"
		+ "<g fill='#fff' stroke='"+K+"' stroke-width='3'>"+frames+"</g>"
		+ _arenaCatSVG(196, 440, 1)
		+ "<path d='M52,310 H288 Q300,310 300,322 V378 Q300,390 288,390 H218 L200,410 L198,390 H52 Q40,390 40,378 V322 Q40,310 52,310 Z' fill='#fff' stroke='"+K+"' stroke-width='3.5'/>"
		+ "</g></svg>";

	var _go = function(kind, id){
		return function(){
			Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
			config.onpick(kind, id);
		};
	};
	var _el = function(cls, x, y, html, kind, id, attr){
		var d = document.createElement("div");
		d.className = cls;
		d.style.left = x+"px";
		d.style.top = y+"px";
		d.innerHTML = html;
		if(kind){
			d.onclick = _go(kind, id);
			d.setAttribute(kind, id);
		}
		if(attr) for(var k in attr) d.setAttribute(k, attr[k]);
		self.dom.appendChild(d);
		return d;
	};

	// Плоды — игроки: человечек в своей шляпе стоит на конце ветки (середина — точка плода)
	var fruits = [["tft",190,204],["all_d",230,144],["all_c",285,116],["grudge",350,90],["prober",420,83],
		["tf2t",490,90],["pavlov",555,116],["random",608,144],["giga_shield",645,204],
		["giga_tri",270,214],["kimi5",350,184],["claude5",490,184],["giga_start",570,214]]; // Kimi 5.0 и Claude 5.0 — поровну от середины
	var ph = 56, pw = Math.round(ph*300/325);
	for(var i=0; i<fruits.length; i++){
		var id = fruits[i][0];
		var f = _el("arena_fruit", fruits[i][1]-pw/2, fruits[i][2]-ph/2, _arenaPeep(id, ph, 0, 0),
			"card", id, {title: _arenaWord("label_"+id).replace(/<[^>]*>/g, "")});
		f.style.width = pw+"px";
		f.style.height = ph+"px";
	}

	// Табличка на верхушке (рамка — в рисунке)
	_el("arena_oak_sign", 330, 6, Words.get("arena_oak_top"), "scroll", "stronger");

	// Надписи свитков над сундуком (бумага — в рисунке, повёрнута так же)
	for(var i=0; i<ARENA_SCROLLS.length; i++){
		var sc = _el("arena_oak_scroll", 735, 196+i*48, Words.get("arena_scroll_"+ARENA_SCROLLS[i]+"_t"), "scroll", ARENA_SCROLLS[i]);
		sc.style.transform = "rotate("+rot[i]+"deg)";
	}

	// Кот объясняет (облачко — в рисунке)
	_el("arena_oak_say", 54, 314, Words.get("arena_oak_say"));

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}

/*******************************

Свиток развёрнут: пергамент поверх дуба. ✕, щелчок мимо или Esc — свернуть.
«Кто сильнее» — два графика: лидер по прогонам и монеты за матч (числа — ARENA_STRONGER).
config: {which, onclose: function(){}, onaction: function(slideID){}}

*******************************/
// Числа для «Кто сильнее»: лидер через 10 поколений из 400 прогонов (arena/tests/evo_arena.js)
// и монеты за матч в турнире «как на арене» (arena/tests/who_stronger.js, облако 31.10.2026)
var ARENA_STRONGER = {runs:{claude5:278, kimi5:122}, coins:{claude5:15.77, kimi5:15.62}};

function ArenaScroll(config){

	var self = this;
	self.id = config.id;
	var which = config.which;

	self.dom = document.createElement("div");
	self.dom.className = "object";
	self.dom.classList.add("arena_scroll");
	self.dom.style.left = "0px";
	self.dom.style.top = "0px";

	var body = "";
	if(which=="stronger"){
		var chart = function(title, data, fmt){
			var max = Math.max(data.claude5, data.kimi5), html = "<div class='arena_chart'><div class='arena_chart_t'>"+_arenaWord(title)+"</div>";
			["claude5", "kimi5"].forEach(function(id){
				html += "<div class='arena_chart_row'><b class='"+id+"'>"+_arenaWord("label_"+id)+"</b>"
					+ "<i style='width:"+Math.round(220*data[id]/max)+"px;background:"+PEEP_METADATA[id].color+"'></i>"
					+ "<em>"+fmt(data[id])+"</em></div>";
			});
			return html+"</div>";
		};
		body += "<div class='arena_charts'>"
			+ chart("arena_scroll_stronger_runs", ARENA_STRONGER.runs, function(x){ return x+""; })
			+ chart("arena_scroll_stronger_coins", ARENA_STRONGER.coins, function(x){ return x.toFixed(2).replace(".", ","); })
			+ "</div>";
	}
	body += "<div class='arena_parch_text'>"+Words.get("arena_scroll_"+which)+"</div>";

	self.dom.innerHTML = "<div class='arena_scroll_dim'></div>"
		+ "<div class='arena_parch arena_parch_"+which+"'>"
		+ "<svg class='arena_parch_frame' width='840' height='420'><defs>"+_arenaWobble("arena_wob_parch", 3.5)+"</defs>"
		+ "<rect x='5' y='5' width='830' height='410' rx='16' fill='#fff' stroke='"+ARENA_INK+"' stroke-width='3.5' filter='url(#arena_wob_parch)'/></svg>"
		+ "<div class='arena_parch_title'>"+Words.get("arena_scroll_"+which+"_t")+"</div>"
		+ "<div class='arena_parch_x' title='свернуть'>&#10005;</div>"
		+ body
		+ "<div class='arena_parch_cat'>&laquo;"+_arenaWord("arena_cat_"+which)+"&raquo;</div>"
		+ "<svg class='arena_parch_catpic' width='120' height='110'><defs>"+_arenaWobble("arena_wob_cat", 3)+"</defs>"
		+ "<g filter='url(#arena_wob_cat)'>"+_arenaCatSVG(50, 40, 0.75)+"</g></svg>"
		+ "</div>";

	var _close = function(){
		Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
		config.onclose();
	};
	self.dom.querySelector(".arena_scroll_dim").onclick = _close;
	self.dom.querySelector(".arena_parch_x").onclick = _close;

	// Ссылки внутри свитка: <span class='arena_go' go='slideID'>
	var links = self.dom.querySelectorAll(".arena_go");
	for(var i=0; i<links.length; i++){
		(function(a){
			a.onclick = function(){
				Loader.sounds["button"+Math.ceil(Math.random()*3)].play();
				config.onaction(a.getAttribute("go"));
			};
		})(links[i]);
	}

	self.add = function(){ _add(self); };
	self.remove = function(){ _remove(self); };

}
