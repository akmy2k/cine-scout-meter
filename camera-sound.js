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
class ScoutSoundMeter {
  constructor(canvas,button,status){
    this.canvas=canvas;this.button=button;this.status=status;this.history=[];this.generation=0;
    button.addEventListener('click',()=>this.stream?this.stop():this.start());
    document.addEventListener('visibilitychange',()=>{if(document.hidden)this.stop();});
    this.draw();
  }
  async start(){
    const generation=++this.generation;this.button.disabled=true;this.status.textContent='Waiting for microphone permission…';
    let stream,context;
    try{
      const AudioCtx=window.AudioContext||window.webkitAudioContext;
      context=new AudioCtx();this.pendingContext=context;await context.resume();
      if(generation!==this.generation){context.close();return;}
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
      if(generation!==this.generation){stream.getTracks().forEach(t=>t.stop());context.close();return;}
      this.pendingContext=null;this.stream=stream;this.context=context;this.analyser=context.createAnalyser();this.analyser.fftSize=2048;
      this.source=context.createMediaStreamSource(stream);this.source.connect(this.analyser);
      this.samples=new Float32Array(this.analyser.fftSize);this.history=[];this.started=performance.now();this.lastSample=0;
      this.button.textContent='Stop microphone';this.status.textContent='Live microphone · local analysis only';
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
    this.generation++;cancelAnimationFrame(this.frame);this.source?.disconnect();this.stream?.getTracks().forEach(t=>t.stop());this.context?.close();this.pendingContext?.close();this.pendingContext=null;
    this.stream=null;this.context=null;this.button.disabled=false;this.button.textContent='Enable microphone';this.status.textContent='Microphone off · no recording';this.draw();
  }
  draw(now=performance.now()){
    const c=this.canvas,w=c.width=window.innerWidth,h=c.height=window.innerHeight,ctx=c.getContext('2d');
    ctx.fillStyle='#0c1419';ctx.fillRect(0,0,w,h);
    const style=getComputedStyle(document.documentElement),safe=name=>parseFloat(style.getPropertyValue(name))||0;
    const footer=Math.max(17,safe('--safe-bottom')+8);
    const left=Math.max(52,safe('--safe-left')+20),right=w-Math.max(22,safe('--safe-right')+12),top=Math.max(210,Math.min(240,h*.49),document.getElementById('sound-controls').getBoundingClientRect().bottom+65),bottom=Math.max(top+35,h-Math.max(62,safe('--safe-bottom')+50)),plotH=bottom-top;
    ctx.font='12px -apple-system, sans-serif';ctx.textAlign='right';ctx.textBaseline='middle';
    for(let db=-90;db<=0;db+=15){const y=bottom-(db+90)/90*plotH;ctx.strokeStyle='#35454d';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle='#a4b7be';ctx.fillText(String(db),left-8,y);}
    if(this.stream&&this.levels){
      ctx.textAlign='left';ctx.fillStyle='#b4f4d5';ctx.font='700 30px -apple-system, sans-serif';ctx.fillText(`${this.levels.rms.toFixed(1)} dBFS`,left,top-38);
      ctx.font='13px -apple-system, sans-serif';ctx.fillStyle=this.levels.peak>=-.5?'#ff9c81':'#d5e4e8';ctx.fillText(`Peak ${this.levels.peak.toFixed(1)} dBFS${this.levels.peak>=-.5?' · CLIPPING':''}`,left,top-12);
      ctx.strokeStyle='#a5edcd';ctx.lineWidth=2;ctx.beginPath();this.history.forEach((p,i)=>{const x=right-(now-p.time)/30000*(right-left),y=bottom-(p.value+90)/90*plotH;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
    }else{ctx.textAlign='left';ctx.fillStyle='#d5e4e8';ctx.font='16px -apple-system,sans-serif';ctx.fillText('Enable microphone to measure sound',left,top-25);}
    ctx.font='12px -apple-system,sans-serif';ctx.fillStyle='#a4b7be';ctx.textAlign='left';ctx.fillText('30 seconds ago',left,bottom+20);ctx.textAlign='right';ctx.fillText('Now',right,bottom+20);
    ctx.textAlign='center';ctx.font='11px -apple-system,sans-serif';ctx.fillText('Relative mic level · dBFS, not calibrated dB SPL',w/2,h-footer);
  }
}
