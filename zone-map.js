// A ZONE: scene-linear stop bands around 18% middle gray.
const CINE_ZONES = [
  {stop:4,min:3.5,label:'+4',rgb:[255,255,255],hex:'#FFFFFF'},
  {stop:3,min:2.5,label:'+3',rgb:[255,32,32],hex:'#FF2020'},
  {stop:2,min:1.5,label:'+2',rgb:[255,100,0],hex:'#FF6400'},
  {stop:1,min:.5,label:'+1',rgb:[255,235,0],hex:'#FFEB00'},
  {stop:0,min:-.5,label:'0 · 18%',rgb:[118,118,118],hex:'#767676'},
  {stop:-1,min:-1.5,label:'−1',rgb:[0,215,190],hex:'#00D7BE'},
  {stop:-2,min:-2.5,label:'−2',rgb:[57,255,20],hex:'#39FF14'},
  {stop:-3,min:-3.5,label:'−3',rgb:[22,45,150],hex:'#162D96'},
  {stop:-4,min:-Infinity,label:'−4',rgb:[64,16,104],hex:'#401068'}
];
const CINE_LINEAR=Float64Array.from({length:256},(_,i)=>{const v=i/255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
function cineZoneMap(count=9,under=1,over=1){
  if(![3,5,7,9].includes(count))throw new Error('A ZONE supports 3, 5, 7 or 9 bands');
  if(count===3){
    if(!Number.isFinite(under)||under<=0||!Number.isFinite(over)||over<=0)throw new Error('Boundaries must be positive stops from middle gray');
    return [
      {...CINE_ZONES[3],stop:over,min:over,label:'+'+over},
      {...CINE_ZONES[4],min:-under},
      {...CINE_ZONES[5],stop:-under,min:-Infinity,label:'−'+under}
    ].map(z=>({...z,threshold:.18*2**z.min}));
  }
  const half=(count-1)/2;
  const map=CINE_ZONES.filter(z=>Math.abs(z.stop)<=half).map(z=>({...z}));
  map[map.length-1].min=-Infinity;
  return map.map(z=>({...z,threshold:.18*2**z.min}));
}
const CINE_DEFAULT_ZONE_MAP=cineZoneMap(9);
function cineZoneForLuminance(y,map=CINE_DEFAULT_ZONE_MAP){
  if(map.length===3){
    if(y>=map[0].threshold)return map[0];
    if(y<=map[1].threshold)return map[2];
    return map[1];
  }
  return map.find(z=>y>=z.threshold)||map[map.length-1];
}
function cineImageLuminance(r,g,b){return .2126*CINE_LINEAR[r]+.7152*CINE_LINEAR[g]+.0722*CINE_LINEAR[b];}
function cineZoneForRGB(r,g,b,map=CINE_DEFAULT_ZONE_MAP){return cineZoneForLuminance(cineImageLuminance(r,g,b),map);}
function cineZoneForRGBFast(r,g,b,map=CINE_DEFAULT_ZONE_MAP){
  const y=cineImageLuminance(r,g,b);
  if(map.length===3)return y>=map[0].threshold?map[0]:y<=map[1].threshold?map[2]:map[1];
  for(let i=0;i<map.length;i++)if(y>=map[i].threshold)return map[i];
  return map[map.length-1];
}
function cineSpotLetter(index){return String.fromCharCode(65+index);}
