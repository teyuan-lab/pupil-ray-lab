'use strict';
const $=id=>document.getElementById(id),O=Optics;
const specs=[['f','Objective nominal f',90,240,1,' mm'],['eye','Ocular focal parameter',20,65,1,' mm'],['diam','Diaphragm diameter',8,30,.5,' mm'],['field','Object field angle',0,3,.1,'°'],['defocus','Ocular defocus',-12,12,.5,' mm'],['stop','Diaphragm position',-100,90,1,' mm'],['n','Glass refractive index',1.45,1.7,.001,''],['eyeOffset','Eye axial offset',-40,60,1,' mm'],['eyeHeight','Eye lateral offset',-8,8,.25,' mm'],['eyeDiam','Eye aperture diameter',2,8,.25,' mm']];
let state={},key='kepler';
const fmt=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'∞';
function reset(){state={...O.presets[key],n:1.517,defocus:0,stop:0,eyeOffset:0,eyeHeight:0,eyeDiam:4};$('controls').innerHTML=specs.map(([id,label,min,max,step,unit])=>`<div class="control"><label for="${id}">${label}<output id="${id}Value"></output></label><input type="range" aria-label="${label}" id="${id}" min="${min}" max="${max}" step="${step}" value="${state[id]}"></div>`).join('');for(const [id]of specs)$(id).addEventListener('input',()=>{state[id]=+$(id).value;render();});render();}
$('system').onchange=()=>{key=$('system').value;reset();};$('reset').onclick=reset;for(const id of ['bundles','extensions','showEye'])$(id).onchange=render;
function render(){
 for(const [id,,, ,step,unit]of specs)$(id+'Value').textContent=fmt(state[id],step<.01?3:step<1?2:0)+unit;
 const sys=O.system(key,state),a=O.analyze(sys),en=a.entrance,ex=a.exit;
 $('stopValue').textContent=fmt(sys.diaphragm.x)+' mm'; $('stop').setAttribute('aria-valuetext',fmt(sys.diaphragm.x)+' mm from objective front');
 $('description').textContent=O.presets[key].description;
 $('epD').textContent=en?fmt(en.diam)+' mm':'Unavailable';$('epX').textContent=en?`x = ${fmt(en.x)} mm · ${en.virtual?'virtual':'real / stop'}`:'';
 $('xpD').textContent=ex?fmt(ex.diam,2)+' mm':'Unavailable';$('xpX').textContent=ex?`x = ${fmt(ex.x)} mm · ${ex.virtual?'virtual':'real'}`:'';
 $('relief').textContent=fmt(a.relief)+' mm';$('reliefNote').textContent=ex&&!ex.virtual&&a.relief>0?'Accessible exit pupil':'No accessible external pupil';$('angle').textContent=fmt(state.field)+'°';
 const real=ex&&Number.isFinite(ex.x)&&!ex.virtual&&a.relief>0,eyeX=(real?ex.x:sys.last+25)+state.eyeOffset;
 const rays=[],angle=state.field*Math.PI/180;
 for(let i=0;i<17;i++){const r=O.fieldRay(sys,angle,sys.stop.a*(i-8)/8);if(r)rays.push(r);}
 const chief=a.chief;
 const passed=rays.filter(r=>r.ok),eyePass=passed.filter(r=>eyeX>=sys.last&&Math.abs(r.p[1]+(eyeX-r.p[0])*r.d[1]/r.d[0]-state.eyeHeight)<=state.eyeDiam/2);
 $('transmission').textContent=`${passed.length}/17 rays clear optics`;
 const chiefState=chief?.ok?'Chief ray passes the stop center.':'Chief ray unavailable or clipped.';
 $('status').textContent=`${chiefState} Active stop: ${sys.stop.name}. ${17-passed.length} sampled field rays blocked. ${eyeX<sys.last?'Eye plane is inside the instrument.':`${eyePass.length}/${passed.length} emerging rays enter the eye aperture.`} ${!real?'Exit pupil is not accessible outside the instrument.':''}`;
 $('eyePosition').textContent=`x = ${fmt(eyeX)} mm`;
 let xs=[Math.min(0,sys.diaphragm.x)-Math.max(35,sys.p.f*.2),sys.last+40,eyeX+15];for(const p of [en,ex])if(p&&Number.isFinite(p.x)&&Math.abs(p.x)<sys.last*3+200)xs.push(p.x);
 const xmin=Math.min(...xs)-15,xmax=Math.max(...xs)+15,yrange=Math.max(30,state.diam*.8,...sys.ls.map(l=>l.a+10));
 const scale=Math.min(900/(xmax-xmin),210/(yrange*2)),X=x=>50+(900-(xmax-xmin)*scale)/2+(x-xmin)*scale,Y=y=>176-y*scale;
 let s=`<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f3f7"/></pattern></defs><rect width="1000" height="350" fill="url(#grid)"/><path d="M40 176H960" stroke="#b7c4d3" stroke-dasharray="5 5"/><text x="42" y="319">x = 0 at objective front vertex · mm</text>`;
 const line=(x1,y1,x2,y2,color,width=1,dash='')=>`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const path=(points,color,width=1,dash='')=>`<polyline points="${points.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 for(const l of sys.ls){const pts=[];for(let i=0;i<=40;i++){let y=-l.a+i*l.a/20;pts.push([l.x+O.sag(l.r,y),y]);}for(let i=40;i>=0;i--){let y=-l.a+i*l.a/20;pts.push([l.x+l.t+O.sag(-l.r,y),y]);}s+=`<polygon points="${pts.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="#dbeafa" fill-opacity=".75" stroke="#6093c3"/>`;
 s+=`<text text-anchor="middle" x="${X(l.x+l.t/2)}" y="${Y(l.a)-16}">${l.name}</text><text text-anchor="middle" x="${X(l.x)}" y="${Y(-l.a)+20}">${fmt(l.x,0)}</text>`;}
 s+=line(sys.stop.x,sys.stop.a,sys.stop.x,yrange*.8,'#24384f',4)+line(sys.stop.x,-sys.stop.a,sys.stop.x,-yrange*.8,'#24384f',4)+`<text text-anchor="middle" x="${X(sys.stop.x)}" y="28">Aperture stop</text>`;
 if($('bundles').checked)for(const sign of [-1,0])for(let i=-1;i<=1;i++){const r=O.fieldRay(sys,sign*angle,sys.stop.a*i*.85);if(r){const points=r.points.slice();if(r.ok)points.push([xmax,r.p[1]+(xmax-r.p[0])*r.d[1]/r.d[0]]);s+=path(points,sign===0?'#a7b9cc':'#8abbb3',1);}}
 for(const r of rays){const pts=r.points.slice();if(r.ok)pts.push([xmax,r.p[1]+(xmax-r.p[0])*r.d[1]/r.d[0]]);s+=path(pts,r.ok?'#3f83c5':'#c2a59d',r.target===0?1.5:.8,r.ok?'':'3 3');if(!r.ok)s+=`<circle cx="${X(r.points.at(-1)[0])}" cy="${Y(r.points.at(-1)[1])}" r="3" fill="#b47c6b"/>`;}
 if(chief){const pts=chief.points.slice();if(chief.ok)pts.push([xmax,chief.p[1]+(xmax-chief.p[0])*chief.d[1]/chief.d[0]]);s+=path(pts,'#d45333',2.5);}
 for(const [p,label,yy]of [[en,'Entrance pupil',64],[ex,'Exit pupil',292]])if(p&&Number.isFinite(p.x)&&p.x>=xmin&&p.x<=xmax){s+=line(p.x,-p.diam/2,p.x,p.diam/2,'#168679',4,p.virtual?'4 3':'')+`<line x1="${X(p.x)}" y1="${yy+5}" x2="${X(p.x)}" y2="${Y(p.diam/2)-5}" stroke="#168679" stroke-dasharray="2 4"/><text class="pupil-label" text-anchor="middle" x="${X(p.x)}" y="${yy}">${label}${p.virtual?' (virtual)':''}</text>`;}
 // Exact stop-center probe rays, independent of field rays, show pupil conjugacy.
 if($('extensions').checked)for(const side of ['entrance','exit']){const dir=side==='entrance'?-1:1,p=side==='entrance'?en:ex,idx=sys.surfaces.indexOf(sys.stop),ss=dir<0?sys.surfaces.slice(0,idx).reverse():sys.surfaces.slice(sys.stop.stop?idx+1:idx);if(p&&Number.isFinite(p.x)&&p.x>=xmin&&p.x<=xmax)for(const t of [-.025,.025]){const r=O.trace(ss,[sys.stop.x,0],[dir*Math.cos(t),Math.sin(t)],false);if(r.ok){s+=path(r.points,'#168679',1,'3 4');const h=r.p[1]+(p.x-r.p[0])*r.d[1]/r.d[0];s+=line(r.p[0],r.p[1],p.x,h,'#168679',1,'3 4');}}}
 if(real&&ex.x>=xmin&&ex.x<=xmax){const y=258;s+=`<path d="M${X(sys.last)} ${y-4}v8m0 -4H${X(ex.x)}m0 -4v8" stroke="#168679" fill="none"/><text text-anchor="middle" x="${(X(sys.last)+X(ex.x))/2}" y="${y-10}">Eye relief ${fmt(a.relief)} mm</text>`;}
 if($('showEye').checked){s+=line(eyeX,state.eyeHeight-state.eyeDiam/2,eyeX,state.eyeHeight+state.eyeDiam/2,'#6f5bb5',5)+`<text x="${X(eyeX)+8}" y="${Y(state.eyeHeight)-12}" style="fill:#6f5bb5">Eye</text>`;}
 if(sys.stop!==sys.diaphragm)s+=line(sys.diaphragm.x,sys.diaphragm.a,sys.diaphragm.x,yrange*.65,'#8391a0',3)+line(sys.diaphragm.x,-sys.diaphragm.a,sys.diaphragm.x,-yrange*.65,'#8391a0',3)+`<text text-anchor="middle" x="${X(sys.diaphragm.x)}" y="308">Diaphragm</text>`; $('layout').innerHTML=s;
 let e=`<path d="M20 85H280" stroke="#e1e7ef"/><text x="12" y="18" font-size="10" fill="#718197">Height above axis (mm)</text>`;const ey=y=>85-y*7;
 e+=`<rect x="35" y="${ey(state.eyeHeight+state.eyeDiam/2)}" width="230" height="${state.eyeDiam*7}" fill="#f1edf9" stroke="#9c8bc5"/><text x="220" y="18" font-size="10" fill="#6f5bb5">Eye</text>`;
 for(const r of passed){const y=r.p[1]+(eyeX-r.p[0])*r.d[1]/r.d[0];if(Math.abs(y)<10)e+=`<circle cx="${150+(r.target/sys.stop.a)*65}" cy="${ey(y)}" r="${r.target===0?4:2.7}" fill="${r.target===0?'#d45333':Math.abs(y-state.eyeHeight)<=state.eyeDiam/2?'#3075be':'#b5bdc8'}"/>`;}
 e+=`<text x="15" y="156" font-size="10" fill="#718197">−rim</text><text x="115" y="156" font-size="10" fill="#718197">stop coordinate</text><text x="250" y="156" font-size="10" fill="#718197">+rim</text>`;$('eyeView').innerHTML=e;
 $('lesson').innerHTML=`<p><b>Chief ray.</b> The orange ray starts at the selected field angle and is numerically aimed through the active stop center.</p><p><b>Entrance / exit pupils.</b> The green markers image the active aperture stop through the optics before / after it. The stop is automatically identified for an on-axis collimated beam; another lens rim can take over when the diaphragm moves.</p><p><b>Eye relief.</b> ${real?'Place the eye aperture at the real exit pupil to intercept bundles from different fields. Axial or lateral displacement can hide part of the field.':'The exit pupil is virtual or lies inside the instrument. The eye is shown 25 mm behind the last surface, plus your offset.'}</p>`;
 $('prescription').innerHTML='<table><tr><th>Element</th><th>Front x</th><th>R1 / R2</th><th>t</th><th>Clear Ø</th></tr>'+sys.ls.map(l=>`<tr><td>${l.name}</td><td>${fmt(l.x)}</td><td>${fmt(l.r)} / ${fmt(-l.r)}</td><td>${fmt(l.t)}</td><td>${fmt(l.a*2)}</td></tr>`).join('')+'</table>';
}
reset();
