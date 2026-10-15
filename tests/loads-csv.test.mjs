import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseLoadsCsv} from '../loads-csv.mjs';
import {analyze} from '../beam.mjs';
const expected=[{p:10,x:0},{p:15,x:-2},{p:10,x:-4}];
test('CSV plantilla crea posiciones acumuladas y las mismas envolventes',()=>{
  const loads=parseLoadsCsv('P_kN,distancia_m\n10,0\n15,2\n10,2\n');
  assert.deepEqual(loads,expected);
  const base={L:10,dx:.1,da:.5};
  assert.deepEqual(analyze({...base,loads}),analyze({...base,loads:expected}));
});
test('CSV de Excel: BOM, CRLF, punto y coma, coma decimal y comillas',()=>{
  assert.deepEqual(parseLoadsCsv('\uFEFFP_kN;distancia_m\r\n"10,5";0\r\n15;"2,5"\r\n'),[{p:10.5,x:0},{p:15,x:-2.5}]);
});
test('cabeceras invertidas, espacios, vacíos entre filas y cargas ascendentes',()=>{
  assert.deepEqual(parseLoadsCsv('\nDistancia anterior (m),P (kN)\n0,-10\n\n0,20'),[{p:-10,x:0},{p:20,x:0}]);
});
test('rechaza datos inválidos sin inventar cargas ni distancias',()=>{
  for(const csv of ['', 'P_kN,distancia_m','P_kN,distancia_m\n10,1','P_kN,distancia_m\n10,0\n5,-1','P_kN,distancia_m\n10,0\n,2','P_kN,distancia_m\nNaN,0','P_kN,distancia_m\n1e999,0','P_kN,distancia_m\n10,0,2','P,x\n10,0','P_kN,distancia_m\n"10,0','P_kN,distancia_m\n"10"abc,0']) assert.throws(()=>parseLoadsCsv(csv));
});
test('limita el tamaño de los archivos y cantidad de cargas',()=>{
  assert.throws(()=>parseLoadsCsv(' '.repeat(1000001)),/1 MB/);
  assert.throws(()=>parseLoadsCsv('P_kN,distancia_m\n'+'1,0\n'.repeat(501)),/500/);
});
