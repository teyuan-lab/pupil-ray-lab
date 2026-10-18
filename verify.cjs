const assert=require('node:assert/strict'),O=require('./optics.js');
let cases=0;
function near(a,b,t=1e-5){assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);}
// Snell's law, independent analytical planar air-to-glass interface.
{const t=.4,r=O.trace([{x:0,r:Infinity,a:20,n1:1,n2:1.5}],[-1,0],[Math.cos(t),Math.sin(t)]);near(Math.sin(t),1.5*r.d[1]);}
// Reversibility: exact finite ray returns to its original incoming direction and line.
{const l=O.lens(0,60,12,'Test'),r=O.trace(l.surfaces,[-10,3],[Math.cos(.02),Math.sin(.02)]),b=O.trace(l.surfaces.slice().reverse(),[r.p[0]+r.d[0],r.p[1]+r.d[1]],r.d.map(v=>-v));assert.ok(b.ok);near(b.d[0],-Math.cos(.02));near(b.d[1],-Math.sin(.02));near(b.p[1]+(-10-b.p[0])*b.d[1]/b.d[0],3);}
for(const key in O.presets){
 const s=O.system(key),a=O.analyze(s);assert.ok(a.chief.ok);near(a.entrance.diam,s.p.diam);assert.equal(a.exit.virtual,key==='galilean');
 assert.equal(Math.sign(a.chief.d[1]),['rifle','galilean'].includes(key)?1:-1);
 // Pupil magnification follows the afocal angular magnification invariant in air.
 const q=O.fieldRay(s,1e-5,0),mag=(q.d[1]/q.d[0])/1e-5;near(Math.abs(mag)*a.exit.diam,a.entrance.diam,.003);
 for(const f of [90,160,240])for(const eye of [20,40,65])for(const diam of [8,20,30])for(const stop of [0,30,90])for(const n of [1.45,1.7])for(const defocus of [-12,0,12]){
  const s=O.system(key,{f,eye,diam,stop,n,defocus}),a=O.analyze(s);cases++;
  assert.ok(a.entrance&&a.exit&&a.chief);assert.ok(Number.isFinite(a.exit.diam));
  for(const l of s.ls)if(l.f>0)assert.ok(l.t>2*O.sag(l.r,l.a),'Lens edges must not overlap');
  const aim=O.aim(s,.01,0);assert.ok(aim);const partial=O.trace(s.surfaces.filter(x=>x.x<=s.stop.x),[aim.start,aim.h],aim.d,false);near(partial.p[1],0,1e-7);
  const axial=O.trace(s.surfaces,[-1,1e-5],[1,0],false);s.surfaces.forEach((surf,i)=>assert.ok(s.capacity*Math.abs(axial.points[i+1][1]/1e-5)<=surf.a+1e-6));
  const e=1e-5,idx=s.surfaces.indexOf(s.stop),ss=s.surfaces.slice(s.stop.stop?idx+1:idx),pr=O.trace(ss,[s.stop.x,0],[Math.cos(e),Math.sin(e)],false);if(pr.ok&&Number.isFinite(a.exit.x))near(pr.p[1]+(a.exit.x-pr.p[0])*pr.d[1]/pr.d[0],0,1e-6);
 }
}
console.log(`Passed ${cases} prescription cases + Snell, reversibility, pupil conjugacy, afocal invariant, image orientation, stop identification and chief-ray aiming checks.`);
