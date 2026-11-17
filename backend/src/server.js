require('dotenv').config();const app=require('./app');const {getPool,closeMySQL}=require('./config/mysql');const {connectMongo,closeMongo}=require('./config/mongodb');
const PORT=Number(process.env.PORT||5000);let server;
async function start(){try{await getPool().query('SELECT 1');console.log('MySQL connected');await connectMongo();console.log('MongoDB connected');server=app.listen(PORT,()=>console.log(`Backend listening on http://localhost:${PORT}`));}catch(err){console.error('Startup failed. Check database configuration and network access.');console.error('Error type:',err.code||err.name);await shutdown(1);}}
async function shutdown(code=0){if(server)await new Promise(resolve=>server.close(resolve));try{await closeMongo();}catch(e){console.error('MongoDB shutdown error');}try{await closeMySQL();}catch(e){console.error('MySQL shutdown error');}process.exit(code);}
process.on('SIGINT',()=>shutdown(0));process.on('SIGTERM',()=>shutdown(0));start();
