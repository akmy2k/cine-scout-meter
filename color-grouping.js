// Deterministic perceptual grouping. Lower luminance weight tolerates shading.
function scoutLab(p) {
  const linear = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const r = linear(p.r), g = linear(p.g), b = linear(p.b);
  const l = Math.cbrt(.4122214708*r + .5363325363*g + .0514459929*b);
  const m = Math.cbrt(.2119034982*r + .6806995451*g + .1073969566*b);
  const s = Math.cbrt(.0883024619*r + .2817188376*g + .6299787005*b);
  return [100*(.2104542553*l + .793617785*m - .0040720468*s),
    100*(1.9779984951*l - 2.428592205*m + .4505937099*s),
    100*(.0259040371*l + .7827717662*m - .808675766*s)];
}
function scoutDistance(a, b) {
  return Math.hypot(.4*(a[0]-b[0]), a[1]-b[1], a[2]-b[2]);
}
function groupSceneColors(pixels, tolerance = 14) {
  if (!pixels.length) return [];
  const bins = new Map();
  for (const p of pixels) {
    const key = ((p.r>>4)<<8) | ((p.g>>4)<<4) | (p.b>>4);
    let bin = bins.get(key);
    if (!bin) { bin = {r:0,g:0,b:0,n:0}; bins.set(key,bin); }
    bin.r += p.r; bin.g += p.g; bin.b += p.b; bin.n++;
  }
  const samples = [...bins.values()].map(p => ({r:p.r/p.n,g:p.g/p.n,b:p.b/p.n,n:p.n}));
  samples.forEach(p => p.lab = scoutLab(p));
  samples.sort((a,b) => b.n-a.n || a.r-b.r || a.g-b.g || a.b-b.b);
  const groups = [];
  for (const p of samples) {
    let closest = null, distance = tolerance;
    for (const g of groups) {
      const d = scoutDistance(p.lab,g.lab);
      if (d < distance) { closest = g; distance = d; }
    }
    if (!closest) groups.push({...p,lab:[...p.lab]});
    else {
      const n = closest.n+p.n;
      for (const k of ['r','g','b']) closest[k] = (closest[k]*closest.n + p[k]*p.n)/n;
      closest.n=n; closest.lab=scoutLab(closest);
    }
  }
  groups.sort((a,b)=>b.n-a.n);
  const top = groups.slice(0,3).map(g=>({...g}));
  // Fold smaller families into their nearest displayed family; account for every pixel.
  for (const g of groups.slice(3)) {
    const nearest = top.reduce((a,b)=>scoutDistance(g.lab,a.lab)<=scoutDistance(g.lab,b.lab)?a:b);
    nearest.n += g.n;
  }
  const results = top.map(g=>({r:g.r,g:g.g,b:g.b,pct:100*g.n/pixels.length})).sort((a,b)=>b.pct-a.pct);
  while(results.length<3) results.push({...results[0],pct:0});
  return results;
}
