(function(root){
'use strict';
const presets={
 kepler:{name:'Keplerian telescope',f:160,eye:32,diam:24,field:1,description:'A positive objective and positive eyepiece form an inverted angular image. The objective aperture is imaged beyond the eyepiece.'},
 eyepiece:{name:'Two-element eyepiece',f:110,eye:32,diam:20,field:1,description:'An upstream objective supplies a real intermediate image to a two-element positive eyepiece. The upstream aperture determines the exit pupil; the intermediate image is not a pupil.'},
 rifle:{name:'Rifle scope · erecting relay',f:180,eye:55,diam:24,field:.7,description:'A positive relay re-images the first image before the ocular. Two image inversions give an upright view. This is an illustrative fixed-power scope, not a commercial prescription.'},
 galilean:{name:'Galilean telescope',f:140,eye:32,diam:22,field:.8,description:'A negative eyepiece intercepts the converging objective beam. Its exit pupil is virtual and lies inside the instrument; there is no accessible external eye-relief plane.'}
};
function sag(r,y){return r===Infinity?0:(y*y/r)/(1+Math.sqrt(1-y*y/(r*r)));}
function lens(x,f,a,name,n=1.517){const r=(n-1)*2*f,t=Math.max(3,Math.min(8,a*.42),f>0?2*sag(r,a)+1:0);return {x,f,a,t,r,name,n,surfaces:[{x,r,a,n1:1,n2:n,name:name+' front'},{x:x+t,r:-r,a,n1:n,n2:1,name:name+' rear'}]};}
function hit(s,p,d){
 let ts=[];
 if(!Number.isFinite(s.r))ts=[(s.x-p[0])/d[0]];
 else {let q=p[0]-s.x-s.r,b=q*d[0]+p[1]*d[1],c=q*q+p[1]*p[1]-s.r*s.r,disc=b*b-c;if(disc<0)return null;ts=[-b-Math.sqrt(disc),-b+Math.sqrt(disc)];}
 const valid=ts.filter(t=>t>=-1e-7).map(t=>[p[0]+t*d[0],p[1]+t*d[1]]).filter(q=>Math.abs(q[1])<Math.abs(s.r)&&Math.abs(q[0]-s.x-sag(s.r,q[1]))<1e-5);
 return valid[0]||null;
}
function trace(surfaces,p,d,clip=true){
 p=p.slice();d=d.slice();const points=[p.slice()];
 for(const s of surfaces){const q=hit(s,p,d);if(!q)return {ok:false,points,p,d,reason:'Missed surface'};points.push(q);if(clip&&Math.abs(q[1])>s.a+1e-7)return {ok:false,points,p:q,d,reason:'Aperture clipping'};
 let normal=Number.isFinite(s.r)?[1,-q[1]/(s.r*Math.sqrt(1-q[1]*q[1]/(s.r*s.r)))]:[1,0];let len=Math.hypot(...normal);normal=normal.map(v=>v/len);let dot=d[0]*normal[0]+d[1]*normal[1];if(dot<0){normal=normal.map(v=>-v);dot=-dot;}
 const eta=d[0]>0?s.n1/s.n2:s.n2/s.n1,tx=eta*(d[0]-dot*normal[0]),ty=eta*(d[1]-dot*normal[1]),k=1-tx*tx-ty*ty;if(k<0)return {ok:false,points,p:q,d,reason:'Total internal reflection'};
 d=[tx+Math.sqrt(k)*normal[0],ty+Math.sqrt(k)*normal[1]];p=q;
 }
 return {ok:true,points,p,d};
}
function focal(l){const r=trace(l.surfaces,[-.1,1e-4],[1,0],false),b=-r.p[1]*r.d[0]/r.d[1];return {bfl:b,ffl:b,efl:-1e-4*r.d[0]/r.d[1]};} // symmetric singlet, equal front/back focal distances
function system(key,params={}){
 const defaults=presets[key],p={...defaults,n:1.517,defocus:0,stop:0,...params};let ls=[];
 const obj=lens(0,p.f,Math.max(16,p.diam*.65),'Objective',p.n);ls.push(obj);let image=obj.t+focal(obj).bfl;
 if(key==='rifle'){const rf=focal(lens(0,45,15,'',p.n)),relay=lens(image+rf.ffl+rf.efl,45,15,'Erecting relay',p.n);ls.push(relay);image=relay.x+relay.t+rf.bfl+rf.efl;}
 if(key==='eyepiece'){
  // Two identical positive singlets separated by 0.6 nominal ocular focal length.
  const e1=lens(0,p.eye*1.75,14,'Field lens',p.n),e2=lens(e1.t+p.eye*.6,p.eye*1.75,14,'Eye lens',p.n),ss=[...e1.surfaces,...e2.surfaces];
  const rev=trace(ss.slice().reverse(),[e2.x+e2.t+.1,1e-4],[-1,0],false);const focus=rev.p[0]-rev.p[1]*rev.d[0]/rev.d[1];let shift=image-focus+p.defocus;e1.x+=shift;e2.x+=shift;for(const l of [e1,e2]){l.surfaces.forEach(s=>s.x+=shift);ls.push(l);}
 }else{const fe=key==='galilean'?-p.eye:p.eye,e=lens(0,fe,Math.max(14,p.diam*.6),'Eyepiece',p.n);let x=image+focal(e).ffl+p.defocus;e.x=x;e.surfaces.forEach(s=>s.x+=x);ls.push(e);}
 const last=ls.at(-1).x+ls.at(-1).t;
 // Negative travel moves into object space; positive travel stays in the first air gap.
 const stopx=p.stop<0?p.stop*p.f/100:p.stop===0?-.02:obj.t+1+(ls[1].x-obj.t-2)*p.stop/100;
 const diaphragm={x:stopx,r:Infinity,a:p.diam/2,n1:1,n2:1,stop:true,name:'Diaphragm'};
 const surfaces=[...ls.flatMap(l=>l.surfaces),diaphragm].sort((a,b)=>a.x-b.x);
 // Identify the actual paraxial aperture stop by the on-axis collimated-ray height at every clear aperture.
 const axial=trace(surfaces,[Math.min(-1,stopx-1),1e-5],[1,0],false);let capacity=Infinity,stop=diaphragm;
 if(axial.ok)surfaces.forEach((s,i)=>{const h=Math.abs(axial.points[i+1][1]/1e-5),c=h>1e-10?s.a/h:Infinity;if(c<capacity){capacity=c;stop=s;}});
 return {key,p,ls,surfaces,stop,diaphragm,last,image,capacity};
}
function pupil(sys,side){
 const dir=side==='entrance'?-1:1,idx=sys.surfaces.indexOf(sys.stop),ss=dir<0?sys.surfaces.slice(0,idx).reverse():sys.surfaces.slice(sys.stop.stop?idx+1:idx);
 if(!ss.length)return {x:sys.stop.x,diam:sys.stop.a*2,mag:1,virtual:false};
 const e=1e-5,a=trace(ss,[sys.stop.x,0],[dir*Math.cos(e),Math.sin(e)],false),b=trace(ss,[sys.stop.x,e],[dir,0],false);
 if(!a.ok||!b.ok)return null;let slope=a.d[1]/a.d[0];if(Math.abs(slope)<1e-12)return {x:Infinity,diam:Infinity,mag:Infinity,virtual:false};
 const x=a.p[0]-a.p[1]/slope,mag=(b.p[1]+(x-b.p[0])*b.d[1]/b.d[0])/e;
 return {x,diam:Math.abs(mag)*sys.stop.a*2,mag,virtual:(x-a.p[0])*dir<0};
}
function aim(sys,angle,target){
 const start=Math.min(0,sys.diaphragm.x)-Math.max(35,sys.p.f*.2),d=[Math.cos(angle),Math.sin(angle)],ss=sys.surfaces.filter(s=>s.x<=sys.stop.x);
 function run(h){const r=trace(ss,[start,h],d,false);return r.ok?r:null;}
 let h=target-(sys.stop.x-start)*Math.tan(angle);
 for(let i=0;i<18;i++){let r=run(h);if(!r)return null;let err=r.p[1]-target;if(Math.abs(err)<1e-8)return {h,start,d};let r2=run(h+.0001);if(!r2)return null;let derivative=(r2.p[1]-r.p[1])/.0001;if(Math.abs(derivative)<1e-9)return null;h-=err/derivative;}
 return null;
}
function fieldRay(sys,angle,target){const a=aim(sys,angle,target);if(!a)return null;return {...trace(sys.surfaces,[a.start,a.h],a.d),target,angle};}
function analyze(sys){const entrance=pupil(sys,'entrance'),exit=pupil(sys,'exit'),chief=fieldRay(sys,sys.p.field*Math.PI/180,0);return {entrance,exit,chief,relief:exit?exit.x-sys.last:NaN};}
const api={presets,sag,lens,hit,trace,focal,system,pupil,aim,fieldRay,analyze};if(typeof module!=='undefined')module.exports=api;else root.Optics=api;
})(typeof window!=='undefined'?window:globalThis);
