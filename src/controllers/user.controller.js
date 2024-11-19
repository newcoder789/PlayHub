import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User}  from "../models/user.model.js";
import {uploadOnCLoudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

// Logic building 

// 1. for registering a user 
// ---a. get user details from frontend 
// ---b. validation not empty
// ---c. check if user already exist :username ,email
// ---d. check for images, avatar
// ---e. upload them to cloudinary, avatar
// ---f. create user object -create entry in db
// ---g. remove password and refresh token from response
// ---h. check for user creation
// ---i. return respond
const registerUser = asyncHandler( async (req,res) =>{
    const {fullname, username, email, password} = req.body;
    console.log("user full email pass:", username,fullname, email,password);

    //validations
    if (
        [fullname, username, email, password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check users existence
    const existedUser = User.findOne({
        $or: [{ username }, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // check for images, files 
    // multer just adds propery to req where we saved it as avatar now it could be manuy things like jpg, png hence[0] which might and might not exist then path gives us the path of that file 
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }


    // upload on cloudinary 
    const avatar = await uploadOnCLoudinary(avatarLocalPath)
    const coverImage = await uploadOnCLoudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")       
    }

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username:username.toLowerCase(),
        email,
        password,

    })

    const createdUser =  User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})
export {registerUser};