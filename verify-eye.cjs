const assert=require('node:assert/strict'),O=require('./optics.js'),E=require('./eye.js');
const near=(a,b,t=1e-6)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
// Independent paraxial single-surface focus nR/(n-1), and exact retinal sphere intersection.
const eye=E.model(0,0,4,60),ray={p:[-10,.0001,0],d:[1,0,0]},h=E.eyeRay(ray,eye);
near(h.local[0],eye.depth);near(h.local[1],0,1e-8);near(eye.depth,eye.n*eye.radius/(eye.n-1));
assert.equal(E.eyeRay({p:[-10,3,0],d:[1,0,0]},eye),null);
const blocked=E.eyeRay({p:[-10,3,0],d:[1,0,0]},eye,true);assert.ok(blocked.blocked);near(blocked.aperture[0],eye.pupilX);assert.ok(blocked.cornea[0]<blocked.aperture[0]);assert.ok(eye.pupilX>eye.x);near(eye.entranceX,eye.x+eye.entranceDepth);
const shifted=E.model(0,8,4);assert.equal(E.eyeRay(ray,shifted),null);
for(const key in O.presets){
 const s=O.system(key),a=O.analyze(s),e=E.model(a.relief>0?a.exit.x:s.last+25,0,4);
 // Match full 3D tracing to the established meridional trace.
 for(const theta of [0,.005,.015])for(const target of [-s.stop.a*.6,0,s.stop.a*.6]){
  const m=O.fieldRay(s,theta,target),r=E.fieldRay(s,theta,0,target,0);if(m?.ok){assert.ok(r);near(m.p[0],r.p[0]);near(m.p[1],r.p[1]);near(m.d[1],r.d[1]);}
 }
 // Rotational invariance of a centered circular optical system.
 const y=E.fieldRay(s,.003,0,1,0),z=E.fieldRay(s,0,.003,0,1);assert.ok(y&&z);near(y.p[1],z.p[2]);near(y.d[1],z.d[2]);
 const t=E.targetRays(s),hits=t.samples.map(r=>E.eyeRay(r,e)).filter(Boolean);assert.ok(hits.length>0);assert.ok(hits.length<=t.samples.length);
 for(const hit of hits){near(hit.aperture[0],e.pupilX);assert.ok(Math.hypot(hit.aperture[1]-e.y,hit.aperture[2])<=e.diam/2+1e-8);near((hit.local[0]-e.retinaCenter)**2+hit.local[1]**2+hit.local[2]**2,144,1e-5);assert.ok(hit.local.every(Number.isFinite));}
 const missed=t.samples.map(r=>E.eyeRay(r,E.model(e.x,8,2))).filter(Boolean);assert.ok(missed.length<hits.length);
}
// Increasing eye power moves the paraxial focus in front of the fixed retina.
for(const power of [50,60,70]){const e=E.model(0,0,4,power),h=E.eyeRay({p:[-10,.01,0],d:[1,0,0]},e);if(power===60)near(h.local[1],0,1e-7);else assert.equal(Math.sign(h.local[1]),power<60?1:-1);}
console.log('Passed reduced-eye focus, aperture clipping, curved retina, 3D/meridional agreement, rotational symmetry and all-system retinal capture checks.');
