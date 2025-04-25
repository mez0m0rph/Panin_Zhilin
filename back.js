////////////////////////////////////
// Утилита для переключения панелей
////////////////////////////////////
const AlgorithmUI = {
  // Показывает панель с id, скрывает другие
  switchAlgorithm(id) {
    document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('show');
  }
};

// Назначаем кнопкам переключение
document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo));
});

////////////////////////////////////
// A* Алгоритм
////////////////////////////////////
class AStar {
  constructor() {
    // Поля для состояния:
    this.grid = [];              // массив ячеек {r, c, type, elem}
    this.start = null;           // стартовая ячейка
    this.end = null;             // целевая ячейка
    this.sizeInput = document.getElementById('gridSizeInput');
    this.generateBtn = document.getElementById('generateGridButton');
    this.findBtn = document.getElementById('findPathButton');
    this.container = document.getElementById('gridDisplay');
    this.attachHandlers();
  }

  attachHandlers() {
    // Генерация сетки
    this.generateBtn.addEventListener('click', () => this.createGrid());
    // Поиск пути
    this.findBtn.addEventListener('click', () => this.findPath());
  }

  createGrid() {
    const n = parseInt(this.sizeInput.value);
    if (isNaN(n) || n < 3) {
      alert('Введите размер не менее 3');
      return;
    }
    // Сброс состояния
    this.grid = [];
    this.start = this.end = null;
    this.container.innerHTML = '';
    this.container.style.gridTemplateColumns = `repeat(${n}, 40px)`;

    // Создаем ячейки
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const elem = document.createElement('div');
        elem.className = 'grid-cell';
        elem.addEventListener('click', () => this.onCellClick(r, c, elem));
        this.container.appendChild(elem);
        this.grid.push({ r, c, type: 'empty', elem });
      }
    }
  }

  onCellClick(r, c, elem) {
    // Находим объект ячейки
    const cell = this.grid.find(x => x.r === r && x.c === c);
    if (!this.start) {
      cell.type = 'start'; this.start = cell; elem.style.background = '#2ecc71';
    } else if (!this.end && cell.type === 'empty') {
      cell.type = 'end'; this.end = cell; elem.style.background = '#e74c3c';
    } else if (cell.type === 'empty') {
      cell.type = 'obstacle'; elem.style.background = '#2c3e50';
    } else if (cell.type === 'obstacle') {
      cell.type = 'empty'; elem.style.background = 'lightgray';
    }
  }

  heuristic(a, b) {
    // Манхэттенское расстояние
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }

  findPath() {
    if (!this.start || !this.end) {
      alert('Укажите старт и финиш');
      return;
    }
    const openSet = [this.start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    // Инициализация оценок
    this.grid.forEach(cell => { gScore.set(cell, Infinity); fScore.set(cell, Infinity); });
    gScore.set(this.start, 0);
    fScore.set(this.start, this.heuristic(this.start, this.end));

    while (openSet.length) {
      // Выбираем узел с минимальным fScore
      let current = openSet.reduce((a, b) => fScore.get(a) < fScore.get(b) ? a : b);
      if (current === this.end) {
        this.reconstructPath(cameFrom, current);
        return;
      }
      // Удаляем текущий из открытого
      openSet.splice(openSet.indexOf(current), 1);
      // Соседи (4 направления)
      for (let [dr, dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr = current.r + dr, nc = current.c + dc;
        const neighbor = this.grid.find(x => x.r === nr && x.c === nc);
        if (!neighbor || neighbor.type === 'obstacle') continue;
        const tentative = gScore.get(current) + 1;
        if (tentative < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentative);
          fScore.set(neighbor, tentative + this.heuristic(neighbor, this.end));
          if (!openSet.includes(neighbor)) openSet.push(neighbor);
        }
      }
    }
    alert('Маршрут не найден');
  }

  reconstructPath(cameFrom, current) {
    while (cameFrom.has(current)) {
      const prev = cameFrom.get(current);
      if (current !== this.end) current.elem.style.background = '#f1c40f';
      current = prev;
    }
  }
}

////////////////////////////////////
// K-Means Алгоритм
////////////////////////////////////
class KMeans {
  constructor() {
    this.points = [];       // массив точек [x,y]
    this.k = 3;             // число кластеров
    this.centroids = [];    // массив центроид [x,y]
    this.canvas = document.getElementById('kmeansCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.pointCountInput = document.getElementById('kmeansPointCount');
    this.kInput = document.getElementById('kmeansK');
    this.genBtn = document.getElementById('kmeansGenerateBtn');
    this.runBtn = document.getElementById('kmeansRunBtn');
    this.attachHandlers();
  }

  attachHandlers() {
    this.genBtn.addEventListener('click', () => this.generatePoints());
    this.runBtn.addEventListener('click', () => this.clusterize());
  }

  generatePoints() {
    const n = parseInt(this.pointCountInput.value);
    this.points = [];
    for (let i = 0; i < n; i++) {
      this.points.push([Math.random() * this.canvas.width, Math.random() * this.canvas.height]);
    }
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach(([x,y]) => {
      this.ctx.fillStyle = '#333'; this.ctx.fillRect(x-3,y-3,6,6);
    });
  }

  clusterize() {
    this.k = parseInt(this.kInput.value);
    if (this.k < 1) return;
    // Инициализация центроид случайно из точек
    this.centroids = this.points.slice(0, this.k);
    let assignments = [];
    let changed = true;
    // Итерации
    while (changed) {
      changed = false;
      // 1) Присвоение кластера
      assignments = this.points.map(p => {
        const dists = this.centroids.map(c => Math.hypot(p[0]-c[0], p[1]-c[1]));
        return dists.indexOf(Math.min(...dists));
      });
      // 2) Обновление центроид
      for (let i=0;i<this.k;i++) {
        const clusterPts = this.points.filter((_, idx) => assignments[idx] === i);
        if (clusterPts.length) {
          const x = clusterPts.reduce((s,p)=>s+p[0],0)/clusterPts.length;
          const y = clusterPts.reduce((s,p)=>s+p[1],0)/clusterPts.length;
          if (x!==this.centroids[i][0] || y!==this.centroids[i][1]) changed = true;
          this.centroids[i] = [x,y];
        }
      }
    }
    // Отрисовка
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach((p, idx) => {
      const c = assignments[idx] * 360/this.k;
      this.ctx.fillStyle = `hsl(${c},70%,50%)`;
      this.ctx.fillRect(p[0]-3,p[1]-3,6,6);
    });
    this.centroids.forEach(c => {
      this.ctx.beginPath(); this.ctx.arc(c[0],c[1],8,0,2*Math.PI);
      this.ctx.strokeStyle = '#000'; this.ctx.stroke();
    });
  }
}

////////////////////////////////////
// Генетический алгоритм TSP
////////////////////////////////////
class GeneticTSP {
  constructor() {
    this.cities = [];
    this.population = [];
    this.best = null;
    this.canvas = document.getElementById('geneticCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.runBtn = document.getElementById('runGeneticBtn');
    this.resetBtn = document.getElementById('resetGeneticBtn');
    this.attachHandlers();
  }

  attachHandlers() {
    this.canvas.addEventListener('click', e => this.addCity(e));
    this.runBtn.addEventListener('click', () => this.runGA());
    this.resetBtn.addEventListener('click', () => this.reset());
  }

  addCity(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.cities.push({ x: e.clientX-rect.left, y: e.clientY-rect.top });
    this.drawCities();
  }

  drawCities() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{this.ctx.beginPath();this.ctx.arc(c.x,c.y,5,0,2*Math.PI);this.ctx.fillStyle='#000';this.ctx.fill();});
  }

  reset() {
    this.cities=[]; this.population=[]; this.best=null; this.drawCities();
    document.getElementById('bestDistanceDisplay').textContent='';
  }

  runGA() {
    if (this.cities.length<2) return;
    const popSize = 100, generations = 200;
    // Инициализация
    this.population = [];
    for (let i=0;i<popSize;i++) this.population.push(this.shuffle([...this.cities]));
    this.best = null;
    // Эволюция
    for (let g=0;g<generations;g++) {
      const graded = this.population.map(r=>({route:r,dist:this.distance(r)}));
      graded.sort((a,b)=>a.dist-b.dist);
      if (!this.best || graded[0].dist<this.distance(this.best)) this.best=[...graded[0].route];
      // Селекция
      const retain = Math.floor(popSize*0.2);
      let parents = graded.slice(0,retain).map(o=>o.route);
      // Турнир
      while (parents.length<popSize) {
        const a = graded[Math.floor(Math.random()*retain)].route;
        const b = graded[Math.floor(Math.random()*retain)].route;
        parents.push(this.distance(a)<this.distance(b)?[...a]:[...b]);
      }
      // Скрещивание и мутация
      this.population = parents.map((p,i)=>{
        let child = this.crossover(p, parents[(i+1)%parents.length]);
        if (Math.random()<0.05) child = this.mutate(child);
        return child;
      });
    }
    this.drawBest();
  }

  distance(route) {
    let d=0; for (let i=0;i<route.length-1;i++) d+=Math.hypot(route[i].x-route[i+1].x,route[i].y-route[i+1].y);
    return d;
  }

  shuffle(arr) {
    for (let i=arr.length-1;i>0;i--) {const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}
    return arr;
  }

  crossover(a,b) {
    const start= Math.floor(Math.random()*a.length), end=Math.floor(Math.random()*a.length);
    const seg = a.slice(Math.min(start,end),Math.max(start,end));
    const child = [...seg]; b.forEach(c=>{if(!child.includes(c))child.push(c);} );
    return child;
  }

  mutate(route) {
    const i=Math.floor(Math.random()*route.length), j=Math.floor(Math.random()*route.length);
    [route[i],route[j]]=[route[j],route[i]]; return route;
  }

  drawBest() {
    this.drawCities();
    if (!this.best) return;
    this.ctx.beginPath();
    this.ctx.moveTo(this.best[0].x,this.best[0].y);
    this.best.forEach(p=>this.ctx.lineTo(p.x,p.y));
    this.ctx.strokeStyle = '#f00'; this.ctx.stroke();
    document.getElementById('bestDistanceDisplay').textContent = `Длина пути: ${this.distance(this.best).toFixed(2)}`;
  }
}

////////////////////////////////////
// Муравьиный алгоритм ACO
////////////////////////////////////
class AntColony {
  constructor() {
    this.cities = [];
    this.canvas = document.getElementById('antCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.genBtn = document.getElementById('antGenerateBtn');
    this.runBtn = document.getElementById('antRunBtn');
    this.attach();
  }

  attach() {
    this.genBtn.addEventListener('click', () => this.generateCities());
    this.runBtn.addEventListener('click', () => this.run());
  }

  generateCities() {
    const n = parseInt(document.getElementById('antCityCount').value);
    this.cities=[];
    for (let i=0;i<n;i++) this.cities.push({x:Math.random()*this.canvas.width,y:Math.random()*this.canvas.height});
    this.drawCities();
  }

  drawCities() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{this.ctx.beginPath();this.ctx.arc(c.x,c.y,5,0,2*Math.PI);this.ctx.fillStyle='#000';this.ctx.fill();});
  }

  run() {
    if (this.cities.length<2) return;
    const alpha=parseFloat(document.getElementById('antAlpha').value);
    const beta=parseFloat(document.getElementById('antBeta').value);
    const rho=parseFloat(document.getElementById('antRho').value);
    const iterations=parseInt(document.getElementById('antIterations').value);
    const n=this.cities.length;
    // инициализация матриц
    const dist=Array(n).fill().map(()=>Array(n).fill(0));
    const pher=Array(n).fill().map(()=>Array(n).fill(1));
    for (let i=0;i<n;i++) for (let j=0;j<n;j++) dist[i][j]=i===j?Infinity:Math.hypot(this.cities[i].x-this.cities[j].x,this.cities[i].y-this.cities[j].y);

    let bestTour=null, bestLen=Infinity;
    for (let it=0;it<iterations;it++) {
      const tours=[];
      for (let a=0;a<n;a++) {
        const tour=[0], visited=new Set([0]);
        while (tour.length<n) {
          const i=tour[tour.length-1];
          const probs=this.cities.map((_,j)=>visited.has(j)?0:Math.pow(pher[i][j],alpha)*Math.pow(1/dist[i][j],beta));
          const sum=probs.reduce((s,p)=>s+p,0);
          let r=Math.random()*sum;
          let next=probs.findIndex(p=>{r-=p;return r<=0;}); tour.push(next); visited.add(next);
        }
        tours.push(tour);
        const len=this.calcLen(tour,dist);
        if (len<bestLen) {bestLen=len;bestTour=tour;}
      }
      // испарение
      for (let i=0;i<n;i++) for (let j=0;j<n;j++) pher[i][j]*=(1-rho);
      // осаждение
      tours.forEach(tour=>{
        const len=this.calcLen(tour,dist);
        tour.forEach((x,i)=>{if(i<tour.length-1){const y=tour[i+1]; pher[x][y]+=1/len; pher[y][x]+=1/len;}});
      });
    }
    // отрисовка лучшего
    this.drawCities(); this.ctx.beginPath(); this.ctx.moveTo(this.cities[bestTour[0]].x,this.cities[bestTour[0]].y);
    bestTour.forEach(i=>this.ctx.lineTo(this.cities[i].x,this.cities[i].y)); this.ctx.strokeStyle='#f00'; this.ctx.stroke();
    alert(`Лучший путь: ${bestLen.toFixed(2)}`);
  }

  calcLen(tour, dist) { return tour.slice(0,-1).reduce((s,i,k,a)=>s+dist[i][a[k+1]],0); }
}

// Запуск всех при загрузке
window.addEventListener('DOMContentLoaded', () => {
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
});
