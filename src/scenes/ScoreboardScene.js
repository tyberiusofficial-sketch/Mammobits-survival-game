import { getTopScores, getMyScores } from '../services/scores.js';
export class ScoreboardScene{
  constructor(game){ this.game=game; this.top=[]; this.mine=[]; }
  async enter(){ this.top = await getTopScores(); this.mine = await getMyScores(); }
  update(){}
  draw(ctx){
    const c = ctx.canvas; ctx.clearRect(0,0,c.width,c.height);
    ctx.fillStyle='#0c1016'; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle='#cfe2ff'; ctx.font='24px system-ui'; ctx.fillText('Scoreboard', 30, 50);
    ctx.font='16px system-ui'; let y=90;
    ctx.fillText('Top 5:', 30, y); y+=24;
    this.top.slice(0,5).forEach(s=>{ ctx.fillText(`${s.wallet} — ${s.score}`, 40, y); y+=20; });
    y+=16; ctx.fillText('Your recent:', 30, y); y+=24;
    this.mine.slice(0,5).forEach(s=>{ ctx.fillText(`${s.score} — ${new Date(s.created_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}`, 40, y); y+=20; });
  }
}
