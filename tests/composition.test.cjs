const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
vm.runInThisContext(fs.readFileSync(path.join(root, 'composition.js'), 'utf8'));
const w=80,h=60;
function frame(fn) {
  const data=new Uint8ClampedArray(w*h*4);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
    const value=fn(x,y),i=(y*w+x)*4;
    data[i]=data[i+1]=data[i+2]=value;data[i+3]=255;
  }
  return scoutFrameEvidence(data,w,h);
}
for(const id of Object.keys(SCOUT_GUIDES))for(const aspect of [.5,1,2])for(let turn=0;turn<4;turn++) {
  const guide=scoutGuideGeometry(id,turn,true,aspect);
  assert(guide.paths.length);
  assert(guide.paths.flat().every(p=>p.every(Number.isFinite)));
  assert.equal(scoutGuideAlignment(guide,frame(()=>120)).score,0);
}
console.log(`PASS: ${Object.keys(SCOUT_GUIDES).length} guides, rotation, mirroring, portrait/landscape, blank-frame rejection`);
assert(SCOUT_GUIDES.roomCorner);
assert(scoutGuideGeometry('roomCorner').paths.length>=3);
const thirds=scoutGuideGeometry('thirds');
const aligned=scoutGuideAlignment(thirds,frame(x=>x<26?30:220));
const off=scoutGuideAlignment(thirds,frame(x=>x<42?30:220));
assert(Math.max(...aligned.paths)>.68);
assert(Math.max(...off.paths)<.68);
console.log('PASS: aligned edge triggers, displaced edge does not');
let seed=7;
const noise=scoutGuideAlignment(thirds,frame(()=>{seed=seed*16807%2147483647;return seed%256;}));
assert(Math.max(...noise.paths)<.68);
console.log('PASS: random texture does not trigger line glow');
const testEv={edges:new Float32Array(w*h),w,h,mean:1,max:30,prominence:100,focus:[1/3,1/3]};
assert(scoutGuideAlignment(thirds,testEv).focus>.95);
testEv.focus=[.5,.5];
assert.equal(scoutGuideAlignment(thirds,testEv).focus,0);
console.log('PASS: focal proximity distinguishes thirds intersection from centre');
const circle=scoutGuideGeometry('circle',0,false,2).paths[0];
const xs=circle.map(p=>p[0]*2),ys=circle.map(p=>p[1]);
assert(Math.abs((Math.max(...xs)-Math.min(...xs))-(Math.max(...ys)-Math.min(...ys)))<1e-6);
console.log('PASS: circular guide retains circular proportions in landscape');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
for(const [,code]of html.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(code);
assert.equal(JSON.parse(fs.readFileSync(path.join(root,'manifest.json'))).orientation,'any');
console.log('PASS: app script syntax and unlocked install orientation');
