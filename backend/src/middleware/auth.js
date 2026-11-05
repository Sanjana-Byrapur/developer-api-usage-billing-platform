const jwt=require('jsonwebtoken');
const {getPool}=require('../config/mysql');
const {asyncHandler}=require('../utils/http');
const requireAuth=asyncHandler(async(req,res,next)=>{
 const h=req.headers.authorization||''; if(!h.startsWith('Bearer ')) return res.status(401).json({success:false,message:'Bearer token required'});
 if(!process.env.JWT_SECRET || process.env.JWT_SECRET.length<32) return res.status(500).json({success:false,message:'JWT_SECRET must be configured with at least 32 characters'});
 let payload; try{payload=jwt.verify(h.slice(7),process.env.JWT_SECRET);}catch(e){return res.status(401).json({success:false,message:'Invalid or expired token'});}
 const [rows]=await getPool().execute('SELECT user_id,name,email,role_id,is_active FROM users WHERE user_id=? LIMIT 1',[payload.sub]);
 if(!rows.length||!rows[0].is_active) return res.status(401).json({success:false,message:'User is inactive or no longer exists'});
 const [roles]=await getPool().execute('SELECT role_name FROM roles WHERE role_id=?',[rows[0].role_id]);
 req.user={...rows[0],role:roles[0]?.role_name||'UNKNOWN'}; next();
});
function allowRoles(...roles){return (req,res,next)=>roles.includes(req.user?.role)?next():res.status(403).json({success:false,message:'Insufficient permissions'});}
module.exports={requireAuth,allowRoles};
