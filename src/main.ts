import { Game } from './game';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const loading = document.getElementById('loading') as HTMLDivElement;

if (!canvas) throw new Error('Canvas element not found');
const game = new Game(canvas);

// Hide loading screen
requestAnimationFrame(() => {
  loading.classList.add('hidden');
  setTimeout(() => loading.remove(), 300);
});

// Game loop
let lastTime = 0;

function frame(time: number) {
  const dt = Math.min((time - lastTime) / 1000, 0.05); // Cap delta to prevent spiral
  lastTime = time;

  game.update(dt);
  game.render();

  requestAnimationFrame(frame);
}

requestAnimationFrame((time) => {
  lastTime = time;
  requestAnimationFrame(frame);
});

