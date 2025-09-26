export class Effects{
  constructor(){ this.fx=[]; }
  add(x,y,ttl=250,type='impact'){ this.fx.push({x,y,ttl,type}); }
  update(dt){ this.fx = this.fx.map(f=>({ ...f, ttl: f.ttl-dt })).filter(f=>f.ttl>0); }
  draw(ctx, cam){
    this.fx.forEach(f=>{
      ctx.save();
      ctx.translate(Math.floor(f.x - cam.x), Math.floor(f.y - cam.y));
      ctx.fillStyle = f.type==='impact' ? 'rgba(255,200,80,0.8)' : 'rgba(120,200,255,0.8)';
      ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
      ctx.restore();
    });
  }
}
