import mongoose from 'mongoose';

// Connect to the MongoDB database
const connectDB = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/lms-DB`);
        console.log('MongoDB Connected Successfully');

    } catch (error) {
        console.error('MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;
