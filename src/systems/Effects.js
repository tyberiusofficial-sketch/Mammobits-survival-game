export class Effects{
  constructor(){ this.fx=[]; this.frames={}; }
  setFrames(name, frames){ this.frames[name] = frames.filter(Boolean); }
  add(x,y,ttl=250,type='impact'){ this.fx.push({x,y,ttl,type,age:0}); }
  update(dt){ this.fx = this.fx.map(f=>({ ...f, age:f.age+dt, ttl:f.ttl-dt })).filter(f=>f.ttl>0); }
  draw(ctx, cam){
    for(const f of this.fx){
      const frames = this.frames[f.type];
      if(frames && frames.length){
        const t = 1 - (f.ttl / Math.max(1, f.age + f.ttl));
        const idx = Math.min(frames.length-1, Math.floor(t * frames.length));
        const img = frames[idx];
        const dx = Math.floor(f.x - cam.x - img.width/2);
        const dy = Math.floor(f.y - cam.y - img.height/2);
        ctx.drawImage(img, dx, dy);
      }else{
        ctx.save();
        ctx.translate(Math.floor(f.x - cam.x), Math.floor(f.y - cam.y));
        ctx.fillStyle = f.type==='impact' ? 'rgba(255,200,80,0.85)' : 'rgba(120,200,255,0.85)';
        ctx.beginPath(); ctx.arc(0,0,6,0,Math.PI*2); ctx.fill();
        ctx.restore();
      }
    }
  }
}
