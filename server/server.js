import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import { clerkWebhooks, stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloudinary.js';
import courseRouter from './routes/courseRoutes.js';
import userRouter from './routes/userRoutes.js';

const startServer = async () => {
    try {
        //Connect to DB
        await connectDB();
        await connectCloudinary();

        //Initialize Express
        const app = express();

        //Middlewares
        app.use(cors());
        app.use(clerkMiddleware()) 


        //Routes
        app.get('/', (req, res) => res.send("API WORKING"));
        app.post('/clerk', express.json(), clerkWebhooks);
        app.use('/api/educator', express.json(), educatorRouter);
        app.use('/api/course', express.json(), courseRouter);
        app.use('/api/user', express.json(), userRouter);
        app.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhooks);


        //PORT
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    } catch (error) {
        console.error("❌ Error starting server:", error);
        process.exit(1); 
    }
};


startServer();
