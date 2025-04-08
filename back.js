const btnAStar = document.getElementById('btnAStar');
const btnGenetic = document.getElementById('btnGenetic');
const sectionAStar = document.getElementById('sectionAStar');
const sectionGenetic = document.getElementById('sectionGenetic');

function displayInterface(selectedSection) {
    sectionAStar.classList.remove('active');
    sectionGenetic.classList.remove('active');
    selectedSection.classList.add('active');
}

btnAStar.addEventListener('click', () => {
    displayInterface(sectionAStar);
});

btnGenetic.addEventListener('click', () => {
    displayInterface(sectionGenetic);
});

const canvasGenetic = document.getElementById('geneticCanvas');
const ctxGenetic = canvasGenetic.getContext('2d');
const runGenAlgoBtn = document.getElementById('runGenAlgoBtn');
const resetGenAlgoBtn = document.getElementById('resetGenAlgoBtn');
const bestDistanceDisplay = document.getElementById('bestDistanceDisplay');
let cityCoords = [];
let populationRoutes = [];
let bestRoute = null;
let generationCount = 0;
let algoIntervalId = null;

canvasGenetic.addEventListener('click', (e) => {
    const bounds = canvasGenetic.getBoundingClientRect();
    const xCoord = e.clientX - bounds.left;
    const yCoord = e.clientY - bounds.top;
    cityCoords.push({ x: xCoord, y: yCoord });
    updateGeneticCanvas();
});

function updateGeneticCanvas() {
    ctxGenetic.clearRect(0, 0, canvasGenetic.width, canvasGenetic.height);
    if (bestRoute) {
        ctxGenetic.beginPath();
        const startCity = cityCoords[bestRoute[0]];
        ctxGenetic.moveTo(startCity.x, startCity.y);
        for (let i = 1; i < bestRoute.length; i++) {
            ctxGenetic.lineTo(cityCoords[bestRoute[i]].x, cityCoords[bestRoute[i]].y);
        }
        ctxGenetic.lineTo(startCity.x, startCity.y);
        ctxGenetic.strokeStyle = 'red';
        ctxGenetic.lineWidth = 2;
        ctxGenetic.stroke();
    }
    cityCoords.forEach(city => {
        ctxGenetic.beginPath();
        ctxGenetic.arc(city.x, city.y, 5, 0, Math.PI * 2);
        ctxGenetic.fillStyle = 'blue';
        ctxGenetic.fill();
    });
}

function calcRouteLength(route) {
    let length = 0;
    for (let i = 0; i < route.length; i++) {
        const cityA = cityCoords[route[i]];
        const cityB = cityCoords[route[(i + 1) % route.length]];
        length += Math.hypot(cityA.x - cityB.x, cityA.y - cityB.y);
    }
    return length;
}

function initPopulation(popSize) {
    populationRoutes = [];
    const baseRoute = Array.from({ length: cityCoords.length }, (_, i) => i);
    for (let i = 0; i < popSize; i++) {
        const shuffled = baseRoute.slice().sort(() => Math.random() - 0.5);
        populationRoutes.push(shuffled);
    }
}

function selectParent(tourSize = 5) {
    let bestCandidate = null;
    for (let i = 0; i < tourSize; i++) {
        const candidate = populationRoutes[Math.floor(Math.random() * populationRoutes.length)];
        if (!bestCandidate || calcRouteLength(candidate) < calcRouteLength(bestCandidate)) {
            bestCandidate = candidate;
        }
    }
    return bestCandidate.slice();
}

function performCrossover(parent1, parent2) {
    const start = Math.floor(Math.random() * parent1.length);
    const end = start + Math.floor(Math.random() * (parent1.length - start));
    const child = new Array(parent1.length).fill(null);
    for (let i = start; i < end; i++) {
        child[i] = parent1[i];
    }
    let idx = 0;
    for (let i = 0; i < child.length; i++) {
        if (child[i] === null) {
            while (child.includes(parent2[idx])) {
                idx++;
            }
            child[i] = parent2[idx];
        }
    }
    return child;
}

function applyMutation(route, mutRate = 0.01) {
    for (let i = 0; i < route.length; i++) {
        if (Math.random() < mutRate) {
            const swapIdx = Math.floor(Math.random() * route.length);
            [route[i], route[swapIdx]] = [route[swapIdx], route[i]];
        }
    }
}

function evolveGeneration() {
    const newGeneration = [];
    populationRoutes.sort((r1, r2) => calcRouteLength(r1) - calcRouteLength(r2));
    bestRoute = populationRoutes[0];
    bestDistanceDisplay.textContent = "Лучшее расстояние: " + calcRouteLength(bestRoute).toFixed(2);
    newGeneration.push(bestRoute.slice());
    while (newGeneration.length < populationRoutes.length) {
        const parentA = selectParent();
        const parentB = selectParent();
        let child = performCrossover(parentA, parentB);
        applyMutation(child);
        newGeneration.push(child);
    }
    populationRoutes = newGeneration;
    generationCount++;
    updateGeneticCanvas();
}

runGenAlgoBtn.addEventListener('click', () => {
    if (cityCoords.length < 3) {
        alert("Добавьте минимум 3 точки (города) для работы алгоритма!");
        return;
    }
    initPopulation(100);
    generationCount = 0;
    if (algoIntervalId) clearInterval(algoIntervalId);
    algoIntervalId = setInterval(evolveGeneration, 50);
});

resetGenAlgoBtn.addEventListener('click', () => {
    cityCoords = [];
    populationRoutes = [];
    bestRoute = null;
    generationCount = 0;
    bestDistanceDisplay.textContent = "";
    ctxGenetic.clearRect(0, 0, canvasGenetic.width, canvasGenetic.height);
    if (algoIntervalId) clearInterval(algoIntervalId);
});
