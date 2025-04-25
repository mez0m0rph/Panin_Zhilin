// ==================== Общие утилиты ====================
const AlgoInterfaceManager = {
    // Переключение интерфейсов между разными алгоритмами
    // algorithmId: строковый идентификатор интерфейса (например, "astar", "genetic", "kmeans", "ant")
    switchInterface: (algorithmId) => {
        // Скрываем все интерфейсы
        document.querySelectorAll('.algo-interface').forEach(uiSection => {
            uiSection.classList.add('hidden');
        });
        // Показываем выбранный интерфейс
        document.getElementById(`${algorithmId}-interface`).classList.remove('hidden');
    }
};

document.querySelectorAll('.algo-btn').forEach(button => {
    // У каждого селектора алгоритма есть data-algo с идентификатором интерфейса
    button.addEventListener('click', () => {
        AlgoInterfaceManager.switchInterface(button.dataset.algo);
    });
});

// ==================== A* Algorithm ====================
// Класс реализует поиск кратчайшего пути на квадратной сетке с препятствиями
class AStar {
    constructor() {
        // Матрица узлов (объекты с координатами и типом)
        this.nodeGrid = [];
        // Стартовый узел и целевой узел
        this.sourceNode = null;
        this.targetNode = null;
        // Размер стороны сетки
        this.matrixSize = 0;
        // DOM-элементы для управления алгоритмом
        this.elements = {
            gridContainer: document.getElementById('astar-grid'),    // контейнер сетки в HTML
            dimensionInput: document.getElementById('astar-size'),  // поле ввода размера сетки
            createBtn: document.getElementById('astar-generate'),   // кнопка генерации сетки
            searchBtn: document.getElementById('astar-find-path')   // кнопка запуска поиска пути
        };

        // Настраиваем обработчики событий
        this.initialize();
    }

    // Привязываем обработчики к кнопкам
    initialize() {
        this.elements.createBtn.addEventListener('click', () => this.createGrid());
        this.elements.searchBtn.addEventListener('click', () => this.searchPath());
    }

    // Генерация сетки размера matrixSize x matrixSize
    createGrid() {
        this.matrixSize = parseInt(this.elements.dimensionInput.value);
        if (this.matrixSize < 3) return; // минимальный размер 3

        // Очищаем предыдущие данные
        this.nodeGrid = [];
        this.elements.gridContainer.innerHTML = '';
        this.sourceNode = this.targetNode = null;

        // Настраиваем CSS сетки
        this.elements.gridContainer.style.gridTemplateColumns = `repeat(${this.matrixSize}, 30px)`;

        // Создаем ячейки и наполняем nodeGrid
        for (let rIndex = 0; rIndex < this.matrixSize; rIndex++) {
            for (let cIndex = 0; cIndex < this.matrixSize; cIndex++) {
                const tile = document.createElement('div');
                tile.className = 'grid-cell';
                tile.dataset.row = rIndex;
                tile.dataset.col = cIndex;
                tile.style.background = '#bdc3c7'; // начальный цвет пустой ячейки
                // Привязываем клик по ячейке для установки старта/финиша/препятствий
                tile.addEventListener('click', () => this.onTileClick(rIndex, cIndex, tile));
                this.elements.gridContainer.appendChild(tile);
                this.nodeGrid.push({ rIndex, cIndex, type: 'empty', tile });
            }
        }
    }

    /**
     * Обработчик клика по ячейке:
     * - Если нет стартовой точки, устанавливаем текущую как старт.
     * - Иначе если нет финишной точки, устанавливаем как финиш.
     * - Иначе переключаем пустую клетку/препятствие.
     */
    onTileClick(rIndex, cIndex, tile) {
        const node = this.nodeGrid.find(n => n.rIndex === rIndex && n.cIndex === cIndex);
        if (!node) return;

        if (!this.sourceNode) {
            node.type = 'start';         // помечаем как старт
            this.sourceNode = node;
            tile.style.background = '#2ecc71'; // зелёный
        } else if (!this.targetNode && node.type !== 'start') {
            node.type = 'end';           // помечаем как финиш
            this.targetNode = node;
            tile.style.background = '#e74c3c'; // красный
        } else if (node.type === 'obstacle') {
            node.type = 'empty';        // убираем препятствие
            tile.style.background = '#bdc3c7';
        } else if (node.type === 'empty') {
            node.type = 'obstacle';     // добавляем препятствие
            tile.style.background = '#2c3e50'; // тёмно-синий
        }
    }

    /**
     * Эвристическая функция Манхэттена:
     * Определяет примерное расстояние от nodeA до nodeB по вертикали и горизонтали.
     */
    estimateCost(nodeA, nodeB) {
        return Math.abs(nodeA.rIndex - nodeB.rIndex) + Math.abs(nodeA.cIndex - nodeB.cIndex);
    }

    // Запуск алгоритма A*: ищем кратчайший путь от sourceNode к targetNode
    searchPath() {
        if (!this.sourceNode || !this.targetNode) return;

        // Открытый список узлов для обработки
        const activeSet = [this.sourceNode];
        // Карта предшественников: как мы пришли в каждую ячейку
        const predecessors = new Map();
        // Карты стоимости пути от старта (gCost) и оценки полного пути (fCost = g + h)
        const gCost = new Map();
        const fCost = new Map();
        this.nodeGrid.forEach(node => {
            gCost.set(node, Infinity);
            fCost.set(node, Infinity);
        });
        gCost.set(this.sourceNode, 0);
        fCost.set(this.sourceNode, this.estimateCost(this.sourceNode, this.targetNode));

        // Основной цикл, пока есть узлы для обработки
        while (activeSet.length) {
            // Выбираем узел с минимальным fCost
            let currentNode = activeSet.reduce((a, b) => fCost.get(a) < fCost.get(b) ? a : b);
            if (currentNode === this.targetNode) {
                // Если достигли цели, реконструируем путь
                this.buildPath(predecessors, currentNode);
                return;
            }

            // Убираем текущий узел из открытого списка
            activeSet.splice(activeSet.indexOf(currentNode), 1);

            // Перебираем соседей (четыре направления)
            const adjacentNodes = this.getNeighbors(currentNode);
            adjacentNodes.forEach(neighbor => {
                // Пропускаем препятствия
                if (neighbor.type === 'obstacle') return;
                const tentativeG = gCost.get(currentNode) + 1; // стоимость перемещения = 1
                if (tentativeG < gCost.get(neighbor)) {
                    // Обновляем маршрут через currentNode
                    predecessors.set(neighbor, currentNode);
                    gCost.set(neighbor, tentativeG);
                    fCost.set(neighbor, tentativeG + this.estimateCost(neighbor, this.targetNode));
                    // Добавляем в открытый список, если ещё нет
                    if (!activeSet.includes(neighbor)) activeSet.push(neighbor);
                }
            });
        }

        // Если пошло не так -- путь не найден
        alert('Путь не найден');
    }

    // Получение соседних узлов в четырёх направлениях (верх, вниз, влево, вправо)
    getNeighbors(node) {
        const directions = [[1,0],[-1,0],[0,1],[0,-1]];
        return directions.map(([dr, dc]) => {
            const neighbor = this.nodeGrid.find(n => n.rIndex === node.rIndex + dr && n.cIndex === node.cIndex + dc);
            return neighbor;
        }).filter(Boolean);
    }

    // Реконструкция и отрисовка пути, начиная с targetNode обратно до sourceNode
    buildPath(predecessors, currentNode) {
        while (predecessors.has(currentNode)) {
            if (currentNode.type !== 'end') {
                currentNode.tile.style.background = '#f1c40f'; // жёлтый цвет пути
            }
            currentNode = predecessors.get(currentNode);
        }
    }
}

// ==================== Генетический алгоритм TSP ====================
// Реализация генетического алгоритма для приближённого решения задачи коммивояжёра
class GeneticTSP {
    constructor() {
        // Настройка холста для отрисовки городов и маршрута
        this.cityCanvas = document.getElementById('genetic-canvas');
        this.cityCtx = this.cityCanvas.getContext('2d');
        this.canvasWidth = this.cityCanvas.width;
        this.canvasHeight = this.cityCanvas.height;
        // Список городов в формате {x, y}
        this.locations = [];
        // Популяция маршрутов (каждый маршрут — массив городов)
        this.popGroup = [];
        // Лучший найденный за всё время маршрут
        this.bestPath = null;
        // DOM-элементы управления алгоритмом
        this.elements = {
            numCitiesInput: document.getElementById('genetic-city-count'),
            popSizeInput: document.getElementById('genetic-pop-size'),
            genCountInput: document.getElementById('genetic-generations'),
            initBtn: document.getElementById('genetic-generate'),
            executeBtn: document.getElementById('genetic-run')
        };
        this.initialize();
    }

    // Привязка событий к кнопкам
    initialize() {
        this.elements.initBtn.addEventListener('click', () => this.setupScenario());
        this.elements.executeBtn.addEventListener('click', () => this.runEvolution());
    }

    // Генерация случайных городов и начальной популяции
    setupScenario() {
        this.locations = [];
        const totalCities = parseInt(this.elements.numCitiesInput.value);
        for (let i = 0; i < totalCities; i++) {
            this.locations.push({ x: Math.random() * this.canvasWidth, y: Math.random() * this.canvasHeight });
        }
        this.popGroup = this.generateInitialPopulation();
        this.bestPath = null;
        this.render(); // отрисовываем начальное состояние
    }

    // Формирование начальной популяции случайных перестановок городов
    generateInitialPopulation() {
        const initial = [];
        const size = parseInt(this.elements.popSizeInput.value);
        for (let i = 0; i < size; i++) initial.push(this.randomize([...this.locations]));
        return initial;
    }

    // Перестановка (тасование) массива методом Фишера–Йетса
    randomize(arr) {
        for (let idx = arr.length - 1; idx > 0; idx--) {
            const swapIdx = Math.floor(Math.random() * (idx + 1));
            [arr[idx], arr[swapIdx]] = [arr[swapIdx], arr[idx]];
        }
        return arr;
    }

    // Вычисление общей длины пути (сумма эвклидовых расстояний между последовательными городами)
    computeDistance(route) {
        return route.slice(0, -1).reduce((sum, pt, i) => {
            const nxt = route[i + 1];
            return sum + Math.hypot(pt.x - nxt.x, pt.y - nxt.y);
        }, 0);
    }

    // Оценка и ранжирование популяции (сортировка по возрастанию длины маршрута)
    rankGroup() {
        const scored = this.popGroup.map(route => ({ route, dist: this.computeDistance(route) }));
        scored.sort((a, b) => a.dist - b.dist);
        this.popGroup = scored.map(o => o.route);
        // Обновляем лучший маршрут, если текущий лучше
        if (!this.bestPath || scored[0].dist < this.computeDistance(this.bestPath)) {
            this.bestPath = [...scored[0].route];
        }
    }

    // Селекция: сохраняем топ-10% и доукомплектовываем турнирным отбором
    selectParents() {
        const survivors = [];
        const eliteCount = Math.floor(this.popGroup.length * 0.1);
        // Добавляем элиту
        for (let i = 0; i < eliteCount; i++) survivors.push(this.popGroup[i]);
        // Турнир между случайными парами
        while (survivors.length < this.popGroup.length) {
            const a = Math.floor(Math.random() * this.popGroup.length);
            const b = Math.floor(Math.random() * this.popGroup.length);
            survivors.push(this.computeDistance(this.popGroup[a]) < this.computeDistance(this.popGroup[b])
                ? [...this.popGroup[a]]
                : [...this.popGroup[b]]);
        }
        return survivors;
    }

    // Кроссовер порядка (Order Crossover, OX): берем случайный сегмент из parentA и дополняем городами из parentB
    mix(parentA, parentB) {
        const cutA = Math.floor(Math.random() * parentA.length);
        const cutB = Math.floor(Math.random() * parentA.length);
        // Берем сегмент между cutA и cutB из первого родителя
        const segment = parentA.slice(Math.min(cutA, cutB), Math.max(cutA, cutB));
        const child = [...segment];
        // Заполняем оставшиеся позиции в порядке следования во втором родителе
        parentB.forEach(city => { if (!child.includes(city)) child.push(city); });
        return child;
    }

    // Мутация: меняем местами два случайных города
    mutate(route) {
        const i = Math.floor(Math.random() * route.length);
        const j = Math.floor(Math.random() * route.length);
        [route[i], route[j]] = [route[j], route[i]];
        return route;
    }

    // Создание нового поколения: ранжируем, отбираем родителей, применяем кроссовер и мутацию
    evolveGeneration() {
        this.rankGroup();
        const parents = this.selectParents();
        const nextGen = [];
        parents.forEach((mom, idx) => {
            let kid = this.mix(mom, parents[(idx + 1) % parents.length]);
            // С вероятностью 1% выполняем мутацию
            if (Math.random() < 0.01) kid = this.mutate(kid);
            nextGen.push(kid);
        });
        this.popGroup = nextGen;
    }

    // Запуск алгоритма на заданное число поколений и отрисовка финального результата
    runEvolution() {
        const iterations = parseInt(this.elements.genCountInput.value);
        for (let gen = 0; gen < iterations; gen++) this.evolveGeneration();
        this.render();
    }

    // Отрисовка городов и лучшего маршрута на холсте
    render() {
        this.cityCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.locations.forEach(({ x, y }) => {
            this.cityCtx.beginPath();
            this.cityCtx.arc(x, y, 4, 0, 2 * Math.PI);
            this.cityCtx.fill();
        });
        if (this.bestPath) {
            this.cityCtx.beginPath();
            this.cityCtx.moveTo(this.bestPath[0].x, this.bestPath[0].y);
            this.bestPath.forEach(pt => this.cityCtx.lineTo(pt.x, pt.y));
            this.cityCtx.stroke();
        }
    }
}

// ==================== K-средние ====================
// Класс реализует алгоритм k-средних для кластеризации двумерных точек
class KMeans {
    constructor() {
        this.dataCanvas = document.getElementById('kmeans-canvas');
        this.dataCtx = this.dataCanvas.getContext('2d');
        this.canvasWidth = this.dataCanvas.width;
        this.canvasHeight = this.dataCanvas.height;
        this.dataPoints = [];   // массив точек [x,y]
        this.centers = [];      // текущие координаты центроидов
        this.assignments = [];
        this.elements = {
            pointCountInput: document.getElementById('kmeans-point-count'),
            kValueInput: document.getElementById('kmeans-k'),
            initBtn: document.getElementById('kmeans-generate'),
            iterateBtn: document.getElementById('kmeans-run')
        };
        this.initialize();
    }

    initialize() {
        this.elements.initBtn.addEventListener('click', () => this.setupPoints());
        this.elements.iterateBtn.addEventListener('click', () => this.runClustering());
    }

    // Генерация случайного набора точек и инициализация центроид
    setupPoints() {
        this.dataPoints = [];
        const total = parseInt(this.elements.pointCountInput.value);
        for (let i = 0; i < total; i++) {
            this.dataPoints.push([Math.random() * this.canvasWidth, Math.random() * this.canvasHeight]);
        }
        const k = parseInt(this.elements.kValueInput.value);
        // Выбираем случайные точки в качестве начальных центроид
        this.centers = Array(k).fill().map(() => [...this.dataPoints[Math.floor(Math.random() * this.dataPoints.length)]]);
        this.render();
    }

    /**
     * Запуск итераций кластеризации:
     * 1) Присвоение каждой точки ближайшему центроиду
     * 2) Обновление координат центроид как среднее точек кластеров
     */
    runClustering(iterations = 10) {
        for (let iter = 0; iter < iterations; iter++) {
            // Шаг 1: присвоение кластеров
            this.assignments = this.dataPoints.map(pt => {
                const dists = this.centers.map(c => Math.hypot(pt[0] - c[0], pt[1] - c[1]));
                return dists.indexOf(Math.min(...dists));
            });
            // Шаг 2: пересчет центроид
            const sums = this.centers.map(() => [0, 0]);
            const counts = Array(this.centers.length).fill(0);
            this.dataPoints.forEach((pt, idx) => {
                const cid = this.assignments[idx];
                sums[cid][0] += pt[0]; sums[cid][1] += pt[1]; counts[cid]++;
            });
            this.centers = sums.map((sum, idx) => counts[idx] ? [sum[0] / counts[idx], sum[1] / counts[idx]] : this.centers[idx]);
        }
        this.render();
    }

    // Визуализация точек (цвет по кластеру) и центроид
    render() {
        this.dataCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.dataPoints.forEach((pt, idx) => {
            const colorHue = (this.assignments[idx] || 0) * 60;
            this.dataCtx.fillStyle = `hsl(${colorHue}, 50%, 50%)`;
            this.dataCtx.fillRect(pt[0] - 3, pt[1] - 3, 6, 6);
        });
        this.centers.forEach(center => {
            this.dataCtx.strokeStyle = '#000';
            this.dataCtx.beginPath();
            this.dataCtx.arc(center[0], center[1], 8, 0, 2 * Math.PI);
            this.dataCtx.stroke();
        });
        this.dataCtx.fillStyle = '#000';
    }
}

// ==================== Муравьиный алгоритм ====================
// Класс реализует алгоритм колонии муравьев для задачи коммивояжёра
class AntColony {
    constructor() {
        this.routeCanvas = document.getElementById('ant-canvas');
        this.routeCtx = this.routeCanvas.getContext('2d');
        this.canvasWidth = this.routeCanvas.width;
        this.canvasHeight = this.routeCanvas.height;
        this.nodes = [];           // координаты городов
        this.distMatrix = [];      // матрица расстояний
        this.pheromoneMatrix = []; // матрица уровней феромонов
        this.elements = {
            nodeCountInput: document.getElementById('ant-city-count'),
            antNumInput: document.getElementById('ant-count'),
            alphaInput: document.getElementById('ant-alpha'),
            betaInput: document.getElementById('ant-beta'),
            evapRateInput: document.getElementById('ant-rho'),
            iterCountInput: document.getElementById('ant-iterations'),
            setupBtn: document.getElementById('ant-generate'),
            startBtn: document.getElementById('ant-run')
        };
        this.initialize();
    }

    initialize() {
        this.elements.setupBtn.addEventListener('click', () => this.setupNetwork());
        this.elements.startBtn.addEventListener('click', () => this.executeAnts());
    }

    /**
     * Генерация городов и инициализация матриц:
     * - nodes: случайные координаты
     * - distMatrix: расчёт евклидовых расстояний
     * - pheromoneMatrix: начальный уровень феромонов = 1
     */
    setupNetwork() {
        const total = parseInt(this.elements.nodeCountInput.value);
        this.nodes = Array(total).fill().map(() => ({ x: Math.random() * this.canvasWidth, y: Math.random() * this.canvasHeight }));
        this.distMatrix = Array(total).fill().map(() => Array(total).fill(0));
        this.pheromoneMatrix = Array(total).fill().map(() => Array(total).fill(1));
        for (let i = 0; i < total; i++) {
            for (let j = 0; j < total; j++) {
                this.distMatrix[i][j] = i === j ? Infinity : Math.hypot(
                    this.nodes[i].x - this.nodes[j].x,
                    this.nodes[i].y - this.nodes[j].y
                );
            }
        }
        this.renderNodes();
    }

    /**
     * Основной цикл колонии муравьев:
     * 1) Каждый муравей строит свой тур по вероятностному правилу
     * 2) Обновление матрицы феромонов: испарение + осаждение
     * 3) Сохраняем лучший найденный тур
     */
    executeAnts() {
        const antCount = parseInt(this.elements.antNumInput.value);
        const alpha = parseFloat(this.elements.alphaInput.value);
        const beta = parseFloat(this.elements.betaInput.value);
        const evap = parseFloat(this.elements.evapRateInput.value);
        const iterations = parseInt(this.elements.iterCountInput.value);
        let bestTour = null;
        let bestLen = Infinity;

        for (let iter = 0; iter < iterations; iter++) {
            const allTours = [];
            for (let a = 0; a < antCount; a++) {
                const tour = [0];             // старт из города 0
                const visited = new Set(tour);
                // Строим маршрут до тех пор, пока не посетим все города
                while (tour.length < this.nodes.length) {
                    const last = tour[tour.length - 1];
                    // Вычисление вероятностей для каждого непосещённого города
                    const probs = this.nodes.map((_, idx) => {
                        if (visited.has(idx)) return 0;
                        return Math.pow(this.pheromoneMatrix[last][idx], alpha) * Math.pow(1 / this.distMatrix[last][idx], beta);
                    });
                    const totalProb = probs.reduce((sum, p) => sum + p, 0);
                    let r = Math.random() * totalProb;
                    // Выбираем следующий город на основе накопленного бюджета r
                    const next = probs.findIndex(p => (r -= p) <= 0);
                    tour.push(next);
                    visited.add(next);
                }
                allTours.push(tour);
                // Проверяем, если найден более короткий тур
                const length = this.calculateTourLength(tour);
                if (length < bestLen) {
                    bestLen = length;
                    bestTour = [...tour];
                }
            }
            // Испарение феромонов
            for (let i = 0; i < this.pheromoneMatrix.length; i++) {
                for (let j = 0; j < this.pheromoneMatrix.length; j++) {
                    this.pheromoneMatrix[i][j] *= (1 - evap);
                }
            }
            // Осаждение феромонов по всем турам
            allTours.forEach(tour => {
                const len = this.calculateTourLength(tour);
                tour.forEach((nodeIdx, idx) => {
                    if (idx < tour.length - 1) {
                        const nextIdx = tour[idx + 1];
                        this.pheromoneMatrix[nodeIdx][nextIdx] += 1 / len;
                        this.pheromoneMatrix[nextIdx][nodeIdx] += 1 / len;
                    }
                });
            });
        }
        this.renderTour(bestTour);
    }

    // Вычисление длины тура как суммы расстояний между последовательными узлами
    calculateTourLength(tour) {
        return tour.slice(0, -1).reduce((sum, idx, i, arr) => sum + this.distMatrix[idx][arr[i + 1]] , 0);
    }

    // Отрисовка узлов (городов)
    renderNodes() {
        this.routeCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this.nodes.forEach(({ x, y }) => {
            this.routeCtx.beginPath();
            this.routeCtx.arc(x, y, 5, 0, 2 * Math.PI);
            this.routeCtx.fill();
        });
    }

    // Отрисовка лучшего тура поверх узлов
    renderTour(tour) {
        this.renderNodes();
        if (!tour) return;
        this.routeCtx.beginPath();
        this.routeCtx.moveTo(this.nodes[tour[0]].x, this.nodes[tour[0]].y);
        tour.forEach(idx => {
            const { x, y } = this.nodes[idx];
            this.routeCtx.lineTo(x, y);
        });
        this.routeCtx.stroke();
    }
}

// Инициализация всех алгоритмов после загрузки страницы
window.addEventListener('DOMContentLoaded', () => {
    new AStar();
    new GeneticTSP();
    new KMeans();
    new AntColony();
});

// ==================== Логика решения алгоритмов ====================
// A* Algorithm:
// 1. Инициализация:
//    - Создаём openSet, в который кладём стартовый узел.
//    - Устанавливаем gCost (стоимость от старта) для всех узлов = Infinity, кроме стартового = 0.
//    - fCost (g + h) для стартового = эвристика до цели (Manhattan).
// 2. Основной цикл, пока openSet не пуст:
//    a) Берём узел с минимальным fCost.
//    b) Если это целевой узел, восстанавливаем путь по карте предшественников и завершаем.
//    c) Иначе убираем узел из openSet и для каждого свободного соседа:
//       - вычисляем tentativeG = gCost[current] + стоимость перехода (1).
//       - если tentativeG < gCost[neighbor], обновляем:
//         • предшественник[neighbor] = current;
//         • gCost[neighbor] = tentativeG;
//         • fCost[neighbor] = tentativeG + эвристика(neighbor, цель);
//         • если neighbor не в openSet, добавляем.
// 3. Если openSet опустел и цель не достигнута — путь не найден.

// Genetic TSP:
// 1. Генерация городов: случайные координаты на canvas.
// 2. Начальная популяция: создаём N маршрутов (перестановок городов).
// 3. Для каждого поколения (итерации):
//    a) Оцениваем пригодность каждого маршрута как суммарную длину (евклидово расстояние).
//    b) Сортируем популяцию по возрастанию длины.
//    c) Элитизм: сохраняем топ-10% без изменений.
//    d) Селекция: турнирный отбор для оставшихся.
//    e) Кроссовер (OX): для каждой пары родителей берём сегмент из первого и дополняем городами второго в порядке следования.
//    f) Мутация с малой вероятностью: меняем местами два случайных города в маршруте.
//    g) Новое поколение заменяет старое.
// 4. Повторяем до заданного числа поколений, результат — лучший маршрут за всё время.

// K-Means:
// 1. Случайно выбираем M точек (данные) на canvas.
// 2. Инициализируем K центроид случайными данными.
// 3. Повторяем итерации:
//    a) Для каждой точки вычисляем расстояния до всех центроид, присваиваем её ближайшему (кластер).
//    b) Для каждого кластера пересчитываем центр как среднее координат точек, ему относящихся.
// 4. Итерации повторяются до сходимости или заданного числа раз.
// 5. Результат — разбиение на кластеры и финальные координаты центроид.

// Ant Colony:
// 1. Генерация городов и инициализация:
//    - nodes[] — координаты городов;
//    - distMatrix[i][j] — евклидово расстояние между i, j;
//    - pheromoneMatrix[i][j] = 1.
// 2. Для каждой итерации:
//    a) Каждый из M муравьев строит тур:
//       - стартует из города 0, отмечает посещённые;
//       - на каждом шаге для перехода в непосещённый город вычисляет вероятность ∝ pheromone^α * (1/dist)^β;
//       - выбирает следующий город случайно согласно весам.
//    b) После построения всех туров обновляем матрицу феромонов:
//       - испарение: pheromone *= (1 - rho);
//       - осаждение: для каждого ребра в туре добавляем Δ = 1/длина_тура.
//    c) Отслеживаем лучший тур по минимальной длине.
// 3. По завершении итераций отображаем лучший маршрут.
