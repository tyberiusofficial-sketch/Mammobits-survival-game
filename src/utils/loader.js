export async function loadImage(src){
  return new Promise((res)=>{
    const img = new Image(); img.onload = ()=>res(img); img.onerror=()=>res(null); img.src = src;
  });
}
export async function loadAudio(src){
  return new Promise((res)=>{
    const a = new Audio(); a.oncanplaythrough=()=>res(a); a.onerror=()=>res(null); a.src = src; a.preload="auto";
  });
}
export async function loadFrames(prefix, count){
  const frames = [];
  for (let i = 0; i < count; i++){
    frames.push(await loadImage(`./assets/${prefix}_${i}.png`));
  }
  return frames;
}
