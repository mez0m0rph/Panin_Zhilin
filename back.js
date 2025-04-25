// back.js

///////////////////////////////////////
// UI: переключение интерфейсов
///////////////////////////////////////
const AlgorithmUI = {
  switchAlgorithm(id) {
    document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
    document.getElementById(id)?.classList.add('show');
  }
};
document.querySelectorAll('.algo-btn').forEach(btn =>
  btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo))
);

//////////////////////////////////
// A* Алгоритм
//////////////////////////////////
class AStar {
  constructor() {
    this.sizeInput = document.getElementById('gridSizeInput');
    this.generateBtn = document.getElementById('generateGridButton');
    this.findBtn = document.getElementById('findPathButton');
    this.container = document.getElementById('gridDisplay');

    this.grid = [];
    this.start = null;
    this.end = null;

    this.generateBtn.addEventListener('click', () => this.createGrid());
    this.findBtn.addEventListener('click', () => this.findPath());
  }

  createGrid() {
    const n = +this.sizeInput.value;
    if (n < 3) { alert('Размер N ≥ 3'); return; }
    this.grid = []; this.start = this.end = null;
    this.container.innerHTML = '';
    this.container.style.gridTemplateColumns = `repeat(${n},40px)`;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const el = document.createElement('div');
        el.className = 'grid-cell';
        el.addEventListener('click', () => this.onCellClick(r, c, el));
        this.container.append(el);
        this.grid.push({ r, c, type: 'empty', elem: el });
      }
    }
  }

  onCellClick(r, c, el) {
    const cell = this.grid.find(x => x.r === r && x.c === c);
    if (!this.start) { cell.type = 'start'; this.start = cell; el.style.background = '#2ecc71'; }
    else if (!this.end && cell.type === 'empty') { cell.type = 'end'; this.end = cell; el.style.background = '#e74c3c'; }
    else if (cell.type === 'empty') { cell.type = 'obstacle'; el.style.background = '#2c3e50'; }
    else if (cell.type === 'obstacle') { cell.type = 'empty'; el.style.background = 'lightgray'; }
  }

  heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }

  findPath() {
    if (!this.start || !this.end) { alert('Установите старт/финиш'); return; }

    const open = [this.start];
    const cameFrom = new Map();
    const gScore = new Map(), fScore = new Map();
    this.grid.forEach(c => { gScore.set(c, Infinity); fScore.set(c, Infinity); });
    gScore.set(this.start, 0);
    fScore.set(this.start, this.heuristic(this.start, this.end));

    while (open.length) {
      const current = open.reduce((a, b) => fScore.get(a) < fScore.get(b) ? a : b);
      if (current === this.end) { this.reconstruct(cameFrom, current); return; }
      open.splice(open.indexOf(current), 1);

      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr,dc]) => {
        const nr = current.r + dr, nc = current.c + dc;
        const neighbor = this.grid.find(x => x.r === nr && x.c === nc);
        if (!neighbor || neighbor.type === 'obstacle') return;

        const tentativeG = gScore.get(current) + 1;
        if (tentativeG < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.heuristic(neighbor, this.end));
          if (!open.includes(neighbor)) open.push(neighbor);
        }
      });
    }

    alert('Путь не найден');
  }

  reconstruct(cameFrom, current) {
    while (cameFrom.has(current)) {
      if (current !== this.end) current.elem.style.background = '#f1c40f';
      current = cameFrom.get(current);
    }
  }
}

//////////////////////////////////
// K-Means Кластеризация
//////////////////////////////////
class KMeans {
  constructor() {
    this.canvas = document.getElementById('kmeansCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.countInput = document.getElementById('kmeansPointCount');
    this.kInput = document.getElementById('kmeansK');
    this.genBtn = document.getElementById('kmeansGenerateBtn');
    this.runBtn = document.getElementById('kmeansRunBtn');

    this.points = [];
    this.centroids = [];

    this.genBtn.addEventListener('click', () => this.generatePoints());
    this.runBtn.addEventListener('click', () => this.cluster());
  }

  generatePoints() {
    const n = +this.countInput.value;
    if (n < 1) { alert('≥1 точка'); return; }
    this.points = Array.from({ length: n }, () => [
      Math.random() * this.canvas.width,
      Math.random() * this.canvas.height,
      null
    ]);
    this.drawPoints();
  }

  drawPoints() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(p => {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
    });
  }

  cluster() {
    const K = +this.kInput.value;
    if (K < 1 || this.points.length < K) { alert('Неверный K/точек'); return; }

    this.centroids = this.points.slice(0, K).map(p => [p[0], p[1]]);
    let changed = true;

    while (changed) {
      changed = false;
      this.points.forEach(p => {
        const dists = this.centroids.map(c =>
          Math.hypot(p[0] - c[0], p[1] - c[1])
        );
        p[2] = dists.indexOf(Math.min(...dists));
      });
      for (let i = 0; i < K; i++) {
        const grp = this.points.filter(p => p[2] === i);
        if (!grp.length) continue;
        const avgX = grp.reduce((s, p) => s + p[0], 0) / grp.length;
        const avgY = grp.reduce((s, p) => s + p[1], 0) / grp.length;
        if (avgX !== this.centroids[i][0] || avgY !== this.centroids[i][1]) {
          changed = true;
          this.centroids[i] = [avgX, avgY];
        }
      }
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(p => {
      const hue = (p[2] * 360) / this.centroids.length;
      this.ctx.fillStyle = `hsl(${hue},70%,50%)`;
      this.ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
    });
    this.centroids.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c[0], c[1], 8, 0, 2 * Math.PI);
      this.ctx.strokeStyle = '#000';
      this.ctx.stroke();
    });
  }
}

//////////////////////////////////
// Генетический TSP
//////////////////////////////////
class GeneticTSP {
  constructor() {
    this.canvas = document.getElementById('geneticCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.runBtn = document.getElementById('runGeneticBtn');
    this.resetBtn = document.getElementById('resetGeneticBtn');
    this.output = document.getElementById('bestDistanceDisplay');

    this.cities = [];
    this.bestRoute = null;

    this.canvas.addEventListener('click', e => this.addCity(e));
    this.runBtn.addEventListener('click', () => this.runGA());
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  addCity(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.cities.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    this.drawCities();
  }

  drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cities.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'blue';
      this.ctx.fill();
    });
  }

  reset() {
    this.cities = [];
    this.bestRoute = null;
    this.output.textContent = '';
    this.drawCities();
  }

  runGA() {
    const n = this.cities.length;
    if (n < 2) { alert('Добавьте ≥2 города'); return; }

    const popSize = 50;     // уменьшил для скорости
    const generations = 100;

    // 1. Инициализация популяции
    let population = [];
    for (let i = 0; i < popSize; i++) {
      population.push(this._shuffle([...Array(n).keys()]));
    }

    let bestDist = Infinity;

    // 2. Эволюция
    for (let gen = 0; gen < generations; gen++) {
      // Оценка
      const scored = population.map(route => ({
        route,
        dist: this._routeLength(route)
      })).sort((a, b) => a.dist - b.dist);

      // Сохраняем лучший, замыкая цикл
      if (scored[0].dist < bestDist) {
        bestDist = scored[0].dist;
        this.bestRoute = [...scored[0].route, scored[0].route[0]];
      }

      // Отбор топ-20%
      const retain = Math.floor(popSize * 0.2);
      let newPop = scored.slice(0, retain).map(o => o.route);

      // Кроссовер + мутация
      while (newPop.length < popSize) {
        const a = this._tournamentSelect(scored);
        const b = this._tournamentSelect(scored);
        let child = this._crossover(a, b);
        if (Math.random() < 0.1) child = this._mutate(child);
        newPop.push(child);
      }

      population = newPop;
    }

    // 3. Рисуем точки и лучшую линию
    this.drawCities();
    if (this.bestRoute) {
      this.ctx.beginPath();
      const start = this.cities[this.bestRoute[0]];
      this.ctx.moveTo(start.x, start.y);
      this.bestRoute.forEach(idx => {
        const c = this.cities[idx];
        this.ctx.lineTo(c.x, c.y);
      });
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    this.output.textContent = `Длина: ${bestDist.toFixed(2)}`;
  }

  _shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  _tournamentSelect(scored) {
    const cutoff = Math.floor(scored.length * 0.2);
    return scored[Math.floor(Math.random() * cutoff)].route;
  }

  _crossover(a, b) {
    const len = a.length;
    const i = Math.floor(Math.random() * len);
    const j = Math.floor(Math.random() * len);
    const [s, e] = i < j ? [i, j] : [j, i];
    const seg = a.slice(s, e);
    return [...seg, ...b.filter(x => !seg.includes(x))];
  }

  _mutate(r) {
    const i = Math.floor(Math.random() * r.length);
    const j = Math.floor(Math.random() * r.length);
    [r[i], r[j]] = [r[j], r[i]];
    return r;
  }

  _routeLength(route) {
    let sum = 0;
    for (let i = 0; i < route.length; i++) {
      const a = this.cities[route[i]];
      const b = this.cities[route[(i + 1) % route.length]];
      sum += Math.hypot(a.x - b.x, a.y - b.y);
    }
    return sum;
  }
}

//////////////////////////////////
// Ant Colony Optimization (TSP)
//////////////////////////////////
class AntColony {
  constructor() {
    this.canvas = document.getElementById('antCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.countInput = document.getElementById('antCityCount');
    this.antCountInput = document.getElementById('antCount');
    this.alphaInput = document.getElementById('antAlpha');
    this.betaInput = document.getElementById('antBeta');
    this.rhoInput = document.getElementById('antRho');
    this.iterInput = document.getElementById('antIterations');
    this.genBtn = document.getElementById('antGenerateBtn');
    this.runBtn = document.getElementById('antRunBtn');

    this.cities = [];
    this.distances = [];
    this.pheromone = [];
    this.bestTour = null;
    this.bestLen = Infinity;

    this.genBtn.addEventListener('click', () => this.generateCities());
    this.runBtn.addEventListener('click', () => this.runACO());
  }

  generateCities() {
    const n = +this.countInput.value;
    if (n < 2) { alert('≥2 города'); return; }
    this.cities = Array.from({ length: n }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height
    }));
    this.drawCities();
  }

  drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cities.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'blue';
      this.ctx.fill();
    });
  }

  runACO() {
    const n = this.cities.length;
    if (n < 2) return;

    const ants = +this.antCountInput.value;
    const alpha = +this.alphaInput.value;
    const beta = +this.betaInput.value;
    const rho = +this.rhoInput.value;
    const iterations = +this.iterInput.value;

    // матрицы
    this.distances = Array.from({ length: n }, () => Array(n).fill(0));
    this.pheromone = Array.from({ length: n }, () => Array(n).fill(1));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) this.distances[i][j] = Infinity;
        else {
          const dx = this.cities[i].x - this.cities[j].x;
          const dy = this.cities[i].y - this.cities[j].y;
          this.distances[i][j] = Math.hypot(dx, dy);
        }
      }
    }

    this.bestLen = Infinity;

    for (let it = 0; it < iterations; it++) {
      const tours = [];

      // для каждого муравья
      for (let k = 0; k < ants; k++) {
        const tour = [0];
        const visited = new Set([0]);
        while (tour.length < n) {
          const i = tour[tour.length - 1];
          const probs = this.cities.map((_, j) => {
            if (visited.has(j)) return 0;
            return Math.pow(this.pheromone[i][j], alpha) *
                   Math.pow(1 / this.distances[i][j], beta);
          });
          const sum = probs.reduce((s, v) => s + v, 0);
          let r = Math.random() * sum;
          let next = 0;
          for (let idx = 0; idx < n; idx++) {
            r -= probs[idx];
            if (r <= 0) { next = idx; break; }
          }
          tour.push(next);
          visited.add(next);
        }
        tours.push(tour);

        const len = this.tourLength(tour);
        if (len < this.bestLen) {
          this.bestLen = len;
          this.bestTour = [...tour, tour[0]];
        }
      }

      // испарение
      for (let i = 0; i < n; i++)
        for (let j = 0; j < n; j++)
          this.pheromone[i][j] *= (1 - rho);

      // осаждение
      tours.forEach(tour => {
        const len = this.tourLength(tour);
        tour.forEach((u, idx) => {
          const v = tour[(idx + 1) % tour.length];
          this.pheromone[u][v] += 1 / len;
          this.pheromone[v][u] += 1 / len;
        });
      });
    }

    // финальная отрисовка
    this.drawCities();
    if (this.bestTour) {
      this.ctx.beginPath();
      const st = this.cities[this.bestTour[0]];
      this.ctx.moveTo(st.x, st.y);
      this.bestTour.forEach(idx => {
        const c = this.cities[idx];
        this.ctx.lineTo(c.x, c.y);
      });
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    }

    alert(`ACO длина: ${this.bestLen.toFixed(2)}`);
  }

  tourLength(tour) {
    let sum = 0;
    for (let i = 0; i < tour.length; i++) {
      const a = tour[i], b = tour[(i + 1) % tour.length];
      sum += this.distances[a][b];
    }
    return sum;
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
});
