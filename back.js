document.addEventListener('DOMContentLoaded', () => {
  App.initialize();
});

const App = {  /*для визуализации поиска пути на сетке (алгоритм А*)*/
  gridSize: 0,  /*состояние приложения*/
  startNode: null,
  endNode: null,
  obstacles: new Set(),

  elements: {
    aStarButton: null,
    aStarInterface: null,
    generateGridButton: null,
    gridSizeInput: null,
    gridDisplay: null,
    findPathButton: null,
  },

  initialize() {
    this.elements.aStarButton = document.getElementById('aStarButton');
    this.elements.aStarInterface = document.getElementById('aStarInterface');
    this.elements.generateGridButton = document.getElementById('generateGridButton');
    this.elements.gridSizeInput = document.getElementById('gridSizeInput');
    this.elements.gridDisplay = document.getElementById('gridDisplay');
    this.elements.findPathButton = document.getElementById('findPathButton');

    this.bindUIEvents();  /*по кнопкам привязывать*/
  },

  bindUIEvents() {  /*привязывать обработчики событий для интерфейса*/
    this.elements.aStarButton.addEventListener('click', () => {  /*отображение панели алгоритма при нажатии*/
      this.elements.aStarInterface.classList.add('show');
    });

    this.elements.generateGridButton.addEventListener('click', () => {  /*генерить сетку при нажатии*/
      this.generateGrid();
    });

    this.elements.findPathButton.addEventListener('click', () => {  /*искать путь при нажатии*/
      this.findPath();
    });

    this.elements.gridDisplay.addEventListener('click', (event) => {  /*клик переносится на контейнер сетки*/
      this.handleCellClick(event);
    })
  },

  generateGrid() {  /*генерить сетку*/
    const size = parseInt(this.elements.gridSizeInput.value);  /*число преобразовывать в размер*/
    if (size < 2 || size > 20) {  /*допустимый ли размер*/
      alert('Размер сетки должен быть от 2 до 20');
      return;
    }

    this.gridSize = size;  /*инициализируем состояние приложения*/
    this.startNode = null;
    this.endNode = null;
    this.obstacles.clear();
    this.elements.gridDisplay.innerHTML = '';
    this.elements.gridDisplay.style.gridTemplateColumns = `repeat(${size}, 40px)`;

    for (let i = 0; i < size * size; i++) {  /*клетки сетки делать*/
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      cell.dataset.x = Math.floor(i / size);  /*считать координаты клетки по индексам*/
      cell.dataset.y = i % size;
      this.elements.gridDisplay.appendChild(cell);
    }

    this.elements.gridDisplay.classList.remove('hidden-element');  /*отображение сетки и кнопки поиска пути*/
    this.elements.findPathButton.classList.remove('hidden-element');
  },

  handleCellClick(event) {  /*клик по клетке сетки (обрабатывать)*/
    const cell = event.target;
    if (!this.startNode) {  /*если стартовую клетку не выбрали*/
      this.clearCellsByClass('start-point');
      this.startNode = cell;
      cell.classList.add('start-point');
    }
    else if (!this.endNode && cell !== this.startNode) {  /*выбираем конечную, если выбрали начальную (чтобы не совпадали)*/
      this.clearCellsByClass('end-point');
      this.endNode = cell;
      cell.classList.add('end-point');
    }
    else if (cell !== this.startNode && cell !== this.endNode) {  /*клетка-препятствие(если не старт/конец)*/
      cell.classList.toggle('obstacle-cell');
      this.obstacles.add(cell);
    }
  },

  findPath() {  /*искать путь от стартовой до конечной точки через А* алгоритм*/
    if (!this.startNode || !this.endNode) {
      alert('Установите стартовую и конечную точки');
      return;
    }
    this.clearPathVisuals();  /*прошлый найденный путь чистим*/
    const path = PathFinder.aStar(this.startNode, this.endNode, this.gridSize, this.elements.gridDisplay);  /*поиск запускаем*/
    path ? this.displayPath(path) : alert('Путь не существует');  /*выводим результат*/
  },

  clearPathVisuals() {  /*чистим визуал*/
    document.querySelectorAll('.path-cell').forEach(cell => cell.classList.remove('path-cell'));
  },

  displayPath(pathArray) {  /*отображаем найденный путь */
    pathArray.forEach(cell => cell.classList.add('path-cell'));
  },

  clearCellsByClass(className) {  /*удаляем класс у всех клеток с указанным класом*/
    document.querySelectorAll(`.${className}`).forEach(cell => cell.classList.remove(className));
  }
};

const PathFinder = {  /*А*-алгоритм(искать путь)*/
  aStar(startCell, endCell, gridSize, gridContainer) {
    const startCoords = Helpers.getCellCoordinates(startCell);  /*делаем координаты из данных клеток*/
    const endCoords = Helpers.getCellCoordinates(endCell);

    let openList = [Helpers.createNode(startCoords.x, startCoords.y, 0, null, endCoords)];  /*очередь узлов*/
    const closedSet = new Set();  /*множестов узлов*/
    const nodeMap = new Map([[Helpers.nodeKey(startCoords), openList[0]]]);  /*хэш таблица для доступа к узлам*/

    while (openList.length > 0) {
      const currentNode = openList.sort((a, b) => a.f - b.f).shift();  /*сорт. по f (g+h) и минимальный узел*/

      if (currentNode.x === endCoords.x && currentNode.y === endCoords.y) {  /*если дошли до нужной, рисуем путь*/
        return Helpers.reconstructPath(currentNode, gridContainer);
      }

      closedSet.add(Helpers.nodeKey(currentNode));  /*текущий узел - обработанный*/

      Helpers.getNeighbors(currentNode, gridSize).forEach(neighbor => {  /*для соседей текущего узла*/
        if (closedSet.has(Helpers.nodeKey(neighbor)) || Helpers.isObstacle(neighbor, gridContainer)) return;  /*скип, если препят. или уже обработ.*/

        const tentativeG = currentNode.g + 1;  /*цена перемещения в соседний*/
        const storedNode = nodeMap.get(Helpers.nodeKey(neighbor));

        if (!storedNode || tentativeG < storedNode.g) {  /*узел не был посещен*/
          const newNode = Helpers.createNode(neighbor.x, neighbor.y, tentativeG, currentNode, endCoords);
          nodeMap.set(Helpers.nodeKey(newNode), newNode);
          if (!storedNode) openList.push(newNode);
        }
      });
    }
    return null;  /*путь не нашелся*/
  }
};

const Helpers = {
  getCellCoordinates(cell) {  /*преобразовывать коордитаны клетки из dataset в числовой объект*/
    return {
      x: parseInt(cell.dataset.x),
      y: parseInt(cell.dataset.y)
    };
  },

  createNode(x, y, g, parent, end) {  /*делать узел для поиска с учетом эвристики*/
    const h = Math.abs(x - end.x) + Math.abs(y - end.y);
    return { x, y, g, h, f: g + h, parent };
  },

  nodeKey(node) {  /*возвращать уникальный ключ узла*/
    return `${node.x},${node.y}`;
  },

  getNeighbors(node, gridSize) {  /*возвращать массив соседних узлов в пределах сетки*/
    const directions = [
      { x: node.x + 1, y: node.y },
      { x: node.x - 1, y: node.y },
      { x: node.x, y: node.y + 1 },
      { x: node.x, y: node.y - 1 }
    ];
    return directions.filter(neighbor =>
        neighbor.x >= 0 && neighbor.x < gridSize &&
        neighbor.y >= 0 && neighbor.y < gridSize
    );
  },

  reconstructPath(node, gridContainer) {  /*реконструировать путь от конечного до начального через цепочку узлов*/
    const path = [];
    while (node) {
      const cell = this.getCellByCoordinates(node.x, node.y, gridContainer);  /*DOM-элементы поиск по узлам*/
      path.push(cell);
      node = node.parent;
    }
    return path.reverse();
  },

  getCellByCoordinates(x, y, gridContainer) {  /*поиск клетки в DOM по коорд.*/
    return Array.from(gridContainer.children).find(cell =>
        parseInt(cell.dataset.x) === x && parseInt(cell.dataset.y) === y
    );
  },

  isObstacle(neighbor, gridContainer) {   /*препятствие ли клетка, проверка через css класс*/
    return Array.from(gridContainer.children).some(cell =>
        parseInt(cell.dataset.x) === neighbor.x &&
        parseInt(cell.dataset.y) === neighbor.y &&
        cell.classList.contains('obstacle-cell')
    );
  }
};
