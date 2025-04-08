const aStarButton = document.getElementById('aStarButton');
const geneticButton = document.getElementById('geneticButton');
const aStarInterface = document.getElementById('aStarInterface');
const geneticInterface = document.getElementById('geneticInterface');

function showInterface(section) {
  aStarInterface.classList.remove('show');
  geneticInterface.classList.remove('show');
  section.classList.add('show');
}

aStarButton.addEventListener('click', () => showInterface(aStarInterface));
geneticButton.addEventListener('click', () => showInterface(geneticInterface));

let gridSize = 0;
let grid = [];
let startCell = null;
let endCell = null;
const gridSizeInput = document.getElementById('gridSizeInput');
const generateGridButton = document.getElementById('generateGridButton');
const gridDisplay = document.getElementById('gridDisplay');
const findPathButton = document.getElementById('findPathButton');

generateGridButton.addEventListener('click', () => {
  gridSize = parseInt(gridSizeInput.value);
  if(isNaN(gridSize) || gridSize <= 0) return;
  grid = [];
  gridDisplay.innerHTML = '';
  gridDisplay.classList.remove('hidden-element');
  findPathButton.classList.remove('hidden-element');
  startCell = null;
  endCell = null;
  for(let i = 0; i < gridSize; i++){
    let row = [];
    let rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    for(let j = 0; j < gridSize; j++){
      let cell = {i, j, type: 'empty'};
      row.push(cell);
      let cellDiv = document.createElement('div');
      cellDiv.classList.add('grid-cell');
      cellDiv.dataset.row = i;
      cellDiv.dataset.col = j;
      cellDiv.style.backgroundColor = 'lightgray';
      cellDiv.addEventListener('click', () => {
        if(!startCell){
          cell.type = 'start';
          startCell = cell;
          cellDiv.style.backgroundColor = '#00ff00';
        } else if(!endCell && cell.type !== 'start'){
          cell.type = 'end';
          endCell = cell;
          cellDiv.style.backgroundColor = '#ff0000';
        } else if(cell.type === 'obstacle'){
          cell.type = 'empty';
          cellDiv.style.backgroundColor = 'lightgray';
        } else if(cell.type === 'empty' && cell !== startCell && cell !== endCell){
          cell.type = 'obstacle';
          cellDiv.style.backgroundColor = 'black';
        }
      });
      rowDiv.appendChild(cellDiv);
    }
    grid.push(row);
    gridDisplay.appendChild(rowDiv);
  }
});

function heuristic(a, b) {
  return Math.abs(a.i - b.i) + Math.abs(a.j - b.j);
}

function getNeighbors(cell) {
  let neighbors = [];
  let dirs = [[-1,0],[1,0],[0,-1],[0,1]];
  for(let d of dirs){
    let ni = cell.i + d[0], nj = cell.j + d[1];
    if(ni >= 0 && ni < gridSize && nj >= 0 && nj < gridSize)
      neighbors.push(grid[ni][nj]);
  }
  return neighbors;
}

function runAStar() {
  if(!startCell || !endCell) { alert("Установите старт и финиш"); return; }
  let openSet = [];
  let cameFrom = new Map();
  let gScore = new Map();
  let fScore = new Map();
  function cellKey(c) { return c.i + ',' + c.j; }
  for(let row of grid) for(let cell of row) {
    gScore.set(cellKey(cell), Infinity);
    fScore.set(cellKey(cell), Infinity);
  }
  gScore.set(cellKey(startCell), 0);
  fScore.set(cellKey(startCell), heuristic(startCell, endCell));
  openSet.push(startCell);
  while(openSet.length > 0) {
    openSet.sort((a,b) => fScore.get(cellKey(a)) - fScore.get(cellKey(b)));
    let current = openSet.shift();
    if(current === endCell) { reconstructPath(cameFrom, current); return; }
    for(let neighbor of getNeighbors(current)){
      if(neighbor.type === 'obstacle') continue;
      let tentativeG = gScore.get(cellKey(current)) + 1;
      if(tentativeG < gScore.get(cellKey(neighbor))){
        cameFrom.set(cellKey(neighbor), current);
        gScore.set(cellKey(neighbor), tentativeG);
        fScore.set(cellKey(neighbor), tentativeG + heuristic(neighbor, endCell));
        if(!openSet.includes(neighbor)) openSet.push(neighbor);
      }
    }
  }
  alert("Маршрут не найден");
}

function reconstructPath(cameFrom, current) {
  let path = [current];
  while(cameFrom.has(current.i + ',' + current.j)) {
    current = cameFrom.get(current.i + ',' + current.j);
    path.push(current);
  }
  path.reverse();
  drawPath(path);
}

function drawPath(path) {
  let cellDivs = document.querySelectorAll('.grid-cell');
  cellDivs.forEach(div => {
    let row = parseInt(div.dataset.row);
    let col = parseInt(div.dataset.col);
    let cell = grid[row][col];
    if(cell.type === 'empty') div.style.backgroundColor = 'lightgray';
  });
  for(let cell of path) {
    let cellDiv = document.querySelector(`.grid-cell[data-row='${cell.i}'][data-col='${cell.j}']`);
    cellDiv.style.backgroundColor = 'yellow';
  }
}

findPathButton.addEventListener('click', runAStar);

const canvas = document.getElementById('geneticCanvas');
const ctx = canvas.getContext('2d');
const runGenAlgoBtn = document.getElementById('runGenAlgoBtn');
const resetGenAlgoBtn = document.getElementById('resetGenAlgoBtn');
const bestDistanceDisplay = document.getElementById('bestDistanceDisplay');
let points = [];
let population = [];
let bestIndividual = null;
let genCount = 0;
let genInterval = null;

canvas.addEventListener('click', (e) => {
  let rect = canvas.getBoundingClientRect();
  let x = e.clientX - rect.left;
  let y = e.clientY - rect.top;
  points.push({x, y});
  drawCanvas();
});

function drawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if(bestIndividual) {
    ctx.beginPath();
    let start = points[bestIndividual[0]];
    ctx.moveTo(start.x, start.y);
    for(let i = 1; i < bestIndividual.length; i++){
      ctx.lineTo(points[bestIndividual[i]].x, points[bestIndividual[i]].y);
    }
    ctx.lineTo(start.x, start.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  points.forEach(pt => {
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'blue';
    ctx.fill();
  });
}

function distance(order) {
  let d = 0;
  for(let i = 0; i < order.length; i++){
    let a = points[order[i]];
    let b = points[order[(i + 1) % order.length]];
    d += Math.hypot(a.x - b.x, a.y - b.y);
  }
  return d;
}

function initPopulation(popSize) {
  population = [];
  let baseOrder = Array.from({length: points.length}, (_, i) => i);
  for(let i = 0; i < popSize; i++){
    let order = baseOrder.slice().sort(() => Math.random() - 0.5);
    population.push(order);
  }
}

function tournamentSelection(k = 5) {
  let best = null;
  for(let i = 0; i < k; i++){
    let ind = population[Math.floor(Math.random() * population.length)];
    if(!best || distance(ind) < distance(best)) best = ind;
  }
  return best.slice();
}

function orderCrossover(parentA, parentB) {
  let start = Math.floor(Math.random() * parentA.length);
  let end = start + Math.floor(Math.random() * (parentA.length - start));
  let child = new Array(parentA.length).fill(null);
  for(let i = start; i < end; i++){
    child[i] = parentA[i];
  }
  let idx = 0;
  for(let i = 0; i < child.length; i++){
    if(child[i] === null){
      while(child.includes(parentB[idx])) idx++;
      child[i] = parentB[idx];
    }
  }
  return child;
}

function mutate(order, rate = 0.01) {
  for(let i = 0; i < order.length; i++){
    if(Math.random() < rate){
      let j = Math.floor(Math.random() * order.length);
      [order[i], order[j]] = [order[j], order[i]];
    }
  }
}

function evolveGen() {
  let newPop = [];
  population.sort((a, b) => distance(a) - distance(b));
  bestIndividual = population[0];
  bestDistanceDisplay.textContent = "Лучшее расстояние: " + distance(bestIndividual).toFixed(2);
  newPop.push(bestIndividual.slice());
  while(newPop.length < population.length){
    let parentA = tournamentSelection();
    let parentB = tournamentSelection();
    let child = orderCrossover(parentA, parentB);
    mutate(child);
    newPop.push(child);
  }
  population = newPop;
  genCount++;
  drawCanvas();
}

runGenAlgoBtn.addEventListener('click', () => {
  if(points.length < 3){ alert("Добавьте минимум 3 точки!"); return; }
  initPopulation(100);
  genCount = 0;
  if(genInterval) clearInterval(genInterval);
  genInterval = setInterval(evolveGen, 50);
});

resetGenAlgoBtn.addEventListener('click', () => {
  points = [];
  population = [];
  bestIndividual = null;
  genCount = 0;
  bestDistanceDisplay.textContent = "";
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if(genInterval) clearInterval(genInterval);
});
