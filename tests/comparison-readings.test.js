import test from 'node:test';import assert from 'node:assert/strict';
import {comparisonReading,comparisonLabel} from '../src/utils/comparisonReadings.js';
test('comparison never invents a score, preserves zero and labels missing metrics',()=>{
 for(const value of [undefined,null,'',true,'invalid'])assert.equal(Number.isNaN(comparisonReading(value)),true);
 assert.equal(comparisonReading(0),0);assert.equal(comparisonReading('98'),98);
 assert.equal(comparisonLabel(NaN,'%'),'—');assert.equal(comparisonLabel(98,'%'),'98%');
});
