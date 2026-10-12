import test from 'node:test';
import assert from 'node:assert/strict';
import {medicineImageUrl} from '../src/utils/medicineImage.js';
test('existing medicine image rows use API proxy on kiosk and admin phones',()=>{
 for(const base of ['http://192.168.50.1','http://192.168.50.1:5000/']) {
  assert.equal(medicineImageUrl({image_path:'/medicine-images/kit.png'},base),base.replace(/\/$/,'')+'/api/medicine-images/kit.png');
  assert.equal(medicineImageUrl({imageUrl:'/api/medicine-images/kit.png'},base),base.replace(/\/$/,'')+'/api/medicine-images/kit.png');
 }
 assert.equal(medicineImageUrl({imageUrl:'https://example.com/kit.png'},''),'https://example.com/kit.png');
 assert.equal(medicineImageUrl({image_path:123},''),'');
 assert.equal(medicineImageUrl({image_path:'javascript:alert(1)'},''),'');
});
