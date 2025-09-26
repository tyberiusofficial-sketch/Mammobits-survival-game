import { clamp } from '../utils/math.js';
export class Camera{
  constructor(w,h,worldW,worldH){ this.w=w; this.h=h; this.worldW=worldW; this.worldH=worldH; this.x=0; this.y=0; }
  follow(target){
    this.x = clamp(target.x + target.w/2 - this.w/2, 0, this.worldW - this.w);
    this.y = clamp(target.y + target.h/2 - this.h/2, 0, this.worldH - this.h);
  }
}
