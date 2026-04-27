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
      <div class="game-ui">
        <div class="score-display">Dist: <span id="roller-score">0</span>m</div>
      </div>
      <p>Use ← → keys to move!</p>
      <div id="game-canvas-wrapper"></div>
    `;
    
    const width = 600, height = 400;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 10, 50);

    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    document.getElementById('game-canvas-wrapper').appendChild(renderer.domElement);

    // Floor (Infinite-like tiling)
    const floorGroup = new THREE.Group();
    scene.add(floorGroup);
    const createFloorSeg = (z) => {
      const seg = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 20),
        new THREE.MeshPhongMaterial({ color: 0x1a1a2e, shininess: 100 })
      );
      seg.rotation.x = -Math.PI / 2;
      seg.position.z = z;
      floorGroup.add(seg);
      
      // Grid helper for floor
      const grid = new THREE.GridHelper(10, 10, 0x00f2ff, 0x004444);
      grid.rotation.x = -Math.PI / 2;
      seg.add(grid);
      return seg;
    };

    let floors = [createFloorSeg(0), createFloorSeg(-20), createFloorSeg(-40)];

    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      new THREE.MeshPhongMaterial({ color: 0xff00ff, emissive: 0xff00ff, emissiveIntensity: 0.5 })
    );
    ball.position.y = 0.5;
    scene.add(ball);

    const light = new THREE.PointLight(0xffffff, 1, 100);
    light.position.set(0, 10, 0);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Obstacles
    let obstacles = [];
    const spawnObstacle = (z) => {
      const obs = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1, 1),
        new THREE.MeshPhongMaterial({ color: 0x00f2ff, emissive: 0x00f2ff, emissiveIntensity: 0.5 })
      );
      obs.position.set((Math.random() - 0.5) * 8, 0.5, z);
      scene.add(obs);
      obstacles.push(obs);
    };

    camera.position.set(0, 3, 5);
    
    let keys = {};
    this.addListener(document, 'keydown', e => keys[e.code] = true);
    this.addListener(document, 'keyup', e => keys[e.code] = false);

    this.score = 0;
    let nextObstacleZ = -20;

    const animate = () => {
      this.animId = requestAnimationFrame(animate);
      
      // Controls
      if (keys['ArrowLeft']) ball.position.x -= 0.15;
      if (keys['ArrowRight']) ball.position.x += 0.15;
      ball.position.z -= 0.2; // Constant speed
      ball.rotation.x -= 0.2;

      // Camera follow
      camera.position.z = ball.position.z + 6;
      camera.position.x = ball.position.x * 0.5;
      camera.lookAt(ball.position.x, 0, ball.position.z - 2);
      light.position.set(ball.position.x, 5, ball.position.z);

      // Floor recycling
      floors.forEach(f => {
        if (f.position.z > ball.position.z + 20) {
          f.position.z -= 60;
        }
      });

      // Spawning obstacles
      if (ball.position.z < nextObstacleZ) {
        spawnObstacle(ball.position.z - 30);
        nextObstacleZ -= 15;
      }

      // Collision detection
      obstacles.forEach(o => {
        const dist = ball.position.distanceTo(o.position);
        if (dist < 1) {
          this.gameOver();
        }
      });

      // Out of bounds
      if (Math.abs(ball.position.x) > 5) {
        this.gameOver();
      }

      // Score
      this.score = Math.floor(-ball.position.z);
      document.getElementById('roller-score').innerText = this.score;
      if (this.score > 0 && this.score % 100 === 0) gameManager.addCoin(1);

      renderer.render(scene, camera);
    };
    animate();
  }

  gameOver() {
    cancelAnimationFrame(this.animId);
    alert(`Game Over! Distance: ${this.score}m`);
    gameManager.startGame('roller');
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

/* 7. Omok (오목) */
class OmokGame extends BaseGame {
  init(container) {
    this.size = 15;
    this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
    this.turn = 1; // 1: Black, 2: White
    this.gameOver = false;

    container.innerHTML = `
      <div class="board-game-container">
        <h2>Omok (오목)</h2>
        <div class="game-info">Turn: <span id="omok-turn" class="turn-black">Black</span></div>
        <canvas id="omok-board" class="board" width="450" height="450"></canvas>
      </div>
    `;

    this.canvas = document.getElementById('omok-board');
    this.ctx = this.canvas.getContext('2d');
    this.cellSize = 450 / this.size;

    this.draw();
    this.addListener(this.canvas, 'mousedown', (e) => this.handleClick(e));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 450, 450);

    // Grid
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let i = 0; i < this.size; i++) {
      ctx.beginPath();
      ctx.moveTo(this.cellSize/2, i * this.cellSize + this.cellSize/2);
      ctx.lineTo(450 - this.cellSize/2, i * this.cellSize + this.cellSize/2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i * this.cellSize + this.cellSize/2, this.cellSize/2);
      ctx.lineTo(i * this.cellSize + this.cellSize/2, 450 - this.cellSize/2);
      ctx.stroke();
    }

    // Stones
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] !== 0) {
          ctx.beginPath();
          ctx.arc(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, this.cellSize/2 - 2, 0, Math.PI * 2);
          ctx.fillStyle = this.board[y][x] === 1 ? '#000' : '#fff';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.stroke();
        }
      }
    }
  }

  handleClick(e) {
    if (this.gameOver) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);

    if (x >= 0 && x < this.size && y >= 0 && y < this.size && this.board[y][x] === 0) {
      this.board[y][x] = this.turn;
      if (this.checkWin(x, y)) {
        this.draw();
        alert(`${this.turn === 1 ? 'Black' : 'White'} wins!`);
        gameManager.addCoin(50);
        this.gameOver = true;
      } else {
        this.turn = this.turn === 1 ? 2 : 1;
        const turnEl = document.getElementById('omok-turn');
        turnEl.innerText = this.turn === 1 ? 'Black' : 'White';
        turnEl.className = this.turn === 1 ? 'turn-black' : 'turn-white';
        this.draw();
      }
    }
  }

  checkWin(x, y) {
    const color = this.board[y][x];
    const dirs = [[1,0], [0,1], [1,1], [1,-1]];
    for (let [dx, dy] of dirs) {
      let count = 1;
      for (let i = 1; i < 5; i++) {
        let nx = x + dx * i, ny = y + dy * i;
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size || this.board[ny][nx] !== color) break;
        count++;
      }
      for (let i = 1; i < 5; i++) {
        let nx = x - dx * i, ny = y - dy * i;
        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size || this.board[ny][nx] !== color) break;
        count++;
      }
      if (count >= 5) return true;
    }
    return false;
  }
}

/* 8. Baduk (바둑) - Simplified */
class BadukGame extends BaseGame {
  init(container) {
    this.size = 19;
    this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
    this.turn = 1; // 1: Black, 2: White
    
    container.innerHTML = `
      <div class="board-game-container">
        <h2>Baduk (바둑)</h2>
        <div class="game-info">Turn: <span id="baduk-turn" class="turn-black">Black</span></div>
        <canvas id="baduk-board" class="board" width="500" height="500"></canvas>
        <button class="btn" onclick="gameManager.currentGame.pass()">Pass</button>
      </div>
    `;

    this.canvas = document.getElementById('baduk-board');
    this.ctx = this.canvas.getContext('2d');
    this.cellSize = 500 / this.size;

    this.draw();
    this.addListener(this.canvas, 'mousedown', (e) => this.handleClick(e));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 500, 500);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    for (let i = 0; i < this.size; i++) {
      ctx.beginPath();
      ctx.moveTo(this.cellSize/2, i * this.cellSize + this.cellSize/2);
      ctx.lineTo(500 - this.cellSize/2, i * this.cellSize + this.cellSize/2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i * this.cellSize + this.cellSize/2, this.cellSize/2);
      ctx.lineTo(i * this.cellSize + this.cellSize/2, 500 - this.cellSize/2);
      ctx.stroke();
    }

    // Star points
    const stars = [3, 9, 15];
    ctx.fillStyle = '#333';
    stars.forEach(sy => stars.forEach(sx => {
      ctx.beginPath();
      ctx.arc(sx * this.cellSize + this.cellSize/2, sy * this.cellSize + this.cellSize/2, 3, 0, Math.PI * 2);
      ctx.fill();
    }));

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.board[y][x] !== 0) {
          ctx.beginPath();
          ctx.arc(x * this.cellSize + this.cellSize/2, y * this.cellSize + this.cellSize/2, this.cellSize/2 - 1, 0, Math.PI * 2);
          ctx.fillStyle = this.board[y][x] === 1 ? '#000' : '#fff';
          ctx.fill();
          ctx.strokeStyle = '#333';
          ctx.stroke();
        }
      }
    }
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / this.cellSize);
    const y = Math.floor((e.clientY - rect.top) / this.cellSize);

    if (x >= 0 && x < this.size && y >= 0 && y < this.size && this.board[y][x] === 0) {
      this.board[y][x] = this.turn;
      this.capture(x, y);
      this.turn = this.turn === 1 ? 2 : 1;
      this.updateUI();
      this.draw();
      gameManager.addCoin(2);
    }
  }

  pass() {
    this.turn = this.turn === 1 ? 2 : 1;
    this.updateUI();
  }

  updateUI() {
    const turnEl = document.getElementById('baduk-turn');
    turnEl.innerText = this.turn === 1 ? 'Black' : 'White';
    turnEl.className = this.turn === 1 ? 'turn-black' : 'turn-white';
  }

  capture(x, y) {
    const opponent = this.turn === 1 ? 2 : 1;
    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    dirs.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size && this.board[ny][nx] === opponent) {
        const group = [];
        if (!this.hasLiberty(nx, ny, opponent, group, new Set())) {
          group.forEach(([gx, gy]) => this.board[gy][gx] = 0);
        }
      }
    });
  }

  hasLiberty(x, y, color, group, visited) {
    const key = `${x},${y}`;
    if (visited.has(key)) return false;
    visited.add(key);
    group.push([x, y]);

    const dirs = [[1,0], [-1,0], [0,1], [0,-1]];
    for (let [dx, dy] of dirs) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
        if (this.board[ny][nx] === 0) return true;
        if (this.board[ny][nx] === color) {
          if (this.hasLiberty(nx, ny, color, group, visited)) return true;
        }
      }
    }
    return false;
  }
}

/* 9. Janggi (장기) - Simplified */
class JanggiGame extends BaseGame {
  init(container) {
    this.board = [
      ['R','N','B','S',' ','S','B','N','R'],
      [' ',' ',' ',' ','P',' ',' ',' ',' '],
      [' ','C',' ',' ',' ',' ',' ','C',' '],
      ['P',' ','P',' ','P',' ','P',' ','P'],
      [' ',' ',' ',' ',' ',' ',' ',' ',' '],
      [' ',' ',' ',' ',' ',' ',' ',' ',' '],
      ['p',' ','p',' ','p',' ','p',' ','p'],
      [' ','c',' ',' ',' ',' ',' ','c',' '],
      [' ',' ',' ',' ','p',' ',' ',' ',' '],
      ['r','n','b','s',' ','s','b','n','r']
    ];
    this.turn = 'red'; // red (lowercase), blue (uppercase)
    this.selected = null;

    container.innerHTML = `
      <div class="board-game-container">
        <h2>Janggi (장기)</h2>
        <div class="game-info">Turn: <span id="janggi-turn" style="color:#e94560">Red</span></div>
        <canvas id="janggi-board" class="board" width="400" height="450"></canvas>
      </div>
    `;

    this.canvas = document.getElementById('janggi-board');
    this.ctx = this.canvas.getContext('2d');
    this.draw();
    this.addListener(this.canvas, 'mousedown', (e) => this.handleClick(e));
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, 400, 450);
    const w = 400/8, h = 450/9;

    // Lines
    ctx.strokeStyle = '#333';
    for(let i=0; i<10; i++){
      ctx.beginPath(); ctx.moveTo(0, i*h); ctx.lineTo(400, i*h); ctx.stroke();
    }
    for(let i=0; i<9; i++){
      ctx.beginPath(); ctx.moveTo(i*w, 0); ctx.lineTo(i*w, 450); ctx.stroke();
    }

    // Palaces
    const drawPalace = (ox, oy) => {
      ctx.beginPath(); ctx.moveTo(3*w, oy); ctx.lineTo(5*w, oy+2*h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(5*w, oy); ctx.lineTo(3*w, oy+2*h); ctx.stroke();
    };
    drawPalace(0, 0); drawPalace(0, 7*h);

    // Pieces
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for(let y=0; y<10; y++){
      for(let x=0; x<9; x++){
        const p = this.board[y][x];
        if(p !== ' '){
          ctx.fillStyle = (p === p.toLowerCase()) ? '#e94560' : '#00f2ff';
          ctx.beginPath(); ctx.arc(x*w, y*h, 18, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.fillText(this.getPieceName(p), x*w, y*h);
        }
      }
    }
  }

  getPieceName(p) {
    const names = { 'r':'車', 'n':'馬', 'b':'象', 's':'士', 'p':'卒', 'c':'包', 'k':'楚' };
    return names[p.toLowerCase()] || p;
  }

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const w = 400/8, h = 450/9;
    const x = Math.round((e.clientX - rect.left) / w);
    const y = Math.round((e.clientY - rect.top) / h);

    const p = this.board[y] ? this.board[y][x] : null;
    if(!this.selected) {
      if(p && ((this.turn === 'red' && p === p.toLowerCase()) || (this.turn === 'blue' && p === p.toUpperCase()))) {
        this.selected = {x, y};
      }
    } else {
      this.board[y][x] = this.board[this.selected.y][this.selected.x];
      this.board[this.selected.y][this.selected.x] = ' ';
      this.selected = null;
      this.turn = this.turn === 'red' ? 'blue' : 'red';
      document.getElementById('janggi-turn').innerText = this.turn.toUpperCase();
      document.getElementById('janggi-turn').style.color = this.turn === 'red' ? '#e94560' : '#00f2ff';
      this.draw();
      gameManager.addCoin(5);
    }
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
gameManager.registerGame('omok', { name: 'Omok', icon: '⚪' }, OmokGame);
gameManager.registerGame('baduk', { name: 'Baduk', icon: '⚫' }, BadukGame);
gameManager.registerGame('janggi', { name: 'Janggi', icon: '🏯' }, JanggiGame);
