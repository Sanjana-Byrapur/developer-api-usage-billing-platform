const {getPool}=require('../config/mysql');
const {getMongo}=require('../config/mongodb');
const {allocateAllowance}=require('./billing');
const conflict=message=>Object.assign(new Error(message),{status:409});

// Reconcile a complete month while holding the same subscription lock used by
// application event ingestion and aggregation. Direct DB writers bypass this.
async function generateInvoice({organization_id,subscription_id,from,to,tax=0}){
 const c=await getPool().getConnection();
 try {
  await c.beginTransaction();
  const [subs]=await c.execute('SELECT s.plan_id,p.monthly_fee,p.included_requests FROM subscriptions s JOIN pricing_plans p ON p.plan_id=s.plan_id WHERE s.subscription_id=? AND s.organization_id=? FOR UPDATE',[subscription_id,organization_id]);
  if(!subs.length)throw Object.assign(new Error('Subscription not found for organization'),{status:404});
  const [existing]=await c.execute('SELECT invoice_id FROM invoices WHERE subscription_id=? AND billing_period_start<=? AND billing_period_end>=? LIMIT 1',[subscription_id,to,from]);
  if(existing.length)throw conflict('An invoice already overlaps this billing period');
  const start=new Date(`${from}T00:00:00Z`),end=new Date(`${to}T00:00:00Z`);end.setUTCDate(end.getUTCDate()+1);
  const groups=await getMongo().collection('api_request_events').aggregate([{$match:{organization_id,subscription_id,request_timestamp:{$gte:start,$lt:end}}},{$group:{_id:{api_id:'$api_id',day:{$dateToString:{format:'%Y-%m-%d',date:'$request_timestamp',timezone:'UTC'}}},request_count:{$sum:1}}}]).toArray();
  const expected=allocateAllowance(groups.map(g=>({api_id:Number(g._id.api_id),day:g._id.day,request_count:g.request_count})),Number(subs[0].included_requests));
  const [records]=await c.execute("SELECT api_id,DATE_FORMAT(usage_date,'%Y-%m-%d') AS day,request_count,billable_requests,amount FROM usage_records WHERE organization_id=? AND subscription_id=? AND usage_date BETWEEN ? AND ?",[organization_id,subscription_id,from,to]);
  if(records.length!==expected.length)throw conflict('Usage is not fully aggregated; aggregate the month first');
  for(const g of expected){
   const record=records.find(r=>Number(r.api_id)===g.api_id&&r.day===g.day);
   const [prices]=await c.execute('SELECT price_per_request FROM api_pricing WHERE api_id=? AND plan_id=? AND effective_from <= ? AND (effective_until IS NULL OR effective_until >= DATE_ADD(?, INTERVAL 1 DAY)) ORDER BY effective_from DESC LIMIT 1',[g.api_id,subs[0].plan_id,g.day,g.day]);
   if(!prices.length)throw conflict(`Missing full-day pricing for API ${g.api_id} on ${g.day}`);
   const amount=Math.round((g.billable_requests*Number(prices[0].price_per_request)+Number.EPSILON)*100)/100;
   if(!record||Number(record.request_count)!==g.request_count||Number(record.billable_requests)!==g.billable_requests||Number(record.amount)!==amount)throw conflict('Usage or pricing changed; aggregate the month again');
  }
  const fee=Number(subs[0].monthly_fee);
  if(fee>0){const [columns]=await c.execute("SELECT COLUMN_NAME,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='invoice_items' AND COLUMN_NAME IN ('api_id','description')");if(!columns.some(x=>x.COLUMN_NAME==='api_id'&&x.IS_NULLABLE==='YES')||!columns.some(x=>x.COLUMN_NAME==='description'))throw conflict('Paid-plan invoicing requires the approved invoice plan fee migration');}
  const [u]=await c.execute('SELECT api_id,SUM(billable_requests) AS requests,SUM(amount) AS amount FROM usage_records WHERE organization_id=? AND subscription_id=? AND usage_date BETWEEN ? AND ? GROUP BY api_id',[organization_id,subscription_id,from,to]);
  const subtotal=u.reduce((sum,x)=>sum+Number(x.amount),fee);
  const [ins]=await c.execute("INSERT INTO invoices(organization_id,subscription_id,billing_period_start,billing_period_end,subtotal,tax,total_amount,status) VALUES(?,?,?,?,?,?,?,'DRAFT')",[organization_id,subscription_id,from,to,subtotal,tax,subtotal+tax]);
  for(const x of u){const unit=Number(x.requests)?Number((Number(x.amount)/Number(x.requests)).toFixed(4)):0;await c.execute('INSERT INTO invoice_items(invoice_id,api_id,request_count,unit_price,amount) VALUES(?,?,?,?,?)',[ins.insertId,x.api_id,Number(x.requests),unit,Number(x.amount)]);}
  if(fee>0)await c.execute('INSERT INTO invoice_items(invoice_id,api_id,description,request_count,unit_price,amount) VALUES(?,NULL,?,1,?,?)',[ins.insertId,'Monthly plan fee',fee,fee]);
  await c.execute('CALL refresh_invoice_total(?)',[ins.insertId]);await c.commit();return {invoice_id:ins.insertId,subtotal,total_amount:subtotal+tax,items:u.length+(fee>0?1:0)};
 }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={generateInvoice};
