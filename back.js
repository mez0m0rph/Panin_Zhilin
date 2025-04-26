const AlgorithmUI = {  // переключение между интерфейсами
  switchAlgorithm(id) {  // у всех элементов .algorithm-interface убираем css-класс show, 
                         // а потом добавляем show к блоку, чей id передается (чтобы при нажатии на алгоритм
                         // отображался только нужный раздел, а остальные были скрыты)
    document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('show');
  }
};

document.querySelectorAll('.algo-btn').forEach(btn =>  // добавляем обработчик на все кнопки algo-btn
                                                       // на каждую кнопку algo-btn вешаем обработчик клика
                                                       // он вызывает switchAlgorithm, передает значение data-algo
                                                       // (чтобы кнопки отображали нужные панели)
  btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo))
);


class AStar {  // А* (построение пути на сетке)
  constructor() {
    // dom-элементы (узлы html, через них читать/менять свойства/атрибуты)
    this.sizeInput = document.getElementById('gridSizeInput');  
                        // сейвит ссылки на поля ввода/кнопки в свойства объекта 
                        // (чтобы дальше с ними работать)
    this.generateBtn = document.getElementById('generateGridButton');
                        // при клике вызывает createGrid
                        // считывает размер введенной сетки, чистит прошлую
                        // создает новую
    this.findBtn = document.getElementById('findPathButton');
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
      alert('введите размер N ≥ 3');
      return;
    }
    
    this.grid  = [];
              // убираем старые данные 
    this.start = this.end = null;
              // отмеченные точки сбрасываем
    this.gridContainer.innerHTML = '';
              // старые div'ы из контейнера удаляем 
    this.gridContainer.style.gridTemplateColumns = `repeat(${N}, 40px)`; 
              // делаем css-grid колонки (делаем N колонок, каждая 40 пикселей по ширине)

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
                  // делаем N на N ячеек
        const cellElem = document.createElement('div');
                  // делаем новый div, класс для него grid-cell
        cellElem.className = 'grid-cell';
        cellElem.addEventListener('click', () => this.onCellClick(r, c, cellElem));
                  // привязываем к этому div'у метод onCellClick(r, c, elem)
        this.gridContainer.appendChild(cellElem);
                  // кидаем элемент в контейнер, чтобы он появлился в dom'е
        this.grid.push({ r, c, type: 'empty', elem: cellElem });
                  // инфо про ячейку сохраняем
      }
    }
  }

  onCellClick(r, c, elem) {
                  // логика: первый клик - зеленая кнопка
                  // второй клик - красная кнопка
                  // клики дальше - свич между empty и obstacle (смена цвета)
    const cell = this.grid.find(x => x.r === r && x.c === c);
                  // находим объект ячейки по координатам (в this.grid)
    if (!this.start) { // если старт не задан, задаем это стартом
      cell.type = 'start';
      this.start = cell;
      elem.style.background = '#2ecc71';  // красим в зеленый
    }
    else if (!this.end && cell.type === 'empty') {  // если финиш не задан, задаем финишом это
      cell.type = 'end';
      this.end = cell;
      elem.style.background = '#e74c3c';  // красим в красный
    }
    else if (cell.type === 'empty') {  // когда пустая клетка, делаем ее препятствием
      cell.type = 'obstacle';
      elem.style.background = '#2c3e50';  // красим в синий
    }
    else if (cell.type === 'obstacle') {  // когда препятствиие - делаем свободной
      cell.type = 'empty';
      elem.style.background = 'lightgray';  // красим в цвет пустой клетки  
    }
  }

  heuristic(a, b) {  // эвристика (оно же расстояние по клеткам по прямым осям)
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
                    // возвращает сумму алсолютных разниц по строкам и столбцам (r и c)
                    // юзается в A* для оценки кол-во оставшихся клеток до нужной клетки 
  }

  findPath() {
            // логика: юзаем open-сет (массив), карты gscore и fscore
            // пока open не пуст, выбираем узел с минимальным f
            // смотрим соседей (снизу/сверху/слева/справа)
            // обновляем оценки и записи в cameFrom
            // дошли до финиша - вызываем reconstruct
    if (!this.start || !this.end) {
      alert('Установите старт и финиш');
      return;
    }

    const open = [this.start];  // список клеток, которые надо проверить
    const cameFrom = new Map();  // map, чтобы путь восстанавливать 
    const gScore = new Map();  // бесконечный, кроме стартовой (там ноль)
    const fScore = new Map();  // gScore + эвристика

    this.grid.forEach(cell => {  // оценки
      gScore.set(cell, Infinity);
      fScore.set(cell, Infinity);
    });
    gScore.set(this.start, 0);
    fScore.set(this.start, this.heuristic(this.start, this.end));

    while (open.length > 0) {  // главный цикл (пока open не пуст)
      const current = open.reduce((a, b) => (  // current - узел с минимальным fScore
        fScore.get(a) < fScore.get(b) ? a : b
      ));

      if (current === this.end) {  // если дошли до цели, восстанавливаем путь 
        this.reconstruct(cameFrom, current);
        return;
      }

      open.splice(open.indexOf(current), 1);  // current удаляем из open

      [[1,0],[-1,0],[0,1],[0,-1]].forEach(([dr, dc]) => {
                      // для каждого направления (вверх/вниз... считаем соседнюю клетку)
        const nr = current.r + dr;
        const nc = current.c + dc;
        const neighbor = this.grid.find(x => x.r === nr && x.c === nc);
        if (!neighbor || neighbor.type === 'obstacle') return;
                      // если есть сосед, и он не препятствие
        const tentativeG = gScore.get(current) + 1;
        if (tentativeG < gScore.get(neighbor)) {  // если этот лучше старого gScore
          cameFrom.set(neighbor, current);  // обновляем соседа
          gScore.set(neighbor, tentativeG);
          fScore.set(neighbor, tentativeG + this.heuristic(neighbor, this.end));
          if (!open.includes(neighbor)) open.push(neighbor); 
                      // если neighbor не в open'e, добавляем его туда
        }
      });
    }

    alert('Путь не найден');
  }

  reconstruct(cameFrom, current) {  // восстановление пути
                  // логика: идем от старта к финишу, цвета старта и финиша не меняем
    while (cameFrom.has(current)) {  // с конечной проходим 
      if (current !== this.end) {
        current.elem.style.background = '#f1c40f'; // путь в желтый
      }
      current = cameFrom.get(current);  // когда цикл прошли, current равен старту
    }
  }
}

class KMeans {  // K-Means (генерация и кластеризация точек)
  constructor() {
    this.canvas    = document.getElementById('kmeansCanvas');
    this.ctx       = this.canvas.getContext('2d');
    this.pCount    = document.getElementById('kmeansPointCount');
    this.kInput    = document.getElementById('kmeansK');
    this.genBtn    = document.getElementById('kmeansGenerateBtn');
    this.runBtn    = document.getElementById('kmeansRunBtn');
    this.points    = [];
    this.centroids = [];

    this.genBtn.addEventListener('click', () => this.genPoints());
    this.runBtn.addEventListener('click', () => this.cluster());
  }

  genPoints() {  // генерация случайных точек
    const n = +this.pCount.value;
    this.points = Array.from({ length: n }, () => [
      Math.random() * this.canvas.width,
      Math.random() * this.canvas.height
    ]);
    this.draw();
  }

  draw() {  // отрисовка точек (черные квадратики)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach(p => {
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(p[0]-3, p[1]-3, 6, 6);
    });
  }

  cluster() {  // сама кластеризация
    const k = +this.kInput.value;
    if (k < 1 || k > this.points.length) return;
    this.centroids = this.points.slice(0, k);
    let changed = true;
    let assignments = [];

    while (changed) {
      changed = false;
      // назначаем каждому ближайший центроид
      assignments = this.points.map(p => {
        const ds = this.centroids.map(c => Math.hypot(p[0]-c[0], p[1]-c[1]));
        return ds.indexOf(Math.min(...ds));
      });
      // пересчитываем центроиды
      for (let i = 0; i < k; i++) {
        const cluster = this.points.filter((_, idx) => assignments[idx] === i);
        const meanX = cluster.reduce((s,p) => s+p[0],0)/cluster.length;
        const meanY = cluster.reduce((s,p) => s+p[1],0)/cluster.length;
        if (meanX !== this.centroids[i][0] || meanY !== this.centroids[i][1]) {
          changed = true;
          this.centroids[i] = [ meanX, meanY ];
        }
      }
    }

    // отображаем
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.points.forEach((p, idx) => {
      this.ctx.fillStyle = `hsl(${assignments[idx]*360/k},70%,50%)`;
      this.ctx.fillRect(p[0]-3, p[1]-3, 6, 6);
    });
    this.centroids.forEach(c => {
      this.ctx.beginPath();
      this.ctx.arc(c[0], c[1], 8, 0, 2*Math.PI);
      this.ctx.strokeStyle = '#000';
      this.ctx.stroke();
    });
  }
}


class GeneticTSP {  // генетика
              // логика: инициализируем популяцию случайных маршрутов
              // для каждого поколения считаем длину маршрута
              // сортируем по лучшей длине
              // сохраняем лучший 
              // отбираем 20%
              // кроссовер и мутация для заполнения популяции 
              // рисуем лучший маршрут и выводим длину
  constructor() {
    this.canvas = document.getElementById('geneticCanvas'); // dom-элементы
    this.ctx = this.canvas.getContext('2d');
    this.runBtn = document.getElementById('runGeneticBtn');
    this.resetBtn = document.getElementById('resetGeneticBtn');
    this.outputEl = document.getElementById('bestDistanceDisplay');

    // Данные:
    this.cities    = [];    // [{x, y}, ...]
    this.bestRoute = null;  // [idx0, idx1, ..., idx0]

    // События:
    // Клик по холсту — добавление города
    this.canvas.addEventListener('click', (e) => this.addCity(e));
    this.runBtn.addEventListener('click',  () => this.runGA());
    this.resetBtn.addEventListener('click',() => this.reset());
  }

  /**
   * Добавление нового города в массив и перерисовка всех городов.
   */
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

  /**
   * Генетический алгоритм:
   * 1. Инициализация популяции случайных маршрутов.
   * 2. Для каждого поколения:
   *    a) Оценка (вычисление длины маршрута).
   *    b) Сортировка по лучшей длине.
   *    c) Сохранение лучшего (и замыкание цикла).
   *    d) Отбор топ-20%.
   *    e) Кроссовер и мутация для заполнения популяции.
   * 3. Отрисовка лучшего маршрута и вывод длины.
   */
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
    this.outputEl.textContent = Лучшая длина маршрута: ${bestDistance.toFixed(2)};
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

  /**
   * Одноточечный кроссовер:
   * - выбираем случайный отрезок в parentA,
   * - сохраняем его, затем дополняем генами из parentB в порядке.
   */
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

  /**
   * Вычисление длины цикла маршрута (последний → первый тоже считается)
   */
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


//////////////////////////////////
// Муравьиный алгоритм (ACO) — TSP
//////////////////////////////////
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

  /**
   * Запуск ACO:
   * - собираем параметры α, β, ρ, число муравьев и итераций,
   * - строим матрицы расстояний и феромона,
   * - для каждой итерации моделируем маршруты муравьев,
   * - испаряем феромон, осаждаем по всем маршрутам,
   * - сохраняем лучший маршрут и рисуем его.
   */
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

    alert(Лучший маршрут ACO длина: ${this.bestLen.toFixed(2)});
  }

  /**
   * Подсчёт длины цикла тура (последний→первый также считается).
   * @param {number[]} tour — массив индексов городов
   * @returns {number} длина маршрута
   */
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
});
