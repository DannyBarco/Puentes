import {test} from 'node:test';
import assert from 'node:assert/strict';
import {response,analyze,grid} from '../beam.mjs';
test('carga central: salto de cortante y momento PL/4',()=>{assert.deepEqual(response(10,5,[{p:10,x:5}]),{left:5,right:-5,moment:25});});
test('fórmulas a ambos lados de la sección',()=>{assert.deepEqual(response(10,4,[{p:10,x:2}]),{left:-2,right:-2,moment:12});assert.deepEqual(response(10,4,[{p:10,x:8}]),{left:1.9999999999999996,right:1.9999999999999996,moment:7.999999999999998});});
test('superposición y cargas fuera de luz',()=>{const r=response(10,5,[{p:10,x:2},{p:20,x:8},{p:999,x:-1},{p:999,x:11}]);assert.ok(Math.abs(r.moment-30)<1e-10);assert.ok(Math.abs(r.left-2)<1e-10);});
test('malla incluye extremo no divisible',()=>assert.deepEqual(grid(1,.4),[0,.4,.8,1]));
test('recorrido del tren y envolvente conocida',()=>{const r=analyze({L:10,dx:1,da:5,loads:[{p:10,x:0}]});assert.equal(r.envelope[1].mmax,25);assert.equal(r.envelope[1].vmax,5);assert.equal(r.envelope[1].vmin,-5);assert.equal(r.envelope[0].mmax,0);assert.equal(r.envelope[2].mmax,0);const train=analyze({L:10,dx:3,da:5,loads:[{p:10,x:0},{p:20,x:-2}]});assert.equal(train.travel.at(-1),12);});
test('valida geometría, incrementos y límites de cálculo',()=>{for(const change of [{L:0},{dx:0},{da:-1},{loads:[]},{loads:[{p:1,x:1}]},{dx:1e-9}])assert.throws(()=>analyze({L:10,dx:1,da:1,loads:[{p:10,x:0}],...change}));});

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} ≠ ${b}`);
test('coincidencias decimales conservan el salto de P y las cargas en apoyos',()=>{
  const r=response(1,.3,[{p:10,x:0}],.1+.2);
  close(r.left,7);close(r.right,-3);close(r.moment,2.1);
  const support=response(1,0,[{p:10,x:-.3}],.1+.2);
  close(support.left,10);close(support.right,0);
  assert.deepEqual(response(1,.3,[{p:10,x:1.000001}]),{left:0,right:0,moment:0});
});
test('refinar Δx recupera los extremos que omite una malla gruesa',()=>{
  const base={L:10,da:5,loads:[{p:10,x:0}]};
  const coarse=analyze({...base,dx:3}).envelope[1];
  const fine=analyze({...base,dx:.5}).envelope[1];
  close(coarse.mmax,20);close(fine.mmax,25);
  close(coarse.vmax,4);close(coarse.vmin,-3);
  close(fine.vmax,5);close(fine.vmin,-5);
});
test('envolventes coinciden con un cálculo independiente por equilibrio en toda la malla',()=>{
  // Reference uses reactions and lever arms, rather than the influence formulas.
  for(const loads of [[{p:12,x:0},{p:7,x:-1.5},{p:20,x:-4}],[{p:-9,x:0},{p:13,x:-2}]]){
    const {envelope,travel}=analyze({L:10,dx:.25,da:.5,loads});
    for(const row of envelope){
      const vs=[0],ms=[0];
      for(const s of travel){
        const active=loads.map(c=>({p:c.p,x:c.x+s})).filter(c=>c.x>=0&&c.x<=10);
        const rb=active.reduce((sum,c)=>sum+c.p*c.x/10,0);
        const ra=active.reduce((sum,c)=>sum+c.p,0)-rb;
        vs.push(ra-active.filter(c=>c.x<row.a).reduce((sum,c)=>sum+c.p,0));
        vs.push(ra-active.filter(c=>c.x<=row.a).reduce((sum,c)=>sum+c.p,0));
        ms.push(ra*row.a-active.filter(c=>c.x<row.a).reduce((sum,c)=>sum+c.p*(row.a-c.x),0));
      }
      close(row.vmin,Math.min(...vs));close(row.vmax,Math.max(...vs));
      close(row.mmin,Math.min(...ms));close(row.mmax,Math.max(...ms));
    }
  }
});
test('cargas ascendentes, coincidentes y tren descargado',()=>{
  const r=analyze({L:10,dx:1,da:5,loads:[{p:-10,x:0},{p:-5,x:0}]});
  close(r.envelope[1].mmin,-37.5);close(r.envelope[1].mmax,0);
  assert.deepEqual(response(10,5,[{p:10,x:0},{p:20,x:-2}],12.01),{left:0,right:0,moment:0});
});
test('resultados que desbordan el rango numérico se rechazan',()=>{
  assert.throws(()=>analyze({L:10,dx:1,da:5,loads:[{p:1e308,x:0},{p:1e308,x:0}]}),/rango numérico/);
});
