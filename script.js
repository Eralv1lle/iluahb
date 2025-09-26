/* --------------------- Утилиты --------------------- */
function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

/* --------------------- AOS уже инициализирован в index.html --------------------- */

/* --------------------- Confetti (hero) --------------------- */
(function initConfetti(){
  const cvs = document.getElementById('confetti');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');

  function resize(){
    cvs.width = cvs.clientWidth || window.innerWidth;
    cvs.height = cvs.clientHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // частицы
  const particles = [];
  const PARTICLE_COUNT = 180;
  function rand(min,max){ return Math.random()*(max-min)+min; }

  class P {
    constructor(){
      this.reset();
    }
    reset(){
      this.x = rand(0, cvs.width);
      this.y = rand(-cvs.height, 0);
      this.vx = rand(-0.5,0.5);
      this.vy = rand(1,4);
      this.size = rand(6,12);
      this.color = `hsl(${rand(0,360)}, 80%, 60%)`;
      this.rot = rand(0,Math.PI*2);
      this.rr = rand(0.01,0.05);
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      this.rot += this.rr;
      if (this.y > cvs.height + 20) this.reset();
      if (this.x < -20) this.x = cvs.width + 20;
      if (this.x > cvs.width + 20) this.x = -20;
    }
    draw(){
      ctx.save();
      ctx.translate(this.x,this.y);
      ctx.rotate(this.rot);
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size*0.6);
      ctx.restore();
    }
  }

  for (let i=0;i<PARTICLE_COUNT;i++) particles.push(new P());

  function loop(){
    ctx.clearRect(0,0,cvs.width,cvs.height);
    for (let p of particles){
      p.step();
      p.draw();
    }
    requestAnimationFrame(loop);
  }
  loop();
})();

/* --------------------- Background music toggle --------------------- */
(function musicToggle(){
  const btn = document.getElementById('musicToggle');
  const audio = document.getElementById('bgMusic');
  if (!btn || !audio) return;

  let playing = false;
  btn.addEventListener('click', async ()=>{
    try {
      if (!playing){
        await audio.play();
        btn.textContent = 'Выключить музыку 🔇';
        playing = true;
      } else {
        audio.pause();
        btn.textContent = 'Включить саундтрек 🎧';
        playing = false;
      }
    } catch(e){
      // Автовоспроизведение могла заблокировать — покажем подсказку
      alert('Браузер блокирует автозапуск аудио. Нажмите кнопку ещё раз или разрешите звук.');
    }
  });
})();

/* --------------------- Game: pop balloons --------------------- */
(function game(){
  const canvas = document.getElementById('gameCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let balloons = [];
  let interval = null;
  let score = 0;
  const scoreEl = document.getElementById('score');

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function spawnBalloons(count=12){
    balloons = [];
    for (let i=0;i<count;i++){
      balloons.push({
        x: rand(40, canvas.width-40),
        y: canvas.height + rand(20, 400),
        r: rand(18,36),
        speed: rand(0.8,2.5),
        color: `hsl(${rand(0,360)},80%,60%)`,
        popped:false
      });
    }
  }

  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // sky
    const g = ctx.createLinearGradient(0,0,0,canvas.height);
    g.addColorStop(0,'#b6f0ff'); g.addColorStop(1,'#ffffff');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    for (let b of balloons){
      if (b.popped) continue;
      b.y -= b.speed;
      // string
      ctx.beginPath();
      ctx.moveTo(b.x, b.y + b.r);
      ctx.lineTo(b.x, b.y + b.r + 30);
      ctx.strokeStyle = 'rgba(0,0,0,0.06)';
      ctx.stroke();

      // balloon
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fillStyle = b.color;
      ctx.fill();

      // reflection
      ctx.beginPath();
      ctx.arc(b.x - b.r/3, b.y - b.r/3, b.r/4, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fill();
    }
  }

  function update(){
    draw();
    if (balloons.every(b => b.popped || b.y < -50)) {
      clearInterval(interval);
      // Victory!
      ctx.fillStyle = '#222';
      ctx.font = '30px Comfortaa, sans-serif';
      ctx.fillText('🎉 Победа! Открываем секрет...', 220, 210);
      setTimeout(showSecret, 1000);
    }
  }

  function popAt(x,y){
    for (let b of balloons){
      if (b.popped) continue;
      const d = Math.hypot(x - b.x, y - b.y);
      if (d <= b.r) {
        b.popped = true;
        score += Math.ceil(10 + b.r);
        scoreEl.textContent = 'Счёт: ' + score;
        explodeParticles(b.x, b.y, b.color);
      }
    }
  }

  canvas.addEventListener('click', (e)=>{
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    popAt(x,y);
  });

  // маленькие частицы при взрыве
  function explodeParticles(x,y,color){
    const parts = [];
    for (let i=0;i<16;i++){
      parts.push({
        x,y,
        vx: rand(-2.5,2.5),
        vy: rand(-3.5,-0.5),
        life: rand(30,70),
        color
      });
    }
    let tick = 0;
    function step(){
      tick++;
      ctx.save();
      for (let p of parts){
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        ctx.globalAlpha = Math.max(0, (p.life - tick)/p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 4, 4);
      }
      ctx.restore();
      if (tick < 90) requestAnimationFrame(step);
    }
    step();
  }

  function startGame(){
    score = 0;
    scoreEl.textContent = 'Счёт: 0';
    spawnBalloons(14);
    clearInterval(interval);
    interval = setInterval(update, 30);
  }

  window.startGame = startGame;

  // secret when score high enough
  function showSecret(){
    if (score >= 200) {
      // большая поздравиловка
      alert('🔥 Нереально! Ты набрал много очков — СЮРПРИЗ: Илья — легенда! 🎉');
      // можно открыть gif
      const w = window.open('', '_blank');
      w.document.write('<img src="images/dildo.gif" style="width:100%;max-width:800px;display:block;margin:0 auto;">');
    } else {
      alert('Неплохо! Попробуй ещё раз и получишь секретный подарок 🎁');
    }
  }

})();

/* --------------------- Fireworks (final) --------------------- */
(function fireworksModule(){
  const cvs = document.getElementById('fireworks');
  if (!cvs) return;
  const ctx = cvs.getContext('2d');

  function resize(){
    cvs.width = cvs.clientWidth || window.innerWidth;
    cvs.height = cvs.clientHeight || window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function rand(min,max){ return Math.random()*(max-min)+min; }

  function launch(numBursts=4){
    for (let i=0;i<numBursts;i++){
      setTimeout(()=> createBurst(rand(100,cvs.width-100), rand(80, cvs.height/2), 40 + Math.floor(rand(20,80)) ), i*450);
    }
  }

  function createBurst(x,y,particlesCount=60){
    const particles = [];
    for (let i=0;i<particlesCount;i++){
      const angle = Math.random()*Math.PI*2;
      const speed = rand(1,6);
      particles.push({
        x,y, vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed, life: rand(50,140),
        color: `hsl(${rand(0,360)},90%,60%)`, age:0
      });
    }

    function draw(){
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0,0,cvs.width,cvs.height);
      particles.forEach(p=>{
        p.x += p.vx; p.y += p.vy; p.vy += 0.02; p.age++;
        ctx.globalAlpha = Math.max(0, 1 - p.age / p.life);
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2.6, 0, Math.PI*2);
        ctx.fillStyle = p.color;
        ctx.fill();
      });
      ctx.globalCompositeOperation = 'source-over';
      if (particles.some(p => p.age < p.life)) requestAnimationFrame(draw);
    }
    draw();
  }

  window.launchFireworks = launch;
})();

/* --------------------- Utils: convert HSL color to rgb string for canvas rgba filling (if needed) --------------------- */
/* Note: not used extensively here but kept in case of future color conversion needs */
function hslToRgbString(hsl){
  // input like "hsl(120,80%,60%)" or "hsl(120,80%,60)"
  try {
    const tmp = hsl.replace('hsl(','').replace(')','').replace('%','').split(',');
    let h = parseFloat(tmp[0]), s = parseFloat(tmp[1])/100, l = parseFloat(tmp[2])/100;
    const a = s * Math.min(l, 1-l);
    const f = (n) => {
      const k = (n + h/30) % 12;
      const color = l - a * Math.max(Math.min(k-3,9-k,1), -1);
      return Math.round(255 * color);
    };
    return `${f(0)},${f(8)},${f(4)}`;
  } catch(e){
    return '255,255,255';
  }
}

function playMusic() {
  const music = document.getElementById("birthday-music");
  music.volume = 0.7;
  music.play();
}