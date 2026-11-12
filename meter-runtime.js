// color-grouping.js
// Deterministic perceptual grouping. Lower luminance weight tolerates shading.
function scoutLab(p) {
  const linear = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const r = linear(p.r), g = linear(p.g), b = linear(p.b);
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b);
  const m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b);
  const s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  return [100*(.2104542553*l + .793617785*m - .0040720468*s),
    100*(1.9779984951*l - 2.428592205*m + .4505937099*s),
    100*(.0259040371*l + .7827717662*m - .808675766*s)];
}
function scoutDistance(a, b) {
  return Math.hypot(.4*(a[0]-b[0]), a[1]-b[1], a[2]-b[2]);
}
function groupSceneColors(pixels, tolerance = 14) {
  if (!pixels.length) return [];
  const bins = new Map();
  for (const p of pixels) {
    const key = ((p.r>>4)<<8) | ((p.g>>4)<<4) | (p.b>>4);
    let bin = bins.get(key);
    if (!bin) { bin = {r:0,g:0,b:0,n:0}; bins.set(key,bin); }
    bin.r += p.r; bin.g += p.g; bin.b += p.b; bin.n++;
  }
  const samples = [...bins.values()].map(p => ({r:p.r/p.n,g:p.g/p.n,b:p.b/p.n,n:p.n}));
  samples.forEach(p => p.lab = scoutLab(p));
  samples.sort((a,b) => b.n-a.n || a.r-b.r || a.g-b.g || a.b-b.b);
  const groups = [];
  for (const p of samples) {
    let closest = null, distance = tolerance;
    for (const g of groups) {
      const d = scoutDistance(p.lab,g.lab);
      if (d < distance) { closest = g; distance = d; }
    }
    if (!closest) groups.push({...p,lab:[...p.lab]});
    else {
      const n = closest.n+p.n;
      for (const k of ['r','g','b']) closest[k] = (closest[k]*closest.n + p[k]*p.n)/n;
      closest.n=n; closest.lab=scoutLab(closest);
    }
  }
  groups.sort((a,b)=>b.n-a.n);
  const top = groups.slice(0,3).map(g=>({...g}));
  // Fold smaller families into their nearest displayed family; account for every pixel.
  for (const g of groups.slice(3)) {
    const nearest = top.reduce((a,b)=>scoutDistance(g.lab,a.lab)<=scoutDistance(g.lab,b.lab)?a:b);
    nearest.n += g.n;
  }
  const results = top.map(g=>({r:g.r,g:g.g,b:g.b,pct:100*g.n/pixels.length})).sort((a,b)=>b.pct-a.pct);
  while(results.length<3) results.push({...results[0],pct:0});
  return results;
}

// composition.js
/* Alignment estimates local contrast and edges, not aesthetic quality. */
const SCOUT_GUIDES = {
  roomCorner: 'Room corner / leading lines',
  thirds: 'Rule of thirds', golden: 'Golden section', spiral: 'Golden spiral', spiralgrid: 'Spiral section',
  goldenTriangle: 'Golden triangles', harmonious: 'Harmonious triangles', diagonal: 'Diagonal',
  doubleDiagonal: 'Double diagonal', cross: 'Cross', focal: 'Focal mass', vee: 'V arrangement',
  pyramid: 'Pyramid', radial: 'Radiating', funnel: 'Funnel', scurve: 'S curve', lshape: 'L arrangement',
  circle: 'Circular', ccurve: 'C curve', balance: 'Balance', unbalanced: 'Asymmetric balance'
};
function scoutGuideGeometry(id, turn = 0, mirror = false, aspect = 1) {
  const paths = [], anchors = [];
  const line = (...p) => paths.push(p);
  const curve = fn => paths.push(Array.from({length:81},(_,i)=>fn(i/80)));
  const circle = (cx,cy,r,start=0,end=Math.PI*2) => curve(t=>[cx+r*Math.min(1,1/aspect)*Math.cos(start+t*(end-start)),cy+r*Math.min(1,aspect)*Math.sin(start+t*(end-start))]);
  const grid = a => { for(const v of [a,1-a]) {line([v,0],[v,1]);line([0,v],[1,v]);for(const u of [a,1-a]) anchors.push([v,u]);} };
  switch(id) {
    case 'golden': grid(.382); break;
    case 'spiral': {
      const phi=(1+Math.sqrt(5))/2, end=Math.PI*3;
      const raw=Array.from({length:161},(_,i)=>{const t=i/160*end,r=Math.pow(phi,2*t/Math.PI);return [r*Math.cos(t),r*Math.sin(t)];});
      const xs=raw.map(p=>p[0]),ys=raw.map(p=>p[1]),minX=Math.min(...xs),minY=Math.min(...ys),w=Math.max(...xs)-minX,h=Math.max(...ys)-minY;
      const scale=Math.min(.88*aspect/w,.88/h);const fit=p=>[.5+(p[0]-minX-w/2)*scale/aspect,.5+(p[1]-minY-h/2)*scale];paths.push(raw.map(fit));anchors.push(fit([0,0]));break;
    }
    case 'spiralgrid': {
      let x=0,y=0,w=1,h=1;
      for(let i=0;i<7;i++) {switch(i%4) {
        case 0: line([x+w*.618,y],[x+w*.618,y+h]);x+=w*.618;w*=.382;break;
        case 1: line([x,y+h*.618],[x+w,y+h*.618]);y+=h*.618;h*=.382;break;
        case 2: line([x+w*.382,y],[x+w*.382,y+h]);w*=.382;break;
        case 3: line([x,y+h*.382],[x+w,y+h*.382]);h*=.382;break;
      }} anchors.push([x+w/2,y+h/2]);break;
    }
    case 'goldenTriangle': { const t=1/(1+aspect*aspect);line([0,1],[1,0]);line([0,0],[t,1-t]);line([1,1],[1-t,t]);break; }
    case 'harmonious': line([0,0],[1,1]);line([0,1],[.35,.35]);line([1,0],[.65,.65]);break;
    case 'diagonal': line([0,0],[1,1]);break;
    case 'doubleDiagonal': line([0,0],[1,.8]);line([0,.65],[1,.15]);break;
    case 'cross': line([.5,0],[.5,1]);line([0,.5],[1,.5]);anchors.push([.5,.5]);break;
    case 'focal': circle(.5,.5,.13);anchors.push([.5,.5]);break;
    case 'vee': line([.1,.08],[.5,.92],[.9,.08]);anchors.push([.5,.92]);break;
    case 'pyramid': line([.1,.9],[.5,.1],[.9,.9],[.1,.9]);anchors.push([.5,.1]);break;
    case 'radial': for(let i=0;i<12;i++){const a=i*Math.PI/6;line([.382,.5],[.382+.85*Math.cos(a),.5+.85*Math.sin(a)]);}anchors.push([.382,.5]);break;
    case 'funnel': line([.1,.1],[.9,.1],[.9,.9],[.1,.9],[.1,.1]);line([.35,.35],[.65,.35],[.65,.65],[.35,.65],[.35,.35]);for(const [x,y] of [[0,0],[1,0],[1,1],[0,1]])line([.1+.8*x,.1+.8*y],[.35+.3*x,.35+.3*y]);anchors.push([.5,.5]);break;
    case 'scurve': curve(t=>[.5+.29*Math.sin(2*Math.PI*t),.08+.84*t]);break;
    case 'lshape': line([.2,.1],[.2,.82],[.9,.82]);anchors.push([.2,.82]);break;
    case 'roomCorner': line([.62,.08],[.62,.72]);line([0,.95],[.62,.72],[1,.9]);line([0,.06],[.62,.25],[1,.05]);anchors.push([.62,.72]);break;
    case 'circle': circle(.5,.5,.35);break;
    case 'ccurve': circle(.52,.5,.36,Math.PI*.25,Math.PI*1.75);break;
    case 'balance': for(const x of [.25,.75]){line([x-.12,.3],[x+.12,.3],[x+.12,.75],[x-.12,.75],[x-.12,.3]);anchors.push([x,.52]);}break;
    case 'unbalanced': line([.12,.15],[.42,.15],[.42,.85],[.12,.85],[.12,.15]);line([.75,.6],[.9,.6],[.9,.85],[.75,.85],[.75,.6]);anchors.push([.27,.5],[.825,.725]);break;
    default: grid(1/3);
  }
  function transform(p){let [x,y]=p;if(mirror)x=1-x;for(let i=0;i<(turn%4+4)%4;i++)[x,y]=[1-y,x];return [x,y];}
  return {paths:paths.map(p=>p.map(transform)),anchors:anchors.map(transform)};
}
function scoutFrameEvidence(data,w,h) {
  const luma=new Float32Array(w*h),edges=new Float32Array(w*h),salience=new Float32Array(w*h);
  let mr=0,mg=0,mb=0;
  for(let i=0;i<w*h;i++){const k=i*4;luma[i]=.2126*data[k]+.7152*data[k+1]+.0722*data[k+2];mr+=data[k];mg+=data[k+1];mb+=data[k+2];}
  mr/=w*h;mg/=w*h;mb/=w*h;
  let sum=0,max=0;
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
    const i=y*w+x,k=i*4;
    const gx=luma[i-w+1]+2*luma[i+1]+luma[i+w+1]-luma[i-w-1]-2*luma[i-1]-luma[i+w-1];
    const gy=luma[i+w-1]+2*luma[i+w]+luma[i+w+1]-luma[i-w-1]-2*luma[i-w]-luma[i-w+1];
    const e=Math.hypot(gx,gy)/4;edges[i]=e;sum+=e;max=Math.max(max,e);
    salience[i]=Math.hypot(data[k]-mr,data[k+1]-mg,data[k+2]-mb)/Math.sqrt(3);
  }
  let best=0,fx=.5,fy=.5;
  for(let y=3;y<h-3;y+=2)for(let x=3;x<w-3;x+=2){let v=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)v+=salience[(y+dy)*w+x+dx];v/=25;if(v>best){best=v;fx=x/(w-1);fy=y/(h-1);}}
  return {edges,w,h,mean:sum/Math.max(1,(w-2)*(h-2)),max,focus:[fx,fy],prominence:best};
}
function scoutGuideAlignment(geometry,ev) {
  if(ev.max<8 || ev.mean<.1) return {score:0,paths:geometry.paths.map(()=>0),focus:0};
  const pathScores=geometry.paths.map(path=>{
    let hits=0,sum=0,n=0;
    for(let j=1;j<path.length;j++){
      const a=path[j-1],b=path[j],steps=Math.max(2,Math.ceil(Math.hypot((b[0]-a[0])*ev.w,(b[1]-a[1])*ev.h)));
      for(let k=0;k<=steps;k++){
        const t=k/steps,x=Math.round((a[0]+(b[0]-a[0])*t)*(ev.w-1)),y=Math.round((a[1]+(b[1]-a[1])*t)*(ev.h-1));
        if(x<2||x>=ev.w-2||y<2||y>=ev.h-2)continue;
        let best=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)best=Math.max(best,ev.edges[(y+dy)*ev.w+x+dx]);
        sum+=best;if(best>Math.max(10,ev.mean*1.7))hits++;n++;
      }
    }
    if(!n)return 0;
    const coverage=hits/n,lift=(sum/n)/(ev.mean+2);
    return Math.min(1,Math.max(0,(coverage-.14)/.43))*Math.min(1,Math.max(0,(lift-1.4)/1.5));
  });
  let focal=0;
  if(geometry.anchors.length&&ev.prominence>28){
    const distance=Math.min(...geometry.anchors.map(p=>Math.hypot(p[0]-ev.focus[0],p[1]-ev.focus[1])));
    focal=Math.max(0,1-distance/.17)*Math.min(1,(ev.prominence-28)/45);
  }
  return {score:Math.max(focal,...pathScores),paths:pathScores,focus:focal,focusPoint:ev.focus};
}
function scoutDrawGuide(ctx,w,h,geometry,alignment={paths:[],focus:0},glow=true,threshold=.55,baseVisible=true){
  const strength=score=>{const t=Math.max(0,Math.min(1,(score-threshold)/Math.max(.01,1-threshold)));return t*t*(3-2*t);};
  ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
  geometry.paths.forEach((path,i)=>{
    const amount=glow?strength(alignment.paths[i]||0):0;
    if(!baseVisible&&amount<=0)return;
    ctx.strokeStyle=amount>0?'rgba(111,240,188,'+(.8*amount)+')':'rgba(235,240,242,.42)';
    ctx.shadowColor='rgba(83,235,168,'+(.65*amount)+')';ctx.shadowBlur=amount>0?8+14*amount:0;
    ctx.lineWidth=amount>0?1+2*amount:Math.max(1,Math.min(w,h)/650);
    ctx.beginPath();path.forEach(([x,y],j)=>j?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.stroke();
  });
  for(const [x,y] of geometry.anchors){
    const near=alignment.focusPoint&&Math.hypot(x-alignment.focusPoint[0],y-alignment.focusPoint[1])<.15;
    const amount=glow&&near?strength(alignment.focus||0):0;
    if(!baseVisible&&amount<=0)continue;
    ctx.shadowBlur=amount>0?8+16*amount:0;ctx.lineWidth=amount>0?1+1.8*amount:1.2;
    ctx.shadowColor='rgba(83,235,168,'+(.65*amount)+')';
    ctx.strokeStyle=amount>0?'rgba(111,240,188,'+(.8*amount)+')':'rgba(235,240,242,.55)';
    ctx.beginPath();ctx.arc(x*w,y*h,Math.max(amount>0?7:4,Math.min(w,h)*(amount>0?.013:.009)),0,Math.PI*2);ctx.stroke();
  }
  ctx.restore();
}

const SCOUT_GUIDE_TIPS = {
 thirds:'Place a subject at an intersection or a horizon on a third.',
 golden:'Use the tighter golden-ratio divisions for subject and horizon.',
 spiral:'Let a curve lead the eye into the small end of the spiral.',
 spiralgrid:'Nest the frame around a focal point using golden divisions.',
 goldenTriangle:'Align a strong diagonal with the smaller crossing lines.',
 harmonious:'Build a scene from opposing triangular directions.',
 diagonal:'Follow a road, edge or gesture across the frame.',
 doubleDiagonal:'Arrange two strong directions that cross in the scene.',
 cross:'Align a central vertical and horizontal structure.',
 focal:'Gather the strongest visual interest into one compact area.',
 vee:'Use two edges converging toward a low focal point.',
 pyramid:'Give a subject a broad base and a clear apex.',
 radial:'Let several lines converge on one focal point.',
 funnel:'Frame depth through an opening or a receding corridor.',
 scurve:'Follow a winding path through the picture.',
 lshape:'Anchor one side and the base with a strong L shape.',
 roomCorner:'Shoot into the L of a room: match the vertical corner and the floor or ceiling lines on both walls. Mirror for the opposite corner.',
 circle:'Arrange the main shapes around a circular flow.',
 ccurve:'Use an open curve to frame the subject.',
 balance:'Give two sides comparable visual weight.',
 unbalanced:'Balance a larger shape against a smaller distant shape.'
};

// zone-map.js
// A ZONE: scene-linear stop bands around 18% middle gray.
const CINE_ZONES = [
  {stop:4,min:3.5,label:'+4',rgb:[255,255,255],hex:'#FFFFFF'},
  {stop:3,min:2.5,label:'+3',rgb:[255,32,32],hex:'#FF2020'},
  {stop:2,min:1.5,label:'+2',rgb:[255,100,0],hex:'#FF6400'},
  {stop:1,min:.5,label:'+1',rgb:[255,235,0],hex:'#FFEB00'},
  {stop:0,min:-.5,label:'0 · 18%',rgb:[118,118,118],hex:'#767676'},
  {stop:-1,min:-1.5,label:'−1',rgb:[0,215,190],hex:'#00D7BE'},
  {stop:-2,min:-2.5,label:'−2',rgb:[57,255,20],hex:'#39FF14'},
  {stop:-3,min:-3.5,label:'−3',rgb:[22,45,150],hex:'#162D96'},
  {stop:-4,min:-Infinity,label:'−4',rgb:[64,16,104],hex:'#401068'}
];
const CINE_LINEAR=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
function cineZoneMap(count=9,under=1,over=1){
  if(![3,5,9].includes(count))throw new Error('A ZONE supports 3, 5 or 9 bands');
  if(count===3){
    if(!Number.isFinite(under)||under<=0||!Number.isFinite(over)||over<=0)throw new Error('Boundaries must be positive stops from middle gray');
    return [
      {...CINE_ZONES[3],stop:over,min:over,label:'+'+over},
      {...CINE_ZONES[4],min:-under},
      {...CINE_ZONES[5],stop:-under,min:-Infinity,label:'−'+under}
    ].map(z=>({...z,threshold:.18*2**z.min}));
  }
  const half=(count-1)/2;
  const map=CINE_ZONES.filter(z=>Math.abs(z.stop)<=half).map(z=>({...z}));
  map[map.length-1].min=-Infinity;
  return map.map(z=>({...z,threshold:.18*2**z.min}));
}
const CINE_DEFAULT_ZONE_MAP=cineZoneMap(9);
function cineZoneForLuminance(y,map=CINE_DEFAULT_ZONE_MAP){
  if(map.length===3){
    if(y>=map[0].threshold)return map[0];
    if(y<=map[1].threshold)return map[2];
    return map[1];
  }
  return map.find(z=>y>=z.threshold)||map[map.length-1];
}
function cineImageLuminance(r,g,b){return .2126*CINE_LINEAR[r]+.7152*CINE_LINEAR[g]+.0722*CINE_LINEAR[b];}
function cineZoneForRGB(r,g,b,map=CINE_DEFAULT_ZONE_MAP){return cineZoneForLuminance(cineImageLuminance(r,g,b),map);}
function cineZoneForRGBFast(r,g,b,map=CINE_DEFAULT_ZONE_MAP){
  const y=cineImageLuminance(r,g,b);
  if(map.length===3)return y>=map[0].threshold?map[0]:y<=map[1].threshold?map[2]:map[1];
  for(let i=0;i<map.length;i++)if(y>=map[i].threshold)return map[i];
  return map[map.length-1];
}
function cineSpotLetter(index){return String.fromCharCode(65+index);}

// ratio-labels.js
// Keep text at a readable size; move labels instead of shrinking them.
function scoutPlaceRatioLabel(mx,my,w,h,width,height,nodes,occupied) {
  const gap=8, left=8, top=58, right=Math.max(left,width-w-8), bottom=Math.max(top,height-h-62);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const overlaps=(a,b)=>a.x<b.x+b.w+gap&&a.x+a.w+gap>b.x&&a.y<b.y+b.h+gap&&a.y+a.h+gap>b.y;
  const blocked=nodes.map(p=>({x:p.x-25,y:p.y-25,w:50,h:50})).concat(occupied);
  const candidates=[];
  const add=(x,y)=>candidates.push({x:clamp(x,left,right),y:clamp(y,top,bottom),w,h});
  add(mx-w/2,my-h-35);add(mx-w/2,my+35);
  add(mx-w-35,my-h/2);add(mx+35,my-h/2);
  for(let y=top;y<=bottom;y+=18)for(let x=left;x<=right;x+=18)add(x,y);
  candidates.sort((a,b)=>Math.hypot(a.x+w/2-mx,a.y+h/2-my)-Math.hypot(b.x+w/2-mx,b.y+h/2-my));
  const box=candidates.find(r=>!blocked.some(b=>overlaps(r,b)))||candidates[0];
  occupied.push(box);return box;
}

// spot-meter.js
// Relative spot metering from processed sRGB. Absolute exposure requires a reference.
function cineSpotReading(r,g,b){
  const linear=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;};
  const R=linear(r),G=linear(g),B=linear(b),X=.4124564*R+.3575761*G+.1804375*B,Y=.2126729*R+.7151522*G+.072175*B,Z=.0193339*R+.119192*G+.9503041*B;
  const total=X+Y+Z,x=X/total,y=Y/total,n=(x-.3320)/(.1858-y),kelvin=449*n**3+3525*n*n+6823.3*n+5520.33;
  // Suppress very dark, clipped and strongly coloured samples: CCT is meaningful on neutral targets.
  const valid=Y>.005&&Math.max(r,g,b)<250&&Math.min(r,g,b)>10&&Math.max(r,g,b)/Math.min(r,g,b)<2.5&&Number.isFinite(kelvin)&&kelvin>=2000&&kelvin<=10000;
  return {luma:Y,kelvin:valid?Math.round(kelvin/100)*100:null,clipped:Math.max(r,g,b)>=250||Y<.005};
}
function cineSpotEV(f,seconds,iso,nd){return Math.log2(f*f/seconds)-Math.log2(iso/100)+nd;}
function cineSpotFstop(ev,seconds,iso,nd){return Math.sqrt(2**(ev-nd)*seconds*iso/100);}
const CINE_SPOT_STOPS=[1,1.4,2,2.8,4,5.6,8,11,16,22,32,45,64,90,128];
function cineSpotScale(f){return {value:Math.max(1,Math.min(128,f)),index:Math.max(0,Math.min(14,Math.round(2*Math.log2(Math.max(1e-12,f))))),edge:f<1?'≤':f>128?'≥':''};}
class CineSpotMeter{
  constructor(){
    this.x=.5;this.y=.5;this.readout=document.getElementById('spot-reading');this.temperature=document.getElementById('spot-temperature');this.note=document.getElementById('spot-note');
    this.inputs=['spot-shutter','spot-iso','spot-nd','spot-known-f'].map(id=>document.getElementById(id));
    this.scale=document.getElementById('spot-scale');
    CINE_SPOT_STOPS.forEach(f=>{const tick=document.createElement('span');tick.textContent=f;this.scale.append(tick);});
    this.inputs.forEach(input=>input.addEventListener('input',()=>this.update()));
    document.getElementById('spot-calibrate').addEventListener('click',()=>{
      if(!this.sample||this.sample.clipped){this.note.textContent='Choose a midtone spot first.';return;}
      const [den,iso,nd,f]=this.values();if(![den,iso,f].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(nd))return;
      this.reference={luma:this.sample.luma,ev:cineSpotEV(f,1/den,iso,nd)};this.update();
    });
  }
  values(){return this.inputs.map(input=>Number(input.value));}
  reset(){this.reference=null;this.sample=null;this.update();}
  measure(ctx,w,h){
    const radius=Math.max(2,Math.round(Math.min(w,h)*.015)),cx=Math.round(this.x*w),cy=Math.round(this.y*h),sx=Math.max(0,Math.min(w-2*radius,cx-radius)),sy=Math.max(0,Math.min(h-2*radius,cy-radius));
    const data=ctx.getImageData(sx,sy,2*radius,2*radius).data;let r=0,g=0,b=0;for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];}const count=data.length/4;
    this.sample=cineSpotReading(r/count,g/count,b/count);this.update();
  }
  update(){
    const sample=this.sample,[den,iso,nd]=this.values();this.temperature.textContent=sample?.kelvin?`≈ ${sample.kelvin} K · image estimate`:'K — · use a neutral grey/white target';
    if(!sample){this.readout.textContent='Aim at a midtone';this.note.textContent='Tap the camera image to move the spot.';return;}
    if(!this.reference){this.readout.textContent='f/— · match a reference';this.note.textContent='Enter a trusted meter’s f-stop below, then tap Match. Auto exposure / white balance affect readings.';return;}
    if(!(den>0&&iso>0&&Number.isFinite(nd))){this.readout.textContent='Check settings';return;}
    const delta=Math.log2(Math.max(1e-8,sample.luma)/this.reference.luma),f=cineSpotFstop(this.reference.ev+delta,1/den,iso,nd),position=cineSpotScale(f);
    const bound=position.edge||(sample.clipped?(sample.luma<.005?'≤':'≥'):'');
    this.readout.textContent=`${bound}f/${position.value.toFixed(1)} · ${delta>=0?'+':''}${delta.toFixed(1)} stops`;
    Array.from(this.scale.children).forEach((tick,i)=>tick.classList.toggle('active',i===position.index));
    if(this.scaleIndex!==position.index){this.scale.children[position.index].scrollIntoView({block:'nearest',inline:'nearest'});this.scaleIndex=position.index;}
    this.note.textContent=sample.clipped?'Sensor limit · aperture shown as a bound. Keep camera exposure fixed.':'Relative to matched spot · keep camera exposure and white balance fixed. Re-match after camera changes.';
  }
  draw(ctx,w,h){const x=this.x*w,y=this.y*h,r=Math.min(w,h)*.025;ctx.save();ctx.strokeStyle='#000';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#e9f7ee';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(x-r-6,y);ctx.lineTo(x+r+6,y);ctx.moveTo(x,y-r-6);ctx.lineTo(x,y+r+6);ctx.stroke();ctx.restore();}
}

// camera-sound.js
// Display-only exposure simulation in linear light when hardware EV is unavailable.
function scoutExposureLut(ev) {
  return Uint8ClampedArray.from({length:256},(_,i)=>{
    const s=i/255,linear=s<=.04045?s/12.92:((s+.055)/1.055)**2.4;
    const v=Math.min(1,linear*2**ev);
    return Math.round(255*(v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055));
  });
}
function scoutAudioLevels(samples) {
  let sum=0,peak=0;
  for(const sample of samples){sum+=sample*sample;peak=Math.max(peak,Math.abs(sample));}
  return {rms:Math.max(-90,20*Math.log10(Math.sqrt(sum/Math.max(1,samples.length))||1e-9)),peak:Math.max(-90,20*Math.log10(peak||1e-9))};
}
function scoutAudioExtension(type='') { return type.includes('mp4')?'m4a':type.includes('ogg')?'ogg':type.includes('webm')?'webm':'bin'; }
class ScoutSoundMeter {
  constructor(canvas,button,status){
    this.canvas=canvas;this.button=button;this.status=status;this.history=[];this.generation=0;
    this.recordButton=document.getElementById('sound-record');this.saveButton=document.getElementById('sound-save');this.target=-60;
    button.addEventListener('click',()=>this.stream||this.pendingContext?this.stop():this.start());
    this.recordButton.addEventListener('click',()=>this.recorder?.state==='recording'?this.stopRecording():this.startRecording());
    this.saveButton.addEventListener('click',()=>this.saveRecording());
    document.getElementById('sound-target').addEventListener('input',e=>{this.target=Number(e.target.value);document.getElementById('sound-target-value').textContent=this.target+' dBFS';this.draw();});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
    this.draw();
  }
  async start(){
    const generation=++this.generation;this.button.disabled=false;this.button.textContent='Cancel mic';this.status.textContent='Waiting for microphone permission…';
    let stream,context;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      context=new AudioCtx();this.pendingContext=context;await context.resume();
      if(generation!==this.generation){context.close();return;}
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());context.close();return;}
      this.pendingContext=null;this.stream=stream;this.context=context;this.analyser=context.createAnalyser();this.analyser.fftSize=2048;
      this.source=context.createMediaStreamSource(stream);this.source.connect(this.analyser);
      this.samples=new Float32Array(this.analyser.fftSize);this.history=[];this.started=performance.now();this.lastSample=0;
      this.button.textContent='Stop microphone';this.status.textContent='Live microphone · local analysis only';
      if(this.recordButton){this.recordButton.disabled=typeof MediaRecorder==='undefined';this.recordButton.title=this.recordButton.disabled?'Recording is unavailable in this browser':'Record up to 60 seconds locally';}
      const tick=now=>{
        if(generation!==this.generation)return;
        if(now-this.lastSample>=100){this.lastSample=now;this.analyser.getFloatTimeDomainData(this.samples);this.levels=scoutAudioLevels(this.samples);this.history.push({time:now,value:this.levels.rms});this.history=this.history.filter(p=>now-p.time<=30000);this.draw(now);}
        this.frame=requestAnimationFrame(tick);
      };this.frame=requestAnimationFrame(tick);
    }catch(error){
      stream?.getTracks().forEach(t=>t.stop());context?.close();if(this.pendingContext===context)this.pendingContext=null;
      if(generation===this.generation){this.stream=null;this.context=null;this.status.textContent='Microphone unavailable or permission denied. Tap to try again.';this.button.textContent='Enable microphone';}
    }finally{if(generation===this.generation)this.button.disabled=false;}
  }
  stop(){
    this.stopRecording();
    this.generation++;cancelAnimationFrame(this.frame);this.source?.disconnect();this.stream?.getTracks().forEach(t=>t.stop());this.context?.close();this.pendingContext?.close();this.pendingContext=null;
    this.stream=null;this.context=null;this.button.disabled=false;this.button.textContent='Enable microphone';this.status.textContent='Microphone off';if(this.recordButton)this.recordButton.disabled=true;this.draw();
  }
  startRecording(){
    if(!this.stream||typeof MediaRecorder==='undefined')return;
    try{
      const type=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus'].find(t=>MediaRecorder.isTypeSupported(t));
      const recorder=new MediaRecorder(this.stream,type?{mimeType:type}:undefined),chunks=[];
      this.recorder=recorder;this.recordButton.disabled=true;
      recorder.ondataavailable=event=>{if(event.data?.size)chunks.push(event.data);};
      recorder.onstop=()=>{
        clearTimeout(this.recordTimer);
        if(chunks.length){const mime=recorder.mimeType||chunks[0].type||'application/octet-stream';this.recordedFile=new File([new Blob(chunks,{type:mime})],`cinelit-room-tone-${Date.now()}.${scoutAudioExtension(mime)}`,{type:mime});this.saveButton.disabled=false;this.status.textContent='Recording ready · Save audio';}
        else this.status.textContent='No audio captured. Try recording again.';
        this.recordButton.dataset.recording='false';this.recordButton.textContent='Record';this.recordButton.disabled=!this.stream;
      };
      recorder.onerror=()=>{clearTimeout(this.recordTimer);this.status.textContent='Recording failed. Try again.';this.recordButton.dataset.recording='false';this.recordButton.textContent='Record';this.recordButton.disabled=!this.stream;};
      recorder.start(1000);this.recordButton.disabled=false;this.recordButton.dataset.recording='true';this.recordButton.textContent='Stop record';this.status.textContent='Recording locally · 60 s maximum';
      this.recordTimer=setTimeout(()=>this.stopRecording(),60000);
    }catch{this.status.textContent='Recording unavailable in this browser.';this.recordButton.disabled=!this.stream;}
  }
  stopRecording(){if(this.recorder?.state==='recording'){this.recordButton.disabled=true;this.recorder.stop();clearTimeout(this.recordTimer);}}
  async saveRecording(){
    if(!this.recordedFile)return;
    const file=this.recordedFile;
    try{if(navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'CineLit Meter room tone'});return;}}
    catch(error){if(error.name==='AbortError')return;}
    const url=URL.createObjectURL(file),link=document.createElement('a');link.href=url;link.download=file.name;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
  }
  draw(now=performance.now()){
    const c=this.canvas,w=c.width=window.innerWidth,h=c.height=window.innerHeight,ctx=c.getContext('2d');
    ctx.fillStyle='#0c1419';ctx.fillRect(0,0,w,h);
    const style=getComputedStyle(document.documentElement),safe=name=>parseFloat(style.getPropertyValue(name))||0;
    const footer=Math.max(17,safe('--safe-bottom')+8);
    const left=Math.max(44,safe('--safe-left')+16),right=w-Math.max(16,safe('--safe-right')+10),top=Math.max(138,document.getElementById('sound-controls').getBoundingClientRect().bottom+48),bottom=Math.max(top+35,h-Math.max(48,safe('--safe-bottom')+38)),plotH=bottom-top;
    ctx.font='12px -apple-system, sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
    for(let db=-90;db<=0;db+=15){const y=bottom-(db+90)/90*plotH;ctx.strokeStyle='#35454d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle='#a4b7be';ctx.fillText(String(db),left-8,y);}
    const target=Number.isFinite(this.target)?this.target:-60,ty=bottom-(target+90)/90*plotH;
    ctx.fillStyle='rgba(116,181,145,.06)';ctx.fillRect(left,ty,right-left,bottom-ty);ctx.strokeStyle='#e4bf7d';ctx.lineWidth=1.5;ctx.setLineDash([7,5]);ctx.beginPath();ctx.moveTo(left,ty);ctx.lineTo(right,ty);ctx.stroke();ctx.setLineDash([]);
    ctx.textAlign='right';ctx.fillStyle='#f1d49d';ctx.font='11px -apple-system,sans-serif';ctx.fillText(`Quiet-pause target ${target} dBFS`,right-4,ty-10);
    if(this.stream&&this.levels){
      ctx.textAlign='left';ctx.fillStyle='#b4f4d5';ctx.font='700 30px -apple-system, sans-serif';ctx.fillText(`${this.levels.rms.toFixed(1)} dBFS`,left,top-38);
      ctx.font='13px -apple-system, sans-serif';ctx.fillStyle=this.levels.peak>=-.5?'#ff9c81':'#d5e4e8';ctx.fillText(`Peak ${this.levels.peak.toFixed(1)} dBFS${this.levels.peak>=-.5?' · CLIPPING':''}`,left,top-12);
      ctx.strokeStyle='#a5edcd';ctx.lineWidth=2;ctx.beginPath();this.history.forEach((p,i)=>{const x=right-(now-p.time)/30000*(right-left),y=bottom-(p.value+90)/90*plotH;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    }else{ctx.textAlign='left';ctx.fillStyle='#d5e4e8';ctx.font='16px -apple-system,sans-serif';ctx.fillText('Enable microphone to measure sound',left,top-25);}
    ctx.font='12px -apple-system,sans-serif';ctx.fillStyle='#a4b7be';ctx.textAlign='left';ctx.fillText('30 seconds ago',left,bottom+20);ctx.textAlign='right';ctx.fillText('Now',right,bottom+20);
    ctx.textAlign='center';ctx.font='11px -apple-system,sans-serif';ctx.fillText('Relative mic level · dBFS, not calibrated dB SPL',w/2,h-footer);
  }
}
