// back.js

///////////////////////////////////////
// UI: переключение между панелями
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
    if (n < 3) { alert('N ≥ 3'); return; }
    this.grid = []; this.start = this.end = null;
    this.container.innerHTML = '';
    this.container.style.gridTemplateColumns = `repeat(${n},40px)`;
    for (let r=0; r<n; r++) {
      for (let c=0; c<n; c++) {
        const el = document.createElement('div');
        el.className = 'grid-cell';
        el.addEventListener('click',()=>this.onCellClick(r,c,el));
        this.container.append(el);
        this.grid.push({r,c,type:'empty',elem:el});
      }
    }
  }
  onCellClick(r,c,el) {
    const cell = this.grid.find(x=>x.r===r&&x.c===c);
    if (!this.start)      { cell.type='start'; this.start=cell; el.style.background='#2ecc71'; }
    else if (!this.end && cell.type==='empty') { cell.type='end'; this.end=cell; el.style.background='#e74c3c'; }
    else if (cell.type==='empty')      { cell.type='obstacle'; el.style.background='#2c3e50'; }
    else if (cell.type==='obstacle')   { cell.type='empty'; el.style.background='lightgray'; }
  }
  heuristic(a,b){ return Math.abs(a.r-b.r)+Math.abs(a.c-b.c); }
  findPath() {
    if (!this.start||!this.end) { alert('Установите старт/финиш'); return; }
    const open=[this.start], from=new Map(), g=new Map(), f=new Map();
    this.grid.forEach(c=>{g.set(c,Infinity); f.set(c,Infinity);});
    g.set(this.start,0); f.set(this.start,this.heuristic(this.start,this.end));
    while(open.length){
      let cur = open.reduce((a,b)=>f.get(a)<f.get(b)?a:b);
      if (cur===this.end) { this.reconstruct(from,cur); return; }
      open.splice(open.indexOf(cur),1);
      for (let [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nr=cur.r+dr, nc=cur.c+dc;
        const nb=this.grid.find(x=>x.r===nr&&x.c===nc);
        if (!nb||nb.type==='obstacle') continue;
        const tg=g.get(cur)+1;
        if (tg<g.get(nb)){
          from.set(nb,cur);
          g.set(nb,tg);
          f.set(nb,tg+this.heuristic(nb,this.end));
          if (!open.includes(nb)) open.push(nb);
        }
      }
    }
    alert('Путь не найден');
  }
  reconstruct(from,cur){
    while(from.has(cur)){
      if (cur!==this.end) cur.elem.style.background='#f1c40f';
      cur=from.get(cur);
    }
  }
}

//////////////////////////////////
// K-Means Кластеризация
//////////////////////////////////
class KMeans {
  constructor(){
    this.canvas=document.getElementById('kmeansCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.countInput=document.getElementById('kmeansPointCount');
    this.kInput=document.getElementById('kmeansK');
    this.genBtn=document.getElementById('kmeansGenerateBtn');
    this.runBtn=document.getElementById('kmeansRunBtn');
    this.points=[]; this.centroids=[];
    this.genBtn.addEventListener('click',()=>this.generatePoints());
    this.runBtn.addEventListener('click',()=>this.cluster());
  }
  generatePoints(){
    const n=+this.countInput.value; if(n<1){alert('≥1 точка');return;}
    this.points=Array.from({length:n},()=>[Math.random()*this.canvas.width,Math.random()*this.canvas.height,null]);
    this.drawPoints();
  }
  drawPoints(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach(([x,y])=>{
      this.ctx.fillStyle='#333';
      this.ctx.fillRect(x-3,y-3,6,6);
    });
  }
  cluster(){
    const K=+this.kInput.value;
    if(K<1||this.points.length<K){alert('Неверный K/точек');return;}
    this.centroids=this.points.slice(0,K).map(p=>[p[0],p[1]]);
    let changed=true;
    while(changed){
      changed=false;
      this.points.forEach(p=>{
        const dists=this.centroids.map(c=>Math.hypot(p[0]-c[0],p[1]-c[1]));
        p[2]=dists.indexOf(Math.min(...dists));
      });
      for(let i=0;i<K;i++){
        const grp=this.points.filter(p=>p[2]===i);
        if(!grp.length) continue;
        const avgX=grp.reduce((s,p)=>s+p[0],0)/grp.length;
        const avgY=grp.reduce((s,p)=>s+p[1],0)/grp.length;
        if(avgX!==this.centroids[i][0]||avgY!==this.centroids[i][1]){
          changed=true;
          this.centroids[i]=[avgX,avgY];
        }
      }
    }
    // отрисовка
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach(p=>{
      const hue=(p[2]*360)/this.centroids.length;
      this.ctx.fillStyle=`hsl(${hue},70%,50%)`;
      this.ctx.fillRect(p[0]-3,p[1]-3,6,6);
    });
    this.centroids.forEach(c=>{
      this.ctx.beginPath();
      this.ctx.arc(c[0],c[1],8,0,2*Math.PI);
      this.ctx.strokeStyle='#000';
      this.ctx.stroke();
    });
  }
}

//////////////////////////////////
// Генетический TSP
//////////////////////////////////
class GeneticTSP {
  constructor(){
    this.canvas=document.getElementById('geneticCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.runBtn=document.getElementById('runGeneticBtn');
    this.resetBtn=document.getElementById('resetGeneticBtn');
    this.output=document.getElementById('bestDistanceDisplay');
    this.cities=[]; this.bestRoute=[];
    this.canvas.addEventListener('click',e=>this.addCity(e));
    this.runBtn.addEventListener('click',()=>this.runGA());
    this.resetBtn.addEventListener('click',()=>this.reset());
  }
  addCity(e){
    const r=this.canvas.getBoundingClientRect();
    this.cities.push({x:e.clientX-r.left,y:e.clientY-r.top});
    this.drawCities();
  }
  drawCities(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{
      this.ctx.beginPath();
      this.ctx.arc(c.x,c.y,5,0,2*Math.PI);
      this.ctx.fillStyle='#000';
      this.ctx.fill();
    });
  }
  reset(){
    this.cities=[]; this.bestRoute=[]; this.output.textContent=''; this.drawCities();
  }
  runGA(){
    const n=this.cities.length; if(n<2){alert('Добавьте ≥2 города');return;}
    const popSize=100, gens=200; let pop=[];
    for(let i=0;i<popSize;i++){
      pop.push(this.shuffle(Array.from({length:n},(_,i)=>i)));
    }
    let bestDist=Infinity;
    for(let g=0;g<gens;g++){
      const scored=pop.map(route=>({route,dist:this.routeLength(route)}))
                      .sort((a,b)=>a.dist-b.dist);
      if(scored[0].dist<bestDist){
        bestDist=scored[0].dist;
        this.bestRoute=[...scored[0].route,scored[0].route[0]]; // замыкание
      }
      const retain=Math.floor(popSize*0.2);
      let newPop=scored.slice(0,retain).map(o=>o.route);
      while(newPop.length<popSize){
        const a=this.select(scored), b=this.select(scored);
        let c=this.crossover(a,b);
        if(Math.random()<0.05) c=this.mutate(c);
        newPop.push(c);
      }
      pop=newPop;
    }
    // отрисовка
    this.drawCities();
    if(this.bestRoute.length){
      this.ctx.beginPath();
      const st=this.cities[this.bestRoute[0]];
      this.ctx.moveTo(st.x,st.y);
      this.bestRoute.forEach(idx=>{
        const c=this.cities[idx];
        this.ctx.lineTo(c.x,c.y);
      });
      this.ctx.strokeStyle='#e74c3c';
      this.ctx.lineWidth=2;
      this.ctx.stroke();
    }
    this.output.textContent=`Длина пути: ${bestDist.toFixed(2)}`;
  }
  shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }
  select(scored){
    const cutoff=Math.floor(scored.length*0.2);
    return scored[Math.floor(Math.random()*cutoff)].route;
  }
  crossover(a,b){
    const len=a.length;
    const i=Math.floor(Math.random()*len), j=Math.floor(Math.random()*len);
    const [s,e]=i<j?[i,j]:[j,i];
    const seg=a.slice(s,e);
    return [...seg, ...b.filter(x=>!seg.includes(x))];
  }
  mutate(r){
    const i=Math.floor(Math.random()*r.length), j=Math.floor(Math.random()*r.length);
    [r[i],r[j]]=[r[j],r[i]];
    return r;
  }
  routeLength(route){
    let sum=0;
    for(let i=0;i<route.length;i++){
      const a=this.cities[route[i]];
      const b=this.cities[route[(i+1)%route.length]];
      sum+=Math.hypot(a.x-b.x,a.y-b.y);
    }
    return sum;
  }
}

//////////////////////////////////
// Муравьиный ACO
//////////////////////////////////
class AntColony {
  constructor(){
    this.canvas=document.getElementById('antCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.countInput=document.getElementById('antCityCount');
    this.antCountInput=document.getElementById('antCount');
    this.alphaInput=document.getElementById('antAlpha');
    this.betaInput=document.getElementById('antBeta');
    this.rhoInput=document.getElementById('antRho');
    this.iterInput=document.getElementById('antIterations');
    this.genBtn=document.getElementById('antGenerateBtn');
    this.runBtn=document.getElementById('antRunBtn');

    this.cities=[]; this.distances=[]; this.pheromone=[]; this.bestTour=null; this.bestLen=Infinity;
    this.genBtn.addEventListener('click',()=>this.generateCities());
    this.runBtn.addEventListener('click',()=>this.runACO());
  }
  generateCities(){
    const n=+this.countInput.value; if(n<2){alert('≥2 города');return;}
    this.cities=Array.from({length:n},()=>({
      x:Math.random()*this.canvas.width,
      y:Math.random()*this.canvas.height
    }));
    this.drawCities();
  }
  drawCities(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{
      this.ctx.beginPath();
      this.ctx.arc(c.x,c.y,5,0,2*Math.PI);
      this.ctx.fillStyle='#000';
      this.ctx.fill();
    });
  }
  runACO(){
    const n=this.cities.length; if(n<2) return;
    const ants=+this.antCountInput.value;
    const alpha=+this.alphaInput.value, beta=+this.betaInput.value;
    const rho=+this.rhoInput.value, iterations=+this.iterInput.value;
    // матрицы
    this.distances=Array.from({length:n},()=>Array(n).fill(0));
    this.pheromone=Array.from({length:n},()=>Array(n).fill(1));
    for(let i=0;i<n;i++){
      for(let j=0;j<n;j++){
        if(i===j) this.distances[i][j]=Infinity;
        else {
          const dx=this.cities[i].x-this.cities[j].x;
          const dy=this.cities[i].y-this.cities[j].y;
          this.distances[i][j]=Math.hypot(dx,dy);
        }
      }
    }
    this.bestLen=Infinity;
    for(let it=0;it<iterations;it++){
      const tours=[];
      for(let a=0;a<ants;a++){
        const tour=[0], vis=new Set([0]);
        while(tour.length<n){
          const i=tour[tour.length-1];
          const probs=this.cities.map((_,j)=>{
            if(vis.has(j)) return 0;
            return Math.pow(this.pheromone[i][j],alpha)*Math.pow(1/this.distances[i][j],beta);
          });
          const sum=probs.reduce((s,v)=>s+v,0);
          let r=Math.random()*sum, nxt=0;
          for(let idx=0;idx<n;idx++){
            r-=probs[idx];
            if(r<=0){ nxt=idx; break; }
          }
          tour.push(nxt); vis.add(nxt);
        }
        tours.push(tour);
        const len=this.tourLength(tour);
        if(len<this.bestLen){ this.bestLen=len; this.bestTour=[...tour,tour[0]]; }
      }
      // испарение
      for(let i=0;i<n;i++) for(let j=0;j<n;j++) this.pheromone[i][j]*=(1-rho);
      // осаждение
      tours.forEach(tour=>{
        const len=this.tourLength(tour);
        tour.forEach((u,idx)=>{
          const v=tour[(idx+1)%tour.length];
          this.pheromone[u][v]+=1/len;
          this.pheromone[v][u]+=1/len;
        });
      });
    }
    // отрисовка
    this.drawCities();
    if(this.bestTour){
      this.ctx.beginPath();
      const st=this.cities[this.bestTour[0]];
      this.ctx.moveTo(st.x,st.y);
      this.bestTour.forEach(idx=>{
        const c=this.cities[idx];
        this.ctx.lineTo(c.x,c.y);
      });
      this.ctx.strokeStyle='#e74c3c';
      this.ctx.lineWidth=2;
      this.ctx.stroke();
    }
    alert(`ACO длина: ${this.bestLen.toFixed(2)}`);
  }
  tourLength(t){ let s=0;
    for(let i=0;i<t.length;i++){
      const a=t[i], b=t[(i+1)%t.length];
      s+=this.distances[a][b];
    }
    return s;
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', ()=>{
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
});
