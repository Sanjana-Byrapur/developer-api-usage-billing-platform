const test=require('node:test');
const assert=require('node:assert/strict');
const mysql=require('../src/config/mysql');
let queries=[];
const connection={beginTransaction:async()=>{},rollback:async()=>{},release:()=>{},execute:async(sql)=>{
 queries.push(sql);
 if(sql.includes('FROM subscriptions'))return [[{plan_id:1,monthly_fee:0}]];
 if(sql.includes('FROM invoices'))return [[{invoice_id:5}]];
 throw new Error('Unexpected write');
}};
mysql.getPool=()=>({getConnection:async()=>connection});
const {generateInvoice}=require('../src/services/core.service');
test('invoice generation locks its subscription and rejects an overlapping invoice',async()=>{
 queries=[];
 await assert.rejects(generateInvoice({organization_id:1,subscription_id:2,from:'2026-01-01',to:'2026-01-31'}),e=>e.status===409);
 assert.match(queries[0],/FOR UPDATE/);
 assert.equal(queries.some(q=>q.startsWith('INSERT')),false);
});
