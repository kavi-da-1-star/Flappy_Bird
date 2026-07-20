const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const overlayHint = document.getElementById('overlayHint');
const scoreValue = document.getElementById('scoreValue');
const finalScore = document.getElementById('finalScore');
const highScoreValue = document.getElementById('highScoreValue');
const statusMessage = document.getElementById('statusMessage');

const groundHeight = 90;
const pipeWidth = 70;
const pipeGap = 180;
const pipeSpeed = 220;
const gravity = 750;
const flapVelocity = -280;
const birdRadius = 22;
const birdStartX = 140;
const birdStartY = canvas.height / 2;

let bird = {
  x: birdStartX,
  y: birdStartY,
  velocity: 0,
};
let pipes = [];
let score = 0;
let highScore = Number(localStorage.getItem('flappyBirdHighScore') || 0);
let gameOver = true;
let started = false;
let lastTime = 0;
let pipeTimer = 0;
let cloudOffset = 0;
let sunPosition = 0;
let statusTimer = null;

function resetGame() {
  bird = {
    x: birdStartX,
    y: birdStartY,
    velocity: 0,
  };
  pipes = [];
  score = 0;
  pipeTimer = 0;
  updateScore();
  gameOver = false;
  started = true;
  overlay.classList.remove('visible');
  lastTime = 0;
}

function startGame() {
  resetGame();
}

function updateScore() {
  scoreValue.textContent = score;
  finalScore.textContent = score;
  highScoreValue.textContent = highScore;
}

function showStatus(text, duration = 1200) {
  statusMessage.textContent = text;
  statusMessage.classList.add('visible');
  clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    statusMessage.classList.remove('visible');
  }, duration);
}

function flap() {
  if (!started) {
    startGame();
    return;
  }
  if (gameOver) {
    startGame();
    return;
  }
  bird.velocity = flapVelocity;
}

function spawnPipe() {
  const maxTopHeight = canvas.height - groundHeight - pipeGap - 90;
  const topHeight = 80 + Math.random() * Math.max(1, maxTopHeight - 80);
  pipes.push({
    x: canvas.width + 20,
    topHeight,
    gapY: topHeight,
    passed: false,
  });
}

function collidesWithPipe(pipe) {
  const birdBox = {
    x: bird.x - birdRadius * 0.75,
    y: bird.y - birdRadius * 0.8,
    width: birdRadius * 1.5,
    height: birdRadius * 1.6,
  };
  const topRect = {
    x: pipe.x,
    y: 0,
    width: pipeWidth,
    height: pipe.topHeight,
  };
  const bottomRect = {
    x: pipe.x,
    y: pipe.topHeight + pipeGap,
    width: pipeWidth,
    height: canvas.height - groundHeight - (pipe.topHeight + pipeGap),
  };

  return (
    rectsOverlap(birdBox, topRect) || rectsOverlap(birdBox, bottomRect)
  );
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function endGame() {
  if (gameOver) return;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('flappyBirdHighScore', highScore);
  }
  updateScore();
  gameOver = true;
  started = false;
  overlayHint.textContent = 'Press Space or Click to start';
  overlay.classList.add('visible');
}

function update(dt) {
  bird.velocity += gravity * dt;
  bird.y += bird.velocity * dt;

  pipeTimer += dt * 1000;
  if (pipeTimer >= 1400) {
    spawnPipe();
    pipeTimer = 0;
  }

  pipes.forEach((pipe) => {
    pipe.x -= pipeSpeed * dt;
    if (
      !pipe.passed &&
      pipe.x + pipeWidth < bird.x &&
      bird.y > pipe.topHeight &&
      bird.y < pipe.topHeight + pipeGap
    ) {
      pipe.passed = true;
      score += 1;
      updateScore();
    }
  });

  pipes = pipes.filter((pipe) => pipe.x + pipeWidth > -10);

  if (bird.y - birdRadius < 0 || bird.y + birdRadius > canvas.height - groundHeight) {
    endGame();
    return;
  }

  for (const pipe of pipes) {
    if (collidesWithPipe(pipe)) {
      endGame();
      return;
    }
  }
}

function drawBackground(t) {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#8dd7ff');
  gradient.addColorStop(1, '#e8fbff');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.fillStyle = '#ffda70';
  ctx.beginPath();
  ctx.arc(90 + sunPosition, 112, 42, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  const cloudSpeed = 0.02;
  cloudOffset = (cloudOffset + 0.5) % canvas.width;
  drawCloud(80 - cloudOffset * cloudSpeed, 95, 42);
  drawCloud(260 + cloudOffset * 0.3, 140, 34);
  drawCloud(360 - cloudOffset * 0.2, 88, 38);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = '#8de16c';
  ctx.strokeStyle = '#68bc4e';
  ctx.lineWidth = 2;
  for (let i = 0; i < 10; i += 1) {
    const x = (i * 70 + t * 40) % (canvas.width + 80) - 40;
    const y = canvas.height - groundHeight + 18 + (i % 2) * 5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + 10, y - 18, x + 22, y);
    ctx.quadraticCurveTo(x + 38, y + 18, x + 58, y);
    ctx.stroke();
    ctx.fill();
  }
  ctx.restore();

  ctx.fillStyle = '#7acb51';
  ctx.fillRect(0, canvas.height - groundHeight, canvas.width, groundHeight);
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
  ctx.arc(x + size * 0.38, y - size * 0.15, size * 0.42, 0, Math.PI * 2);
  ctx.arc(x + size * 0.72, y + size * 0.12, size * 0.48, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipes() {
  pipes.forEach((pipe) => {
    ctx.save();
    const gradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipeWidth, 0);
    gradient.addColorStop(0, '#41bd5c');
    gradient.addColorStop(0.5, '#2ca446');
    gradient.addColorStop(1, '#1c843b');
    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#0f5b2d';
    ctx.lineWidth = 2;

    ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    ctx.strokeRect(pipe.x, 0, pipeWidth, pipe.topHeight);
    ctx.fillRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height - groundHeight - (pipe.topHeight + pipeGap));
    ctx.strokeRect(pipe.x, pipe.topHeight + pipeGap, pipeWidth, canvas.height - groundHeight - (pipe.topHeight + pipeGap));

    ctx.fillStyle = '#146b30';
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 10, pipeWidth + 8, 10);
    ctx.fillRect(pipe.x - 4, pipe.topHeight + pipeGap, pipeWidth + 8, 10);
    ctx.fillStyle = '#9ce8a2';
    ctx.fillRect(pipe.x + 8, 20, 10, pipe.topHeight - 30);
    ctx.fillRect(pipe.x + 8, pipe.topHeight + pipeGap + 20, 10, canvas.height - groundHeight - pipe.topHeight - pipeGap - 30);
    ctx.fillRect(pipe.x + 30, 16, 10, pipe.topHeight - 24);
    ctx.fillRect(pipe.x + 30, pipe.topHeight + pipeGap + 16, 10, canvas.height - groundHeight - pipe.topHeight - pipeGap - 24);
    ctx.fillRect(pipe.x + 52, 22, 8, pipe.topHeight - 30);
    ctx.fillRect(pipe.x + 52, pipe.topHeight + pipeGap + 22, 8, canvas.height - groundHeight - pipe.topHeight - pipeGap - 30);
    ctx.restore();
  });
}

function drawBird() {
  const wingSwing = Math.sin(performance.now() / 120) * 0.45;
  ctx.save();
  ctx.translate(bird.x, bird.y);

  ctx.fillStyle = '#ff86b0';
  ctx.beginPath();
  ctx.arc(0, 0, birdRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff4d8a';
  ctx.beginPath();
  ctx.arc(-7, 1, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(-8, 4);
  ctx.rotate(wingSwing);
  ctx.fillStyle = '#ff5e95';
  ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(-8, -4);
  ctx.rotate(-wingSwing);
  ctx.fillStyle = '#ff5e95';
  ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ff9f2d';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(32, 6);
  ctx.lineTo(18, 10);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(8, -3, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#101010';
  ctx.beginPath();
  ctx.arc(10, -3, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw() {
  const now = performance.now();
  const time = now / 1000;
  drawBackground(time);
  drawPipes();
  drawBird();
}

function frame(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.03);
  lastTime = timestamp;
  if (started && !gameOver) {
    update(dt);
  }
  draw();
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    flap();
  } else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') {
    event.preventDefault();
    showStatus(`High score: ${highScore}`);
  } else if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
    event.preventDefault();
    startGame();
    showStatus('Game restarted');
  }
});

overlay.addEventListener('click', () => flap());
canvas.addEventListener('click', () => flap());

updateScore();
requestAnimationFrame(frame);
