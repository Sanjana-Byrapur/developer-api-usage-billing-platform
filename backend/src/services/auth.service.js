const bcrypt=require('bcrypt'); const jwt=require('jsonwebtoken'); const {getPool}=require('../config/mysql');
async function register({name,email,password}){
 const role='DEVELOPER'; const p=getPool(); const [rr]=await p.execute('SELECT role_id FROM roles WHERE role_name=?',[role]); if(!rr.length) throw Object.assign(new Error('Requested role is not configured'),{status:400});
 const hash=await bcrypt.hash(password,Number(process.env.BCRYPT_ROUNDS||12));
 const [r]=await p.execute('INSERT INTO users(name,email,password_hash,role_id) VALUES(?,?,?,?)',[name,email.toLowerCase(),hash,rr[0].role_id]);
 const [u]=await p.execute('SELECT user_id,name,email,role_id,is_active,created_at FROM users WHERE user_id=?',[r.insertId]); return u[0];
}
async function login({email,password}){
 const [rows]=await getPool().execute('SELECT u.user_id,u.name,u.email,u.password_hash,u.role_id,u.is_active,r.role_name FROM users u JOIN roles r ON r.role_id=u.role_id WHERE u.email=?',[email.toLowerCase()]);
 if(!rows.length||!rows[0].is_active||!(await bcrypt.compare(password,rows[0].password_hash))) throw Object.assign(new Error('Invalid email or password'),{status:401});
 if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32) throw new Error('Configure JWT_SECRET with at least 32 characters');
 const u=rows[0],token=jwt.sign({sub:u.user_id,role:u.role_name},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'1d'});
 return {token,user:{user_id:u.user_id,name:u.name,email:u.email,role:u.role_name}};
}
module.exports={register,login};
