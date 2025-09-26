export class MenuScene{
  constructor(game){ this.game = game; this.verified = true; } // NFT gate stubbed as verified
  async enter(){}
  update(dt){}
  draw(ctx){
    const c = ctx.canvas; ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='#0c1016'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#cfe2ff'; ctx.font='28px system-ui'; ctx.fillText('Mammobits Survival', 30, 60);
    ctx.font='16px system-ui'; ctx.fillText('Press Enter to Start', 30, 100);
  }
  keydown(e){ if(e.code==='Enter') this.game.setScene('game'); }
}
