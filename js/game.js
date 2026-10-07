import {ROOMS,KHANS,FORGES,WATERS,STAGE_INFO} from './data.js';

const qs=s=>document.querySelector(s);
const TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);

const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d',{alpha:false});
const els={menu:qs('#mainMenu'),hud:qs('#hud'),controls:qs('#mobileControls'),map:qs('#mapPanel'),pause:qs('#pausePanel'),settings:qs('#settingsPanel'),forge:qs('#forgePanel'),dialogue:qs('#dialogue'),cutscene:qs('#cutscene'),toast:qs('#toast')};

let W=1280,H=720,dpr=1,last=0,saveKey='haftkhan-save-v1';
let audioCtx=null;
const state={running:false,paused:false,room:0,frame:0,toastT:0,dialogueT:0,cutsceneStep:0,cutsceneActive:false,settings:{vibration:true,aim:true,effects:true},coins:80,stats:{power:0,mobility:0,armor:0},health:100, maxHealth:100, deaths:0, time:0, worldSeed:927};
const input={left:0,right:0,up:false,attack:false,ranged:false,aimX:0,aimY:-.45};
let touchMove={id:null,x:0,y:0},touchAim={active:false,x:0,y:-.45};

function resize(){dpr=Math.min(window.devicePixelRatio||1,2); W=canvas.clientWidth||innerWidth; H=canvas.clientHeight||innerHeight; canvas.width=Math.floor(W*dpr);canvas.height=Math.floor(H*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
addEventListener('resize',resize);resize();

class Room{
 constructor(i){this.i=i;this.stage=stageFor(i);this.type=typeFor(i);this.kh=KHANS.find(k=>k.index===i)||null;this.enemies=[];this.platforms=[];this.particles=[];this.cleared=false;this.spawn()}
 spawn(){
  const groundY=H*.76;
  this.platforms=[{x:0,y:groundY,w:W*1.2,h:H-groundY+30},{x:W*.2,y:groundY-120,w:W*.18,h:16},{x:W*.48,y:groundY-195,w:W*.2,h:16},{x:W*.73,y:groundY-105,w:W*.18,h:16}];
  if(this.i===0)this.cleared=true;
  if(this.type==='forge'||this.type==='water')this.cleared=true;
  const boss=this.kh?.boss;
  const count=boss?2:2+Math.min(3,Math.floor(this.i/8));
  for(let j=0;j<count;j++)this.enemies.push(new Enemy(W*.28+j*W*.21,groundY-36, boss&&j===count-1?boss:enemyName(this.stage),boss&&j===count-1));
 }
 update(dt){
  if(this.cleared && this.enemies.length===0)return;
  for(const e of this.enemies)e.update(dt,this);
  for(const p of this.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=280*dt}
  this.particles=this.particles.filter(p=>p.life>0);
 }
 draw(){drawBackground(this.stage,this.i);for(const p of this.platforms)drawPlatform(p,this.stage);for(const e of this.enemies)e.draw();this.drawLandmarks();for(const p of this.particles)drawParticle(p)}
 drawLandmarks(){
  if(this.type==='forge'){drawForge(W*.82,H*.55);}
  if(this.type==='water'){drawSpring(W*.82,H*.68)}
  if(this.kh){drawKhanGate(W*.08,H*.76-150,this.kh)}
 }
}

class Enemy{
 constructor(x,y,name,boss=false){this.x=x;this.y=y;this.baseY=y;this.name=name;this.boss=boss;this.hp=boss?180:40;this.maxHp=this.hp;this.r=boss?42:24;this.vx=(Math.random()>.5?1:-1)*(boss?45:28);this.flash=0;this.cool=.4+Math.random();this.dead=false}
 update(dt){
  this.flash=Math.max(0,this.flash-dt);this.cool-=dt;this.x+=this.vx*dt;this.y=this.baseY+Math.sin(state.frame*.002+this.x)*2;
  if(this.x<60||this.x>W-60)this.vx*=-1;
  const px=player.x,py=player.y;
  const dx=px-this.x,dy=py-this.y,dist=Math.hypot(dx,dy);
  if(dist<86 && this.cool<=0){player.hurt(this.boss?12:7);this.cool=1.1+(Math.random()*.7)}
 }
 hit(dmg){this.hp-=dmg;this.flash=.12;spawnBurst(this.x,this.y,this.boss?'#dac17f':'#d08b54',this.boss?12:6);if(this.hp<=0)this.die()}
 die(){this.dead=true;state.coins+=this.boss?50:10;room.cleared=room.cleared||this.boss;save();showToast(this.boss?'نگهبان خان شکست خورد':'سکه +'+fa(this.boss?50:10));}
 draw(){if(this.dead)return;ctx.save();ctx.translate(this.x,this.y);ctx.globalAlpha=this.flash?0.35:1;const r=this.r;
  if(this.boss){ctx.fillStyle='#2a1a23';ctx.beginPath();ctx.arc(0,-8,r,0,TAU);ctx.fill();ctx.fillStyle='#b08862';ctx.beginPath();ctx.arc(0,-18,r*.55,0,TAU);ctx.fill();ctx.fillStyle='#e8d59d';ctx.beginPath();ctx.moveTo(-20,-50);ctx.lineTo(-6,-72);ctx.lineTo(0,-48);ctx.lineTo(16,-74);ctx.lineTo(24,-45);ctx.closePath();ctx.fill();ctx.fillStyle='#d9b96d';ctx.fillRect(-r, -r-18, r*2,5);}
  else{ctx.fillStyle='#2d2a28';ctx.beginPath();ctx.ellipse(0,-12,r*.8,r,0,0,TAU);ctx.fill();ctx.fillStyle='#77705f';ctx.beginPath();ctx.arc(0,-40,r*.65,0,TAU);ctx.fill();}
  if(state.settings.effects){ctx.fillStyle='#f4dfac';ctx.beginPath();ctx.arc(-10,-42,3,0,TAU);ctx.arc(10,-42,3,0,TAU);ctx.fill()}
  ctx.restore();
  if(this.boss){const w=110;ctx.fillStyle='#2a1715';ctx.fillRect(this.x-w/2,this.y-this.r-28,w,6);ctx.fillStyle='#b66a45';ctx.fillRect(this.x-w/2,this.y-this.r-28,w*this.hp/this.maxHp,6)}
 }
}

const world=[];for(let i=0;i<ROOMS;i++)world.push(new Room(i));let room=world[0];
const player={x:W*.16,y:H*.58,vx:0,vy:0,w:32,h:64,onGround:false,attackCd:0,rangeCd:0,invuln:0,alive:true,
 reset(){this.x=W*.16;this.y=H*.58;this.vx=0;this.vy=0;this.onGround=false;this.alive=true;this.invuln=.4},
 update(dt){if(!this.alive)return;this.attackCd=Math.max(0,this.attackCd-dt);this.rangeCd=Math.max(0,this.rangeCd-dt);this.invuln=Math.max(0,this.invuln-dt);
  const ax=(input.right-input.left)*360*(1+state.stats.mobility*.12);this.vx += (ax-this.vx)*Math.min(1,dt*8);this.vx*=input.left||input.right?0.995:0.84;this.x+=this.vx*dt;
  if(input.up&&this.onGround){this.vy=-610*(1+state.stats.mobility*.05);this.onGround=false;input.up=false;haptic(10)}
  this.vy+=1450*dt;this.y+=this.vy*dt;const ground=room.platforms.find(p=>this.x>p.x-10&&this.x<p.x+p.w+10&&this.y+this.h/2>=p.y&&this.y+this.h/2<=p.y+40);
  this.onGround=!!ground;if(ground){this.y=ground.y-this.h/2;this.vy=0}
  this.x=clamp(this.x,24,W-24);
  if(input.attack&&this.attackCd<=0)this.melee();
  if(input.ranged&&this.rangeCd<=0){this.range();input.ranged=false}
  if(this.y>H+90){this.respawn()}
 },
 melee(){this.attackCd=.38;spawnBurst(this.x+28*(this.vx>=0?1:-1),this.y,'#e4c077',5);const dir=this.vx>=0?1:-1;for(const e of room.enemies){if(e.dead)continue;const dx=e.x-this.x;if(Math.abs(dx)<82&&dx*dir>-10&&Math.abs(e.y-this.y)<70)e.hit(20+state.stats.power*8)}},
 range(){this.rangeCd=.55;const dx=touchAim.x,dy=touchAim.y,len=Math.hypot(dx,dy)||1;const vx=dx/len,vy=dy/len;for(let i=0;i<16;i++){const px=this.x+vx*i*34,py=this.y-15+vy*i*34;spawnBurst(px,py,'#8bc4d4',2)}for(const e of room.enemies){if(e.dead)continue;const ex=e.x-this.x,ey=e.y-(this.y-15);const proj=ex*vx+ey*vy;const perp=Math.abs(ex*vy-ey*vx);if(proj>0&&proj<520&&perp<28)e.hit(27+state.stats.power*9)}},
 hurt(d){if(this.invuln>0)return;this.invuln=.6;state.health-=Math.max(1,d-state.stats.armor*3);haptic(18);if(state.health<=0)this.respawn()},
 respawn(){state.deaths++;state.health=state.maxHealth;player.reset();showToast('رستم به آخرین نشان راه بازگشت');save()}
};

function stageFor(i){let k=KHANS.filter(x=>x.index<=i).at(-1);return k?k.stage:(i<4?'grass':i<10?'grass':i<16?'desert':i<22?'cave':i<29?'garden':i<35?'night':i<42?'mountain':'fortress')}
function typeFor(i){if(FORGES.includes(i))return'forge';if(WATERS.includes(i))return'water';if(KHANS.some(k=>k.index===i))return'boss';return'normal'}
function enemyName(stage){return stage==='desert'?'گرگ بیابان':stage==='cave'?'دیو غار':stage==='night'?'سایه دیو':stage==='mountain'?'نگهبان کوه':'دشمن راه'}

function enterRoom(i){if(i<0||i>=ROOMS)return;state.room=i;room=world[i];player.reset();room.cleared=room.cleared||room.enemies.every(e=>e.dead);state.frame=0;renderMap();updateHud();save();
 const k=room.kh;if(k){showDialogue(k.title,k.text,3.5);}
 else if(room.type==='forge'){showToast('آهنگری در این ناحیه فعال است');setTimeout(()=>open('forgePanel'),450)}
 else if(room.type==='water'){state.health=state.maxHealth;showToast('چشمه، توان رستم را بازگرداند');}
}

function nextRoom(){if(room.enemies.some(e=>!e.dead)){showToast('راه هنوز بسته است');return}if(state.room<ROOMS-1)enterRoom(state.room+1);else startFinalCutscene()}
function prevRoom(){if(state.room>0)enterRoom(state.room-1)}

function drawBackground(stage,i){const s=STAGE_INFO[stage]||STAGE_INFO.grass;const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,s.sky1);grd.addColorStop(1,s.sky2);ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#f3d58d22';ctx.beginPath();ctx.arc(W*.72,H*.2,Math.min(W,H)*.11,0,TAU);ctx.fill();
 ctx.fillStyle=s.ground;ctx.fillRect(0,H*.76,W,H*.24);
 // distant Persian-inspired silhouettes
 ctx.globalAlpha=.22;ctx.fillStyle='#0b0d0d';for(let x=0;x<W;x+=90){let h=40+Math.abs(Math.sin((x+i)*.03))*110;ctx.beginPath();ctx.moveTo(x,H*.76);ctx.lineTo(x+45,H*.76-h);ctx.lineTo(x+90,H*.76);ctx.closePath();ctx.fill()}ctx.globalAlpha=1;
 if(stage==='desert'){ctx.fillStyle='#efcf8f18';for(let x=0;x<W;x+=140){ctx.beginPath();ctx.ellipse(x+50,H*.66,80,18,0,0,TAU);ctx.fill()}}
 if(stage==='cave'){ctx.fillStyle='#00000055';ctx.fillRect(0,0,W,H*.18);for(let x=20;x<W;x+=90){ctx.fillStyle='#00000066';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x+28,80+Math.sin(x)*20);ctx.lineTo(x+62,0);ctx.fill()}}
 if(stage==='night'){ctx.fillStyle='#d9c88f28';for(let x=40;x<W;x+=70){ctx.beginPath();ctx.arc(x,90+(x%3)*15,1.5,0,TAU);ctx.fill()}}
}
function drawPlatform(p,stage){ctx.fillStyle=stage==='desert'?'#987148':'#403c32';ctx.fillRect(p.x,p.y,p.w,p.h);ctx.fillStyle='#c5a77045';ctx.fillRect(p.x,p.y,p.w,4);ctx.fillStyle='#15120f88';ctx.fillRect(p.x,p.y+8,p.w,p.h-8)}
function drawRostam(){ctx.save();ctx.translate(player.x,player.y);ctx.globalAlpha=player.invuln?0.55:1;ctx.fillStyle='#2b2019';ctx.beginPath();ctx.ellipse(0,8,22,31,0,0,TAU);ctx.fill();ctx.fillStyle='#b47b52';ctx.beginPath();ctx.arc(0,-35,15,0,TAU);ctx.fill();ctx.strokeStyle='#d8b56f';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-35,17,Math.PI*1.05,Math.PI*1.95);ctx.stroke();ctx.fillStyle='#355040';ctx.fillRect(-17,-7,34,24);ctx.fillStyle='#e6d39d';ctx.fillRect(5,-45,5,4);ctx.restore();
 if(state.settings.aim&&input.ranged){const dx=touchAim.x,dy=touchAim.y,len=clamp(Math.hypot(dx,dy),.1,1),ux=dx/len,uy=dy/len;ctx.save();ctx.strokeStyle='#bfe4e5a8';ctx.lineWidth=2;ctx.setLineDash([8,10]);ctx.beginPath();ctx.moveTo(player.x,player.y-15);ctx.lineTo(player.x+ux*300,player.y-15+uy*300);ctx.stroke();ctx.restore()}
}
function drawSpring(x,y){ctx.save();ctx.translate(x,y);ctx.fillStyle='#5da5bfaa';ctx.beginPath();ctx.ellipse(0,12,62,22,0,0,TAU);ctx.fill();ctx.fillStyle='#d1e6df';ctx.beginPath();ctx.arc(0,-8,24,0,TAU);ctx.fill();ctx.strokeStyle='#a9dae4';ctx.lineWidth=3;ctx.stroke();ctx.restore()}
function drawForge(x,y){ctx.save();ctx.translate(x,y);ctx.fillStyle='#4a3022';ctx.fillRect(-44,-40,88,70);ctx.fillStyle='#a56d3e';ctx.fillRect(-22,-64,44,24);ctx.fillStyle='#e1bd71';ctx.beginPath();ctx.arc(0,-58,9,0,TAU);ctx.fill();ctx.fillStyle='#c3a871';ctx.font='12px Tahoma';ctx.textAlign='center';ctx.fillText('آهنگری',0,55);ctx.restore()}
function drawKhanGate(x,y,k){ctx.save();ctx.translate(x,y);ctx.strokeStyle='#d7b76b77';ctx.lineWidth=5;ctx.beginPath();ctx.arc(0,0,42,Math.PI,TAU);ctx.stroke();ctx.fillStyle='#e4c57b';ctx.font='bold 18px serif';ctx.textAlign='center';ctx.fillText(fa(k.n),0,-53);ctx.restore()}
function spawnBurst(x,y,color,n=5){for(let i=0;i<n;i++){room.particles.push({x,y,vx:(Math.random()*2-1)*100,vy:(Math.random()*2-1)*130,life:.35+.4*Math.random(),color})}}
function drawParticle(p){ctx.fillStyle=p.color;ctx.globalAlpha=Math.max(0,p.life*1.8);ctx.fillRect(p.x,p.y,4,4);ctx.globalAlpha=1}

function loop(ts){const dt=Math.min(.032,(ts-last||16)/1000);last=ts;state.frame++;if(state.running&&!state.paused&&!state.cutsceneActive){state.time+=dt;player.update(dt);room.update(dt);cleanEnemies();checkDoors();updateHud();}draw();requestAnimationFrame(loop)}
function cleanEnemies(){room.enemies=room.enemies.filter(e=>!e.dead);}
function checkDoors(){if(room.enemies.length===0&&state.room<ROOMS-1&&player.x>W-54&&player.y>H*.55)nextRoom(); if(state.room>0&&room.enemies.length===0&&player.x<54&&player.y>H*.55)prevRoom()}
function draw(){ctx.clearRect(0,0,W,H);if(state.running&&!state.cutsceneActive){room.draw();drawRostam();}}

function updateHud(){qs('#khanLabel').textContent=room.kh?room.kh.title:(room.type==='forge'?'آهنگری':room.type==='water'?'چشمه':'راه مازندران');qs('#roomLabel').textContent=fa(state.room+1)+'/'+fa(ROOMS);qs('#healthFill').style.width=clamp(state.health/state.maxHealth*100,0,100)+'%';qs('#coinLabel').textContent=fa(state.coins);}
function renderMap(){const g=qs('#mapGrid');g.innerHTML='';for(let i=0;i<ROOMS;i++){const d=document.createElement('div');d.className='map-cell '+(i<=state.room?'revealed ':'')+(i===state.room?'current ':'');if(KHANS.some(k=>k.index===i))d.classList.add('khan');if(FORGES.includes(i))d.classList.add('forge');if(WATERS.includes(i))d.classList.add('water');if(i===47)d.classList.add('boss');d.textContent=i===0?'آغاز':KHANS.find(k=>k.index===i)?.n?`خان ${fa(KHANS.find(k=>k.index===i).n)}`:'';g.appendChild(d)}}

function showToast(msg){const t=qs('#toast');t.textContent=msg;t.classList.remove('hidden');clearTimeout(showToast.t);showToast.t=setTimeout(()=>t.classList.add('hidden'),1800)}
function showDialogue(name,text,seconds=3){qs('#dialogueName').textContent=name;qs('#dialogueText').textContent=text;els.dialogue.classList.remove('hidden');clearTimeout(showDialogue.t);showDialogue.t=setTimeout(()=>els.dialogue.classList.add('hidden'),seconds*1000)}
function open(id){els[id].classList.remove('hidden');state.paused=true}
function close(id){els[id].classList.add('hidden');state.paused=false}

function startGame(){load();room=world[state.room]||world[0];player.reset();state.running=true;state.paused=false;state.cutsceneActive=false;els.menu.classList.add('hidden');els.hud.classList.remove('hidden');els.controls.classList.remove('hidden');els.cutscene.classList.add('hidden');renderMap();updateHud();if(state.room===0)showDialogue('روایت','کیکاووس و یارانش در مازندران گرفتارند. رستم راه نجات را در پیش می‌گیرد.',4)}
function save(){localStorage.setItem(saveKey,JSON.stringify({room:state.room,coins:state.coins,stats:state.stats,health:state.health,deaths:state.deaths,settings:state.settings}))}
function load(){try{const s=JSON.parse(localStorage.getItem(saveKey)||'null');if(s){Object.assign(state,s);Object.assign(state.settings,s.settings||{})}}catch(e){}}
function startFinalCutscene(){state.cutsceneActive=true;state.cutsceneStep=0;els.controls.classList.add('hidden');els.hud.classList.add('hidden');els.cutscene.classList.remove('hidden');advanceCutscene()}
const cutscenes=[
 ['دیو سپید افتاد','کاووس و یارانش از بند رها می‌شوند؛ اما سفر رستم هنوز پایان نیافته است.'],
 ['پس از هفت‌خان','پهلوان از دل نبردهای بسیار بازمی‌گردد. نام او در آوازها می‌ماند.'],
 ['نیرنگ شغاد','سال‌ها بعد، در جشنی دیگر، نیرنگی پنهان در راه رستم کار گذاشته می‌شود. تصویر فقط سایه‌ها و دهانه‌ی چاه را نشان می‌دهد.'],
 ['فرجام تهمتن','رخش و رستم ناپدید می‌شوند و پرده در سکوت فرو می‌رود. مرگ پهلوان بدون نمایش خشن روایت می‌شود؛ تنها نام او و یادش باقی می‌ماند.'],
];
function advanceCutscene(){const item=cutscenes[state.cutsceneStep];if(!item){els.cutscene.classList.add('hidden');state.cutsceneActive=false;state.running=false;localStorage.removeItem(saveKey);els.menu.classList.remove('hidden');qs('#continueBtn').disabled=true;showToast('پایان سفر');return}qs('#cutsceneTitle').textContent=item[0];qs('#cutsceneText').textContent=item[1] ; qs('#cutsceneNext').textContent=state.cutsceneStep===cutscenes.length-1?'بازگشت به منو':'ادامه';state.cutsceneStep++}

function haptic(ms){if(state.settings.vibration&&navigator.vibrate)navigator.vibrate(ms)}
function beep(freq=220,d=0.06){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=freq;g.gain.value=.025;o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch(e){}}

// UI
qs('#startBtn').onclick=()=>{localStorage.removeItem(saveKey);Object.assign(state,{room:0,coins:80,health:100,deaths:0,stats:{power:0,mobility:0,armor:0}});startGame()};
qs('#continueBtn').onclick=()=>{load();startGame()};
qs('#settingsBtn').onclick=()=>open('settingsPanel');
qs('#menuBtn').onclick=()=>open('pausePanel');
qs('#resumeBtn').onclick=()=>close('pausePanel');
qs('#pauseMapBtn').onclick=()=>{close('pausePanel');open('mapPanel')};
qs('#pauseSettingsBtn').onclick=()=>{close('pausePanel');open('settingsPanel')};
qs('#saveQuitBtn').onclick=()=>{save();location.reload()};
qs('#cutsceneNext').onclick=advanceCutscene;
for(const b of document.querySelectorAll('[data-close]'))b.onclick=()=>close(b.dataset.close);
qs('#vibrationToggle').onchange=e=>{state.settings.vibration=e.target.checked;save()};
qs('#aimToggle').onchange=e=>{state.settings.aim=e.target.checked;save()};
qs('#effectsToggle').onchange=e=>{state.settings.effects=e.target.checked;save()};
qs('#resetBtn').onclick=()=>{localStorage.removeItem(saveKey);location.reload()};
for(const b of document.querySelectorAll('.upgrade'))b.onclick=()=>{const type=b.dataset.upgrade;const costs={power:40,mobility:50,armor:45};const cost=costs[type]*(state.stats[type]+1);if(state.coins<cost){showToast('سکه کافی نیست');return}state.coins-=cost;state.stats[type]++;beep(360,.08);showToast('ارتقا انجام شد');updateHud();save()};

// keyboard/gamepad fallback for desktop testing
addEventListener('keydown',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')input.left=1;if(e.code==='ArrowRight'||e.code==='KeyD')input.right=1;if(e.code==='Space'||e.code==='ArrowUp')input.up=true;if(e.code==='KeyJ')input.attack=true;if(e.code==='KeyK')input.ranged=true;if(e.code==='Escape')state.paused=!state.paused});
addEventListener('keyup',e=>{if(e.code==='ArrowLeft'||e.code==='KeyA')input.left=0;if(e.code==='ArrowRight'||e.code==='KeyD')input.right=0;if(e.code==='KeyJ')input.attack=false});

// virtual joystick
const joy=qs('#joystick'),stick=joy.querySelector('.stick');
function joyMove(x,y){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=x-cx,dy=y-cy;const m=Math.hypot(dx,dy),max=r.width*.33;if(m>max){dx*=max/m;dy*=max/m}stick.style.transform=`translate(${dx}px,${dy}px)`;input.left=dx<-10?1:0;input.right=dx>10?1:0;if(Math.abs(dx)>8){touchAim.x=dx/max;touchAim.y=dy/max}}
joy.addEventListener('pointerdown',e=>{joy.setPointerCapture(e.pointerId);touchMove.id=e.pointerId;joyMove(e.clientX,e.clientY)});joy.addEventListener('pointermove',e=>{if(touchMove.id===e.pointerId)joyMove(e.clientX,e.clientY)});joy.addEventListener('pointerup',e=>{if(touchMove.id===e.pointerId){touchMove.id=null;stick.style.transform='translate(0,0)';input.left=input.right=0}});joy.addEventListener('pointercancel',()=>{touchMove.id=null;stick.style.transform='translate(0,0)';input.left=input.right=0});
function bindHold(id,key){const b=qs(id);b.addEventListener('pointerdown',e=>{b.setPointerCapture(e.pointerId);input[key]=true});b.addEventListener('pointerup',()=>input[key]=false);b.addEventListener('pointercancel',()=>input[key]=false);}
bindHold('#attackBtn','attack');bindHold('#jumpBtn','up');
const rb=qs('#rangedBtn');rb.addEventListener('pointerdown',e=>{rb.setPointerCapture(e.pointerId);input.ranged=true;touchAim.x=1;touchAim.y=-.1});rb.addEventListener('pointermove',e=>{if(input.ranged){const r=rb.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);touchAim.x=dx/80;touchAim.y=dy/80}});rb.addEventListener('pointerup',()=>{input.ranged=false});rb.addEventListener('pointercancel',()=>input.ranged=false);

// Mouse aim for desktop
canvas.addEventListener('pointermove',e=>{if(input.ranged){touchAim.x=(e.clientX-player.x)/260;touchAim.y=(e.clientY-(player.y-15))/260}});

// Forge interaction when close to landmark
addEventListener('pointerdown',()=>{if(state.running&&!state.paused&&room.type==='forge'&&player.x>W*.66){open('forgePanel')}});

renderMap();load();
qs('#continueBtn').disabled=!localStorage.getItem(saveKey);if(localStorage.getItem(saveKey)){qs('#continueBtn').style.opacity='1'}else{qs('#continueBtn').style.opacity='.45'}
requestAnimationFrame(loop);
