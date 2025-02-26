import express from 'express'
import { addUserRating, getUserCourseProgress, getUserData, purchaseCourse, updateCourseProgress, userEnrolledCourses } from '../controllers/userController.js'

const userRouter = express.Router()

userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);
userRouter.post('/purchase', purchaseCourse);


userRouter.post('/update-course-progress', updateCourseProgress);
userRouter.post('/get-course-progress', getUserCourseProgress);
userRouter.post('/add-rating', addUserRating);


export default userRouter;