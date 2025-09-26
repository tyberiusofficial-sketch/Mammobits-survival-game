import { irange, rand } from '../utils/rng.js';
export class SpawnManager{
  constructor(cfg){ this.cfg=cfg; this.elapsed=0; this.next=cfg.startIntervalMs; this.total=0; }
  update(dt, addEnemy){
    this.elapsed += dt;
    if(this.elapsed*0.001*1000 >= this.next){
      this.spawn(addEnemy);
      const rampEvery = this.cfg.rampEverySec*1000;
      const minInt = this.cfg.minIntervalMs;
      this.next = Math.max(minInt, this.next - rampEvery*0.05);
      this.elapsed = 0;
    }
  }
  pickType(){
    const w = this.cfg.composition; const r = Math.random(); let acc=0;
    for(const k of Object.keys(w)){ acc+=w[k]; if(r<=acc) return k; } return 'hunter';
  }
  spawn(addEnemy){
    if(this.total >= this.cfg.maxEnemies) return;
    const type = this.pickType();
    const x = irange(60, this.cfg.worldW-60), y = irange(60, this.cfg.worldH-60);
    addEnemy(type, x, y);
    this.total++;
  }
}
