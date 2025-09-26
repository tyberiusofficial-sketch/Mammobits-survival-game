let seed = 1337;
export function srand(s){ seed = s>>>0; }
export function rand(){ seed = (1664525*seed + 1013904223)>>>0; return (seed & 0xFFFFFFFF)/0x100000000; }
export function irange(a,b){ return a + Math.floor(rand()*(b-a+1)); }
