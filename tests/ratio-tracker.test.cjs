const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict');
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../ratio-tracker.js'),'utf8'));
const width=96,height=80;
function scene(dx=0,dy=0,exposure=0){
 const rgba=new Uint8ClampedArray(width*height*4);let seed=719;
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  seed=seed*16807%2147483647;const value=20+seed%25;const i=(y*width+x)*4;rgba[i]=rgba[i+1]=rgba[i+2]=value;rgba[i+3]=255;
 }
 seed=571;
 for(let py=-10;py<=10;py++)for(let px=-10;px<=10;px++){
  seed=seed*16807%2147483647;const x=40+dx+px,y=35+dy+py;
  if(x<0||y<0||x>=width||y>=height)continue;
  const i=(y*width+x)*4,value=45+seed%150+exposure;rgba[i]=rgba[i+1]=rgba[i+2]=value;
 }
 return cineTrackingFrame(rgba,width,height);
}
const node={x:40/(width-1),y:35/(height-1)};
cineTrackRatioNode(node,scene());assert.equal(node.trackState,'tracking');
for(let move=1;move<=8;move++){
 cineTrackRatioNode(node,scene(move,Math.floor(move/2),10));
 assert.equal(node.trackState,'tracking');assert(Math.abs(node.x*(width-1)-(40+move))<.1);assert(Math.abs(node.y*(height-1)-(35+Math.floor(move/2)))<.1);
}
const flat=cineTrackingFrame(new Uint8ClampedArray(width*height*4).fill(90),width,height),last={x:node.x,y:node.y};
cineTrackRatioNode(node,flat);assert.equal(node.trackState,'lost');assert.equal(node.x,last.x);assert.equal(node.y,last.y);
cineTrackRatioNode(node,scene(20,0));assert.equal(node.x,last.x);assert.equal(node.trackState,'lost');
const weak={x:.5,y:.5};cineTrackRatioNode(weak,flat);assert.equal(weak.trackState,'weak');
cineResetRatioTracking(node);node.x=40/(width-1);node.y=35/(height-1);cineTrackRatioNode(node,scene());cineTrackRatioNode(node,scene(2,1));assert.equal(node.trackState,'tracking');
cineTrackRatioNode(node,{gray:new Float32Array(40*40),width:40,height:40});assert.equal(node.trackState,'lost');
const repeating=new Float32Array(width*height);for(let y=0;y<height;y++)for(let x=0;x<width;x++)repeating[y*width+x]=(x%4<2?40:200);
const ambiguous={x:.5,y:.5},pattern={gray:repeating,width,height};cineTrackRatioNode(ambiguous,pattern);cineTrackRatioNode(ambiguous,pattern);assert.equal(ambiguous.trackState,'lost');assert.equal(ambiguous.x,.5);
assert.equal(new Set(CINE_RATIO_COLOURS).size,4);
console.log('PASS ratio texture tracking through movement/exposure change, flat/ambiguous/occluded hold, drag reacquisition, resized-frame loss and four letter colours');
