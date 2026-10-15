export function grid(end, step) {
  if (!Number.isFinite(end) || !Number.isFinite(step) || end < 0 || step <= 0) throw Error('Los incrementos deben ser positivos y finitos.');
  const n = Math.ceil(end / step);
  if (n > 20000) throw Error('Demasiados pasos: aumenta los incrementos (máximo 20 000 por eje).');
  return Array.from({length:n+1}, (_,i)=>Math.min(i*step,end));
}
export function response(L,a,loads,advance=0) {
  let left=0,right=0,moment=0;
  for (const {p,x} of loads) {
    let pos=x+advance;
    // Decimal grid arithmetic can turn 0.3 into 0.30000000000000004.
    // Snap only roundoff-sized differences at supports and the section jump.
    const tolerance=8*Number.EPSILON*Math.max(L,Math.abs(x),Math.abs(advance));
    if(Math.abs(pos)<=tolerance) pos=0;
    else if(Math.abs(pos-L)<=tolerance) pos=L;
    if(Math.abs(pos-a)<=tolerance) pos=a;
    if(pos<0 || pos>L) continue;
    const r=p*(1-pos/L);
    left+=r-(pos<a?p:0);
    right+=r-(pos<=a?p:0);
    moment+=pos>=a?r*a:p*(pos/L)*(L-a);
  }
  return {left,right,moment};
}
export function analyze({L,dx,da,loads}) {
  if(!Number.isFinite(L)||L<=0) throw Error('La longitud debe ser mayor que cero.');
  if(!loads.length||loads.some(c=>!Number.isFinite(c.p)||!Number.isFinite(c.x))) throw Error('Completa las cargas con números finitos.');
  if(loads[0].x!==0 || loads.some((c,i)=>c.x>0 || (i && c.x>loads[i-1].x))) throw Error('La primera carga debe estar en 0; las siguientes deben quedar detrás, en posiciones decrecientes.');
  const positions=grid(L,da), travel=grid(L-loads.at(-1).x,dx);
  if(positions.length*travel.length*loads.length>5000000) throw Error('El cálculo es demasiado grande. Aumenta Δx o ΔL.');
  const envelope=positions.map(a=>({a,vmin:Infinity,vmax:-Infinity,mmin:Infinity,mmax:-Infinity}));
  for(const s of travel) for(const row of envelope) {
    const r=response(L,row.a,loads,s);
    if(![r.left,r.right,r.moment].every(Number.isFinite)) throw Error('Los valores exceden el rango numérico. Reduce las magnitudes de los datos.');
    row.vmin=Math.min(row.vmin,r.left,r.right);row.vmax=Math.max(row.vmax,r.left,r.right);
    row.mmin=Math.min(row.mmin,r.moment);row.mmax=Math.max(row.mmax,r.moment);
  }
  // Final state after the last load leaves the span: all contributions are zero.
  for(const row of envelope) {row.vmin=Math.min(row.vmin,0);row.vmax=Math.max(row.vmax,0);row.mmin=Math.min(row.mmin,0);row.mmax=Math.max(row.mmax,0);}
  return {positions,travel,envelope};
}
