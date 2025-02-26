import React, { createContext, useEffect, useState } from "react";
import { dummyCourses } from "../assets/assets";
import { useNavigate } from "react-router-dom";
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {
    const currency = import.meta.env.VITE_CURRENCY;
    const navigate = useNavigate();

    const { getToken } = useAuth();
    const { user } = useUser();

    const [allCourses, setAllCourses] = useState([]);
    const [isEducator, setIsEducator] = useState(true);
    const [enrolledCourses, setEnrolledCourses] = useState([]);

    // Function to fetch all courses
    const fetchAllCourses = async () => {
        try {

        } catch (error) {

        }
    };

    // Function to fetch user enrolled courses
    const fetchUserEnrolledCourses = async () => {
        setEnrolledCourses(dummyCourses);
    };

    // Function to calculate average course rating
    const calculateRating = (course) => {
        if (!course.courseRatings?.length) return 0;
        const totalRating = course.courseRatings.reduce((sum, rating) => sum + rating.rating, 0);
        return totalRating / course.courseRatings.length;
    };

    // Function to calculate chapter time
    const calculateChapterTime = (chapter) => {
        const time = chapter.chapterContent.reduce((sum, lecture) => sum + lecture.lectureDuration, 0);
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate total course duration
    const calculateCourseDuration = (course) => {
        const time = course.courseContent.reduce(
            (sum, chapter) => sum + chapter.chapterContent.reduce((subSum, lecture) => subSum + lecture.lectureDuration, 0),
            0
        );
        return humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    };

    // Function to calculate the number of lectures in a course
    const calculateNoOfLectures = (course) => {
        return course.courseContent.reduce(
            (total, chapter) => total + (Array.isArray(chapter.chapterContent) ? chapter.chapterContent.length : 0),
            0
        );
    };

    // Fetch courses and enrolled courses on mount
    useEffect(() => {
        fetchAllCourses();
        fetchUserEnrolledCourses();
    }, []);

    // Log user token when user is available
    useEffect(() => {
        const logToken = async () => {
            console.log(await getToken());
        };
        if (user) {
            logToken();
        }
    }, [user, getToken]);

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
        fetchUserEnrolledCourses

    };

    return <AppContext.Provider value={value}>{props.children}</AppContext.Provider>;
};
