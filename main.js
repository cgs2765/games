/**
 * Core Game Infrastructure
 */

class GameManager {
  constructor() {
    this.coin = parseInt(localStorage.getItem('games_coin')) || 0;
    this.games = {};
    this.currentGame = null;
    this.menuEl = document.getElementById('menu');
    this.gameContainerEl = document.getElementById('game-container');
    this.gameContentEl = document.getElementById('game-content');
    this.updateCoinUI();
  }

  registerGame(id, config, GameClass) {
    this.games[id] = { config, GameClass };
    this.createMenuCard(id, config);
  }

  createMenuCard(id, config) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="icon">${config.icon}</div>
      <div class="title">${config.name}</div>
    `;
    card.onclick = () => this.startGame(id);
    this.menuEl.appendChild(card);
  }

  startGame(id) {
    if (this.currentGame) this.currentGame.destroy();
    
    const { GameClass } = this.games[id];
    this.currentGame = new GameClass();
    
    this.menuEl.style.display = 'none';
    this.gameContainerEl.style.display = 'block';
    this.gameContentEl.innerHTML = '';
    
    this.currentGame.init(this.gameContentEl);
  }

  backToMenu() {
    if (this.currentGame) {
      this.currentGame.destroy();
      this.currentGame = null;
    }
    this.menuEl.style.display = 'flex';
    this.gameContainerEl.style.display = 'none';
  }

  addCoin(n) {
    this.coin += n;
    localStorage.setItem('games_coin', this.coin);
    this.updateCoinUI();
  }

  updateCoinUI() {
    document.getElementById('coin-val').innerText = this.coin;
  }
}

class BaseGame {
  constructor() {
    this.intervals = [];
    this.listeners = [];
  }

  init(container) {}

  addInterval(fn, ms) {
    const id = setInterval(fn, ms);
    this.intervals.push(id);
    return id;
  }

  addListener(target, type, fn) {
    target.addEventListener(type, fn);
    this.listeners.push({ target, type, fn });
  }

  destroy() {
    this.intervals.forEach(clearInterval);
    this.listeners.forEach(({ target, type, fn }) => target.removeEventListener(type, fn));
  }
}

/**
 * Game Implementations
 */

/* 1. Clicker */
class ClickerGame extends BaseGame {
  init(container) {
    this.score = 0;
    this.power = 1;
    container.innerHTML = `
      <div class="game-ui">
        <h2>Clicker Neo</h2>
        <div class="score-display">Score: <span id="game-score">0</span></div>
        <p>Power: <span id="game-power">1</span></p>
      </div>
      <button class="btn" id="click-btn">CLICK!</button>
      <br><br>
      <button class="btn" id="upgrade-btn">Upgrade (Cost: 10)</button>
    `;

    this.addListener(document.getElementById('click-btn'), 'click', () => {
      this.score += this.power;
      gameManager.addCoin(1);
      this.updateUI();
    });

    this.addListener(document.getElementById('upgrade-btn'), 'click', () => {
      if (this.score >= 10) {
        this.score -= 10;
        this.power++;
        this.updateUI();
      }
    });
  }

  updateUI() {
    document.getElementById('game-score').innerText = this.score;
    document.getElementById('game-power').innerText = this.power;
  }
}

/* 2. Snake Pro */
class SnakeGame extends BaseGame {
  init(container) {
    container.innerHTML = `
      <h2>Snake Pro</h2>
      <div id="game-canvas-wrapper">
        <canvas id="snake-canvas" width="400" height="400"></canvas>
      </div>
    `;
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    
    let snake = [{x: 200, y: 200}], dx = 20, dy = 0;
    let food = {x: 100, y: 100};

    this.addListener(document, 'keydown', e => {
      if (e.key === 'ArrowUp' && dy === 0) { dx = 0; dy = -20; }
      if (e.key === 'ArrowDown' && dy === 0) { dx = 0; dy = 20; }
      if (e.key === 'ArrowLeft' && dx === 0) { dx = -20; dy = 0; }
      if (e.key === 'ArrowRight' && dx === 0) { dx = 20; dy = 0; }
    });

    this.addInterval(() => {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, 400, 400);

      let head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      // Wall collision
      if (head.x < 0 || head.x >= 400 || head.y < 0 || head.y >= 400) {
        this.reset(snake, dx, dy);
        return;
      }

      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        food = {
          x: Math.floor(Math.random() * 20) * 20,
          y: Math.floor(Math.random() * 20) * 20
        };
        gameManager.addCoin(5);
      } else {
        snake.pop();
      }

      ctx.fillStyle = '#00f2ff';
      snake.forEach(s => ctx.fillRect(s.x, s.y, 18, 18));
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(food.x, food.y, 18, 18);
    }, 100);
  }

  reset() {
    alert('Game Over!');
    gameManager.startGame('snake');
  }
}

/* 3. Ball Roller 3D (Three.js) */
class BallRollerGame extends BaseGame {
  init(container) {
    container.innerHTML = `
      <h2>Ball Roller 3D</h2>
      <p>Use Arrow Keys to Roll!</p>
      <div id="game-canvas-wrapper"></div>
    `;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 600 / 400, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 400);
    document.getElementById('game-canvas-wrapper').appendChild(renderer.domElement);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 100),
      new THREE.MeshPhongMaterial({ color: 0x1a1a2e })
    );
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.5 })
    );
    ball.position.y = 0.5;
    scene.add(ball);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    camera.position.set(0, 5, 10);
    camera.lookAt(ball.position);

    let keys = {};
    this.addListener(document, 'keydown', e => keys[e.key] = true);
    this.addListener(document, 'keyup', e => keys[e.key] = false);

    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      
      if (keys['ArrowLeft']) ball.position.x -= 0.1;
      if (keys['ArrowRight']) ball.position.x += 0.1;
      ball.position.z -= 0.15; // Move forward

      camera.position.z = ball.position.z + 10;
      camera.lookAt(ball.position);
      light.position.z = ball.position.z;

      if (Math.abs(ball.position.x) > 10) {
        cancelAnimationFrame(this.animId);
        alert('Fell off!');
        gameManager.startGame('roller');
      }

      if (Math.floor(ball.position.z) % 10 === 0 && keys['ArrowLeft'] !== undefined) {
          // Add coin occasionally logic could go here
      }

      renderer.render(scene, camera);
    };
    animate();
  }

  destroy() {
    super.destroy();
    cancelAnimationFrame(this.animId);
  }
}

/* 4. Shape Smasher */
class ShapeSmasherGame extends BaseGame {
  init(container) {
    container.innerHTML = `
      <h2>Shape Smasher</h2>
      <div class="score-display">Smashed: <span id="smash-score">0</span></div>
      <div id="game-canvas-wrapper">
        <canvas id="smash-canvas" width="600" height="400"></canvas>
      </div>
    `;
    const canvas = document.getElementById('smash-canvas');
    const ctx = canvas.getContext('2d');
    let shapes = [];
    this.score = 0;

    this.addListener(canvas, 'mousedown', e => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      shapes = shapes.filter(s => {
        const dist = Math.hypot(s.x - x, s.y - y);
        if (dist < s.r) {
          this.score++;
          gameManager.addCoin(2);
          document.getElementById('smash-score').innerText = this.score;
          return false;
        }
        return true;
      });
    });

    this.addInterval(() => {
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.fillRect(0,0,600,400);

      if (Math.random() < 0.05) {
        shapes.push({
          x: Math.random() * 600,
          y: -20,
          r: 20 + Math.random() * 20,
          speed: 2 + Math.random() * 3,
          color: `hsl(${Math.random() * 360}, 70%, 60%)`
        });
      }

      shapes.forEach(s => {
        s.y += s.speed;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 15;
        ctx.shadowColor = s.color;
        ctx.fill();
      });

      shapes = shapes.filter(s => s.y < 450);
    }, 1000/60);
  }
}

/* 5. Speed Tiles */
class SpeedTilesGame extends BaseGame {
  init(container) {
    container.innerHTML = `
      <h2>Speed Tiles</h2>
      <div class="score-display">Score: <span id="tile-score">0</span></div>
      <div id="game-canvas-wrapper" style="width:300px; height:400px; display:grid; grid-template-columns: repeat(3, 1fr); gap:10px; padding:10px;">
        ${[0,1,2,3,4,5,6,7,8].map(i => `<div class="tile" id="tile-${i}" style="background:var(--panel-bg); border-radius:10px; cursor:pointer; height:100px;"></div>`).join('')}
      </div>
    `;
    
    this.score = 0;
    const tiles = document.querySelectorAll('.tile');
    let activeTile = -1;

    const nextTile = () => {
      if (activeTile !== -1) tiles[activeTile].style.background = 'var(--panel-bg)';
      activeTile = Math.floor(Math.random() * 9);
      tiles[activeTile].style.background = 'var(--neon-blue)';
      tiles[activeTile].style.boxShadow = '0 0 20px var(--neon-blue)';
    };

    tiles.forEach((tile, i) => {
      this.addListener(tile, 'mousedown', () => {
        if (i === activeTile) {
          this.score++;
          gameManager.addCoin(3);
          document.getElementById('tile-score').innerText = this.score;
          nextTile();
        } else {
          alert('Missed!');
          gameManager.startGame('tiles');
        }
      });
    });

    nextTile();
    this.addInterval(nextTile, 1500); // Tile moves if not clicked
  }
}

/* 6. Stacker (Matter.js) */
class StackerGame extends BaseGame {
  init(container) {
    container.innerHTML = `
      <h2>Stacker</h2>
      <p>Click to drop blocks!</p>
      <div id="game-canvas-wrapper"></div>
    `;
    
    const Engine = Matter.Engine,
          Render = Matter.Render,
          Runner = Matter.Runner,
          Bodies = Matter.Bodies,
          Composite = Matter.Composite;

    const engine = Engine.create();
    const render = Render.create({
      element: document.getElementById('game-canvas-wrapper'),
      engine: engine,
      options: { width: 400, height: 500, wireframes: false, background: '#050505' }
    });

    const ground = Bodies.rectangle(200, 490, 400, 20, { isStatic: true, render: { fillStyle: '#1a1a2e' } });
    Composite.add(engine.world, [ground]);

    this.addListener(document.getElementById('game-canvas-wrapper'), 'mousedown', (e) => {
      const rect = document.getElementById('game-canvas-wrapper').getBoundingClientRect();
      const x = e.clientX - rect.left;
      const box = Bodies.rectangle(x, 50, 40, 40, {
        render: { fillStyle: `hsl(${Math.random() * 360}, 70%, 50%)` }
      });
      Composite.add(engine.world, [box]);
      gameManager.addCoin(2);
    });

    Render.run(render);
    const runner = Runner.create();
    Runner.run(runner, engine);

    this.destroy = () => {
      super.destroy();
      Render.stop(render);
      Runner.stop(runner);
      Engine.clear(engine);
      render.canvas.remove();
      render.textures = {};
    };
  }
}

/**
 * Initialization
 */

const gameManager = new GameManager();

gameManager.registerGame('clicker', { name: 'Clicker Neo', icon: '🖱️' }, ClickerGame);
gameManager.registerGame('snake', { name: 'Snake Pro', icon: '🐍' }, SnakeGame);
gameManager.registerGame('roller', { name: 'Ball Roller 3D', icon: '⚽' }, BallRollerGame);
gameManager.registerGame('smash', { name: 'Shape Smasher', icon: '💥' }, ShapeSmasherGame);
gameManager.registerGame('tiles', { name: 'Speed Tiles', icon: '🎹' }, SpeedTilesGame);
gameManager.registerGame('stack', { name: 'Stacker', icon: '🧱' }, StackerGame);
