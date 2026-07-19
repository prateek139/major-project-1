import { asynchandler } from "../utils/asynchandler.js";
import {ApiError} from "../utils/apierror.js" 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiresponse } from "../utils/apiresponse.js";
import jwt from "jsonwebtoken"

const registerUser = asynchandler( async (req,res) => {
   //get user details from the frontend
   //validation - not empty
   //checl if thr user already exists: username,email
   //check for images,check for avatar
   //upload them to cloudinary,avatar
   //create user object - create entry in db
   //remove pass and refresh the token field from the responses
   //check for ueser creation
   //return res
    const {fullname, email,username,password} = req.body
    console.log("BODY:", req.body);
console.log("FILES:", req.files);
    console.log("email: ",email);

    if(
        [fullname,email,username,password].some((field) =>
        field?.trim() =="")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existedUser = 
    await User.findOne({
        $or: [{username},{email}]
    })
    if (existedUser){
        throw new ApiError(409,"user with email or username already exist")
    }
    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverImagelocalpath = req.files?.coverImage?.[0]?.path;

    if(!avatarlocalpath){
        throw new ApiError(400," Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const coverImage = await uploadOnCloudinary(coverImagelocalpath)

    if(!avatar) {
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select(
        "-password -refreshtoken"
    )

    if(!createdUser) {
        throw new ApiError(500," Something went wrong while regestring the user")
    }
    return res.status(201).json(
        new apiresponse(200,createdUser,"user registered successfully")
    )
})


const loginUser = asynchandler(async(req,res) =>{
    //req body -> data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookies
const generateAccesandRefreshToken = async(userId) =>{
    try{
        const user = await User.findById(userId)
        const accessToken = User.generateAccessToken()
        const refreshtoken = User.generateRefreshToken()

        user.refreshtoken = refreshtoken
        await user.save({ validateBeforeSave: false})
        return {accessToken,refreshtoken}

    }catch(error){
        throw new ApiError(500,"Something went wrong  while generating refresh and access token")
    }
}


    const {email,username,password} = req.body
    if(!username || !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{username},{email}]
    })
    if(!user) {
        throw new ApiError(404,"User does not exist")
    }
    if(!isPasswordValid){
        throw new ApiError(401," Invalid user credentials")
    }
    const {accessToken,refreshtoken} = await generateAccesandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).
    select("-password -refreshtoken")

    const options = {
        httpOnly:  true,
        secure: true
    }
    return res.status(200).
    cookie("accesToken", accessToken,options)
    .cookie("refreshtoken", refreshtoken,options)
    .json(
        new apiresponse(
            200,
            {
                user: loggedInUser, accessToken, refreshtoken
            },
            "User logged in Successfully"
        )
    )


})

const logoutUser = asynchandler(async(req,res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshtoken:undefined
            }
        },
            {
                new:true
            }
        
    )
    const options = {
        httpOnly:  true,
        secure: true
    }
    return res
    .status(200)
    .clearCookies("accessToken",options)
    .clearCookies("refreshtoken",options)
    .json(new apiresponse(200,{},"User logged out"))

})
const refreshtoken = asynchandler(async(req,res) =>{
    const incomingRefreshtoken = req.cookies.
    refreshtoken || req.body.refreshtoken

    if(!incomingRefreshtoken){
        throw new ApiError(401,"unauthorized request")
    }
    try {
        const decodedToken = jwt.verify(
            incomingRefreshtoken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
    if(incomingRefreshtoken !== refreshtoken){
        throw new ApiError(401,"Refresh token is expired or used")
    }
    const options = {
        httpOnly:true,
        secure: true
    }
    const {accessToken,newrefreshtoken} = await 
    generateAccesandRefreshToken(user._id)
    
    return res
    .status(200)
    .cookies("accesstoken",accessToken,options)
    .cookies("refreshtoken",newrefreshtoken,options)
    .json(
        new apiresponse(
            200,
            {accessToken,refreshtoken:newrefreshtoken},
            "Access token refreshed"
        )
    )
    } catch (error) {

        throw new ApiError(401,error?.message || "Invalid refresh token")
    }


}

)

const changeCurrentPassword = asynchandler(async(req,res) =>
{
    const{oldPassword,newPassword} =req.body
    const user = await User.findById(req.user?.id)
    const isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400,"Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new apiresponse(200,{},"Password changed successfully"))
})
const getCurrentUser = asynchandler(async(req,res) =>{
    return res
    .status(200)
    .json(200,req.user,"current user fetched successfully")
})


const updateAccountDetails = asynchandler(async(req,res) =>{
    const {fullname,email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname,
                email: email
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new apiresponse(200,user,"Account details updated successfully"))
})

 
const updateUserAvatar = asynchandler(async(req,res) =>{
    const avatarlocalpath= req.file?.path
if(!avatarlocalpath){
    throw new ApiError(400,"Avatar file is missing")
}
const avatar = await uploadOnCloudinary(avatarlocalpath)

if(!avatar.url){
    throw new ApiError(400,"Avatar file is missing")
}
const user =await User.findByIdAndDelete(
    req.user?._id,
    {
        $set:{
            avatar: avatar.url
        }
    },
    {new: true}
).select("-password")
return res
.status(200)
.json(
    new apiresponse(200,user,"avatar image updated successfuly")
)



})

const updateUsercoverImage = asynchandler(async(req,res) =>{
    const coverImagelocalpath= req.file?.path
if(!coverImagelocalpath){
    throw new ApiError(400,"Avatar file is missing")
}
const coverImage = await uploadOnCloudinary(coverImagelocalpath)

if(!coverImage.url){
    throw new ApiError(400,"coverImage file is missing")
}
const user =await User.findByIdAndDelete(
    req.user?._id,
    {
        $set:{
            coverImage: coverImage.url
        }
    },
    {new: true}
).select("-password")
return res
.status(200)
.json(
    new apiresponse(200,user,"Coverimage image updated successfuly")
)


})




export {registerUser,
    loginUser,
    logoutUser,
    refreshtoken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar
}