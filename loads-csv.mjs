// CSV input is kept separate from structural calculations so a rejected file
// never partially replaces the existing train of loads.
export function parseLoadsCsv(text){
  text=text.replace(/^\uFEFF/,'');
  if(text.length>1000000) throw Error('El CSV supera el límite de 1 MB.');
  const first=text.split(/\r?\n/).find(line=>line.trim())||'';
  const delimiter=first.includes(';')?';':',';
  const rows=[];
  let row=[],value='',quoted=false,closed=false,line=1,startLine=1;
  const field=()=>{row.push(value.trim());value='';closed=false;};
  const finish=()=>{
    field();
    if(row.some(v=>v!=='')) rows.push({cells:row,line:startLine});
    row=[];startLine=line+1;
  };
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){
      if(c==='"'){
        if(text[i+1]==='"'){value+='"';i++;}else{quoted=false;closed=true;}
      }else{value+=c;if(c==='\n')line++;}
    }else if(c==='"'){
      if(value.trim()||closed) throw Error(`Comillas incorrectas en la línea ${line}.`);
      value='';quoted=true;
    }else if(c===delimiter){field();}
    else if(c==='\n'||c==='\r'){
      if(c==='\r'&&text[i+1]==='\n') i++;
      finish();line++;
    }else{
      if(closed&&c.trim()) throw Error(`Contenido después de comillas en la línea ${line}.`);
      value+=c;
    }
  }
  if(quoted) throw Error('El CSV contiene comillas sin cerrar.');
  finish();
  if(rows.length<2) throw Error('Incluye una cabecera y al menos una carga.');
  const normalize=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\s()]/g,'').replace(/_/g,'');
  const headers=rows[0].cells.map(normalize);
  const pNames=['p','pkn','carga','cargakn'];
  const dNames=['distancia','distanciam','distanciaanterior','distanciaanteriorm','separacion','separacionm'];
  const pi=headers.findIndex(h=>pNames.includes(h)),di=headers.findIndex(h=>dNames.includes(h));
  if(headers.length!==2||pi<0||di<0) throw Error('Usa dos columnas: P_kN y distancia_m.');
  if(rows.length>501) throw Error('El CSV admite como máximo 500 cargas.');
  let x=0;
  const number=(raw,n)=>{
    const v=delimiter===';'?raw.replace(',','.'):raw;
    if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(v)||!Number.isFinite(Number(v))) throw Error(`Número inválido o vacío en la línea ${n}.`);
    return Number(v);
  };
  return rows.slice(1).map(({cells,line:n},i)=>{
    if(cells.length!==2) throw Error(`La línea ${n} debe tener exactamente dos columnas.`);
    const p=number(cells[pi],n),distance=number(cells[di],n);
    if(distance<0) throw Error(`La separación no puede ser negativa (línea ${n}).`);
    if(i===0&&distance!==0) throw Error('La distancia de la primera carga debe ser 0.');
    x-=distance;
    if(!Number.isFinite(x)) throw Error(`La distancia acumulada excede el rango numérico (línea ${n}).`);
    return {p,x};
  });
}
