export class Renderer{
  constructor(canvas){ this.canvas=canvas; this.ctx=canvas.getContext('2d'); }
  clear(){ this.ctx.fillStyle='#0c1016'; this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height); }
}
