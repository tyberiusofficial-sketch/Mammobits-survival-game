import { Ticker } from './utils/time.js';
import { Renderer } from './systems/Renderer.js';
import { Camera } from './systems/Camera.js';
import { Input } from './systems/Input.js';
import { AudioSys } from './systems/Audio.js';
import { Effects } from './systems/Effects.js';
import { collideWithWorld } from './systems/Physics.js';
import { angleBetween, dist } from './utils/math.js';
import cfg from './config/balance.json' with { type: 'json' };
import { SpawnManager } from './systems/SpawnManager.js';

function img(path){ const i=new Image(); i.src=path; return i; }

export class Game{
  constructor(canvas, hud, banner){
    this.canvas=canvas; this.ctx=canvas.getContext('2d');
    this.input = new Input();
    this.audio = new AudioSys();
    this.renderer = new Renderer(canvas);
    this.effects = new Effects();
    this.world = { width: cfg.world.width, height: cfg.world.height, border: cfg.world.border };
    this.spawner = new SpawnManager(cfg.spawn, this.world.width, this.world.height);
    this.camera = new Camera(cfg.world.camera.w, cfg.world.camera.h, this.world.width, this.world.height);
    this.ticker = new Ticker(60);
    this.enemies = [];
    this.projectiles = [];
    this.score = 0;
    this.assets = {
      mammoth: img('./assets/mammoth.png'),
      hunter:  img('./assets/hunter.png'),
      sabre:   img('./assets/sabre.png'),
      trex:    img('./assets/trex.png'),
      spear:   img('./assets/spear.png'),
      icecube: img('./assets/icecube.png'),
      background: img('./assets/maps/map.png'),
    };
    this.player = this.spawnPlayer();
    this.ui = null;
    this.cooldowns = { stomp:0, water:0, charge:0, attack:0 };
  }
  setUI(ui){ this.ui = ui; }
  spawnPlayer(){
    return { x:this.world.width/2, y:this.world.height/2, w:cfg.player.spriteSize[0], h:cfg.player.spriteSize[1],
      vx:0, vy:0, speed:cfg.player.moveSpeed, hp:cfg.player.baseHp, maxHp:cfg.player.baseHp,
      facing:0, charging:false, chargeT:0, dmgMult:1, spdMult:1, cdMult:1, buffs:[] };
  }
  addEnemy(type,x,y){
    const ecfg = cfg.enemies[type];
    this.enemies.push({ type, x, y, w:ecfg.spriteSize[0], h:ecfg.spriteSize[1], hp:ecfg.hp,
      speed:ecfg.speed, dmg:ecfg.damage, frozen:false, freezeT:0, facing:0, bobT:0, rangedCd:0 });
  }
  fireSpear(ex,ey,angle,speed,damage,maxRange){
    this.projectiles.push({ x:ex, y:ey, w:24, h:6, a:angle, spd:speed, dmg:damage, dist:0, max:maxRange });
  }
  update(dt){
    const P = this.player;
    // run the spawner here (not in draw)
    this.spawner.update(dt, (type, x, y) => this.addEnemy(type, x, y));
    // movement
    let mvx=0,mvy=0;
    if(this.input.down('KeyW')||this.input.down('ArrowUp')) mvy-=1;
    if(this.input.down('KeyS')||this.input.down('ArrowDown')) mvy+=1;
    if(this.input.down('KeyA')||this.input.down('ArrowLeft')) mvx-=1;
    if(this.input.down('KeyD')||this.input.down('ArrowRight')) mvx+=1;
    const len = Math.hypot(mvx,mvy)||1;
    const spd = P.speed * (P.charging? cfg.abilities.charge.speedMultiplier : 1);
    P.vx = mvx/len * spd * dt/1000;
    P.vy = mvy/len * spd * dt/1000;
    P.x += P.vx; P.y += P.vy; if(mvx||mvy) P.facing = Math.atan2(P.vy,P.vx);
    collideWithWorld(P, {...this.world});

    // auto attack
    this.cooldowns.attack = Math.max(0,this.cooldowns.attack-dt);
    if(this.cooldowns.attack<=0){
      const e = this.enemies.find(e=>!e.frozen && dist(P.x,P.y,e.x,e.y)<=cfg.player.attack.range);
      if(e){ this.effects.add(e.x,e.y,220,'swipe'); e.hp -= cfg.player.attack.damage; this.cooldowns.attack=cfg.player.attack.cooldownMs; }
    }

    // abilities
    ['stomp','water','charge'].forEach(k=> this.cooldowns[k]=Math.max(0,this.cooldowns[k]-dt));
    if(this.ui){
      this.ui.setCooldown('stomp', this.cooldowns.stomp);
      this.ui.setCooldown('water', this.cooldowns.water);
      this.ui.setCooldown('charge', this.cooldowns.charge);
      this.ui.setBuffs(P.buffs || []);
    }
    if(this.input.down(cfg.keybinds.stomp) && this.cooldowns.stomp===0) this.stomp();
    if(this.input.down(cfg.keybinds.water) && this.cooldowns.water===0) this.water();
    if(this.input.down(cfg.keybinds.charge) && this.cooldowns.charge===0) this.charge();

    // enemies
    const bobAmp=cfg.enemies.bobbing.amplitude,bobHz=cfg.enemies.bobbing.frequencyHz;
    for(const e of this.enemies){
      if(e.frozen){ e.freezeT-=dt; if(e.freezeT<=0) e.frozen=false; continue; }
      const ang = angleBetween(e.x,e.y,P.x,P.y); e.facing=ang;
      e.x += Math.cos(ang)*e.speed*dt/1000; e.y += Math.sin(ang)*e.speed*dt/1000;
      e.y += Math.sin(e.bobT*2*Math.PI*bobHz)*bobAmp*dt/1000; e.bobT+=dt/1000;
      if(e.type==='hunter'){
        e.rangedCd -= dt;
        if(e.rangedCd<=0){
          const rcfg=cfg.enemies.hunter.ranged; if(rcfg.enabled){
            this.fireSpear(e.x,e.y,ang,rcfg.speed,rcfg.damage,rcfg.maxRange); e.rangedCd=rcfg.cooldownMs;
          }
        }
      }
    }
    // deaths
    this.enemies = this.enemies.filter(e=>{
      if(e.hp<=0){ this.effects.add(e.x,e.y,240,'impact'); this.score+=10; return false; }
      return true;
    });

    // projectiles
    for(const pr of this.projectiles){
      const vx = Math.cos(pr.a)*pr.spd*dt/1000, vy=Math.sin(pr.a)*pr.spd*dt/1000;
      pr.x += vx; pr.y += vy; pr.dist += Math.hypot(vx,vy);
      // collide with player
      if(pr.x < P.x+P.w/2 && pr.x+pr.w > P.x-P.w/2 && pr.y < P.y+P.h/2 && pr.y+pr.h > P.y-P.h/2){
        P.hp -= pr.dmg; this.effects.add(P.x,P.y,180,'impact'); pr.dist = pr.max+1;
      }
      // bounds
      if(pr.x<0||pr.y<0||pr.x>this.world.width||pr.y>this.world.height){ pr.dist = pr.max+1; }
    }
    this.projectiles = this.projectiles.filter(pr=> pr.dist <= pr.max);

    // charge flickers (code-driven; no PNGs necessary)
    if(P.charging){
      P.chargeT -= dt; if(P.chargeT<=0) P.charging=false;
      if(Math.random()<0.25){ this.effects.add(P.x, P.y+P.h*0.35, 120, 'impact'); }
    }

    // camera & fx
    this.camera.follow(P);
    this.effects.update(dt);
  }
  stomp(){
    const r = cfg.abilities.stomp.radius, dmg=cfg.abilities.stomp.damage;
    for(const e of this.enemies){
      const d = Math.hypot(e.x-this.player.x, e.y-this.player.y);
      if(d<=r){ e.hp -= dmg; }
    }
    this.cooldowns.stomp = cfg.abilities.stomp.cooldownMs;
    this.effects.add(this.player.x, this.player.y, 360, 'stomp');
  }
  water(){
    const arc = cfg.abilities.waterSpout.arcDeg * Math.PI/180;
    const freeze = cfg.abilities.waterSpout.freezeMs;
    const facing = this.player.facing || 0;
    for(const e of this.enemies){
      const ang = Math.atan2(e.y-this.player.y, e.x-this.player.x);
      let diff = Math.atan2(Math.sin(ang-facing), Math.cos(ang-facing));
      const d = Math.hypot(e.x-this.player.x, e.y-this.player.y);
      if(Math.abs(diff)<=arc/2 && d<=220){ e.frozen = true; e.freezeT = freeze; }
    }
    this.cooldowns.water = cfg.abilities.waterSpout.cooldownMs;
    this.effects.add(this.player.x, this.player.y, 420, 'water');
  }
  charge(){
    this.player.charging = true;
    this.player.chargeT = cfg.abilities.charge.durationMs;
    this.cooldowns.charge = cfg.abilities.charge.cooldownMs;
  }
  // bg (map)
  const imgBg = this.assets.background;
  if (imgBg) {
    // camera-aware draw; assumes map image size == world size
    this.ctx.drawImage(imgBg, -this.camera.x, -this.camera.y);
  } else {
    // fallback solid color if not present
    this.ctx.fillStyle = '#132031';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
    // enemies
    for(const e of this.enemies){
      const sx = Math.floor(e.x - cam.x), sy = Math.floor(e.y - cam.y);
      if(e.frozen){
        const img=this.assets.icecube;
        ctx.drawImage(img, sx - e.w/2, sy - e.h/2, e.w, e.h);
      }else{
        const img = this.assets[e.type];
        const flip = Math.cos(e.facing) < 0;
        ctx.save(); ctx.translate(sx, sy); if(flip) ctx.scale(-1,1);
        ctx.drawImage(img, -e.w/2, -e.h/2, e.w, e.h);
        ctx.restore();
      }
    }

    // player
    const P=this.player, psx=Math.floor(P.x-cam.x), psy=Math.floor(P.y-cam.y);
    const pFlip = Math.cos(P.facing) < 0;
    ctx.save(); ctx.translate(psx, psy); if(pFlip) ctx.scale(-1,1);
    ctx.drawImage(this.assets.mammoth, -P.w/2, -P.h/2, P.w, P.h);
    ctx.restore();

    // projectiles (draw spear with rotation)
    for(const pr of this.projectiles){
      const sx = pr.x - cam.x, sy = pr.y - cam.y;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(pr.a);
      const img=this.assets.spear;
      ctx.drawImage(img, -pr.w/2, -pr.h/2, pr.w, pr.h);
      ctx.restore();
    }

    // effects last
    this.effects.draw(ctx, cam);
  }
}
