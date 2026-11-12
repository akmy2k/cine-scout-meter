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
const CINE_LUX_PER_FC=1/.09290304;
function cineKelvinColour(k){
  const ramp=[[2000,[255,143,62]],[3200,[255,191,126]],[4500,[255,226,190]],[6500,[224,237,255]],[10000,[128,175,255]]];
  if(!Number.isFinite(k))return '#c5c5c5';
  let low=ramp[0],high=ramp[ramp.length-1];
  for(let i=1;i<ramp.length;i++)if(k<=ramp[i][0]){low=ramp[i-1];high=ramp[i];break;}
  const t=Math.max(0,Math.min(1,(k-low[0])/(high[0]-low[0])));
  return 'rgb('+low[1].map((v,i)=>Math.round(v+(high[1][i]-v)*t)).join(',')+')';
}
function cineSpotLight(luma,reference){
  return reference?.illuminanceLux>0&&reference.luma>0?reference.illuminanceLux*Math.max(0,luma)/reference.luma:null;
}
class CineSpotMeter{
  constructor(){
    this.x=.5;this.y=.38;this.reference=null;
    this.readout=document.getElementById('spot-reading');this.temperature=document.getElementById('spot-temperature');this.note=document.getElementById('spot-note');
    this.offset=document.getElementById('spot-offset');this.lightReading=document.getElementById('spot-light-reading');
    this.notation=document.getElementById('spot-notation');this.lightInput=document.getElementById('spot-known-light');this.lightUnit=document.getElementById('spot-light-unit');
    this.inputs=['spot-shutter','spot-iso','spot-nd','spot-known-f'].map(id=>document.getElementById(id));
    this.scale=document.getElementById('spot-scale');this.matchButton=document.getElementById('spot-calibrate');
    CINE_SPOT_STOPS.forEach(f=>{const tick=document.createElement('span');tick.textContent=f;this.scale.append(tick);});
    this.inputs.forEach(input=>input.addEventListener('input',()=>this.update()));
    this.notation.addEventListener('change',()=>this.update());
    this.knownLightUnit=this.lightUnit.value;
    this.lightUnit.addEventListener('change',()=>{
      const value=Number(this.lightInput.value),next=this.lightUnit.value;
      if(value>0&&next!==this.knownLightUnit)this.lightInput.value=Number((next==='fc'?value/CINE_LUX_PER_FC:value*CINE_LUX_PER_FC).toPrecision(5));
      this.knownLightUnit=next;this.update();
    });
    this.matchButton.addEventListener('click',()=>{
      if(!this.sample||this.sample.clipped){this.note.textContent='Choose a neutral midtone/gray card first.';return;}
      const [den,iso,nd,f]=this.values();if(![den,iso,f].every(v=>Number.isFinite(v)&&v>0)||!Number.isFinite(nd))return;
      const knownLight=Number(this.lightInput.value);
      this.reference={luma:this.sample.luma,ev:cineSpotEV(f,1/den,iso,nd),illuminanceLux:knownLight>0?(this.lightUnit.value==='fc'?knownLight*CINE_LUX_PER_FC:knownLight):null};
      this.displayedStopIndex=null;this.update();
    });
    document.getElementById('spot-reset-gray').addEventListener('click',()=>{this.reference=null;this.displayedStopIndex=null;this.update();});
    this.update();
  }
  values(){return this.inputs.map(input=>Number(input.value));}
  reset(){this.reference=null;this.sample=null;this.displayedStopIndex=null;this.update();}
  measure(ctx,w,h){
    const radius=Math.max(2,Math.round(Math.min(w,h)*.015)),cx=Math.round(this.x*w),cy=Math.round(this.y*h),sx=Math.max(0,Math.min(w-2*radius,cx-radius)),sy=Math.max(0,Math.min(h-2*radius,cy-radius));
    const data=ctx.getImageData(sx,sy,2*radius,2*radius).data;let r=0,g=0,b=0;for(let i=0;i<data.length;i+=4){r+=data[i];g+=data[i+1];b+=data[i+2];}const count=data.length/4;
    this.sample=cineSpotReading(r/count,g/count,b/count);this.update();
  }
  update(){
    const sample=this.sample,values=this.values(),[den,iso,nd]=values,known=values[3]===undefined?2.8:values[3],notation=this.notation?.value||'f';
    this.temperature.textContent=sample?.kelvin?'≈ '+sample.kelvin+' K':'— K';
    if(this.temperature.style)this.temperature.style.color=cineKelvinColour(sample?.kelvin);
    if(this.matchButton)this.matchButton.disabled=!sample||sample.clipped;
    const lux=sample?cineSpotLight(sample.luma,this.reference):null;
    if(this.lightReading)this.lightReading.textContent=lux!==null?(sample.clipped?(sample.luma<.005?'≤ ':'≥ '):'≈ ')+Number(lux.toFixed(1))+' lux · '+Number((lux/CINE_LUX_PER_FC).toFixed(1))+' fc · gray-card estimate':'lux / fc — enter known light, then Match gray';
    if(!sample){this.shortReading=notation+'(—)';this.readout.textContent=this.shortReading;this.note.textContent='Tap the camera image to move the spot. Waiting for a camera/photo sample.';if(this.offset)this.offset.textContent='18% gray reference';return;}
    if(!(Number.isFinite(den)&&den>0&&Number.isFinite(iso)&&iso>0&&Number.isFinite(nd)&&Number.isFinite(known)&&known>0)){this.readout.textContent='Check settings';this.shortReading=notation+'(—)';return;}
    const reference=this.reference||{luma:.18,ev:cineSpotEV(known,1/48,800,0)};
    const delta=Math.log2(Math.max(1e-8,sample.luma)/reference.luma),f=cineSpotFstop(reference.ev+delta,1/den,iso,nd),position=cineSpotScale(f);
    if(this.displayedStopIndex==null||Math.abs(2*Math.log2(Math.max(1e-12,f)/CINE_SPOT_STOPS[this.displayedStopIndex]))>.65)this.displayedStopIndex=position.index;
    const index=this.displayedStopIndex,bound=position.edge||(sample.clipped?(sample.luma<.005?'≤':'≥'):'');
    this.shortReading=(bound||'≈ ')+notation+'('+CINE_SPOT_STOPS[index]+')';this.readout.textContent=this.shortReading;
    if(this.offset)this.offset.textContent=(delta>=0?'+':'')+delta.toFixed(1)+' stops · '+(this.reference?'matched gray':'18% gray');
    Array.from(this.scale.children).forEach((tick,i)=>tick.classList.toggle('active',i===index));
    if(this.scaleIndex!==index){this.scale.children[index].scrollIntoView({block:'nearest',inline:'nearest'});this.scaleIndex=index;}
    this.note.textContent=sample.clipped?'Image limit · stop is a bound. Kelvin needs a neutral, unclipped target.':this.reference?'Matched reference · keep camera exposure/WB fixed. Compare lux/fc on the same gray card.':'Relative gray baseline: '+notation+'('+known+') at ISO 800, 1/48, ND 0. Match gray to a trusted meter for a scene reference.';
  }
  draw(ctx,w,h){
    const x=this.x*w,y=this.y*h,r=Math.min(w,h)*.025;
    ctx.save();ctx.strokeStyle='#000';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#f3f3f3';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(x-r-6,y);ctx.lineTo(x+r+6,y);ctx.moveTo(x,y-r-6);ctx.lineTo(x,y+r+6);ctx.stroke();
    const label=this.shortReading||'f(—)';ctx.font='800 '+Math.max(14,Math.min(20,Math.min(w,h)*.036))+'px -apple-system,sans-serif';
    const width=ctx.measureText(label).width+14,height=29;
    let left=x+r+10;if(left+width>w-5)left=x-r-10-width;left=Math.max(5,Math.min(w-width-5,left));const top=Math.max(5,Math.min(h-height-5,y-height/2));
    ctx.fillStyle='rgba(12,12,12,.9)';ctx.beginPath();ctx.roundRect(left,top,width,height,6);ctx.fill();ctx.fillStyle='#ffffff';ctx.textAlign='left';ctx.textBaseline='middle';ctx.fillText(label,left+7,top+height/2);ctx.restore();
  }
}
