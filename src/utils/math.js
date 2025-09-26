export const TAU = Math.PI * 2;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a,b,t)=> a+(b-a)*t;
export function angleBetween(ax,ay,bx,by){ return Math.atan2(by-ay, bx-ax); }
export function dist(ax,ay,bx,by){ const dx=bx-ax, dy=by-ay; return Math.hypot(dx,dy); }
