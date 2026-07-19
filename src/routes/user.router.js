import { Router } from "express";
import { loginUser, logoutUser, registerUser,refrehaccessToken } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js" 
import { verifyJWT } from "../middlewares/auth.middleware.js";



const router = Router()

router.route("/register").post(
    upload.fields([ 
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    (req, res, next) => {
        console.log("AFTER MULTER");
        console.log(req.files);
        next();
    },
    






    registerUser)

    router.route("/login").post(loginUser)

    //secured routes
    router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refrehaccessToken)
export default router