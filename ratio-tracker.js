// Small, local texture tracker. No images leave the browser.
// Lost/ambiguous patches hold position until the user drags or re-arms a spot.
const CINE_RATIO_COLOURS=['#00DCFF','#FF5AC8','#FFE66D','#7CF5A1'];
function cineTrackingFrame(rgba,width,height){
  const gray=new Float32Array(width*height);
  for(let i=0;i<gray.length;i++)gray[i]=.2126*rgba[i*4]+.7152*rgba[i*4+1]+.0722*rgba[i*4+2];
  return {gray,width,height};
}
function cineTrackingPatch(frame,x,y){
  const radius=5,{gray,width,height}=frame;
  if(x<radius||y<radius||x>=width-radius||y>=height-radius)return null;
  const values=new Float32Array(121);let sum=0,k=0;
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const v=gray[(y+dy)*width+x+dx];values[k++]=v;sum+=v;}
  const mean=sum/values.length;let norm=0;
  for(let i=0;i<values.length;i++){values[i]-=mean;norm+=values[i]*values[i];}
  return {values,norm:Math.sqrt(norm),contrast:Math.sqrt(norm/values.length)};
}
function cineResetRatioTracking(node){node.tracking=null;node.trackState='placed';}
function cineTrackRatioNode(node,frame){
  const {width,height,gray}=frame;
  if(!node.tracking){
    const fx=node.x*(width-1),fy=node.y*(height-1),x=Math.round(fx),y=Math.round(fy);
    const patch=cineTrackingPatch(frame,x,y);
    node.tracking={width,height,x,y,offsetX:fx-x,offsetY:fy-y,patch,lost:!patch||patch.contrast<3};
    node.trackState=node.tracking.lost?'weak':'tracking';return;
  }
  const state=node.tracking;
  if(state.lost)return;
  if(state.width!==width||state.height!==height){state.lost=true;node.trackState='lost';return;}
  const radius=5,search=10,candidates=[];let best=null;
  for(let dy=-search;dy<=search;dy++)for(let dx=-search;dx<=search;dx++){
    const x=state.x+dx,y=state.y+dy;
    if(x<radius||y<radius||x>=width-radius||y>=height-radius)continue;
    let sum=0,sum2=0,dot=0,k=0;
    for(let py=-radius;py<=radius;py++)for(let px=-radius;px<=radius;px++){
      const v=gray[(y+py)*width+x+px];sum+=v;sum2+=v*v;dot+=v*state.patch.values[k++];
    }
    const norm=Math.sqrt(Math.max(0,sum2-sum*sum/121));
    const score=norm>1?dot/(norm*state.patch.norm):-1;
    const candidate={x,y,score};candidates.push(candidate);
    if(!best||score>best.score)best=candidate;
  }
  let alternate=-1;
  if(best)for(const c of candidates)if(Math.hypot(c.x-best.x,c.y-best.y)>3)alternate=Math.max(alternate,c.score);
  if(!best||best.score<.82||best.score-alternate<.04){state.lost=true;node.trackState='lost';return;}
  state.x=best.x;state.y=best.y;
  node.x=(best.x+state.offsetX)/(width-1);node.y=(best.y+state.offsetY)/(height-1);
  node.trackState='tracking';
}
