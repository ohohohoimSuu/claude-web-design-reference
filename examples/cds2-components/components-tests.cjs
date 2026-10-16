'use strict';
const assert = require('node:assert/strict');
const { createEffortState } = require('./components.js');
let count = 0;
function test(name, fn) { fn(); count++; console.log('PASS ' + name); }
test('changing model capabilities drops unsupported effort and preserves supported effort', () => {
  const state = createEffortState({value:'max'});
  state.configure({levels:['low','high'],recommended:'high'});
  assert.equal(state.get().value,'high');
  state.select('low');
  state.configure({levels:['low','medium','high'],recommended:'medium'});
  assert.equal(state.get().value,'low');
});
test('locked and unavailable choices cannot change selection; unlock restores selection', () => {
  const state = createEffortState({levels:['low','high'],locked:true});
  assert.equal(state.select('low'),false);
  assert.equal(state.get().value,'high');
  state.configure({locked:false});
  assert.equal(state.select('max'),false);
  assert.equal(state.select('low'),true);
  assert.equal(state.get().value,'low');
});
test('invalid capability updates are atomic and do not lose current state', () => {
  const state = createEffortState({value:'xhigh'});
  const before = state.get();
  for (const options of [{levels:[]},{levels:['low','unknown']},{levels:['low','low']},{levels:['low'],recommended:'high'}]) {
    assert.throws(() => state.configure(options),TypeError);
    assert.deepEqual(state.get(),before);
  }
});
test('returned arrays cannot mutate available choices and Max warnings follow actual selection', () => {
  const state = createEffortState({value:'max'});
  assert.equal(state.get().warning,true);
  state.get().levels.length = 0;
  assert.equal(state.select('high'),true);
  assert.equal(state.get().warning,false);
  assert.equal(state.get().levels.length,5);
});
console.log(count + ' CDS 2.0 capability-state tests passed.');
