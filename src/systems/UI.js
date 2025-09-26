export class UI{
  constructor(hudEl, bannerEl, buffsEl){
    this.hud = hudEl; this.banner = bannerEl; this.buffsEl = buffsEl;
    this.cooldowns = {stomp:0, water:0, charge:0};
    this.bannerTimer = 0;
    this.icons = {
      stomp: {ready:null, disabled:null, el: document.getElementById('btn-stomp')},
      water: {ready:null, disabled:null, el: document.getElementById('btn-water')},
      charge:{ready:null, disabled:null, el: document.getElementById('btn-charge')},
    };
    Object.values(this.icons).forEach(i=>{ i.el.classList.add('icon'); i.el.textContent=''; });
  }
  setIcons(map){
    Object.keys(map).forEach(k=>{
      this.icons[k].ready = map[k].ready;
      this.icons[k].disabled = map[k].disabled;
    });
  }
  announce(text, ms=5000){
    this.banner.innerText = text; this.banner.style.display='block'; this.bannerTimer = ms;
  }
  setCooldown(name, ms){ this.cooldowns[name] = ms; }
  setBuffs(buffIconUrls){
    this.buffsEl.innerHTML = '';
    buffIconUrls.forEach(url=>{
      const img = document.createElement('img'); img.src = url; this.buffsEl.appendChild(img);
    });
  }
  update(dt){
    Object.keys(this.cooldowns).forEach(k=> this.cooldowns[k] = Math.max(0, this.cooldowns[k]-dt));
    if(this.bannerTimer>0){ this.bannerTimer-=dt; if(this.bannerTimer<=0){ this.banner.style.display='none'; } }
    Object.keys(this.icons).forEach(k=>{
      const isCd = this.cooldowns[k] > 0;
      const url = isCd ? this.icons[k].disabled : this.icons[k].ready;
      if(url) this.icons[k].el.style.backgroundImage = `url(${url})`;
      this.icons[k].el.disabled = isCd;
    });
  }
  render(player){
    this.hud.innerHTML = `HP: ${Math.ceil(player.hp)} / ${player.maxHp} &nbsp; Score: ${player.score}`;
  }
}
