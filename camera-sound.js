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
