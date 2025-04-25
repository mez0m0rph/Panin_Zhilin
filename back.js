// script.js

///////////////////////////////////////
// Навигация и переключение секций UI
///////////////////////////////////////
const AlgorithmUI = {
  /** 
   * Показывает панель алгоритма с заданным id, скрывая другие 
   * @param {string} panelId — id секции для отображения 
   */
  switchAlgorithm(panelId) {
    // Скрыть все панели
    document.querySelectorAll('.algorithm-interface').forEach(el => {
      el.classList.remove('show');
    });
    // Показать выбранную
    const panel = document.getElementById(panelId);
    if (panel) panel.classList.add('show');
  }
};

// Привязка кнопок навигации
document.querySelectorAll('.algo-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    AlgorithmUI.switchAlgorithm(btn.dataset.algo);
  });
});


//////////////////////////////////
// Алгоритм A* (поиск кратчайшего пути)
//////////////////////////////////
class AStar {
  constructor() {
    // DOM-элементы управления и контейнер для сетки
    this.sizeInput = document.getElementById('gridSizeInput');
    this.generateButton = document.getElementById('generateGridButton');
    this.findButton = document.getElementById('findPathButton');
    this.gridContainer = document.getElementById('gridDisplay');

    // Внутренние данные
    this.grid = [];      // массив ячеек { r, c, type, elem }
    this.start = null;   // ячейка старта
    this.end = null;     // ячейка финиша

    this._attachEventListeners();
  }

  /** Привязка обработчиков событий к кнопкам */
  _attachEventListeners() {
    this.generateButton.addEventListener('click', () => this._createGrid());
    this.findButton.addEventListener('click', () => this._findPath());
  }

  /** Создает сетку n×n клеток и сбрасывает состояние */
  _createGrid() {
    const n = parseInt(this.sizeInput.value, 10);
    if (isNaN(n) || n < 3) {
      alert('Введите размер сетки N ≥ 3');
      return;
    }

    // Сброс данных
    this.grid = [];
    this.start = null;
    this.end = null;
    this.gridContainer.innerHTML = '';
    this.findButton.classList.remove('show');

    // Настройка CSS grid
    this.gridContainer.style.gridTemplateColumns = `repeat(${n}, 40px)`;

    // Создание ячеек
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const cellElem = document.createElement('div');
        cellElem.className = 'grid-cell';
        // Обработчик клика по ячейке
        cellElem.addEventListener('click', () => this._onCellClick(r, c, cellElem));
        this.gridContainer.appendChild(cellElem);
        this.grid.push({ r, c, type: 'empty', elem: cellElem });
      }
    }

    // Показать кнопку поиска пути
    this.findButton.classList.add('show');
  }

  /**
   * Обработка клика по ячейке:
   * - первая кликаемая становится стартом (зеленая)
   * - вторая — финишем (красная)
   * - последующие клики переключают между проходной и препятствием
   */
  _onCellClick(r, c, elem) {
    const cell = this.grid.find(x => x.r === r && x.c === c);
    if (!this.start) {
      cell.type = 'start';
      this.start = cell;
      elem.style.background = '#2ecc71';
    } else if (!this.end && cell.type === 'empty') {
      cell.type = 'end';
      this.end = cell;
      elem.style.background = '#e74c3c';
    } else if (cell.type === 'empty') {
      cell.type = 'obstacle';
      elem.style.background = '#2c3e50';
    } else if (cell.type === 'obstacle') {
      cell.type = 'empty';
      elem.style.background = 'lightgray';
    }
  }

  /** Манхэттенская эвристика (расстояние по «прямым») */
  _heuristic(a, b) {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }

  /**
   * Запуск алгоритма A*:
   * - используем открытую группу open[], карты g и f,
   * - находим путь или сообщаем об отсутствии.
   */
  _findPath() {
    if (!this.start || !this.end) {
      alert('Установите старт и финиш');
      return;
    }

    const open = [this.start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();

    // Инициализация оценок
    this.grid.forEach(cell => {
      gScore.set(cell, Infinity);
      fScore.set(cell, Infinity);
    });
    gScore.set(this.start, 0);
    fScore.set(this.start, this._heuristic(this.start, this.end));

    // Основной цикл
    while (open.length > 0) {
      // Выбрать узел с минимальным fScore
      let current = open.reduce((a, b) =>
        fScore.get(a) < fScore.get(b) ? a : b
      );

      // Если достигли финиша — восстанавливаем путь
      if (current === this.end) {
        this._reconstructPath(cameFrom, current);
        return;
      }

      // Удаляем текущий из open
      open.splice(open.indexOf(current), 1);

      // Проверяем всех соседей (4 направления)
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
        const nr = current.r + dr, nc = current.c + dc;
        const neighbor = this.grid.find(x => x.r === nr && x.c === nc);
        if (!neighbor || neighbor.type === 'obstacle') return;

        // Стоимость перехода
        const tentativeG = gScore.get(current) + 1;
        if (tentativeG < gScore.get(neighbor)) {
          cameFrom.set(neighbor, current);
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this._heuristic(neighbor, this.end));
          if (!open.includes(neighbor)) open.push(neighbor);
        }
      });
    }

    alert('Путь не найден');
  }

  /**
   * Восстановление и отрисовка пути:
   * - идем по cameFrom до старта,
   * - красим ячейки пути в желтый (кроме старта/финиша).
   */
  _reconstructPath(cameFrom, current) {
    while (cameFrom.has(current)) {
      if (current !== this.end) {
        current.elem.style.background = '#f1c40f';
      }
      current = cameFrom.get(current);
    }
  }
}


//////////////////////////////////
// Кластеризация: K-средних (K-Means)
//////////////////////////////////
class KMeans {
  constructor() {
    // DOM-элементы
    this.canvas = document.getElementById('kmeansCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.pointsCountInput = document.getElementById('kmeansPointCount');
    this.kInput = document.getElementById('kmeansK');
    this.generateBtn = document.getElementById('kmeansGenerateBtn');
    this.runBtn = document.getElementById('kmeansRunBtn');

    // Данные для алгоритма
    this.points = [];      // массив [x, y, clusterIndex]
    this.centroids = [];   // массив [x, y]

    this._attachEventListeners();
  }

  /** Привязка кнопок к методам */
  _attachEventListeners() {
    this.generateBtn.addEventListener('click', () => this._generatePoints());
    this.runBtn.addEventListener('click', () => this._runKMeans());
  }

  /** Генерация случайных точек на холсте */
  _generatePoints() {
    const n = parseInt(this.pointsCountInput.value, 10);
    if (isNaN(n) || n < 1) return alert('Введите число точек ≥ 1');

    this.points = Array.from({ length: n }, () => [
      Math.random() * this.canvas.width,
      Math.random() * this.canvas.height,
      null
    ]);

    this._drawPoints();
  }

  /** Очистка холста и отрисовка точек черным цветом */
  _drawPoints() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(([x, y]) => {
      this.ctx.fillStyle = '#333';
      this.ctx.fillRect(x - 3, y - 3, 6, 6);
    });
  }

  /**
   * Запуск алгоритма K-средних:
   * - инициализация центроидов первыми K точками,
   * - итеративное назначение и пересчет до сходимости.
   */
  _runKMeans() {
    const K = parseInt(this.kInput.value, 10);
    if (isNaN(K) || K < 1 || this.points.length < K) {
      return alert('Неверное K или недостаточно точек');
    }

    // Инициализация центроидов (первые K точек)
    this.centroids = this.points.slice(0, K).map(p => [p[0], p[1]]);

    let changed = true;
    while (changed) {
      changed = false;

      // Назначение кластеров: точке — ближайший центроид
      this.points.forEach(p => {
        const distances = this.centroids.map(c =>
          Math.hypot(p[0] - c[0], p[1] - c[1])
        );
        p[2] = distances.indexOf(Math.min(...distances));
      });

      // Пересчет центроидов
      for (let i = 0; i < K; i++) {
        const clusterPoints = this.points.filter(p => p[2] === i);
        if (clusterPoints.length === 0) continue;
        const avgX = clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length;
        const avgY = clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length;
        if (avgX !== this.centroids[i][0] || avgY !== this.centroids[i][1]) {
          changed = true;
          this.centroids[i] = [avgX, avgY];
        }
      }
    }

    // Отрисовка результатов: точки — в цвет кластеров, центроиды — обводка
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(p => {
      const hue = (p[2] * 360) / this.centroids.length;
      this.ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
      this.ctx.fillRect(p[0] - 3, p[1] - 3, 6, 6);
    });
    this.centroids.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c[0], c[1], 8, 0, 2 * Math.PI);
      this.ctx.strokeStyle = '#000';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }
}


//////////////////////////////////
// Генетический алгоритм TSP
//////////////////////////////////
class GeneticTSP {
  constructor() {
    // DOM-элементы
    this.canvas = document.getElementById('geneticCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.runBtn = document.getElementById('runGeneticBtn');
    this.resetBtn = document.getElementById('resetGeneticBtn');
    this.output = document.getElementById('bestDistanceDisplay');

    // Данные
    this.cities = [];    // массив { x, y }
    this.bestRoute = []; // лучший найденный цикл маршрута

    this._attachEventListeners();
  }

  /** Привязка событий на холст и кнопки */
  _attachEventListeners() {
    // Добавление города кликом
    this.canvas.addEventListener('click', e => this._addCity(e));
    this.runBtn.addEventListener('click', () => this._runGA());
    this.resetBtn.addEventListener('click', () => this._reset());
  }

  /** Добавляет город в массив и перерисовывает */
  _addCity(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.cities.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    this._drawCities();
  }

  /** Рисует все города как синие точки */
  _drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cities.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#000';
      this.ctx.fill();
    });
  }

  /** Полный сброс состояния и UI */
  _reset() {
    this.cities = [];
    this.bestRoute = [];
    this.output.textContent = '';
    this._drawCities();
  }

  /**
   * Основной метод генетического алгоритма:
   * - инициализация популяции случайных маршрутов,
   * - оценка, отбор, кроссовер, мутация на фиксированное число поколений,
   * - сохраняем лучший маршрут как цикл (возврат в стартовую точку).
   */
  _runGA() {
    const n = this.cities.length;
    if (n < 2) {
      return alert('Добавьте минимум 2 города');
    }

    const populationSize = 100;
    const generations = 200;
    let population = [];

    // 1. Инициализация: создаем популяцию случайных маршрутов
    for (let i = 0; i < populationSize; i++) {
      population.push(this._shuffle(Array.from({ length: n }, (_, i) => i)));
    }

    let bestDistance = Infinity;

    // 2. Эволюция по поколениям
    for (let gen = 0; gen < generations; gen++) {
      // Оцениваем каждую особь (маршрут) по длине цикла
      const graded = population.map(route => {
        const dist = this._routeLength(route);
        return { route, dist };
      }).sort((a, b) => a.dist - b.dist);

      // Сохраняем лучший
      if (graded[0].dist < bestDistance) {
        bestDistance = graded[0].dist;
        // Формируем полный цикл, замыкая в начало
        this.bestRoute = [...graded[0].route, graded[0].route[0]];
      }

      // 3. Отбор: оставляем топ-20%
      const retainCount = Math.floor(populationSize * 0.2);
      let newPopulation = graded.slice(0, retainCount).map(o => o.route);

      // 4. Кроссовер и мутация для пополнения до исходного размера
      while (newPopulation.length < populationSize) {
        const parentA = this._select(graded);
        const parentB = this._select(graded);
        let child = this._crossover(parentA, parentB);

        // Мутация с вероятностью 5%
        if (Math.random() < 0.05) {
          child = this._mutate(child);
        }
        newPopulation.push(child);
      }

      population = newPopulation;
    }

    // 5. Отрисовка лучшего цикла на холсте
    this._drawCities();
    this._drawBestRoute();
    this.output.textContent = `Длина цикла: ${bestDistance.toFixed(2)}`;
  }

  /** Перемешивание массива городов (Fisher–Yates shuffle) */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Случайный отбор родителя с небольшим преимуществом лучших */
  _select(graded) {
    // Турнирный отбор: выбираем одного из лучших 20 случайно
    return graded[Math.floor(Math.random() * Math.floor(graded.length * 0.2))].route;
  }

  /**
   * Одноточечный кроссовер:
   * - копирует сегмент от A, затем дополняет из B в порядке.
   */
  _crossover(parentA, parentB) {
    const len = parentA.length;
    const [, ...rest] = parentB; // копирование
    const start = Math.floor(Math.random() * len);
    const end = Math.floor(Math.random() * len);
    const [i, j] = start < end ? [start, end] : [end, start];

    // Сегмент от A
    const segment = parentA.slice(i, j);
    // Строим ребенка, вставляя сначала сегмент, затем остальные элементы из B
    const child = segment.concat(rest.filter(id => !segment.includes(id)));
    return child;
  }

  /** Мутация: меняет местами две случайные точки маршрута */
  _mutate(route) {
    const a = Math.floor(Math.random() * route.length);
    const b = Math.floor(Math.random() * route.length);
    [route[a], route[b]] = [route[b], route[a]];
    return route;
  }

  /**
   * Вычисление длины полного цикла (замыкаем маршрут):
   * суммируем расстояния между соседними городами и от последнего к первому
   */
  _routeLength(route) {
    let total = 0;
    for (let i = 0; i < route.length; i++) {
      const a = this.cities[route[i]];
      const b = this.cities[route[(i + 1) % route.length]];
      total += Math.hypot(a.x - b.x, a.y - b.y);
    }
    return total;
  }

  /** Отрисовка лучшего маршрута как красной линии */
  _drawBestRoute() {
    if (!this.bestRoute.length) return;
    this.ctx.beginPath();
    const startCity = this.cities[this.bestRoute[0]];
    this.ctx.moveTo(startCity.x, startCity.y);
    this.bestRoute.forEach(idx => {
      const c = this.cities[idx];
      this.ctx.lineTo(c.x, c.y);
    });
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}


//////////////////////////////////
// Муравьиный алгоритм (Ant Colony Optimization для TSP)
//////////////////////////////////
class AntColony {
  constructor() {
    // DOM-элементы
    this.canvas = document.getElementById('antCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.alphaInput = document.getElementById('antAlpha');
    this.betaInput = document.getElementById('antBeta');
    this.rhoInput = document.getElementById('antRho');
    this.iterInput = document.getElementById('antIterations');
    this.runButton = document.getElementById('antRunBtn');
    this.resetButton = document.getElementById('antResetBtn');

    // Данные
    this.cities = [];
    this.pheromone = [];
    this.distances = [];
    this.bestTour = null;
    this.bestLength = Infinity;

    this._attachEventListeners();
  }

  /** Привязка событий интерфейса */
  _attachEventListeners() {
    // Добавление города кликом
    this.canvas.addEventListener('click', e => this._addCity(e));
    this.runButton.addEventListener('click', () => this._runACO());
    this.resetButton.addEventListener('click', () => this._reset());
  }

  /** Добавляет город */
  _addCity(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.cities.push({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    this._drawCities();
  }

  /** Рисует все города */
  _drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cities.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#000';
      this.ctx.fill();
    });
  }

  /** Сброс всех данных и холста */
  _reset() {
    this.cities = [];
    this.pheromone = [];
    this.distances = [];
    this.bestTour = null;
    this.bestLength = Infinity;
    this._drawCities();
  }

  /**
   * Основной метод Ant Colony Optimization:
   * - строим матрицу расстояний и феромона,
   * - моделируем заданное число итераций,
   * - для каждого муравья строим маршрут вероятностно,
   * - испаряем и осаждаем феромон,
   * - сохраняем лучший найденный цикл.
   */
  _runACO() {
    const n = this.cities.length;
    if (n < 2) {
      return alert('Добавьте минимум 2 города');
    }

    // Параметры
    const alpha = parseFloat(this.alphaInput.value) || 1;
    const beta = parseFloat(this.betaInput.value) || 5;
    const rho = parseFloat(this.rhoInput.value) || 0.1;
    const iterations = parseInt(this.iterInput.value, 10) || 50;

    // Матрица расстояний и начальная феромона
    this.distances = Array.from({ length: n }, () => Array(n).fill(0));
    this.pheromone = Array.from({ length: n }, () => Array(n).fill(1));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          this.distances[i][j] = Infinity;
        } else {
          this.distances[i][j] = Math.hypot(
            this.cities[i].x - this.cities[j].x,
            this.cities[i].y - this.cities[j].y
          );
        }
      }
    }

    // Основной цикл итераций
    for (let it = 0; it < iterations; it++) {
      const allTours = [];

      // Каждый «муравей» строит свой маршрут
      for (let a = 0; a < n; a++) {
        const tour = [0];
        const visited = new Set([0]);

        while (tour.length < n) {
          const current = tour[tour.length - 1];
          // Рассчитываем вероятности перехода
          const probs = this.cities.map((_, j) => {
            if (visited.has(j)) return 0;
            return Math.pow(this.pheromone[current][j], alpha) *
                   Math.pow(1 / this.distances[current][j], beta);
          });
          const sum = probs.reduce((s, v) => s + v, 0);
          let r = Math.random() * sum;

          // Выбираем следующий город по случайному порогу
          let next = probs.findIndex(p => {
            r -= p;
            return r <= 0;
          });
          tour.push(next);
          visited.add(next);
        }

        allTours.push(tour);

        // Обновляем лучший маршрут
        const length = this._tourLength(tour);
        if (length < this.bestLength) {
          this.bestLength = length;
          this.bestTour = [...tour, tour[0]]; // замыкаем цикл
        }
      }

      // Испарение феромона
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          this.pheromone[i][j] *= (1 - rho);
        }
      }

      // Осаждение феромона по всем маршрутам
      allTours.forEach(tour => {
        const length = this._tourLength(tour);
        tour.forEach((u, idx) => {
          const v = tour[(idx + 1) % tour.length];
          this.pheromone[u][v] += 1 / length;
          this.pheromone[v][u] += 1 / length;
        });
      });
    }

    // Отрисовка лучшего цикла
    this._drawCities();
    this._drawBestTour();
    alert(`Лучший маршрут ACO длина: ${this.bestLength.toFixed(2)}`);
  }

  /** Вычисляет длину цикла (замыкание маршрута) */
  _tourLength(tour) {
    let sum = 0;
    for (let i = 0; i < tour.length; i++) {
      const a = tour[i];
      const b = tour[(i + 1) % tour.length];
      sum += this.distances[a][b];
    }
    return sum;
  }

  /** Отрисовывает лучший цикл красной линией */
  _drawBestTour() {
    if (!this.bestTour) return;
    this.ctx.beginPath();
    const start = this.cities[this.bestTour[0]];
    this.ctx.moveTo(start.x, start.y);
    this.bestTour.forEach(idx => {
      const c = this.cities[idx];
      this.ctx.lineTo(c.x, c.y);
    });
    this.ctx.strokeStyle = '#e74c3c';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
  }
}


// Инициализация всех алгоритмов после загрузки DOM
window.addEventListener('DOMContentLoaded', () => {
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
});
