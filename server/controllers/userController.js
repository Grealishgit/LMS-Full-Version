import User from "../models/User.js"
import Course from "../models/course.js";
import { CourseProgress } from "../models/courseProgress.js";
import { Purchase } from '../models/purchase.js';
import Stripe from "stripe";

export const getUserData = async (req, res) => {
    try {
        const userId = req.auth.userId
        const user = await User.findById(userId)

        if (!user) {
            return res.json({ success: false, message: "User Not Found" });
        }
        return res.json({ success: true, user });

    } catch (error) {
        return res.json({ success: false, message: error.message });

    }
}
//Users Enrolled Courses With Lecture Links
export const userEnrolledCourses = async (req, res) => {
    try {
        const userId = req.auth.userId
        const userData = await User.findById(userId).populate('enrolledCourses')

        res.json({ success: true, enrolledCourses: userData.enrolledCourses });
    } catch (error) {

        return res.json({ success: false, message: error.message });

    }

}

export const purchaseCourse = async (req, res) => {
    try {
        const { courseId } = req.body
        const { origin } = req.headers
        const userId = req.auth.userId
        const userData = await User.findById(userId)
        const courseData = await Course.findById(courseId)

        if (!userData || !courseData) {
            return res.json({ success: false, message: "Invalid Data" });
        }
        const purchaseData = {
            courseId: courseData._id,
            userId,
            amount: (courseData.coursePrice - courseData.discount * courseData.coursePrice / 100).toFixed(2),
        }

        const newPurchase = await Purchase.create(purchaseData);

        //Stripe Gateway Initialize
        const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
        const currency = process.env.CURRENCY.toLowerCase();

        //Creating line items for Stripe
        const line_items = [{
            price_data: {
                currency,
                product_data: {
                    name: courseData.courseTitle,
                },
                unit_amount: Math.floor(newPurchase.amount) * 100
            },
            quantity: 1
        }]
        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/loading/my-enrollments`,
            cancel_url: `${origin}/`,
            line_items: line_items,
            mode: 'payment',
            metadata: {
                purchaseId: newPurchase._id.toString()
            }
        })

        return res.json({ success: true, session_url: session.url });

    } catch (error) {
        res.json({ success: false, message: error.message });

    }
}

//Update User Course Progress
export const updateCourseProgress = async (req, res) => {
    try {

        const userId = req.auth.userId;
        const { courseId, lectureId } = req.body;

        // Validate userId, courseId, and lectureId
        if (!userId || !courseId || !lectureId) {
            return res.status(400).json({ success: false, message: 'userId, courseId, and lectureId are required' });
        }

        // Find the course progress
        let progressData = await CourseProgress.findOne({ userId, courseId });

        if (progressData) {
            if (progressData.lectureCompleted.includes(lectureId)) {
                return res.json({ success: true, message: 'Lecture Already Completed' });
            }

            progressData.lectureCompleted.push(lectureId);
            await progressData.save();
        } else {
            await CourseProgress.create({
                userId,
                courseId,
                lectureCompleted: [lectureId]
            });
        }

        return res.json({ success: true, message: 'Progress Updated' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

//get User Course Progress
export const getUserCourseProgress = async (req, res) => {
    try {
        const userId = req.auth.userId;
        const { courseId } = req.body;

        if (!userId || !courseId) {
            return res.status(400).json({ success: false, message: "Missing userId or courseId" });
        }

        const progressData = await CourseProgress.findOne({ userId, courseId });



        if (!progressData) {
            return res.json({ success: true, progressData: { lectureCommpleted: [] } }); // Return an empty structure
        }

        res.json({ success: true, progressData });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};


//Add User rating to course
export const addUserRating = async (req, res) => {
    const { courseId, rating, userId } = req.body;



    // Validate userId, courseId, and rating
    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
        return res.json({ success: false, message: 'Invalid Details' });
    }

    try {
        const course = await Course.findById(courseId);
        if (!course) {
            return res.json({ success: false, message: 'Course Not Found' });
        }

        const user = await User.findById(userId);
        if (!user || !user.enrolledCourses.includes(courseId)) {
            return res.json({ success: false, message: 'User has not purchased this course' });
        }

        const existingRatingIndex = course.courseRatings.findIndex(r => r.userId === userId);
        if (existingRatingIndex > -1) {
            course.courseRatings[existingRatingIndex].rating = rating;
        } else {
            course.courseRatings.push({ userId, rating });
        }

        await course.save();
        return res.json({ success: true, message: 'Rating Added' });
    } catch (error) {
        return res.json({ success: false, message: error.message });
    }
};