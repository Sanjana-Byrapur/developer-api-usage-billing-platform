const test=require('node:test');
const assert=require('node:assert/strict');
const jwt=require('jsonwebtoken');
process.env.JWT_SECRET='test-only-not-a-real-secret-0123456789';
const mysql=require('../src/config/mysql');
mysql.getPool=()=>({execute:async(sql,args)=>{
 if(sql.includes('FROM users'))return [[{user_id:1,name:'Test',email:'test@example.invalid',role_id:2,is_active:1}]];
 if(sql.includes('FROM roles'))return [[{role_name:'DEVELOPER'}]];
 if(sql.includes('FROM organization_members'))return [args[0]===1?[{member_role:'VIEWER'}]:[]];
 if(sql.includes('FROM api_keys'))return [[{organization_id:2}]];
 if(sql.includes('FROM invoices'))return [[{organization_id:2}]];
 throw new Error('Unexpected database access');
}});
const app=require('../src/app');
test('organization data and mutations are denied without appropriate membership',async()=>{
 const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
 try {
  const token=jwt.sign({sub:1},process.env.JWT_SECRET);const base=`http://127.0.0.1:${server.address().port}/api`;
  for(const [method,path,body] of [['GET','/usage/logs?organization_id=2'],['GET','/invoices/1'],['PATCH','/keys/1/revoke'],['POST','/keys',{organization_id:1}]]){
   const res=await fetch(base+path,{method,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined});
   assert.equal(res.status,403,`${method} ${path}`);
  }
 }finally{await new Promise(resolve=>server.close(resolve));}
});
