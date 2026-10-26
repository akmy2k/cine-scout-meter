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
class CineSpotMeter{
  constructor(){
    this.x=.5;this.y=.5;this.readout=document.getElementById('spot-reading');this.temperature=document.getElementById('spot-temperature');this.note=document.getElementById('spot-note');
    this.inputs=['spot-shutter','spot-iso','spot-nd','spot-known-f'].map(id=>document.getElementById(id));
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
    if(sample.clipped){this.readout.textContent='Outside measuring range';this.note.textContent='Choose a spot away from clipped whites and deep blacks.';return;}
    if(!this.reference){this.readout.textContent='f/— · match a reference';this.note.textContent='Enter a trusted meter’s f-stop below, then tap Match. Auto exposure / white balance affect readings.';return;}
    if(!(den>0&&iso>0&&Number.isFinite(nd))){this.readout.textContent='Check settings';return;}
    const delta=Math.log2(sample.luma/this.reference.luma),f=cineSpotFstop(this.reference.ev+delta,1/den,iso,nd);
    this.readout.textContent=`f/${f.toFixed(1)} · ${delta>=0?'+':''}${delta.toFixed(1)} stops`;
    this.note.textContent='Relative to matched spot · keep camera exposure and white balance fixed. Re-match after camera changes.';
  }
  draw(ctx,w,h){const x=this.x*w,y=this.y*h,r=Math.min(w,h)*.025;ctx.save();ctx.strokeStyle='#000';ctx.lineWidth=4;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#e9f7ee';ctx.lineWidth=1.5;ctx.stroke();ctx.beginPath();ctx.moveTo(x-r-6,y);ctx.lineTo(x+r+6,y);ctx.moveTo(x,y-r-6);ctx.lineTo(x,y+r+6);ctx.stroke();ctx.restore();}
}
