import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User}  from "../models/user.model.js";
import {uploadOnCLoudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken  = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken =  user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave :false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens", error);
    }
}


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
    const {fullName, username, email, password} = req.body;
    console.log("user full email pass:", username,fullName, email,password);

    //validations
    if (
        [fullName, username, email, password].some((field)=>field?.trim()==="")
    ) {
        throw new ApiError(400, "All fields are required")
    }

    // check users existence
    const existedUser = await User.findOne({
        $or: [{ username }, {email}]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exist")
    }

    // check for images, files 

    // multer just adds propery to req where we saved it as avatar now it could be many things like jpg, png hence[0] which might and might not exist then path gives us the path of that file 

    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    // to fix the error that happens when "?" optional chaining  and variable hasnt come  which is if user left this field empty 

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }



    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required at localpath")
    }


    // upload on cloudinary 
    const avatar = await uploadOnCLoudinary(avatarLocalPath)
    const coverImage = await uploadOnCLoudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400, "Avatar file is required")       
    }

    // create user object
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        username:username.toLowerCase(),
        email,
        password,

    })

    // remove password and refresh token from response
    const createdUser =  await User.findById(user._id).select(
        "-password -refreshToken"
    )

    // check for user creation
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    // return respond
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})


//2.  login a User
// ---a. take data from user 
// ---b. username or email base pe login
// ---c. find user if not user u r not here
// ---d. if yes check password if not password=>try again
// ---e. if yes access refresh and access token 
// ---f. send secure cookies
// ---g. send response for user login
const loginUser = asyncHandler( async (req,res)=>{
    const {email, username, password} = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }
    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if(!user){
        throw new ApiError(404, "Username is not found")
    } 

    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect){
        throw new ApiError(401, "Invalid User Credentials")
    }

    const {accessToken,  refreshToken} = await generateAccessAndRefreshToken(user._id);

    // this modified user object now contains the sensitive refreshToken which shouldn't be sent to the client. By fetching the user again with .select("-password -refreshToken"), you ensure that the returned object loggedInUser is sanitized and safe to send back to the client
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    // make it only modefied by server
    const options = {
        httpOnly: true,
        secure:true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    // we are sending throw json also as it might be a mobile user which will need a header
    .json(
        new ApiResponse(
            200, 
            {
                user:loggedInUser,accessToken,
                refreshToken
            }, 
            "User logged in successfully"
        )
    )
})


const logoutUser = asyncHandler( async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
    const options = {
        httpOnly: true,
        secure:true
    }
    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json( new ApiResponse(200, {}, "User logged out successfully"))

})

const refreshAccessToken = asyncHandler( async (req,res)=>{
    const incomingRefreshToken = req.cookies.
    refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unautharized request")
    }
    
    try{
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid RefreshToken request")
        }

        if(incomingRefreshToken!== user?.refreshToken){
            throw new ApiError(401, "Refresh Token is expired or used")
        }

        const options ={
            httpOnly:true,
            secure:true
        }

        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id);

        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken)
        .json(
            new ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access Token refreshed successfully")
        )
    }catch(error){
        throw new ApiError(401, error?.message || "Invalid refresh Token")
    }
})


const changeCurrentPassword = asyncHandler( async(req,res)=>{
    const {oldPassword,newPassword} = req.body;
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(401, "Invalid user")
    }
    const passwordConfirmation = await user.isPasswordCorrect(oldPassword)
    if(!passwordConfirmation){
        throw new ApiError(401, "Invalid password")
    }
    user.password = newPassword
    await user.save()

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"current user fetched succefully"))
})


const updateAccountDetails = asyncHandler( async(req,res)=>{
    const {fullName, email} = res.body
    if(!fullName|| !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = User.findByIdAndUpdate(
        req.user?.id,
        {
            $set:{
                fullName,
                email
            }
        },
        {new:true}
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})


const updateUserAvatar = asyncHandler( async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file not found while updating")
    }

    // code to to delete old avatar from cloudinary 
    const oldUser = await User.findById(req.user?._id)
    cloudinary.v2.uploader
    .destroy(oldUser.avatar.public_id)
    .then(result=>console.log(result));
    if(!user){
        throw new ApiError(401, "Invalid user")
    }
    const avatar = await uploadOnCLoudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {new:true} // this sends the updated user 
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,user, "Avatar image updated successfully."
        )
    )

})


const updateUserCoverImage = asyncHandler( async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400, "coverImage file not found while updating")
    }
    

    const coverImage = await uploadOnCLoudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true} // this sends the updated user 
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,user, "coverImage updated successfully."
        )
    )

})


// main hard work 
const getUserChannelProfile = asyncHandler( async(req, res)=>{
    const {username } = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await  User.aggregate([
        {
            // This is a stage in the aggregation pipeline. The $ match stage filters the documents in the collection to pass only those that match the specified condition(s) to the next stage of the pipeline. It's similar to a find operation in MongoDB but is used within the aggregation framework.
            $match:{
                username:username?.toLowerCase()
            }
        },{
            //  This stage is used to perform a left outer join between two collections in MongoDB.
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },{
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },{
            // thi swill add these field to the user 
            $addfield:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                // u can use "$" "cond" to apply condition in which we have in which says if we have [this element in , this(could be array or even  object )]
                isSubscribed:{
                    $cond:{
                        if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                        then:true,
                        else:false
                    }
                }
            }
        },{
            // this filters what data u want to give 1 for yes if u want to give
            $project:{
                fullName:1,
                userName:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1
            }
        }
    ])
    if(!channel.length){
        throw new ApiError(404,"channel does not exist");
    }
    return res
    .status(200)
    .json( new ApiResponse(200, channel[0], "User channel fetched Successfully "))
})

const getWatchHistory = asyncHandler( async(req,res)=>{
    // if someone ask what do you get with this =>req.user.id
    // what u get is "string"   which get stored as  ObjectId("string ") automatically my mongoose internally 
    // so if u do that u will have to convert it , since when weuse aggregate pipeline it gives its code directly hence we have to change it using 
    // $match:{_id:new mongoose.Types.ObjectId(req.user._id) and not just _id:req.user._id} 

    const user = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline :[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullName:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },{
                        // when we have done all buisiness in owner model, it will give us array and to fix that we are applying another pipeline
                        $addFields:{
                            // we can change name and make another field , but this will just overwrite this field
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json( new ApiResponse(
        200,
        user[0].watchHistory, // check whether this work we added aggregation pipeline first thing from array logic in fucntion itself
        "watch history fetched succesfully"

    ))
}) 

export {
    loginUser,
    logoutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getWatchHistory,
    getUserChannelProfile,
    

};
    
