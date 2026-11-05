const test=require('node:test');
const assert=require('node:assert/strict');
const {allocateAllowance,monthBounds}=require('../src/services/billing');

test('monthly allowance is shared across APIs and days in deterministic order',()=>{
 const result=allocateAllowance([{day:'2026-02-02',api_id:2,request_count:7},{day:'2026-02-01',api_id:3,request_count:6},{day:'2026-02-01',api_id:1,request_count:5}],10);
 assert.deepEqual(result.map(x=>x.billable_requests),[0,1,7]);
 assert.deepEqual(allocateAllowance(result,10),result);
});
test('month boundaries include leap day and reject invalid months',()=>{
 const bounds=monthBounds('2024-02');assert.equal(bounds.from,'2024-02-01');assert.equal(bounds.to,'2024-02-29');
 assert.throws(()=>monthBounds('2024-13'),/YYYY-MM/);
});
test('rejects invalid counts and allowances',()=>{
 assert.throws(()=>allocateAllowance([], -1));
 assert.throws(()=>allocateAllowance([{day:'2026-01-01',api_id:1,request_count:-1}],0));
});
