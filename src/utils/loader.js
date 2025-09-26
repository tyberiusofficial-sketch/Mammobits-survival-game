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
