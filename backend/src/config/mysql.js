const mysql = require('mysql2/promise');
let pool;
function getPool() {
  if (!pool) {
    const required = ['MYSQL_HOST','MYSQL_USER','MYSQL_DATABASE'];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) throw new Error(`Missing MySQL environment variables: ${missing.join(', ')}`);
    pool = mysql.createPool({host:process.env.MYSQL_HOST,port:Number(process.env.MYSQL_PORT || 3306),user:process.env.MYSQL_USER,password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,waitForConnections:true,connectionLimit:10,queueLimit:0,enableKeepAlive:true,decimalNumbers:true});
  }
  return pool;
}
async function pingMySQL(){ const p=getPool(); await p.query('SELECT 1'); return true; }
async function closeMySQL(){ if(pool){const p=pool;pool=null;await p.end();} }
module.exports={getPool,pingMySQL,closeMySQL};
