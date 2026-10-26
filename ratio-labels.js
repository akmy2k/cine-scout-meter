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
