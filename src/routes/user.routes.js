import { Router } from "express";
import { loginUser, logoutUser, registerUser, refreshAccessToken, changeCurrentPassword, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory, getCurrentUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {name:"avatar", maxCount:1},
        {name:"coverImage", maxCount:1}
    ]),
    registerUser)

// in user login and logout we got raw body 
router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT,logoutUser)

router.route("/refreshToken").post(refreshAccessToken)

router.route("/changePassword").post(verifyJWT, changeCurrentPassword)

router.route("/current-user").get(verifyJWT, getCurrentUser)


// remember to change route to patch ,so that it do not change complete data  and only update the things given 
router.route("/update-account").patch(verifyJWT, updateAccountDetails)


router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

// this time  we are taking {username} with params, hence we have to change it accordingly
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)
export default router;