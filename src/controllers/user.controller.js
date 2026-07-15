import { asynchandler } from "../utils/asynchandler.js";
import {apierror} from "../utils/apierror.js" 
import { User } from "../models/user.model.js";
import { uploadOnCloudinary} from "../utils/cloudinary.js"
import { apiresponse } from "../utils/apiresponse.js";


const registerUser = asynchandler( async (requestAnimationFrame,res) => {
   //get user details from the frontend
   //validation - not empty
   //checl if thr user already exists: username,email
   //check for images,check for avatar
   //upload them to cloudinary,avatar
   //create user object - create entry in db
   //remove pass and refresh the token field from the responses
   //check for ueser creation
   //return res
    const {fullname, email,username,password} = requestAnimationFrame.body
    console.log("email: ",email);

    if(
        [fullname,email,username,password].some((field) =>
        field?.trim() =="")
    ){
        throw new apierror(400, "All fields are required")
    }

    const existedUser = 
    username.findOne({
        $or: [{username},{email}]
    })
    if (existedUser){
        throw new apierror(409,"user with email or username already exist")
    }
    const avatarlocalpath = requestAnimationFrame.files?.avatar[0]?.path;
    const coverImagelocalpath = requestAnimationFrame.files?.coverImage[0]?.path;

    if(!avatarlocalpath){
        throw new apierror(400," Avatar file is required")
    }
    const avatar = await uploadOnCloudinary(avatarlocalpath)
    const coverImage = await uploadOnCloudinary(coverImagelocalpath)

    if(!avatar) {
        throw new apierror(400,"Avatar file is required")
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
        throw new apierror(500," Something went wrong while regestring the user")
    }
    return res.status(201).json(
        new apiresponse(200,createdUser,"user registered successfully")
    )
})



export {registerUser}