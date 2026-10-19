'use strict';
const $=id=>document.getElementById(id),O=Optics;
const specs=[['f','Objective nominal f',90,240,1,' mm'],['eye','Ocular focal parameter',20,65,1,' mm'],['diam','Diaphragm diameter',8,30,.5,' mm'],['field','Object field angle',0,3,.1,'°'],['defocus','Ocular defocus',-12,12,.5,' mm'],['stop','Diaphragm position',-100,90,1,' mm'],['n','Glass refractive index',1.45,1.7,.001,''],['eyeOffset','Eye axial offset',-40,60,1,' mm'],['eyeHeight','Eye lateral offset',-8,8,.25,' mm'],['eyeDiam','Eye aperture diameter',2,8,.25,' mm']];
const EYE_POWER=57;
let state={},key='kepler',retinaCache={key:null,data:null};
const fmt=(v,d=1)=>Number.isFinite(v)?v.toFixed(d):'∞';
function reset(){state={...O.presets[key],n:1.517,defocus:0,stop:0,eyeOffset:0,eyeHeight:0,eyeDiam:4};$('controls').innerHTML=specs.map(([id,label,min,max,step,unit])=>`<div class="control"><label for="${id}">${label}<output id="${id}Value"></output></label><input type="range" aria-label="${label}" id="${id}" min="${min}" max="${max}" step="${step}" value="${state[id]}"></div>`).join('');for(const [id]of specs)$(id).addEventListener('input',()=>{state[id]=+$(id).value;render();});render();}
$('system').onchange=()=>{key=$('system').value;reset();};$('reset').onclick=reset; $('alignEye').onclick=()=>{state.eyeOffset=0;state.eyeHeight=0;$('eyeOffset').value=0;$('eyeHeight').value=0;render();};$('retinaZoom').onchange=render;for(const id of ['bundles','extensions','showEye'])$(id).onchange=render;
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
 const chief=a.chief,rayEnd=$('showEye').checked&&eyeX>=sys.last?eyeX:null;
 const passed=rays.filter(r=>r.ok),eyePass=passed.filter(r=>eyeX>=sys.last&&Math.abs(r.p[1]+(eyeX-r.p[0])*r.d[1]/r.d[0]-state.eyeHeight)<=state.eyeDiam/2);
 $('transmission').textContent=`${passed.length}/17 rays clear optics`;
 const chiefState=chief?.ok?'Chief ray passes the stop center.':'Chief ray unavailable or clipped.';
 $('status').textContent=`${chiefState} Active stop: ${sys.stop.name}. ${17-passed.length} sampled field rays blocked. ${eyeX<sys.last?'Eye plane is inside the instrument.':`${eyePass.length}/${passed.length} emerging rays enter the eye aperture.`} ${!real?'Exit pupil is not accessible outside the instrument.':''}`;
 $('eyePosition').textContent=`Eye x = ${fmt(eyeX)} mm`; $('alignEye').disabled=!real;
 let xs=[Math.min(0,sys.diaphragm.x)-Math.max(35,sys.p.f*.2),sys.last+40,eyeX+32];for(const p of [en,ex])if(p&&Number.isFinite(p.x))xs.push(p.x);
 const xmin=Math.min(...xs)-15,xmax=Math.max(...xs)+15,yrange=Math.max(30,state.diam*.8,...sys.ls.map(l=>l.a+10));
 const scale=Math.min(900/(xmax-xmin),210/(yrange*2)),X=x=>50+(900-(xmax-xmin)*scale)/2+(x-xmin)*scale,Y=y=>176-y*scale;
 let s=`<defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f0f3f7"/></pattern></defs><rect width="1000" height="350" fill="url(#grid)"/><path d="M40 176H960" stroke="#b7c4d3" stroke-dasharray="5 5"/><text x="42" y="319">x = 0 at objective front vertex · mm</text>`;
 const line=(x1,y1,x2,y2,color,width=1,dash='')=>`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 const path=(points,color,width=1,dash='')=>`<polyline points="${points.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="${width}" ${dash?`stroke-dasharray="${dash}"`:''}/>`;
 for(const l of sys.ls){const pts=[];for(let i=0;i<=40;i++){let y=-l.a+i*l.a/20;pts.push([l.x+O.sag(l.r,y),y]);}for(let i=40;i>=0;i--){let y=-l.a+i*l.a/20;pts.push([l.x+l.t+O.sag(-l.r,y),y]);}s+=`<polygon points="${pts.map(p=>`${X(p[0])},${Y(p[1])}`).join(' ')}" fill="#dbeafa" fill-opacity=".75" stroke="#6093c3"/>`;
 s+=`<text text-anchor="middle" x="${X(l.x+l.t/2)}" y="${Y(l.a)-16}">${l.name}</text><text text-anchor="middle" x="${X(l.x)}" y="${Y(-l.a)+20}">${fmt(l.x,0)}</text>`;}
 s+=line(sys.stop.x,sys.stop.a,sys.stop.x,yrange*.8,'#24384f',4)+line(sys.stop.x,-sys.stop.a,sys.stop.x,-yrange*.8,'#24384f',4)+`<text text-anchor="middle" x="${X(sys.stop.x)}" y="28">Aperture stop</text>`;
 if($('bundles').checked)for(const sign of [-1,0])for(let i=-1;i<=1;i++){const r=O.fieldRay(sys,sign*angle,sys.stop.a*i*.85);if(r){const points=r.points.slice();if(r.ok)points.push([rayEnd??xmax,r.p[1]+((rayEnd??xmax)-r.p[0])*r.d[1]/r.d[0]]);s+=path(points,sign===0?'#a7b9cc':'#8abbb3',1);}}
 for(const r of rays){const pts=r.points.slice();if(r.ok)pts.push([rayEnd??xmax,r.p[1]+((rayEnd??xmax)-r.p[0])*r.d[1]/r.d[0]]);s+=path(pts,r.ok?'#3f83c5':'#c2a59d',r.target===0?1.5:.8,r.ok?'':'3 3');if(!r.ok)s+=`<circle cx="${X(r.points.at(-1)[0])}" cy="${Y(r.points.at(-1)[1])}" r="3" fill="#b47c6b"/>`;}
 if(chief){const pts=chief.points.slice();if(chief.ok)pts.push([rayEnd??xmax,chief.p[1]+((rayEnd??xmax)-chief.p[0])*chief.d[1]/chief.d[0]]);s+=path(pts,'#d45333',2.5);}
 for(const [p,label,yy]of [[en,'Entrance pupil',64]])if(p&&Number.isFinite(p.x)&&p.x>=xmin&&p.x<=xmax){s+=line(p.x,-p.diam/2,p.x,p.diam/2,'#168679',4,p.virtual?'4 3':'')+`<line x1="${X(p.x)}" y1="${yy+5}" x2="${X(p.x)}" y2="${Y(p.diam/2)-5}" stroke="#168679" stroke-dasharray="2 4"/><text class="pupil-label" text-anchor="middle" x="${X(p.x)}" y="${yy}">${label}${p.virtual?' (virtual)':''}</text>`;}
 // Exact stop-center probe rays, independent of field rays, show pupil conjugacy.
 if($('extensions').checked)for(const side of ['entrance','exit']){const dir=side==='entrance'?-1:1,p=side==='entrance'?en:ex,idx=sys.surfaces.indexOf(sys.stop),ss=dir<0?sys.surfaces.slice(0,idx).reverse():sys.surfaces.slice(sys.stop.stop?idx+1:idx);if(p&&Number.isFinite(p.x)&&p.x>=xmin&&p.x<=xmax)for(const t of [-.025,.025]){const r=O.trace(ss,[sys.stop.x,0],[dir*Math.cos(t),Math.sin(t)],false);if(r.ok){s+=path(r.points,'#168679',1,'3 4');const h=r.p[1]+(p.x-r.p[0])*r.d[1]/r.d[0];s+=line(r.p[0],r.p[1],p.x,h,'#168679',1,'3 4');}}}
 if(real&&ex.x>=xmin&&ex.x<=xmax){const y=258;s+=`<path d="M${X(sys.last)} ${y-4}v8m0 -4H${X(ex.x)}m0 -4v8" stroke="#168679" fill="none"/><text text-anchor="middle" x="${(X(sys.last)+X(ex.x))/2}" y="${y-10}">Eye relief ${fmt(a.relief)} mm</text>`;}
 if($('showEye').checked)s+=drawEyeModel(EyeOptics.model(eyeX,state.eyeHeight,state.eyeDiam,EYE_POWER),X,Y,passed,true);
 if(sys.stop!==sys.diaphragm)s+=line(sys.diaphragm.x,sys.diaphragm.a,sys.diaphragm.x,yrange*.65,'#8391a0',3)+line(sys.diaphragm.x,-sys.diaphragm.a,sys.diaphragm.x,-yrange*.65,'#8391a0',3)+`<text text-anchor="middle" x="${X(sys.diaphragm.x)}" y="308">Diaphragm</text>`; 
 // Draw the exit pupil last, so neither field rays nor the coincident eye can hide it.
 if(ex&&Number.isFinite(ex.x)){
  const xp=X(ex.x),cap=7,top=Y(ex.diam/2),bottom=Y(-ex.diam/2);
  s+=`<g id="exitPupilMarker"><line x1="${xp}" y1="85" x2="${xp}" y2="280" stroke="#168679" stroke-width="1.6" stroke-dasharray="6 4" opacity=".7"/><line x1="${xp}" y1="${top}" x2="${xp}" y2="${bottom}" stroke="white" stroke-width="9"/><path d="M${xp-cap} ${top}h${cap*2}M${xp} ${top}V${bottom}M${xp-cap} ${bottom}h${cap*2}" stroke="#168679" stroke-width="4" fill="none" ${ex.virtual?'stroke-dasharray="4 3"':''}/><text class="pupil-label" text-anchor="end" x="${Math.min(970,xp+65)}" y="298">Exit pupil${ex.virtual?' (virtual)':''}</text><text text-anchor="end" x="${Math.min(970,xp+65)}" y="317">Ø ${fmt(ex.diam,2)} mm · x = ${fmt(ex.x)} mm</text></g>`;
 }else s+='<text x="650" y="298" class="pupil-label">Exit pupil at infinity / unavailable</text>';
 $('layout').innerHTML=s;
 renderEyePlacement(sys,ex,eyeX,passed,eyePass.length,real);
 renderRetina(sys,EyeOptics.model(eyeX,state.eyeHeight,state.eyeDiam,EYE_POWER),a);
 $('lesson').innerHTML=`<p><b>Chief ray.</b> The orange ray starts at the selected field angle and is numerically aimed through the active stop center.</p><p><b>Entrance / exit pupils.</b> The green markers image the active aperture stop through the optics before / after it. The stop is automatically identified for an on-axis collimated beam; another lens rim can take over when the diaphragm moves.</p><p><b>Eye relief.</b> ${real?'Place the eye aperture at the real exit pupil to intercept bundles from different fields. Axial or lateral displacement can hide part of the field.':'The exit pupil is virtual or lies inside the instrument. The eye is shown 25 mm behind the last surface, plus your offset.'}</p>`;
 $('prescription').innerHTML='<table><tr><th>Element</th><th>Front x</th><th>R1 / R2</th><th>t</th><th>Clear Ø</th></tr>'+sys.ls.map(l=>`<tr><td>${l.name}</td><td>${fmt(l.x)}</td><td>${fmt(l.r)} / ${fmt(-l.r)}</td><td>${fmt(l.t)}</td><td>${fmt(l.a*2)}</td></tr>`).join('')+'</table>';
}

function renderEyePlacement(sys,ex,eyeX,passed,accepted,real){
 const finite=ex&&Number.isFinite(ex.x),inside=eyeX<sys.last;
 const rear=sys.last,xp=finite?ex.x:rear+25;
 const span=Math.max(20,Math.abs(eyeX-rear),Math.abs(xp-rear));
 const lo=Math.min(rear,eyeX,xp)-span*.15,hi=Math.max(rear,eyeX+26,xp)+span*.2;
 const X=x=>30+(x-lo)/(hi-lo)*440;
 const intercept=r=>r.p[1]+(eyeX-r.p[0])*r.d[1]/r.d[0];
 const range=Math.max(13,Math.abs(state.eyeHeight)+state.eyeDiam/2,finite?ex.diam/2:0,...passed.map(r=>Math.abs(intercept(r))))*1.2;
 const Y=y=>126-y/range*65;
 let e='<rect width="500" height="250" fill="white"/><text x="12" y="16" font-size="12" fill="#63758d">Magnified side view · light →</text><path d="M20 126H480" stroke="#cbd5e2" stroke-dasharray="4 4"/>';
 const line=(x1,y1,x2,y2,color,width=1,dash='')=>`<line x1="${X(x1)}" y1="${Y(y1)}" x2="${X(x2)}" y2="${Y(y2)}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}"/>`;
 e+=`<line x1="${X(rear)}" y1="55" x2="${X(rear)}" y2="197" stroke="#8cabc6" stroke-width="5"/><text x="${X(rear)}" y="43" text-anchor="middle" font-size="11" fill="#52657d">Last surface</text>`;
 if(!inside)for(const r of passed){const h=intercept(r),ok=Math.abs(h-state.eyeHeight)<=state.eyeDiam/2,color=ok?'#3075be':'#cc614e';e+=line(r.p[0],r.p[1],eyeX,h,color,r.target===0?2:1);if(!ok)e+=`<path d="M${X(eyeX)-3} ${Y(h)-3}l6 6m-6 0l6 -6" stroke="#cc614e" stroke-width="1.5"/>`;}
 if(finite){e+=`<line x1="${X(xp)}" y1="54" x2="${X(xp)}" y2="198" stroke="#168679" stroke-dasharray="4 4"/><text x="${X(xp)}" y="32" text-anchor="middle" font-size="12" font-weight="650" fill="#168679">Exit pupil${ex.virtual?' (virtual)':''}</text>`;e+=line(xp,-ex.diam/2,xp,ex.diam/2,'white',7)+line(xp,-ex.diam/2,xp,ex.diam/2,'#168679',3,ex.virtual?'4 3':'');for(const h of [-ex.diam/2,ex.diam/2])e+=`<path d="M${X(xp)-5} ${Y(h)}h10" stroke="#168679" stroke-width="2"/>`;}
 e+=drawEyeModel(EyeOptics.model(eyeX,state.eyeHeight,state.eyeDiam,EYE_POWER),X,Y,inside?[]:passed,true);
 e+=`<text x="${X(eyeX+11)}" y="214" text-anchor="middle" font-size="11" fill="#7560a9">Moving reduced eye · ${fmt(EYE_POWER,0)} D</text>`;
 e+=`<text x="12" y="239" font-size="11" fill="#63758d">${real?'Exit pupil Ø '+fmt(ex.diam,2)+' mm':'Virtual / inaccessible pupil'} · axes magnified independently</text>`;
 $('eyeView').innerHTML=e;
 $('eyeCapture').textContent=inside?'Eye is inside the instrument — move it behind the last surface.':accepted+' of '+passed.length+' sampled rays enter the eye opening';
 $('eyeCapture').classList.toggle('missed',inside||accepted===0);
}

function drawEyeModel(eye,X,Y,rays,labels){
 const x=eye.x,y=eye.y,rr=eye.retinaRadius,c=eye.retinaCenter,edge=4.5,frontSag=EyeOptics.intersection({x:0,r:eye.radius},[-1,edge,0],[1,0,0])?.[0]||2;
 let v=`<g class="eye-model"><path d="M${X(x+frontSag)} ${Y(y+edge)} C${X(x+4)} ${Y(y+15)},${X(x+eye.depth)} ${Y(y+15)},${X(x+eye.depth)} ${Y(y)} C${X(x+eye.depth)} ${Y(y-15)},${X(x+4)} ${Y(y-15)},${X(x+frontSag)} ${Y(y-edge)}Z" fill="#faf1ec" fill-opacity=".8" stroke="#927c76" stroke-width="1.3"/>`;
 const cap=[];for(let i=0;i<=40;i++){const h=-edge+2*edge*i/40,q=EyeOptics.intersection({x:0,r:eye.radius},[-1,h,0],[1,0,0]);if(q)cap.push([x+q[0],y+h]);}
 v+=`<polyline points="${cap.map(p=>X(p[0])+','+Y(p[1])).join(' ')}" fill="#d9eff6" stroke="#5389ad" stroke-width="2"/>`;
 const retina=[];for(let i=-36;i<=36;i++){const t=i*Math.PI/90;retina.push([x+c+rr*Math.cos(t),y+rr*Math.sin(t)]);}v+=`<polyline points="${retina.map(p=>X(p[0])+','+Y(p[1])).join(' ')}" fill="none" stroke="#d67d55" stroke-width="3"/>`;
 for(const r of rays){const hit=EyeOptics.eyeRay({p:[...r.p,0],d:[...r.d,0]},eye);if(hit)v+=`<polyline points="${[hit.aperture,hit.cornea,hit.retina].map(p=>X(p[0])+','+Y(p[1])).join(' ')}" fill="none" stroke="${r.target===0?'#d45333':'#3075be'}" stroke-width="1" opacity=".8"/><circle cx="${X(hit.retina[0])}" cy="${Y(hit.retina[1])}" r="1.5" fill="#d45333"/>`;}
 v+=`<path d="M${X(x)} ${Y(y+edge)}V${Y(y+eye.diam/2)}M${X(x)} ${Y(y-eye.diam/2)}V${Y(y-edge)}" stroke="#7560a9" stroke-width="4"/>`;
 if(labels)v+=`<text x="${X(x+12)}" y="${Y(y+13)}" text-anchor="middle" style="fill:#7560a9;font-size:11px">Reduced eye</text><text x="${X(x+eye.depth)+5}" y="${Y(y-6)}" style="fill:#b2603c;font-size:10px">Retina</text>`;
 return v+'</g>';
}
function renderRetina(sys,eye,analysis){
 const signature=JSON.stringify([key,state.f,state.eye,state.diam,state.field,state.defocus,state.stop,state.n]);
 if(retinaCache.key!==signature)retinaCache={key:signature,data:EyeOptics.targetRays(sys)};
 const data=retinaCache.data,hits=eye.x>=sys.last?data.samples.map(r=>EyeOptics.eyeRay(r,eye)).filter(Boolean):[];
 const canvas=$('retinaCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,zoom=$('retinaZoom').value;
 const slope=analysis.chief?.d[1]/analysis.chief?.d[0]||0;
 const span=zoom==='auto'?Math.min(24,Math.max(4,Math.ceil(2.8*(16.667*Math.abs(slope)+.7)))):+zoom;
 const density=new Float32Array(w*w),px=z=>w/2+z/span*w;
 for(const hit of hits){const x=px(hit.local[2]),y=px(-hit.local[1]);for(let j=-3;j<=3;j++)for(let i=-3;i<=3;i++){const xx=Math.round(x)+i,yy=Math.round(y)+j;if(xx>=0&&xx<w&&yy>=0&&yy<w)density[yy*w+xx]+=Math.exp(-(i*i+j*j)/4);}}
 const img=ctx.createImageData(w,w);for(let i=0;i<density.length;i++){const b=1-Math.exp(-density[i]*.5);img.data[i*4]=10+Math.round(b*69);img.data[i*4+1]=20+Math.round(b*198);img.data[i*4+2]=35+Math.round(b*205);img.data[i*4+3]=255;}ctx.putImageData(img,0,0);
 ctx.strokeStyle='#66829a66';ctx.lineWidth=1;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(w/2,0);ctx.lineTo(w/2,w);ctx.moveTo(0,w/2);ctx.lineTo(w,w/2);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#a5b9ce';ctx.font='15px system-ui';ctx.fillText('+'+fmt(span/2,1)+' mm',8,20);ctx.fillText('−'+fmt(span/2,1)+' mm',8,w-9);ctx.fillText('retinal z →',w-92,w-9);
 if(!hits.length){ctx.fillStyle='#e4b8aa';ctx.textAlign='center';ctx.fillText(eye.x<sys.last?'Eye overlaps the instrument':'No target light reaches the retina',w/2,w/2-15);ctx.textAlign='left';}
 $('retinaStats').textContent=hits.length+' / '+data.launched+' target rays reach retina · '+fmt(span,0)+' mm view';
 $('retinaCaption').textContent='Physical retinal image of the F target. Focus and eye placement change blur and clipping. Fixed display exposure; geometric sampling, no diffraction.';
}
reset();
