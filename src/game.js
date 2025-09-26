import { Ticker } from './utils/time.js';
import { Renderer } from './systems/Renderer.js';
import { Camera } from './systems/Camera.js';
import { Input } from './systems/Input.js';
import { AudioSys } from './systems/Audio.js';
import { Effects } from './systems/Effects.js';
import { collideWithWorld } from './systems/Physics.js';
import { clamp, dist, angleBetween } from './utils/math.js';
import cfg from './config/balance.json' assert { type: 'json' };

export class Game{
  constructor(canvas, hud, banner){
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    this.input = new Input();
    this.audio = new AudioSys();
    this.renderer = new Renderer(canvas);
    this.effects = new Effects();
    this.world = { width: cfg.world.width, height: cfg.world.height, border: cfg.world.border };
    this.camera = new Camera(cfg.world.camera.w, cfg.world.camera.h, this.world.width, this.world.height);
    this.ticker = new Ticker(60);
    this.entities = [];
    this.enemies = [];
    this.projectiles = [];
    this.time = 0;
    this.score = 0;
    this.player = this.spawnPlayer();
    this.ui = null; // set by main
    this.cooldowns = { stomp:0, water:0, charge:0, attack:0 };
    this.freezeTimers = new Map();
  }
  setUI(ui){ this.ui = ui; }
  spawnPlayer(){
    const p = { x: this.world.width/2-24, y: this.world.height/2-24, w: 48, h: 48,
      vx:0, vy:0, speed: cfg.player.moveSpeed, hp: cfg.player.baseHp, maxHp: cfg.player.baseHp,
      facing: 0, score:0, charging:false, chargeT:0, dmgMult:1, spdMult:1, cdMult:1 };
    return p;
  }
  addEnemy(type,x,y){
    const ecfg = cfg.enemies[type];
    const e = { type, x, y, w: ecfg.spriteSize[0], h: ecfg.spriteSize[1], hp: ecfg.hp,
      speed: ecfg.speed, dmg: ecfg.damage, frozen: false, freezeT:0, facing:0, bobT:0 };
    this.enemies.push(e);
  }
  fireSpear(ex,ey,angle,speed,damage,maxRange){
    const p = { x: ex, y: ey, w: 12, h: 4, a: angle, spd: speed, dmg: damage, dist:0, max: maxRange };
    this.projectiles.push(p);
  }
  healFromVine(percentBase){
    const amount = cfg.player.baseHp * (percentBase/100);
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
  }
  update(dt){
    this.time += dt;
    // Inputs
    const P = this.player;
    let mvx=0, mvy=0;
    if(this.input.down('KeyW')||this.input.down('ArrowUp')) mvy-=1;
    if(this.input.down('KeyS')||this.input.down('ArrowDown')) mvy+=1;
    if(this.input.down('KeyA')||this.input.down('ArrowLeft')) mvx-=1;
    if(this.input.down('KeyD')||this.input.down('ArrowRight')) mvx+=1;
    const len = Math.hypot(mvx,mvy)||1;
    const spd = P.speed * P.spdMult * (P.charging? cfg.abilities.charge.speedMultiplier : 1);
    P.vx = mvx/len * spd * dt/1000;
    P.vy = mvy/len * spd * dt/1000;
    P.x += P.vx; P.y += P.vy;
    collideWithWorld(P, {...this.world});

    // Auto attack
    this.cooldowns.attack = Math.max(0, this.cooldowns.attack - dt);
    if(this.cooldowns.attack<=0){
      const inRange = this.enemies.find(e=>!e.frozen && dist(P.x,P.y,e.x,e.y) <= cfg.player.attack.range);
      if(inRange){
        // swipe effect
        this.effects.add(inRange.x, inRange.y, 250, 'swipe');
        inRange.hp -= cfg.player.attack.damage * P.dmgMult;
        this.cooldowns.attack = cfg.player.attack.cooldownMs * P.cdMult;
      }
    }

    // Abilities cooldowns tick
    ['stomp','water','charge'].forEach(k=> this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt));
    if(this.ui){
      this.ui.setCooldown('stomp', this.cooldowns.stomp);
      this.ui.setCooldown('water', this.cooldowns.water);
      this.ui.setCooldown('charge', this.cooldowns.charge);
    }
    // Ability triggers
    if(this.input.down(cfg.keybinds.stomp) && this.cooldowns.stomp===0){
      this.stomp();
    }
    if(this.input.down(cfg.keybinds.water) && this.cooldowns.water===0){
      this.water();
    }
    if(this.input.down(cfg.keybinds.charge) && this.cooldowns.charge===0){
      this.charge();
    }

    // Enemies move & AI
    const bobAmp = cfg.enemies.bobbing.amplitude, bobHz = cfg.enemies.bobbing.frequencyHz;
    for(const e of this.enemies){
      if(e.frozen){
        e.freezeT -= dt; if(e.freezeT<=0){ e.frozen=false; }
        continue;
      }
      // basic chase
      const ang = angleBetween(e.x,e.y,P.x,P.y); e.facing = ang;
      e.x += Math.cos(ang)*e.speed*dt/1000;
      e.y += Math.sin(ang)*e.speed*dt/1000;
      e.y += Math.sin(e.bobT*2*Math.PI*bobHz)*bobAmp*dt/1000;
      e.bobT += dt/1000;

      // Hunter ranged
      if(e.type==='hunter'){
        e.rangedCd = (e.rangedCd||0) - dt;
        if(e.rangedCd<=0){
          const rcfg = cfg.enemies.hunter.ranged;
          if(rcfg.enabled){
            this.fireSpear(e.x, e.y, ang, rcfg.speed, rcfg.damage, rcfg.maxRange);
            e.rangedCd = rcfg.cooldownMs * (P.cdMult||1);
          }
        }
      }
    }
    // Cull dead enemies
    this.enemies = this.enemies.filter(e=>{
      if(e.hp<=0){ this.effects.add(e.x,e.y,300,'impact'); this.score+=10; return false; }
      return true;
    });

    // Projectiles
    for(const pr of this.projectiles){
      const vx = Math.cos(pr.a)*pr.spd*dt/1000, vy=Math.sin(pr.a)*pr.spd*dt/1000;
      pr.x += vx; pr.y += vy; pr.dist += Math.hypot(vx,vy);
      // collide with player (simple)
      if(pr.x < P.x+P.w && pr.x+pr.w > P.x && pr.y < P.y+P.h && pr.y+pr.h > P.y){
        P.hp -= pr.dmg; this.effects.add(P.x,P.y,200,'impact'); pr.dist = pr.max+1;
      }
      // world bounds
      if(pr.x<0||pr.y<0||pr.x>this.world.width||pr.y>this.world.height){ pr.dist = pr.max+1; }
    }
    this.projectiles = this.projectiles.filter(pr=> pr.dist <= pr.max);

    // Camera follow
    this.camera.follow(P);

    // FX
    this.effects.update(dt);

    // UI
    if(this.ui){ this.ui.update(dt); this.ui.render({...P, score:this.score}); }
  }
  stomp(){
    // AOE damage
    const r = cfg.abilities.stomp.radius, dmg=cfg.abilities.stomp.damage;
    for(const e of this.enemies){
      const d = Math.hypot(e.x-this.player.x, e.y-this.player.y);
      if(d<=r){ e.hp -= dmg; }
    }
    this.cooldowns.stomp = cfg.abilities.stomp.cooldownMs * this.player.cdMult;
    this.effects.add(this.player.x, this.player.y, 300, 'impact');
  }
  water(){
    // Freeze in cone
    const arc = cfg.abilities.waterSpout.arcDeg * Math.PI/180;
    const freeze = cfg.abilities.waterSpout.freezeMs;
    const facing = this.player.facing || 0;
    for(const e of this.enemies){
      const ang = Math.atan2(e.y-this.player.y, e.x-this.player.x);
      let diff = Math.atan2(Math.sin(ang-facing), Math.cos(ang-facing));
      const d = Math.hypot(e.x-this.player.x, e.y-this.player.y);
      if(Math.abs(diff)<=arc/2 && d<=200){
        e.frozen = True; /* Python-like mistake avoided */ 
      }
    }
    // Correct setting for JS:
    for(const e of this.enemies){
      const ang = Math.atan2(e.y-this.player.y, e.x-this.player.x);
      let diff = Math.atan2(Math.sin(ang-facing), Math.cos(ang-facing));
      const d = Math.hypot(e.x-this.player.x, e.y-this.player.y);
      if(Math.abs(diff)<=arc/2 && d<=200){
        e.frozen = true; e.freezeT = freeze;
      }
    }
    this.cooldowns.water = cfg.abilities.waterSpout.cooldownMs * this.player.cdMult;
  }
  charge(){
    this.player.charging = true;
    this.player.chargeT = cfg.abilities.charge.durationMs;
    this.cooldowns.charge = cfg.abilities.charge.cooldownMs * this.player.cdMult;
  }
  draw(){
    const ctx = this.ctx, cam=this.camera;
    // world bg
    ctx.fillStyle = '#132031'; ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
    // simple grid
    ctx.strokeStyle='#1e2c45'; ctx.lineWidth=1;
    for(let x= -(cam.x%64); x<=this.canvas.width; x+=64){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,this.canvas.height); ctx.stroke(); }
    for(let y= -(cam.y%64); y<=this.canvas.height; y+=64){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(this.canvas.width,y); ctx.stroke(); }

    // draw enemies
    for(const e of this.enemies){
      const sx = Math.floor(e.x - cam.x), sy = Math.floor(e.y - cam.y);
      if(e.frozen){
        // draw icecube rectangle scaled to e size
        ctx.fillStyle='rgba(150,220,255,0.6)'; ctx.fillRect(sx- e.w/2, sy- e.h/2, e.w, e.h);
      }else{
        ctx.fillStyle = e.type==='trex' ? '#7f2b2b' : e.type==='sabre' ? '#b5832c' : '#6aa1ff';
        ctx.fillRect(sx- e.w/2, sy- e.h/2, e.w, e.h);
      }
    }
    // draw player
    const P = this.player;
    ctx.fillStyle='#e0f0ff'; ctx.fillRect(Math.floor(P.x - cam.x - P.w/2), Math.floor(P.y - cam.y - P.h/2), P.w, P.h);

    // projectiles
    ctx.fillStyle='#d7cf8a';
    for(const pr of this.projectiles){
      ctx.fillRect(Math.floor(pr.x - cam.x), Math.floor(pr.y - cam.y), pr.w, pr.h);
    }

    // effects
    this.effects.draw(ctx, cam);
  }
}
