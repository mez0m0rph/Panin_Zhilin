// Переключение панелей
const AlgorithmUI = {
  switchAlgorithm(id) {
    document.querySelectorAll('.algorithm-interface').forEach(el => el.classList.remove('show'));
    const panel = document.getElementById(id);
    if (panel) panel.classList.add('show');
  }
};
document.querySelectorAll('.algo-btn')
        .forEach(btn => btn.addEventListener('click', () => AlgorithmUI.switchAlgorithm(btn.dataset.algo)));

//////////////////////////////////
// A* Алгоритм
//////////////////////////////////
class AStar {
  constructor() {
    this.grid = [];       // ячейки
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
    const n = +this.sizeInput.value;
    if (n < 3) { alert('N ≥ 3'); return; }
    this.grid = [];
    this.start = this.end = null;
    this.container.innerHTML = '';
    this.container.style.gridTemplateColumns = `repeat(${n}, 40px)`;
    for (let r=0; r<n; r++) for (let c=0; c<n; c++) {
      const cellElem = document.createElement('div');
      cellElem.className = 'grid-cell';
      cellElem.addEventListener('click', ()=> this.onCellClick(r,c,cellElem));
      this.container.appendChild(cellElem);
      this.grid.push({ r, c, type:'empty', elem:cellElem });
    }
  }

  onCellClick(r,c,elem) {
    const cell = this.grid.find(x=>x.r===r&&x.c===c);
    if (!this.start)       { cell.type='start'; this.start=cell; elem.style.background='#2ecc71'; }
    else if (!this.end && cell.type==='empty') { cell.type='end'; this.end=cell; elem.style.background='#e74c3c'; }
    else if (cell.type==='empty') { cell.type='obstacle'; elem.style.background='#2c3e50'; }
    else if (cell.type==='obstacle') { cell.type='empty'; elem.style.background='lightgray'; }
  }

  heuristic(a,b) { return Math.abs(a.r-b.r)+Math.abs(a.c-b.c); }

  findPath() {
    if (!this.start||!this.end) { alert('Установите старт/финиш'); return; }
    const open=[this.start], prev=new Map(),
          g=new Map(), f=new Map();
    this.grid.forEach(c=>{ g.set(c,Infinity); f.set(c,Infinity); });
    g.set(this.start,0); f.set(this.start,this.heuristic(this.start,this.end));

    while (open.length) {
      let cur = open.reduce((a,b)=>f.get(a)<f.get(b)?a:b);
      if (cur===this.end) { this.rebuild(prev,cur); return; }
      open.splice(open.indexOf(cur),1);
      for (let [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nr=cur.r+dr, nc=cur.c+dc;
        const nb = this.grid.find(x=>x.r===nr&&x.c===nc);
        if (!nb||nb.type==='obstacle') continue;
        const tg = g.get(cur)+1;
        if (tg<g.get(nb)) {
          prev.set(nb,cur);
          g.set(nb,tg);
          f.set(nb,tg+this.heuristic(nb,this.end));
          if (!open.includes(nb)) open.push(nb);
        }
      }
    }
    alert('Путь не найден');
  }

  rebuild(prev,cur) {
    while(prev.has(cur)) {
      if (cur!==this.end) cur.elem.style.background='#f1c40f';
      cur = prev.get(cur);
    }
  }
}

//////////////////////////////////
// K-Means
//////////////////////////////////
class KMeans {
  constructor() {
    this.points=[];
    this.centroids=[];
    this.canvas=document.getElementById('kmeansCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.pCount=document.getElementById('kmeansPointCount');
    this.kInput=document.getElementById('kmeansK');
    this.genBtn=document.getElementById('kmeansGenerateBtn');
    this.runBtn=document.getElementById('kmeansRunBtn');
    this.attach();
  }
  attach() {
    this.genBtn.addEventListener('click',()=>this.genPoints());
    this.runBtn.addEventListener('click',()=>this.cluster());
  }
  genPoints() {
    const n=+this.pCount.value;
    this.points = Array.from({length:n},()=>[Math.random()*this.canvas.width,Math.random()*this.canvas.height]);
    this.drawPoints();
  }
  drawPoints() {
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach(([x,y])=>{ this.ctx.fillStyle='#333'; this.ctx.fillRect(x-3,y-3,6,6); });
  }
  cluster() {
    const k=+this.kInput.value;
    this.centroids = this.points.slice(0,k);
    let assign=[],changed=true;
    while(changed) {
      changed=false;
      assign = this.points.map(p=> {
        const d = this.centroids.map(c=>Math.hypot(p[0]-c[0],p[1]-c[1]));
        return d.indexOf(Math.min(...d));
      });
      for(let i=0;i<k;i++){
        const grp=this.points.filter((_,j)=>assign[j]===i);
        if(grp.length){
          const x=grp.reduce((s,p)=>s+p[0],0)/grp.length;
          const y=grp.reduce((s,p)=>s+p[1],0)/grp.length;
          if(x!==this.centroids[i][0]||y!==this.centroids[i][1]) changed=true;
          this.centroids[i]=[x,y];
        }
      }
    }
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.points.forEach((p,i)=>{
      const h=assign[i]*360/k;
      this.ctx.fillStyle=`hsl(${h},70%,50%)`;
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
  constructor() {
    this.cities=[]; this.best=null;
    this.canvas=document.getElementById('geneticCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.runBtn=document.getElementById('runGeneticBtn');
    this.resetBtn=document.getElementById('resetGeneticBtn');
    this.attach();
  }
  attach() {
    this.canvas.addEventListener('click',e=>this.addCity(e));
    this.runBtn.addEventListener('click',()=>this.runGA());
    this.resetBtn.addEventListener('click',()=>this.reset());
  }
  addCity(e) {
    const r=this.canvas.getBoundingClientRect();
    this.cities.push({x:e.clientX-r.left,y:e.clientY-r.top});
    this.drawCities();
  }
  drawCities(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{this.ctx.beginPath();this.ctx.arc(c.x,c.y,5,0,2*Math.PI);this.ctx.fillStyle='#000';this.ctx.fill();});
  }
  reset(){ this.cities=[];this.best=null;this.drawCities();document.getElementById('bestDistanceDisplay').textContent=''; }
  runGA(){
    if(this.cities.length<2) return;
    const popSize=100, gens=200;
    let pop=Array.from({length:popSize},()=>this.shuffle([...this.cities]));
    let bestRoute=null,bestLen=Infinity;
    for(let g=0;g<gens;g++){
      const graded=pop.map(route=>({route,dist:this.len(route)}))
                       .sort((a,b)=>a.dist-b.dist);
      if(graded[0].dist<bestLen){bestLen=graded[0].dist;bestRoute=[...graded[0].route];}
      const retain=graded.slice(0,20).map(o=>o.route);
      while(retain.length<popSize){
        const a=graded[Math.random()*20|0].route, b=graded[Math.random()*20|0].route;
        retain.push(this.len(a)<this.len(b)?[...a]:[...b]);
      }
      pop=retain.map((p,i)=>{let c=this.crossover(p,retain[(i+1)%retain.length]); if(Math.random()<0.05)c=this.mutate(c);return c;});
    }
    this.best=bestRoute; this.drawBest(); document.getElementById('bestDistanceDisplay').textContent=`Длина: ${bestLen.toFixed(2)}`;
  }
  len(rt){return rt.slice(0,-1).reduce((s,p,i,a)=>s+Math.hypot(p.x-a[i+1].x,p.y-a[i+1].y),0);}
  shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
  crossover(a,b){let i=a.length*Math.random()|0,j=a.length*Math.random()|0;
    const seg=a.slice(Math.min(i,j),Math.max(i,j)),child=[...seg];
    b.forEach(c=>{if(!child.includes(c))child.push(c);});return child;
  }
  mutate(r){let i=r.length*Math.random()|0,j=r.length*Math.random()|0;[r[i],r[j]]=[r[j],r[i]];return r;}
  drawBest(){
    this.drawCities();
    if(!this.best) return;
    this.ctx.beginPath();
    this.ctx.moveTo(this.best[0].x,this.best[0].y);
    this.best.forEach(p=>this.ctx.lineTo(p.x,p.y));
    this.ctx.strokeStyle='#f00';this.ctx.stroke();
  }
}

//////////////////////////////////
// Муравьиный ACO
//////////////////////////////////
class AntColony {
  constructor(){
    this.cities=[];
    this.canvas=document.getElementById('antCanvas');
    this.ctx=this.canvas.getContext('2d');
    this.genBtn=document.getElementById('antGenerateBtn');
    this.runBtn=document.getElementById('antRunBtn');
    this.attach();
  }
  attach(){
    this.genBtn.addEventListener('click',()=>this.genCities());
    this.runBtn.addEventListener('click',()=>this.run());
  }
  genCities(){
    const n=+document.getElementById('antCityCount').value;
    this.cities=[];
    for(let i=0;i<n;i++)this.cities.push({x:Math.random()*this.canvas.width,y:Math.random()*this.canvas.height});
    this.drawCities();
  }
  drawCities(){
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.cities.forEach(c=>{this.ctx.beginPath();this.ctx.arc(c.x,c.y,5,0,2*Math.PI);this.ctx.fillStyle='#000';this.ctx.fill();});
  }
  run(){
    if(this.cities.length<2) return;
    const alpha=+document.getElementById('antAlpha').value,
          beta=+document.getElementById('antBeta').value,
          rho=+document.getElementById('antRho').value,
          iters=+document.getElementById('antIterations').value;
    const n=this.cities.length;
    const dist=Array(n).fill().map(()=>Array(n));
    const pher=Array(n).fill().map(()=>Array(n).fill(1));
    for(let i=0;i<n;i++)for(let j=0;j<n;j++)
      dist[i][j]=i===j?Infinity:Math.hypot(this.cities[i].x-this.cities[j].x,this.cities[i].y-this.cities[j].y);
    let bestT=null,bestL=Infinity;
    for(let it=0;it<iters;it++){
      const tours=[];
      for(let a=0;a<n;a++){
        const tour=[0],vis=new Set([0]);
        while(tour.length<n){
          const i=tour.at(-1);
          const probs=this.cities.map((_,j)=>vis.has(j)?0:Math.pow(pher[i][j],alpha)*Math.pow(1/dist[i][j],beta));
          const sum=probs.reduce((s,p)=>s+p,0);
          let r=Math.random()*sum;
          const nxt=probs.findIndex(p=>{r-=p;return r<=0;});
          tour.push(nxt);vis.add(nxt);
        }
        tours.push(tour);
        const L=this.calcLen(tour,dist);
        if(L<bestL){bestL=L;bestT=tour;}
      }
      // испарение
      for(let i=0;i<n;i++)for(let j=0;j<n;j++)pher[i][j]*=(1-rho);
      // осаждение
      tours.forEach(t=>{
        const L=this.calcLen(t,dist);
        t.forEach((u,idx)=>{if(idx<t.length-1){const v=t[idx+1];pher[u][v]+=1/L;pher[v][u]+=1/L;}});
      });
    }
    // отрисовка
    this.drawCities();
    this.ctx.beginPath();
    this.ctx.moveTo(this.cities[bestT[0]].x,this.cities[bestT[0]].y);
    bestT.forEach(i=>this.ctx.lineTo(this.cities[i].x,this.cities[i].y));
    this.ctx.strokeStyle='#f00';this.ctx.stroke();
    alert(`ACO длина: ${bestL.toFixed(2)}`);
  }
  calcLen(t,dist){return t.slice(0,-1).reduce((s,u,i,a)=>s+dist[u][a[i+1]],0);}
}

// Инициализируем
window.addEventListener('DOMContentLoaded', () => {
  new AStar();
  new KMeans();
  new GeneticTSP();
  new AntColony();
});
