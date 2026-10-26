/* Alignment estimates local contrast and edges, not aesthetic quality. */
const SCOUT_GUIDES = {
  thirds: 'Rule of thirds', golden: 'Golden section', spiral: 'Golden spiral', spiralgrid: 'Spiral section',
  goldenTriangle: 'Golden triangles', harmonious: 'Harmonious triangles', diagonal: 'Diagonal',
  doubleDiagonal: 'Double diagonal', cross: 'Cross', focal: 'Focal mass', vee: 'V arrangement',
  pyramid: 'Pyramid', radial: 'Radiating', funnel: 'Funnel', scurve: 'S curve', lshape: 'L arrangement',
  roomCorner: 'Room corner / leading lines', circle: 'Circular', ccurve: 'C curve', balance: 'Balance', unbalanced: 'Asymmetric balance'
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
  if(ev.max<12 || ev.mean<.15) return {score:0,paths:geometry.paths.map(()=>0),focus:0};
  const pathScores=geometry.paths.map(path=>{
    let hits=0,sum=0,n=0;
    for(let j=1;j<path.length;j++){
      const a=path[j-1],b=path[j],steps=Math.max(2,Math.ceil(Math.hypot((b[0]-a[0])*ev.w,(b[1]-a[1])*ev.h)));
      for(let k=0;k<=steps;k++){
        const t=k/steps,x=Math.round((a[0]+(b[0]-a[0])*t)*(ev.w-1)),y=Math.round((a[1]+(b[1]-a[1])*t)*(ev.h-1));
        if(x<2||x>=ev.w-2||y<2||y>=ev.h-2)continue;
        let best=0;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)best=Math.max(best,ev.edges[(y+dy)*ev.w+x+dx]);
        sum+=best;if(best>Math.max(14,ev.mean*1.9))hits++;n++;
      }
    }
    if(!n)return 0;
    const coverage=hits/n,lift=(sum/n)/(ev.mean+2);
    return Math.min(1,Math.max(0,(coverage-.22)/.5))*Math.min(1,Math.max(0,(lift-1.6)/1.8));
  });
  let focal=0;
  if(geometry.anchors.length&&ev.prominence>28){
    const distance=Math.min(...geometry.anchors.map(p=>Math.hypot(p[0]-ev.focus[0],p[1]-ev.focus[1])));
    focal=Math.max(0,1-distance/.12)*Math.min(1,(ev.prominence-28)/45);
  }
  return {score:Math.max(focal,...pathScores),paths:pathScores,focus:focal,focusPoint:ev.focus};
}
function scoutDrawGuide(ctx,w,h,geometry,alignment={paths:[],focus:0},glow=true){
  ctx.save();ctx.lineWidth=Math.max(1,Math.min(w,h)/650);ctx.lineJoin='round';ctx.lineCap='round';
  geometry.paths.forEach((path,i)=>{
    const close=glow&&(alignment.paths[i]||0)>.68;
    ctx.strokeStyle=close?'rgba(111,240,188,.94)':'rgba(235,240,242,.42)';ctx.shadowColor='rgba(83,235,168,.8)';ctx.shadowBlur=close?12:0;
    ctx.beginPath();path.forEach(([x,y],j)=>j?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.stroke();
  });
  for(const [x,y] of geometry.anchors){const near=alignment.focusPoint && Math.hypot(x-alignment.focusPoint[0],y-alignment.focusPoint[1])<.10;const close=glow&&alignment.focus>.68&&near;ctx.shadowBlur=close?15:0;ctx.strokeStyle=close?'rgba(111,240,188,.98)':'rgba(235,240,242,.55)';ctx.beginPath();ctx.arc(x*w,y*h,Math.max(4,Math.min(w,h)*.009),0,Math.PI*2);ctx.stroke();}
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
