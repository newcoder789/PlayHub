import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"; 

const userSchema = new Schema({
    username:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        index:true,// we apply index on those who we want to be enabled while searching 
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        uniqure:true,
        trim:true
    }
    ,fullname:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    }
    ,avatar:{
        type:String ,// urinary url
        required:true
    }
    ,coverImage:{
        type:String,

    },
    watchHistory:[{
        type:Schema.Types.ObjectId,
        ref:"Video"
    }],
    password:{
        type:String,
        required:[true,"Password is requied"]
    },
    refreshToken:{
        type:String
    }
},{
    timestamps:true
});

userSchema.pre("save",async function(next){
    // now if we dont apply if condition it will save password each time for ex let say we are saving image adn click save it will again save password and changing hash in process
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();

})

userSchema.methods.isPasswordCorrect = async function(password){
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({ // this returns the generated tokken
        _id: this._id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
)
}


userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
)
}

export const User = mongoose.model("User", userSchema)