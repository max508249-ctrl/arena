/*
АРЕНА МОДЕЛЕЙ — новые персонажи: стратегии, которые написали языковые модели.

Файл собран скриптом arena/build_strategies.py — не правьте его руками.
Код каждой стратегии вставлен дословно, как его написала модель; рядом — sha256 этого кода.
Прослойка _arenaLogic превращает функцию play(my, their) в персонажа игры
с методами play() и remember(own, other), как у Logic_tft и остальных в PD.js.
Правила прослойки — те же, что на арене проекта: любой ответ, кроме 'D', считается 'C';
в историю пишутся сыгранные ходы (с ошибками), а не задуманные.
*/

// Новые персонажи: кадр в листах спрайтов, цвет, кадр большой шляпы для сцены с автоматом
PEEP_METADATA.claude5 = {frame:8, color:"#D96B3F", hat:26};
PEEP_METADATA.kimi5 = {frame:9, color:"#8E63E8", hat:27};
PEEP_METADATA.deepseek = {frame:10, color:"#1B93AB", hat:28};

// Шляпы Подражателя, Простака и Случайного для сцены с автоматом (в оригинальном листе их не было)
PEEP_METADATA.tf2t.hat = 23;
PEEP_METADATA.pavlov.hat = 24;
PEEP_METADATA.random.hat = 25;
var ARENA_MYSTERY_HAT = 31; // серый цилиндр с вопросом: соперник вслепую

var ARENA_CHARACTERS = ["claude5", "kimi5", "deepseek"];
var ARENA_STRATEGIES = {};

// Claude 5.0 «Гашение эха», 17.10.2026
// источник: витрина/доверие/стратегии_claude_v5.json
ARENA_STRATEGIES.claude5 = (function(){
"use strict";
// >>> claude5 sha256=c5fac23124d835bd01bfeefe1acac05bf69193a720a0ca50688285daeb8f9ae8
function play(my, their) {
  var n = their.length, iG = true, uG = true, d = 0, s = Math.max(0, n - 10), fg = 0, pun = false;
  for (var i = 0; i < n; i++) {
    var jA = iG && !uG, jB = uG && !iG; // обман оправдан, если обманувший чист, а другой — нет
    // гашение эха: его обман сразу после моего одиночного оправданного наказания, во время которого он играл C, не наказываю
    var b = their[i] === 'C' || jB || (pun && their[i - 1] === 'C' && my[i - 2] !== 'D');
    // простил ли он мой обман без причины, будучи сам чист (после двойной ошибки его C — принятие, а не прощение)
    if (i > 0 && !iG && my[i - 1] === 'D' && uG) fg = their[i] === 'C' && fg >= 0 ? fg + 1 : -1;
    if (i >= s && their[i] === 'D' && !b) d++; // окно: только обманы без причины
    pun = my[i] === 'D' && jA; // мой ход — оправданное наказание
    iG = my[i] === 'C' || jA; uG = b;
  }
  if (n >= 6 && d / (n - s) > 0.5) return 'D'; // хронический обманщик или случайный — защита
  if (fg >= 2 && uG && my[n - 1] === 'C') return 'D'; // дою только того, кто простил два моих обмана без причины
  return (iG && !uG) ? 'D' : 'C'; // совесть: за вину — один ответный ход, свою вину принимаю
}
// <<< claude5
return play;
})();

// Kimi 5.0 «Чтец зеркал», 17.10.2026
// источник: витрина/доверие/стратегии_kimi.json
ARENA_STRATEGIES.kimi5 = (function(){
"use strict";
// >>> kimi5 sha256=bd4bd68d2cf69ebc4d66c7673abf113659b543d8d89269a7b2157bfb52329fcb
function play(my, their) {
  var n = their.length, iG = true, uG = true, d = 0, s = Math.max(0, n - 10), fg = 0, justD = false, pun = 0, ech = 0;
  for (var i = 0; i < n; i++) {
    var jA = iG && !uG, jB = uG && !iG, b = their[i] === 'C' || jB;
    if (i > 0 && my[i - 1] === 'D' && justD) { pun++; if (their[i] === 'D') ech++; }
    if (i > 0 && !iG && my[i - 1] === 'D' && uG) fg = their[i] === 'C' && fg >= 0 ? fg + 1 : -1;
    if (i >= s && their[i] === 'D' && !b) d++;
    justD = my[i] === 'D' && jA;
    iG = my[i] === 'C' || jA; uG = b;
  }
  if (n >= 6 && d / (n - s) > 0.5) return 'D';
  if (pun >= 2 && ech / pun >= 0.8) return 'C';
  if (fg >= 2 && uG && my[n - 1] === 'C') return 'D';
  return (iG && !uG) ? 'D' : 'C';
}
// <<< kimi5
return play;
})();

// DeepSeek «Зеркальный суд» (без роли), 02.11.2026
// источник: витрина/доверие/стратегии_deepseek.json
ARENA_STRATEGIES.deepseek = (function(){
"use strict";
// >>> deepseek sha256=75a0b101aa3bd95ad3ee977f04a1709abafeefec73bb33e9306f0a4bfe169318
function play(my, their) {
  if (their.length === 0) return 'C';
  const n = their.length;
  if (n >= 2 && their[n - 1] === 'D' && their[n - 2] === 'D') {
    if (my[n - 1] !== 'D') return 'D';
    if (n >= 3 && their[n - 3] === 'D') return 'D';
    return 'C';
  }
  return their[n - 1];
}
// <<< deepseek
return play;
})();

function _arenaLogic(play){
	return function(){
		var self = this;
		var my = [], their = [];
		self.play = function(){
			var move;
			try{ move = play(my.slice(), their.slice()); }catch(e){ move = "C"; }
			return (move==="D") ? PD.CHEAT : PD.COOPERATE;
		};
		self.remember = function(own, other){
			my.push(own==PD.CHEAT ? "D" : "C");
			their.push(other==PD.CHEAT ? "D" : "C");
		};
	};
}

var Logic_claude5 = _arenaLogic(ARENA_STRATEGIES.claude5);
var Logic_kimi5 = _arenaLogic(ARENA_STRATEGIES.kimi5);
var Logic_deepseek = _arenaLogic(ARENA_STRATEGIES.deepseek);
