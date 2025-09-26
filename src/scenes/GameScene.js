import cfg from '../config/balance.json' assert { type: 'json' };
import { Game } from '../game.js';
export class GameScene{
  constructor(engine){ this.engine=engine; }
  enter(){}
  update(dt){ this.engine.update(dt); }
  draw(ctx){ this.engine.draw(); }
  keydown(e){}
}
