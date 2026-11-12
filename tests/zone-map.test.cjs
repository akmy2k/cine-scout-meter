const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
vm.runInThisContext(fs.readFileSync(path.join(root,'zone-map.js'),'utf8'));
assert.equal(CINE_ZONES.length,9);
for(let stop=-4;stop<=4;stop++)assert.equal(cineZoneForLuminance(.18*2**stop).stop,stop);
assert.equal(cineZoneForLuminance(0).stop,-4);
assert.equal(cineZoneForLuminance(100).stop,4);
assert.equal(cineZoneForRGB(118,118,118).stop,0);
assert.equal(cineZoneForRGB(255,0,0).stop,0);
for(const count of [9,5,3]){
 const map=cineZoneMap(count);assert.equal(map.length,count);
 assert.equal(cineZoneForLuminance(.18,map).stop,0);
 assert.equal(cineZoneForLuminance(0,map),map[map.length-1]);
 assert.equal(cineZoneForLuminance(100,map),map[0]);
}
const custom=cineZoneMap(3,.7,1.3);
assert.equal(cineZoneForLuminance(.18*2**-.7,custom).stop,-.7);
assert.equal(cineZoneForLuminance(.18*2**1.3,custom).stop,1.3);
assert.equal(cineZoneForLuminance(.18*2**.9,custom).stop,0);
assert.equal(cineZoneForLuminance(.18*2**-.6,custom).stop,0);
assert.throws(()=>cineZoneMap(3,0,1));
for(let r=0;r<256;r+=17)for(let g=0;g<256;g+=17)for(let b=0;b<256;b+=17) assert.equal(cineZoneForRGBFast(r,g,b),cineZoneForRGB(r,g,b));
assert.deepEqual([0,1,2,3].map(cineSpotLetter),['A','B','C','D']);
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const snap=html.match(/    function snapRatioGuesstimate[\s\S]*?\n    }/)[0];
vm.runInThisContext(snap);
for(let stop=0;stop<=12;stop++)assert.equal(snapRatioGuesstimate(2**stop),2**stop);
assert.equal(snapRatioGuesstimate(3),4);assert.equal(snapRatioGuesstimate(6),8);assert.equal(snapRatioGuesstimate(12),16);
for(let ratio=1;ratio<100;ratio+=.17)assert(Number.isInteger(Math.log2(snapRatioGuesstimate(ratio))));

console.log('PASS ZONEZ custom maps, linear RGB and whole-stop ratio display');
