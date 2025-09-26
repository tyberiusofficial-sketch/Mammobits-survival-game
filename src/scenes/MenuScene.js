import { verifyOwnership } from '../services/nftGate.js';
export class MenuScene{
  constructor(game){ this.game = game; this.verified = false; this.ready=false; }
  async enter(){
    this.ready=true;
  }
  update(dt){}
  draw(ctx){
    const c = ctx.canvas; ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='#0c1016'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#cfe2ff'; ctx.font='28px system-ui'; ctx.fillText('Mammobits Survival', 30, 60);
    ctx.font='16px system-ui';
    ctx.fillText(this.verified? 'Verified! Press Enter to Start' : 'Press V to Verify NFT (stubbed) then Enter', 30, 100);
  }
  keydown(e){
    if(e.code==='KeyV'){ this.verified=true; }
    if(e.code==='Enter' && this.verified){ this.game.setScene('game'); }
  }
}
