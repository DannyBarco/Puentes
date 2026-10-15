import {analyze,response} from './beam.mjs';
const $=id=>document.getElementById(id);
const fmt=n=>Math.abs(n)<1e-9?'0.000':n.toFixed(3);
let loads=[{p:10,x:0},{p:15,x:-2},{p:10,x:-4}],result,model;

function renderLoads(){
  $('loads').innerHTML=loads.map((c,i)=>`<tr><td>${i+1}</td><td><input aria-label="P carga ${i+1}" data-i="${i}" data-key="p" type="number" step="any" value="${c.p}"></td><td><input aria-label="x carga ${i+1}" data-i="${i}" data-key="x" type="number" step="any" value="${c.x}" ${!i||$('mode').value==='gap'?'disabled':''}></td><td><input aria-label="Distancia carga ${i+1}" data-i="${i}" data-key="gap" type="number" min="0" step="any" value="${i?loads[i-1].x-c.x:0}" ${!i||$('mode').value==='x'?'disabled':''}></td><td><button aria-label="Eliminar carga ${i+1}" data-remove="${i}" class="secondary">×</button></td></tr>`).join('');
}
function invalidate(){
  result=null;
  $('status').textContent='Datos modificados. Pulsa Calcular respuestas para actualizar.';
  for(const id of ['output','shear','moment','beam','envelopeShear','envelopeMoment']) $(id).innerHTML='';
  $('advanceText').textContent='';
  $('error').textContent='';
  $('csv').disabled=true;
  $('advance').disabled=true;
}
$('loads').addEventListener('input',invalidate);
$('loads').addEventListener('change',e=>{
  const {i,key}=e.target.dataset;
  if(i===undefined) return;
  const idx=+i,value=e.target.value===''?NaN:Number(e.target.value);
  invalidate();
  if(!Number.isFinite(value)||(key==='gap'&&value<0)){
    e.target.setAttribute('aria-invalid','true');
    $('error').textContent='Completa la tabla con números finitos y separaciones mayores o iguales a cero.';
    return;
  }
  // Do not propagate an empty or invalid distance to the rest of the train.
  if(key==='gap'){
    const shift=loads[idx-1].x-value-loads[idx].x;
    const updated=loads.map((c,j)=>({...c,x:j>=idx?c.x+shift:c.x}));
    if(updated.some(c=>!Number.isFinite(c.x))){
      e.target.setAttribute('aria-invalid','true');
      $('error').textContent='Las posiciones exceden el rango numérico.';
      return;
    }
    loads=updated;
  }else loads[idx][key]=value;
  renderLoads();
});
$('loads').addEventListener('click',e=>{
  const b=e.target.closest('[data-remove]');
  if(!b) return;
  loads.splice(+b.dataset.remove,1);
  if(loads.length){const offset=loads[0].x;loads.forEach(c=>c.x-=offset);}
  renderLoads();invalidate();
});
$('add').onclick=()=>{loads.push({p:10,x:loads.length?loads.at(-1).x-2:0});renderLoads();invalidate();};
$('mode').onchange=renderLoads;
for(const id of ['length','dx','da']) $(id).oninput=invalidate;

function chart(target,series,xs,label){
  const width=Math.max(280,$(target).clientWidth),left=65,right=20;
  let lo=0,hi=0;
  for(const s of series) for(const y of s.values){lo=Math.min(lo,y);hi=Math.max(hi,y);}
  if(hi===lo){hi++;lo--;}
  const X=x=>left+x/(xs.at(-1)||1)*(width-left-right),Y=y=>22+(hi-y)/(hi-lo)*130;
  const tick=y=>Math.abs(y)>=1e5?y.toExponential(1):y.toFixed(2);
  $(target).innerHTML=`<svg class="chart" viewBox="0 0 ${width} 190" role="img" aria-label="${label}"><line x1="${left}" y1="${Y(0)}" x2="${width-right}" y2="${Y(0)}" stroke="#b9c8bd"/>${[lo,(lo+hi)/2,hi].map(y=>`<text x="2" y="${Y(y)+4}" font-size="11" fill="#75877d">${tick(y)}</text>`).join('')}${series.map(s=>`<polyline fill="none" stroke="${s.color}" stroke-width="2" points="${s.values.map((y,i)=>`${X(xs[i])},${Y(y)}`).join(' ')}"/>`).join('')}<text x="${left}" y="178" font-size="11" fill="#75877d">0</text><text x="${width-right}" y="178" text-anchor="end" font-size="11" fill="#75877d">${tick(xs.at(-1))}</text></svg>`;
}
function drawSection(){
  if(!result) return;
  const a=Number($('section').value);
  if($('section').value===''||!Number.isFinite(a)||a<0||a>model.L){
    $('error').textContent='La sección a debe estar entre 0 y L.';
    $('section').setAttribute('aria-invalid','true');
    $('shear').innerHTML='';$('moment').innerHTML='';
    return;
  }
  $('section').removeAttribute('aria-invalid');$('error').textContent='';
  const rs=result.travel.map(s=>response(model.L,a,model.loads,s));
  chart('shear',[{color:'#287e72',values:rs.map(r=>r.left)},{color:'#c38b41',values:rs.map(r=>r.right)}],result.travel,'Cortante frente al avance');
  chart('moment',[{color:'#287e72',values:rs.map(r=>r.moment)}],result.travel,'Momento frente al avance');
}
function drawEnvelopes(){
  if(!result) return;
  for(const [id,max,min,label] of [['envelopeShear','vmax','vmin','Envolvente de cortante'],['envelopeMoment','mmax','mmin','Envolvente de momento']]){
    chart(id,[{color:'#287e72',values:result.envelope.map(r=>r[max])},{color:'#c38b41',values:result.envelope.map(r=>r[min])}],result.positions,label);
  }
}
function drawBeam(){
  if(!result) return;
  const unloaded=+$('advance').value===result.travel.length;
  const s=unloaded?result.travel.at(-1):result.travel[+$('advance').value];
  $('advanceText').textContent=unloaded?`s > ${fmt(s)} m · viga descargada`:`s = ${fmt(s)} m`;
  const X=x=>50+600*x/model.L;
  let svg='<line x1="50" y1="95" x2="650" y2="95" stroke="#355a50" stroke-width="6"/><path d="M50 100l-12 20h24z M650 100l-12 20h24z" fill="#a4bcaa"/>';
  if(!unloaded) model.loads.forEach(c=>{
    let x=c.x+s;
    const tolerance=8*Number.EPSILON*Math.max(model.L,Math.abs(c.x),Math.abs(s));
    if(Math.abs(x)<=tolerance) x=0;
    if(Math.abs(x-model.L)<=tolerance) x=model.L;
    if(x<0||x>model.L) return;
    const arrow=c.p<0?`M${X(x)} 81V43m-5 8l5 -8 5 8`:`M${X(x)} 43v38m-5 -8l5 8 5 -8`;
    svg+=`<path d="${arrow}" fill="none" stroke="#bf8642" stroke-width="2"/><text x="${X(x)}" y="31" text-anchor="middle" font-size="12" fill="#7d623b">${c.p} kN</text>`;
  });
  svg+=`<text x="50" y="145" font-size="11" fill="#718477">0 m</text><text x="650" y="145" text-anchor="end" font-size="11" fill="#718477">${model.L} m</text>`;
  $('beam').innerHTML=svg;
}
function calculate(){
  try{
    for(const input of $('loads').querySelectorAll('input:not(:disabled)')){
      if(input.value===''||!input.validity.valid||input.getAttribute('aria-invalid')==='true') throw Error('Completa o corrige los datos de la tabla de cargas.');
    }
    const next={L:+$('length').value,dx:+$('dx').value,da:+$('da').value,loads:loads.map(c=>({...c}))};
    const nextResult=analyze(next);
    model=next;result=nextResult;$('error').textContent='';
    $('section').max=model.L;
    if($('section').value===''||+$('section').value<0||+$('section').value>model.L) $('section').value=model.L/2;
    $('advance').max=result.travel.length;$('advance').value=0;
    $('advance').disabled=false;$('csv').disabled=false;
    $('output').innerHTML=result.envelope.map(r=>`<tr>${[r.a,r.vmin,r.vmax,r.mmin,r.mmax].map(v=>`<td>${fmt(v)}</td>`).join('')}</tr>`).join('');
    $('status').textContent=`${result.positions.length} secciones · ${result.travel.length} posiciones del tren · recorrido de 0 a ${fmt(result.travel.at(-1))} m, más estado descargado. Extremos muestreados; pueden variar al refinar Δx.`;
    drawSection();drawEnvelopes();drawBeam();
  }catch(e){invalidate();$('error').textContent=e.message;}
}
$('calculate').onclick=calculate;
$('section').oninput=drawSection;
$('advance').oninput=drawBeam;
window.addEventListener('resize',()=>{drawSection();drawEnvelopes();});
$('csv').onclick=()=>{
  if(!result) return;
  const rows=['a_m,Vmin_kN,Vmax_kN,Mmin_kNm,Mmax_kNm',...result.envelope.map(r=>[r.a,r.vmin,r.vmax,r.mmin,r.mmax].join(','))];
  const url=URL.createObjectURL(new Blob([rows.join('\n')],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download='envolventes.csv';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
};
renderLoads();calculate();
