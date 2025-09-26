export class UI{
  constructor(hudEl, bannerEl){
    this.hud = hudEl; this.banner = bannerEl;
    this.cooldowns = {stomp:0, water:0, charge:0};
    this.bannerTimer = 0;
  }
  announce(text, ms=5000){
    this.banner.innerText = text; this.banner.style.display='block'; this.bannerTimer = ms;
  }
  setCooldown(name, ms){ this.cooldowns[name] = ms; }
  update(dt){
    Object.keys(this.cooldowns).forEach(k=> this.cooldowns[k] = Math.max(0, this.cooldowns[k]-dt));
    if(this.bannerTimer>0){ this.bannerTimer-=dt; if(this.bannerTimer<=0){ this.banner.style.display='none'; } }
  }
  render(player){
    const cd = this.cooldowns;
    this.hud.innerHTML = `HP: ${Math.ceil(player.hp)} / ${player.maxHp} &nbsp; Score: ${player.score}
      <br/>CD - Stomp: ${Math.ceil(cd.stomp/1000)}s, Water: ${Math.ceil(cd.water/1000)}s, Charge: ${Math.ceil(cd.charge/1000)}s`;
  }
}
