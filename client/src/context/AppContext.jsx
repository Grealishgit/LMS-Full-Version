import React, { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const { getToken } = useAuth();
    const { user } = useUser();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [userData, setUserData] = useState(null);

    // Function to fetch all courses
    const fetchAllCourses = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/course/all');

            if (data.success) {
                //toast.success('Courses fetched successfully!');
                setAllCourses(data.courses)
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);

        }
    };

    //Fetch User Data
    const fetchUserData = async () => {
        if (user.publicMetadata.role === 'educator') {
            setIsEducator(true);
        }

        try {
            const token = await getToken();

            const { data } = await axios.get(backendUrl + '/api/user/data', { headers: { Authorization: `Bearer ${token}` } });

            if (data.success) {
                setUserData(data.user)
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        }
    }


    // Function to fetch user enrolled courses
    const fetchUserEnrolledCourses = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data.success) {
                setEnrolledCourses(data.enrolledCourses.reverse());
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching enrolled courses:", error.message);
            toast.error("Failed to load enrolled courses.");
        }
    };


    // Function to calculate average course rating
    const calculateRating = (course) => {
        if (course.courseRatings.length === 0) {
            return 0;
        }

        let totalRating = 0
        course.courseRatings.forEach(rating => {
            totalRating += rating.rating
        })

        return Math.floor(totalRating / course.courseRatings.length);
    };

    // Function to calculate chapter time
    const calculateChapterTime = (chapter) => {
        const time = chapter.chapterContent.reduce((sum, lecture) => sum + lecture.lectureDuration, 0);
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate total course duration
    const calculateCourseDuration = (course) => {
        if (!course?.courseContent || !Array.isArray(course.courseContent)) return "0m"; // Return 0 minutes if courseContent is missing or not an array

        const time = course.courseContent.reduce((sum, chapter) => {
            if (!chapter?.chapterContent || !Array.isArray(chapter.chapterContent)) return sum;
            return sum + chapter.chapterContent.reduce((subSum, lecture) => subSum + (lecture?.lectureDuration || 0), 0);
        }, 0);

        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };


    // Function to calculate the number of lectures in a course
    const calculateNoOfLectures = (course) => {
        if (!course?.courseContent || !Array.isArray(course.courseContent)) return 0; // Ensure courseContent is an array

        return course.courseContent.reduce(
            (total, chapter) => total + (Array.isArray(chapter?.chapterContent) ? chapter.chapterContent.length : 0),
            0
        );
    };


    // Fetch courses and enrolled courses on mount
    useEffect(() => {
        fetchAllCourses();
    }, []);

    // Log user token when user is available
    useEffect(() => {

        if (user) {
            fetchUserEnrolledCourses();
            fetchUserData();
        }
    }, [user]);

    const value = {
        currency,
        allCourses,
        navigate,
        calculateRating,
        isEducator,
        setIsEducator,
        calculateNoOfLectures,
        calculateCourseDuration,
        calculateChapterTime,
        setEnrolledCourses,
        enrolledCourses,
        fetchUserEnrolledCourses,
        backendUrl, userData, setUserData,
        getToken, fetchAllCourses

    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
