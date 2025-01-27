
const User=require("../models/User");
const mailSender=require("../utils/mailSender");
const bcrypt=require("bcryptjs");
const crypto=require("crypto");

//resetPasswordToken
exports.resetPasswordToken=async(req,res)=>{
    try{
    //get email from req body
    const email=req.body.email;

    //check user for this email,email validation
    const user=await User.findOne({email: email});

    if(!user)
    {
        return res.json({success:false,
        message:"Your Email is not registered with us"});
    }
    //generate token
    const token=crypto.randomUUID();

    //update user by adding token and expiration time
    
    //----- search on basis of email and add token,date of expiry
    
    const updateDetails=await User.findOneAndUpdate(
                            {email:email},
                        {
                            token:token,
                            resetPasswordExpires: Date.now()+5*60*1000,
                        },
                    {new:true}) //marking new:true ensures we get new doc

    //create url
    
     //frontend will run on 3000 port
    const url=`http://localhost:3000/update-password/${token}`

    //send mail containing url

    await mailSender(email,
        "Password Reset Link",
        `Password Reset Link: ${url}`
    );

    //return response
    return res.json({
        success:true,
        message:"Email Sent successfully,please check email and change pwd",
    })
   }
   catch(error)
   {
       console.log(error);
       return res.status(500).json({
        success:false,
        message:"Something went wrong while sending reset pwd mail"
       });
   }

}

//-------- reset password

exports.resetPassword=async(req,res)=>{
    //data fetch
    try{
    const{password,confirmPassword,token}=req.body;
    
    //we are taking token from body as frontend have put token in body using url

    //validation
    if(password !==confirmPassword)
    {
        return res.json({
            success:false,
            message:"Password doesn't match",
        });
    }

    //gets user details from db using token
    const userDetails=await User.findOne({token:token});
    
    //if no entry-invalid token
    if(!userDetails)
    {
        return res.json({
            success:false,
            message:"Token is invalid",
        });
    }
 
    //token time check
    if(userDetails.resetPasswordExpires < Date.now())
    {
         return res.json({
            success:false,
            message:"Token is expired,Please regenarate your token",
         });
    }


    //hashing pwd
    const hashedPassword=await bcrypt.hash(password,10);

    //password update
    await User.findOneAndUpdate(
        {token:token},
        {password:hashedPassword},
        {new:true},
    );

    //return response
    return res.status(200).json({
        success:true,
        message:"Password reset successfully",
    })
   
 }
 catch(error)
 {
    console.log(error);
    return res.status(500).json({
        success:false,
        message:"Something went wrong while sending reset password mail",
    })
 }

}
