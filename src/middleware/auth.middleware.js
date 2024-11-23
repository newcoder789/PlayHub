import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";


// it is recommended to replace res with _ if we have res  being not used
export const verifyJWT = asyncHandler( async (req, res, next)=>{
    try {
        const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace(
            "Bearer ", ""
        );
    
        if (!accessToken) {
            return res.status(401).json({ message: "Access denied. No token provided." });
        }
        const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if(!user){
            // TODO:  discuss about frontend 
            throw new ApiError(401, "Invalid Access Token ")
        }
    
        req.user  = user;
    
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token ")
    }

})