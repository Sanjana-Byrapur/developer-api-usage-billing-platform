function notFound(req,res){res.status(404).json({success:false,message:`Route not found: ${req.method} ${req.path}`});}
function errorHandler(err,req,res,next){if(res.headersSent)return next(err);const status=Number(err.status)||500; if(status>=500) console.error('Request failed:',err.code||err.name||'Error'); res.status(status).json({success:false,message:status>=500?'Internal server error':err.message});}
module.exports={notFound,errorHandler};
