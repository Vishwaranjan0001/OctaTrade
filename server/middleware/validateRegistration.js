export async function validRegistration(req,res,next){
    if(!req.body.name || !req.body.email || !req.body.password){
        return res.status(400).json({msg:"All fields not filled"});
    }
    if(req.body.password.length<8){
        return res.status(400).json({msg:"Password lewngth small"});
    }
    next();
};