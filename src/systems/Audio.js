export class AudioSys{
  constructor(){ this.muted = JSON.parse(localStorage.getItem('muted')||'false'); this.bgm=null; }
  async playBgm(src){
    if(this.bgm){ this.bgm.pause(); }
    this.bgm = new Audio(src); this.bgm.loop = true; this.bgm.volume = 0.5;
    if(!this.muted) this.bgm.play().catch(()=>{});
  }
  toggleMute(){
    this.muted = !this.muted; localStorage.setItem('muted', JSON.stringify(this.muted));
    if(this.bgm){ if(this.muted) this.bgm.pause(); else this.bgm.play().catch(()=>{}); }
  }
  playOnce(src, vol=1){
    if(this.muted) return;
    const a = new Audio(src); a.volume = vol; a.play().catch(()=>{});
  }
}
