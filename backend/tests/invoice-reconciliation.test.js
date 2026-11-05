const test=require('node:test');const assert=require('node:assert/strict');
const mysql=require('../src/config/mysql');const mongo=require('../src/config/mongodb');
let records=[],fee=0,columns=[],writes=[];
const connection={beginTransaction:async()=>{},rollback:async()=>{},commit:async()=>{},release:()=>{},execute:async(sql)=>{
 if(sql.includes('FROM subscriptions'))return [[{plan_id:1,monthly_fee:fee,included_requests:1}]];
 if(sql.includes('FROM invoices'))return [[]];
 if(sql.includes('FROM usage_records WHERE')&&!sql.includes('SUM('))return [records];
 if(sql.includes('FROM api_pricing'))return [[{price_per_request:2}]];
 if(sql.includes('information_schema'))return [columns];
 if(sql.includes('SUM(billable_requests)'))return [[{api_id:5,requests:1,amount:2}]];
 writes.push(sql);if(sql.startsWith('INSERT INTO invoices'))return [{insertId:42}];return [{}];
}};
mysql.getPool=()=>({getConnection:async()=>connection});
mongo.getMongo=()=>({collection:()=>({aggregate:()=>({toArray:async()=>[{_id:{api_id:5,day:'2026-01-02'},request_count:2}]})})});
const {generateInvoice}=require('../src/services/invoice.service');
const args={organization_id:1,subscription_id:2,from:'2026-01-01',to:'2026-01-31'};
test('invoice refuses unaggregated or stale usage',async()=>{records=[];fee=0;writes=[];await assert.rejects(generateInvoice(args),/not fully aggregated/);assert.equal(writes.length,0);});
test('paid invoice requires migration before any insert',async()=>{records=[{api_id:5,day:'2026-01-02',request_count:2,billable_requests:1,amount:2}];fee=10;columns=[];writes=[];await assert.rejects(generateInvoice(args),/migration/);assert.equal(writes.length,0);});
test('paid invoice includes a separate plan-fee line after schema is available',async()=>{records=[{api_id:5,day:'2026-01-02',request_count:2,billable_requests:1,amount:2}];fee=10;columns=[{COLUMN_NAME:'api_id',IS_NULLABLE:'YES'},{COLUMN_NAME:'description',IS_NULLABLE:'YES'}];writes=[];const result=await generateInvoice(args);assert.equal(result.total_amount,12);assert.equal(result.items,2);assert.ok(writes.some(q=>q.includes('description')));});
