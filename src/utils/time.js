export class Ticker{
  constructor(hz=60){ this.dt = 1000/hz; this.acc=0; this.last=0; }
  step(now){ if(!this.last) this.last=now; let d=now-this.last; this.last=now; this.acc+=d; let n=0; while(this.acc>=this.dt){ this.acc-=this.dt; n++; } return n; }
}
