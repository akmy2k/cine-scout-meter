const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),path=require('node:path');
vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../camera-sound.js'),'utf8'));
assert([...scoutExposureLut(0)].every((v,i)=>v===i));
assert(scoutExposureLut(1)[100]>100);
assert(scoutExposureLut(-1)[100]<100);
assert.equal(scoutExposureLut(10)[255],255);
assert.equal(scoutAudioLevels(new Float32Array(100)).rms,-90);
assert(Math.abs(scoutAudioLevels(new Float32Array(100).fill(.5)).rms+6.0206)<.001);
assert.equal(scoutAudioLevels(new Float32Array(100).fill(1)).peak,0);
console.log('PASS exposure identity, positive/negative EV, clipping, silence, known RMS and peak');
// No microphone: verify asynchronous permission requests are released on exit.
let resolvePermission,stopped=0;
global.document={addEventListener(){}};
Object.defineProperty(global,'navigator',{value:{mediaDevices:{getUserMedia:()=>new Promise(resolve=>resolvePermission=resolve)}},configurable:true});
global.cancelAnimationFrame=()=>{};
global.window={AudioContext:class{async resume(){} close(){}}};
const meter=Object.create(ScoutSoundMeter.prototype);
Object.assign(meter,{generation:0,button:{},status:{},draw(){}});
(async()=>{
  const pending=meter.start();await Promise.resolve();meter.stop();
  resolvePermission({getTracks:()=>[{stop(){stopped++;}}]});await pending;
  assert.equal(stopped,1);assert.equal(meter.stream,null);assert.equal(meter.button.disabled,false);
  console.log('PASS late microphone permission releases stream after mode exit');
})().catch(error=>{console.error(error);process.exitCode=1;});

// Exercise recording state and preserve the actual supported audio format.
assert.equal(scoutAudioExtension('audio/mp4'),'m4a');
assert.equal(scoutAudioExtension('audio/webm;codecs=opus'),'webm');
global.MediaRecorder=class {
  static isTypeSupported(type){return type==='audio/mp4';}
  constructor(stream,options){this.mimeType=options.mimeType;this.state='inactive';}
  start(){this.state='recording';}
  stop(){this.state='inactive';this.ondataavailable({data:new Blob(['audio'],{type:this.mimeType})});this.onstop();}
};
const recording=Object.create(ScoutSoundMeter.prototype);
Object.assign(recording,{stream:{},recordButton:{dataset:{}},saveButton:{disabled:true},status:{}});
recording.startRecording();assert.equal(recording.recorder.state,'recording');
assert.equal(recording.recordButton.textContent,'Stop record');
recording.stopRecording();assert.equal(recording.recordedFile.type,'audio/mp4');
assert(recording.recordedFile.name.endsWith('.m4a'));assert.equal(recording.saveButton.disabled,false);
assert.equal(recording.recordButton.textContent,'Record');
console.log('PASS recording start/stop, real MIME extension and export readiness');
