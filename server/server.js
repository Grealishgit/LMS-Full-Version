import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';

const startServer = async () => {
    try {
        //Connect to DB
        await connectDB();

        //Initialize Express
        const app = express();

        //Middlewares
        app.use(cors());
        app.use(express.json()); // Ensure JSON middleware is applied globally

        //Routes
        app.get('/', (req, res) => res.send("API WORKING"));
        app.post('/clerk', clerkWebhooks);

        //PORT
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

    } catch (error) {
        console.error("❌ Error starting server:", error);
        process.exit(1); // Exit process if DB connection fails
    }
};

// Start the server
startServer();
