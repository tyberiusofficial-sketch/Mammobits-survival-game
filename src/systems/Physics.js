import { aabbOverlap } from '../utils/collisions.js';
export function collideWithWorld(ent, world){
  // Simple clamp against borders
  ent.x = Math.max(world.border, Math.min(world.width - world.border - ent.w, ent.x));
  ent.y = Math.max(world.border, Math.min(world.height - world.border - ent.h, ent.y));
}
export function overlaps(a,b){ return aabbOverlap(a,b); }
