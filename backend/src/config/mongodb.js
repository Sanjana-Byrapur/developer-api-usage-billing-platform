const {MongoClient}=require('mongodb');
let client; let database;
async function connectMongo(){
  if(database) return database;
  if(!process.env.MONGODB_URI || !process.env.MONGODB_DATABASE) throw new Error('MONGODB_URI and MONGODB_DATABASE must be configured');
  client=new MongoClient(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000});
  await client.connect(); database=client.db(process.env.MONGODB_DATABASE);
  await database.command({ping:1});
  return database;
}
function getMongo(){ if(!database) throw new Error('MongoDB has not been connected'); return database; }
async function ensureEventIndexes(){
  const c=getMongo().collection('api_request_events');
  await c.createIndexes([
    {key:{organization_id:1},name:'idx_event_org'},
    {key:{api_id:1},name:'idx_event_api'},
    {key:{request_timestamp:1},name:'idx_event_timestamp'},
    {key:{organization_id:1,request_timestamp:1},name:'idx_event_org_timestamp'},
    {key:{api_id:1,request_timestamp:1},name:'idx_event_api_timestamp'}
  ]);
}
async function pingMongo(){await getMongo().command({ping:1});return true;}
async function closeMongo(){if(client){const c=client;client=null;database=null;await c.close();}}
module.exports={connectMongo,getMongo,pingMongo,closeMongo};
