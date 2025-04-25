// Utilities for interface switching
const AlgorithmUI = {
    switchAlgorithm(id) {
        document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
        const panel = document.getElementById(id);
        if (panel) panel.classList.add('show');
    }
};

document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo));
});

// A* Implementation
class AStar {
    constructor() {
        this.grid = [];
        this.start = null;
        this.end = null;
        this.sizeInput = document.getElementById('gridSizeInput');
        this.genBtn = document.getElementById('generateGridButton');
        this.findBtn = document.getElementById('findPathButton');
        this.container = document.getElementById('gridDisplay');
        this.attach();
    }
    attach() {
        this.genBtn.addEventListener('click', () => this.createGrid());
        this.findBtn.addEventListener('click', () => this.findPath());
    }
    createGrid() {
        const n = parseInt(this.sizeInput.value);
        if (isNaN(n) || n < 3) return;
        this.grid = [];
        this.container.innerHTML = '';
        this.container.style.gridTemplateColumns = `repeat(${n}, 40px)`;
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                cell.addEventListener('click', () => this.onCellClick(cell));
                this.container.appendChild(cell);
                this.grid.push({ r, c, type: 'empty', cell });
            }
        }
        this.start = this.end = null;
    }
    onCellClick(cell) {
        const obj = this.grid.find(x => x.cell === cell);
        if (!this.start) {
            obj.type = 'start'; this.start = obj; cell.style.background = '#2ecc71';
        } else if (!this.end && obj.type === 'empty') {
            obj.type = 'end'; this.end = obj; cell.style.background = '#e74c3c';
        } else if (obj.type === 'empty') {
            obj.type = 'obstacle'; cell.style.background = '#2c3e50';
        } else if (obj.type === 'obstacle') {
            obj.type = 'empty'; cell.style.background = 'lightgray';
        }
    }
    findPath() {
        if (!this.start || !this.end) return;
        // A* logic here
        alert('A* pathfinding (реализация)');
    }
}

// K-Means Implementation
class KMeans {
    constructor() {
        this.points = [];
        this.canvas = document.getElementById('kmeansCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.genBtn = document.getElementById('kmeansGenerateBtn');
        this.runBtn = document.getElementById('kmeansRunBtn');
        this.pCount = document.getElementById('kmeans-point-count');
        this.kInput = document.getElementById('kmeans-k');
        this.attach();
    }
    attach() {
        this.genBtn.addEventListener('click', () => this.generatePoints());
        this.runBtn.addEventListener('click', () => this.run());
    }
    generatePoints() {
        const n = parseInt(this.pCount.value);
        this.points = [];
        for (let i = 0; i < n; i++) this.points.push([Math.random() * this.canvas.width, Math.random() * this.canvas.height]);
        this.draw();
    }
    run() {
        const k = parseInt(this.kInput.value);
        alert(`K-Means: ${k} кластеров (реализация)`);
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.points.forEach(([x, y]) => {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(x - 3, y - 3, 6, 6);
        });
    }
}

// Ant Colony Implementation
class AntColony {
    constructor() {
        this.cities = [];
        this.canvas = document.getElementById('antCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.genBtn = document.getElementById('generateAntBtn');
        this.runBtn = document.getElementById('runAntBtn');
        this.attach();
    }
    attach() {
        this.genBtn.addEventListener('click', () => this.generateCities());
        this.runBtn.addEventListener('click', () => this.run());
    }
    generateCities() {
        const n = parseInt(document.getElementById('ant-city-count').value);
        this.cities = [];
        for (let i = 0; i < n; i++) this.cities.push({ x: Math.random() * this.canvas.width, y: Math.random() * this.canvas.height });
        this.drawCities();
    }
    run() {
        alert('ACO запущен (реализация)');
    }
    drawCities() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.cities.forEach(city => {
            this.ctx.beginPath(); this.ctx.arc(city.x, city.y, 5, 0, 2 * Math.PI); this.ctx.fillStyle = 'red'; this.ctx.fill();
        });
    }
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    new AStar();
    new KMeans();
    new AntColony();
});
