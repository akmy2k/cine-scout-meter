const fs=require("node:fs"),vm=require("node:vm"),assert=require("node:assert/strict");
vm.runInThisContext(fs.readFileSync(require("node:path").join(__dirname,"../spot-meter.js"),"utf8"));
const ev=cineSpotEV(4,1/48,800,0);
assert(Math.abs(cineSpotFstop(ev,1/48,800,0)-4)<1e-9);
assert(Math.abs(cineSpotFstop(ev,1/48,1600,0)-4*Math.sqrt(2))<1e-9);
assert(Math.abs(cineSpotFstop(ev,1/48,800,2)-2)<1e-9);
assert(Math.abs(cineSpotFstop(ev,1/96,800,0)-4/Math.sqrt(2))<1e-9);
assert(Math.abs(cineSpotFstop(ev+1,1/48,800,0)-4*Math.sqrt(2))<1e-9);
assert(Math.abs(cineSpotReading(128,128,128).kelvin-6500)<=100);
assert.equal(cineSpotReading(255,255,255).kelvin,null);
assert.equal(cineSpotReading(255,0,0).kelvin,null);
assert.equal(cineSpotReading(0,0,0).kelvin,null);
assert(cineSpotReading(180,180,180).luma>cineSpotReading(128,128,128).luma);
console.log("PASS spot exposure round trip, ISO/shutter/ND direction, one-stop luminance response, D65 and invalid CCT rejection");

assert.equal(CINE_SPOT_STOPS.length,15);assert.equal(cineSpotScale(0).value,1);assert.equal(cineSpotScale(256).value,128);assert.equal(cineSpotScale(4).index,4);
const meter=Object.create(CineSpotMeter.prototype);Object.assign(meter,{sample:cineSpotReading(0,0,0),reference:{luma:.18,ev:10},values:()=>[48,800,0],readout:{},temperature:{},note:{},scale:{children:Array.from({length:15},()=>({classList:{toggle(){}},scrollIntoView(){}}))}});
meter.update();assert(meter.readout.textContent.startsWith('≤f/1.0'));assert(!meter.readout.textContent.includes('NaN'));meter.sample=cineSpotReading(255,255,255);meter.update();assert(meter.readout.textContent.includes('f/'));
console.log('PASS 15-position scale and dark/clipped exposure readouts without range errors');
