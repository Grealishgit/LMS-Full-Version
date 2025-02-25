import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // console.log(`🔄 Connecting to MongoDB at: ${process.env.MONGODB_URL}`);

        await mongoose.connect(process.env.MONGODB_URL);


        console.log('✅ MongoDB Connected Successfully');

    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
};

export default connectDB;
