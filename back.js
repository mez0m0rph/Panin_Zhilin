const AlgorithmUI = {  // переключение между интерфейсами
  switchAlgorithm(id) {
                          // у всех элементов .algorithm-interface убираем css-класс show, 
                          // а потом добавляем show к блоку, чей id передается (чтобы при нажатии на алгоритм
                          // отображался только нужный раздел, а остальные были скрыты)
    document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('show');
  }
};
document.querySelectorAll('.algo-btn').forEach(btn => // добавляем обработчик на все кнопки algo-btn
                                                       // на каждую кнопку algo-btn вешаем обработчик клика
                                                       // он вызывает switchAlgorithm, передает значение data-algo
                                                       // (чтобы кнопки отображали нужные панели)
  btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo))
);


class AStar {  // А* (построение пути на сетке)
  constructor() {
    // dom-элементы (узлы html, через них читать/менять свойства/атрибуты)
    this.sizeInput     = document.getElementById('gridSizeInput');
                        // сейвит ссылки на поля ввода/кнопки в свойства объекта 
                        // (чтобы дальше с ними работать)
    this.generateBtn   = document.getElementById('generateGridButton');
                        // при клике вызывает createGrid
                        // считывает размер введенной сетки, чистит прошлую
                        // создает новую
    this.findBtn       = document.getElementById('findPathButton');
                        // при клике запускает findPath(A*)
                        // он перебирает маршруты и красит его
    this.gridContainer = document.getElementById('gridDisplay');
                        // внутри него находятся все ячейки 
                        // в него добавляется grid-Cell, квадратики сетки становятся видимыми 
    
    this.grid  = [];  // внутренние данные с координатами и текущим состоянием (номер строки,
                      // номер столбца, текущее состояние, elem - ссылка на объект в this-grid,
                      // который был отмечен стартом/финишем)
    this.start = null;
    this.end   = null;

    this.generateBtn.addEventListener('click', () => this.createGrid());
                    // привязка событий (при клике на createGrid() - строим)
    this.findBtn.addEventListener('click', ()  => this.findPath());
                     // при клике на findPath() - находим путь
  }

  createGrid() {
                // логика: делаем сетку N на N
                // чистим контейнер
                // делаем div.grid-cell для каждой ячейки
                // кидаем в this.grid объект ячейки
    const N = +this.sizeInput.value;  // строку из ввода в переводим в число
    if (isNaN(N) || N < 3) {  // чтобы сетка вообще имела смысл
      alert('Введите размер N ≥ 3');
      return;
    }
    // Сброс
    this.grid  = [];  // убираем старые данные
    this.start = this.end = null;  // отмеченные точки сбрасываем
    this.gridContainer.innerHTML = '';  // старые div'ы из контейнера удаляем 
    this.gridContainer.style.gridTemplateColumns = `repeat(${N}, 40px)`;  // делаем css-grid колонки (делаем N колонок, каждая 40 пикселей по ширине)

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {  // делаем N на N ячеек
        const cellElem = document.createElement('div');  // делаем новый div, класс для него grid-cell
        cellElem.className = 'grid-cell';
        cellElem.addEventListener('click', () => this.onCellClick(r, c, cellElem));  // привязываем к этому div'у метод onCellClick(r, c, elem)
        this.gridContainer.appendChild(cellElem);  // кидаем элемент в контейнер, чтобы он появлился в dom'е
        this.grid.push({ r, c, type: 'empty', elem: cellElem });  // инфо про ячейку сохраняем
      }
    }
  }

  onCellClick(r, c, elem) { 
                  // логика: первый клик - зеленая кнопка
                  // второй клик - красная кнопка
                  // клики дальше - свич между empty и obstacle (смена цвета)
    const cell = this.grid.find(x => x.r === r && x.c === c);  // находим объект ячейки по координатам (в this.grid)
    if (!this.start) {  // если старт не задан, задаем это стартом
      cell.type = 'start';
      this.start = cell;
      elem.style.background = '#2ecc71';
    }
    else if (!this.end && cell.type === 'empty') {  // если финиш не задан, задаем финишом это
      cell.type = 'end';
      this.end = cell;
      elem.style.background = '#e74c3c';
    }
    else if (cell.type === 'empty') {  // когда пустая клетка, делаем ее препятствием
      cell.type = 'obstacle';
      elem.style.background = '#2c3e50';
    }
    else if (cell.type === 'obstacle') {  // когда препятствиие - делаем свободной
      cell.type = 'empty';
      elem.style.background = 'lightgray';
    }
  }

  heuristic(a, b) {  // эвристика (оно же расстояние по клеткам по прямым осям)
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
                    // возвращает сумму алсолютных разниц по строкам и столбцам (r и c)
                    // юзается в A* для оценки кол-во оставшихся клеток до нужной клетки 
  }

  findPath() {
    if (!this.start || !this.end) {
      alert('Установите старт и финиш');
      return;
    }

    const open     = [this.start];
    const cameFrom = new Map();
    const gScore   = new Map();
    const fScore   = new Map();

    // Инициализация оценок
    this.grid.forEach(cell => {
      gScore.set(cell, Infinity);
      fScore.set(cell, Infinity);
    });
    gScore.set(this.start, 0);
    fScore.set(this.start, this.heuristic(this.start, this.end));

    // Главный цикл
    while (open.length > 0) {
      // Выбор узла с минимальным fScore
      const current = open.reduce((a, b) => (
        fScore.get(a) < fScore.get(b) ? a : b
      ));

      // Если дошли до финиша — восстанавливаем путь
      if (current === this.end) {
        this.reconstruct(cameFrom, current);
        return;
      }

      // Удаляем current из open
      open.splice(open.indexOf(current), 1);

      // Обрабатываем всех 4 соседей
      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
        const nr = current.r + dr;
        const nc = current.c + dc;
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
      if (current !== this.end) {
        current.elem.style.background = '#f1c40f'; // желтый цвет пути
      }
      current = cameFrom.get(current);
    }
  }
}


class KMeans {
  constructor() {
    // DOM-элементы
    this.canvas = document.getElementById('kmeansCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.pointCountInput = document.getElementById('kmeansPointCount');
    this.kInput = document.getElementById('kmeansK');
    this.generateBtn = document.getElementById('kmeansGenerateBtn');
    this.runBtn = document.getElementById('kmeansRunBtn');

    // Данные
    this.points = [];
    this.centroids = [];
    this.clusters = [];

    // Привязка событий
    this.generateBtn.addEventListener('click', () => this.generatePoints());
    this.runBtn.addEventListener('click', () => this.runKMeans());
  }

  generatePoints() {
    const count = +this.pointCountInput.value;
    this.points = Array.from({ length: count }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      cluster: -1
    }));
    this.drawPoints();
  }

  drawPoints() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      this.ctx.fillStyle = '#3498db';
      this.ctx.fill();
    });
  }

  runKMeans() {
    const k = +this.kInput.value;
    if (k < 1 || k > 10) {
      alert('Выберите K от 1 до 10');
      return;
    }
    if (this.points.length === 0) {
      alert('Сгенерируйте точки сначала');
      return;
    }

    // 1. Инициализация центроидов - выбираем k случайных точек
    this.centroids = [];
    const shuffled = [...this.points].sort(() => Math.random() - 0.5);
    for (let i = 0; i < k; i++) {
      this.centroids.push({
        x: shuffled[i].x,
        y: shuffled[i].y,
        color: this.getRandomColor()
      });
    }

    let changed;
    // 2. Основной цикл алгоритма
    do {
      changed = false;
      
      // a) Назначение точек кластерам
      this.points.forEach(p => {
        let minDist = Infinity;
        let newCluster = -1;
        
        // Находим ближайший центроид
        this.centroids.forEach((c, i) => {
          const dist = this.distance(p, c);
          if (dist < minDist) {
            minDist = dist;
            newCluster = i;
          }
        });
        
        // Если кластер изменился
        if (p.cluster !== newCluster) {
          p.cluster = newCluster;
          changed = true;
        }
      });
      
      // b) Пересчет центроидов
      this.centroids.forEach((centroid, i) => {
        const clusterPoints = this.points.filter(p => p.cluster === i);
        if (clusterPoints.length > 0) {
          const sumX = clusterPoints.reduce((sum, p) => sum + p.x, 0);
          const sumY = clusterPoints.reduce((sum, p) => sum + p.y, 0);
          centroid.x = sumX / clusterPoints.length;
          centroid.y = sumY / clusterPoints.length;
        }
      });
    } while (changed); // c) Повторяем пока кластеры меняются

    // 3. Отрисовка результатов
    this.drawClusters();
  }

  drawClusters() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Рисуем точки цветами их кластеров
    this.points.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.centroids[p.cluster]?.color || '#3498db';
      this.ctx.fill();
    });
    
    // Рисуем центроиды
    this.centroids.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 10, 0, 2 * Math.PI);
      this.ctx.fillStyle = c.color;
      this.ctx.fill();
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
    });
  }

  /**
   * Вычисление евклидова расстояния между двумя точками
   */
  distance(a, b) {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  /**
   * Генерация случайного цвета для кластера
   */
  getRandomColor() {
    const hue = Math.floor(Math.random() * 360);
    return `hsl(${hue}, 70%, 50%)`;
  }
}


class GeneticTSP {
  constructor() {
    // DOM-элементы:
    this.canvas    = document.getElementById('geneticCanvas');
    this.ctx       = this.canvas.getContext('2d');
    this.runBtn    = document.getElementById('runGeneticBtn');
    this.resetBtn  = document.getElementById('resetGeneticBtn');
    this.outputEl  = document.getElementById('bestDistanceDisplay');

    // Данные:
    this.cities    = [];    // [{x, y}, ...]
    this.bestRoute = null;  // [idx0, idx1, ..., idx0]

    // События:
    // Клик по холсту — добавление города
    this.canvas.addEventListener('click', (e) => this.addCity(e));
    this.runBtn.addEventListener('click',  () => this.runGA());
    this.resetBtn.addEventListener('click',() => this.reset());
  }

  addCity(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.cities.push({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    });
    this.drawCities();
  }

  /** Отрисовка всех городов (синие точки) */
  drawCities() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.cities.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c.x, c.y, 5, 0, 2 * Math.PI);
      this.ctx.fillStyle = 'blue';
      this.ctx.fill();
    });
  }

  /** Полный сброс данных и UI */
  reset() {
    this.cities = [];
    this.bestRoute = null;
    this.outputEl.textContent = '';
    this.drawCities();
  }


  runGA() {
    const n = this.cities.length;
    if (n < 2) {
      alert('Добавьте минимум 2 города');
      return;
    }

    const populationSize = 100;   // сколько маршрутов в популяции
    const generations     = 200;  // число поколений

    // 1) Инициализация: генерируем популяцию случайных перестановок [0..n-1]
    let population = [];
    for (let i = 0; i < populationSize; i++) {
      population.push(this._shuffle(Array.from({ length: n }, (_, i) => i)));
    }

    let bestDistance = Infinity;

    // 2) Эволюция
    for (let gen = 0; gen < generations; gen++) {
      // a) Оценка: вычисляем длину маршрута для каждого индивида
      const scored = population.map(route => ({
        route,
        distance: this._computeRouteLength(route)
      }))
      // b) Сортировка по возрастанию длины
      .sort((a, b) => a.distance - b.distance);

      // c) Сохраняем лучший маршрут, замыкаем цикл
      if (scored[0].distance < bestDistance) {
        bestDistance = scored[0].distance;
        this.bestRoute = [...scored[0].route, scored[0].route[0]];
      }

      // d) Отбор топ-20% для нового поколения
      const retainCount = Math.floor(populationSize * 0.2);
      let newPop = scored.slice(0, retainCount).map(o => o.route);

      // e) Кроссовер + мутация для заполнения до populationSize
      while (newPop.length < populationSize) {
        const parentA = this._tournamentSelect(scored);
        const parentB = this._tournamentSelect(scored);
        let child = this._crossover(parentA, parentB);
        if (Math.random() < 0.05) {
          child = this._mutate(child);
        }
        newPop.push(child);
      }
      population = newPop;
    }

    // 3) Отрисовываем результат: сначала точки, затем линию цикла
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
      this.ctx.lineWidth   = 2;
      this.ctx.stroke();
    }

    // Выводим длину
    this.outputEl.textContent = `Лучшая длина маршрута: ${bestDistance.toFixed(2)}`;
  }

  /** Fisher–Yates shuffle */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /** Турнирный отбор из топ-20% */
  _tournamentSelect(scored) {
    const cutoff = Math.floor(scored.length * 0.2);
    const idx = Math.floor(Math.random() * cutoff);
    return scored[idx].route;
  }


  _crossover(a, b) {
    const len = a.length;
    const i = Math.floor(Math.random() * len);
    const j = Math.floor(Math.random() * len);
    const [start, end] = i < j ? [i, j] : [j, i];
    const segment = a.slice(start, end);
    return [...segment, ...b.filter(x => !segment.includes(x))];
  }

  /** Мутация: меняем местами две случайные точки */
  _mutate(route) {
    const i = Math.floor(Math.random() * route.length);
    const j = Math.floor(Math.random() * route.length);
    [route[i], route[j]] = [route[j], route[i]];
    return route;
  }

  _computeRouteLength(route) {
    let sum = 0;
    for (let i = 0; i < route.length; i++) {
      const a = this.cities[route[i]];
      const b = this.cities[route[(i + 1) % route.length]];
      sum += Math.hypot(a.x - b.x, a.y - b.y);
    }
    return sum;
  }
}

// Муравьиный алгоритм

class AntColony {
  constructor() {
    // DOM-элементы
    this.canvas       = document.getElementById('antCanvas');
    this.ctx          = this.canvas.getContext('2d');
    this.cityCount    = document.getElementById('antCityCount');
    this.antCount     = document.getElementById('antCount');
    this.alphaInput   = document.getElementById('antAlpha');
    this.betaInput    = document.getElementById('antBeta');
    this.rhoInput     = document.getElementById('antRho');
    this.iterInput    = document.getElementById('antIterations');
    this.generateBtn  = document.getElementById('antGenerateBtn');
    this.runBtn       = document.getElementById('antRunBtn');

    // Данные
    this.cities    = [];
    this.distances = [];
    this.pheromone = [];
    this.bestTour  = null;
    this.bestLen   = Infinity;

    this.generateBtn.addEventListener('click', () => this.generateCities());
    this.runBtn.addEventListener('click', () => this.runACO());
  }

  /** Генерация случайных городов на холсте */
  generateCities() {
    const n = +this.cityCount.value;
    if (n < 2) { alert('Минимум 2 города'); return; }
    this.cities = Array.from({ length: n }, () => ({
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height
    }));
    this.drawCities();
  }

  /** Отрисовка всех городов */
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

    // Параметры
    const ants       = +this.antCount.value;
    const alpha      = +this.alphaInput.value;
    const beta       = +this.betaInput.value;
    const rho        = +this.rhoInput.value;
    const iterations = +this.iterInput.value;

    // Инициализация матриц
    this.distances = Array.from({ length: n }, () => Array(n).fill(0));
    this.pheromone = Array.from({ length: n }, () => Array(n).fill(1));

    // Заполняем матрицу расстояний
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          this.distances[i][j] = Infinity;
        } else {
          const dx = this.cities[i].x - this.cities[j].x;
          const dy = this.cities[i].y - this.cities[j].y;
          this.distances[i][j] = Math.hypot(dx, dy);
        }
      }
    }

    // Моделируем заданное число итераций
    this.bestLen = Infinity;
    for (let iter = 0; iter < iterations; iter++) {
      const tours = [];

      // Каждый муравей строит маршрут
      for (let a = 0; a < ants; a++) {
        const tour = [0];
        const visited = new Set([0]);

        while (tour.length < n) {
          const i = tour[tour.length - 1];
          // Рассчитываем вероятности перехода
          const probs = this.cities.map((_, j) => {
            if (visited.has(j)) return 0;
            return Math.pow(this.pheromone[i][j], alpha) *
                   Math.pow(1 / this.distances[i][j], beta);
          });
          const sum = probs.reduce((s, v) => s + v, 0);

          // Случайный выбор по весам
          let r = Math.random() * sum, next = 0;
          for (let idx = 0; idx < n; idx++) {
            r -= probs[idx];
            if (r <= 0) { next = idx; break; }
          }
          tour.push(next);
          visited.add(next);
        }

        tours.push(tour);
        const len = this._tourLength(tour);
        if (len < this.bestLen) {
          this.bestLen = len;
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
      tours.forEach(tour => {
        const len = this._tourLength(tour);
        tour.forEach((u, idx) => {
          const v = tour[(idx + 1) % tour.length];
          this.pheromone[u][v] += 1 / len;
          this.pheromone[v][u] += 1 / len;
        });
      });
    }

    // Отрисовываем лучший маршрут
    this.drawCities();
    if (this.bestTour) {
      this.ctx.beginPath();
      const s = this.cities[this.bestTour[0]];
      this.ctx.moveTo(s.x, s.y);
      this.bestTour.forEach(idx => {
        const c = this.cities[idx];
        this.ctx.lineTo(c.x, c.y);
      });
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth   = 2;
      this.ctx.stroke();
    }

    alert(`Лучший маршрут ACO длина: ${this.bestLen.toFixed(2)}`);
  }

  _tourLength(tour) {
    let sum = 0;
    for (let i = 0; i < tour.length; i++) {
      const a = tour[i], b = tour[(i + 1) % tour.length];
      sum += this.distances[a][b];
    }
    return sum;
  }
}


// Инициализация всех алгоритмов после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
  
  // Показываем первый интерфейс по умолчанию
  AlgorithmUI.switchAlgorithm('aStarInterface');
});
