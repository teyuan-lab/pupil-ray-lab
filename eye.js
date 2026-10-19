(function(root){
'use strict';
const dot=(a,b)=>a.reduce((v,x,i)=>v+x*b[i],0),add=(p,d,t)=>p.map((v,i)=>v+t*d[i]),unit=d=>{const l=Math.hypot(...d);return d.map(v=>v/l);};
function intersection(s,p,d){
 let ts;if(!Number.isFinite(s.r))ts=[(s.x-p[0])/d[0]];
 else{const q=[p[0]-s.x-s.r,p[1],p[2]],b=dot(q,d),disc=b*b-dot(q,q)+s.r*s.r;if(disc<0)return null;ts=[-b-Math.sqrt(disc),-b+Math.sqrt(disc)];}
 for(const t of ts)if(t>=-1e-7){const q=add(p,d,t),rho=Math.hypot(q[1],q[2]);if(!Number.isFinite(s.r))return q;if(rho>=Math.abs(s.r))continue;const sag=(rho*rho/s.r)/(1+Math.sqrt(1-rho*rho/(s.r*s.r)));if(Math.abs(q[0]-s.x-sag)<1e-5)return q;}
 return null;
}
function refract(s,q,d){
 let normal=Number.isFinite(s.r)?unit([1,-q[1]/(s.r*Math.sqrt(1-(q[1]*q[1]+q[2]*q[2])/(s.r*s.r))),-q[2]/(s.r*Math.sqrt(1-(q[1]*q[1]+q[2]*q[2])/(s.r*s.r)))]):[1,0,0];let c=dot(d,normal);if(c<0){normal=normal.map(v=>-v);c=-c;}const eta=d[0]>0?s.n1/s.n2:s.n2/s.n1,t=d.map((v,i)=>eta*(v-c*normal[i])),k=1-dot(t,t);return k<0?null:t.map((v,i)=>v+Math.sqrt(k)*normal[i]);
}
function trace(surfaces,p,d,clip=true){const points=[p];for(const s of surfaces){const q=intersection(s,p,d);if(!q)return null;points.push(q);if(clip&&Math.hypot(q[1],q[2])>s.a+1e-7)return null;d=refract(s,q,d);if(!d)return null;p=q;}return {p,d,points};}
function fieldRay(sys,ay,az,ty,tz){
 const start=Math.min(0,sys.diaphragm.x)-Math.max(35,sys.p.f*.2),d=unit([1,Math.tan(ay),Math.tan(az)]),ss=sys.surfaces.filter(s=>s.x<=sys.stop.x);let y=ty-(sys.stop.x-start)*d[1]/d[0],z=tz-(sys.stop.x-start)*d[2]/d[0];
 for(let i=0;i<12;i++){const r=trace(ss,[start,y,z],d,false);if(!r)return null;const ey=r.p[1]-ty,ez=r.p[2]-tz;if(Math.hypot(ey,ez)<1e-7)return trace(sys.surfaces,[start,y,z],d);const h=1e-4,ry=trace(ss,[start,y+h,z],d,false),rz=trace(ss,[start,y,z+h],d,false);if(!ry||!rz)return null;const a=(ry.p[1]-r.p[1])/h,b=(rz.p[1]-r.p[1])/h,c=(ry.p[2]-r.p[2])/h,e=(rz.p[2]-r.p[2])/h,det=a*e-b*c;if(Math.abs(det)<1e-10)return null;y-=(e*ey-b*ez)/det;z-=(-c*ey+a*ez)/det;}return null;
}
function model(entranceX,y,diam,power=57){
 const n=4/3,depth=200/9,radius=(n-1)*1000/power,pupilDepth=3;
 // Gaussian image of the internal iris through the equivalent front refractor.
 const entranceDepth=pupilDepth/(n-pupilDepth*power/1000),entranceMagnification=n/(n-pupilDepth*power/1000),x=entranceX-entranceDepth;
 return {x,y,diam,power,n,depth,radius,pupilDepth,pupilX:x+pupilDepth,entranceX,entranceDepth,entranceDiam:diam*entranceMagnification,retinaRadius:12,retinaCenter:depth-12};
}
function eyeRay(ray,eye,includeBlocked=false){
 if(!ray||eye.x<ray.p[0]-1e-7)return null;
 let p=[ray.p[0]-eye.x,ray.p[1]-eye.y,ray.p[2]],d=ray.d;
 const t=-p[0]/d[0];if(t<0)return null;const entry=add(p,d,t);
 const s={x:0,r:eye.radius,a:4.5,n1:1,n2:eye.n},q=intersection(s,p,d);if(!q||Math.hypot(q[1],q[2])>4.5)return null;d=refract(s,q,d);if(!d)return null;
 const pupilT=(eye.pupilDepth-q[0])/d[0];if(pupilT<0)return null;const aperture=add(q,d,pupilT);
 if(Math.hypot(aperture[1],aperture[2])>eye.diam/2+1e-8)return includeBlocked?{entry:[eye.x,entry[1]+eye.y,entry[2]],cornea:[q[0]+eye.x,q[1]+eye.y,q[2]],aperture:[eye.pupilX,aperture[1]+eye.y,aperture[2]],blocked:true}:null;
 const v=[q[0]-eye.retinaCenter,q[1],q[2]],b=dot(v,d),disc=b*b-dot(v,v)+144;if(disc<0)return null;const ts=[-b-Math.sqrt(disc),-b+Math.sqrt(disc)],hits=ts.filter(t=>t>0).map(t=>add(q,d,t)).filter(p=>p[0]>=eye.retinaCenter);if(!hits.length)return null;
 return {entry:[eye.x,entry[1]+eye.y,entry[2]],aperture:[eye.pupilX,aperture[1]+eye.y,aperture[2]],cornea:[q[0]+eye.x,q[1]+eye.y,q[2]],retina:[hits[0][0]+eye.x,hits[0][1]+eye.y,hits[0][2]],local:hits[0],d};
}
function targetRays(sys){
 const samples=[],step=.07*Math.PI/180,N=37;let launched=0;
 // An asymmetric F target. The ray direction is opposite to the scene coordinate.
 for(let row=0;row<13;row++)for(let col=0;col<9;col++)if(col<2||row<2||(row>=5&&row<7&&col<7)){
  const ay=sys.p.field*Math.PI/180-(6-row)*step,az=-(col-4)*step;
  for(let i=0;i<N;i++){const rho=sys.stop.a*Math.sqrt((i+.5)/N),theta=i*Math.PI*(3-Math.sqrt(5));launched++;const r=fieldRay(sys,ay,az,rho*Math.cos(theta),rho*Math.sin(theta));if(r)samples.push(r);}
 }
 return {samples,launched};
}
const api={intersection,refract,trace,fieldRay,model,eyeRay,targetRays,unit};if(typeof module!=='undefined')module.exports=api;else root.EyeOptics=api;
})(typeof window!=='undefined'?window:globalThis);
