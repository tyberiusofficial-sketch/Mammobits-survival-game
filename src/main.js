import { Game } from './game.js';
import { UI } from './systems/UI.js';
import { Ticker } from './utils/time.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
import { ScoreboardScene } from './scenes/ScoreboardScene.js';

const canvas = document.getElementById('game');
const hudEl = document.getElementById('hud');
const bannerEl = document.getElementById('banner');
const btnMute = document.getElementById('btn-mute');
const btnStomp = document.getElementById('btn-stomp');
const btnWater = document.getElementById('btn-water');
const btnCharge = document.getElementById('btn-charge');

const engine = new Game(canvas, hudEl, bannerEl);
const ui = new UI(hudEl, bannerEl);
engine.setUI(ui);

const ctx = canvas.getContext('2d');
const scenes = {
  menu: new MenuScene(engine),
  game: new GameScene(engine),
  scoreboard: new ScoreboardScene(engine)
};
let current = 'menu';

function setScene(name){
  current = name;
  scenes[name].enter && scenes[name].enter();
}
engine.setScene = setScene;

btnMute.addEventListener('click', ()=> engine.audio.toggleMute());
btnStomp.addEventListener('click', ()=> engine.stomp());
btnWater.addEventListener('click', ()=> engine.water());
btnCharge.addEventListener('click', ()=> engine.charge());

window.addEventListener('keydown', (e)=>{
  if(current==='menu'){ scenes.menu.keydown(e); }
  if(e.code==='Backquote'){ debug = !debug; }
  if(e.code==='KeyP'){ paused = !paused; }
});
let paused=false, debug=false;

const ticker = new Ticker(60);
function loop(now){
  const steps = ticker.step(now);
  if(!paused){
    for(let i=0;i<steps;i++){
      scenes[current].update && scenes[current].update(ticker.dt);
    }
  }
  scenes[current].draw && scenes[current].draw(ctx);
  requestAnimationFrame(loop);
}
setScene('menu');
requestAnimationFrame(loop);
