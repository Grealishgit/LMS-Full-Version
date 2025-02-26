import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/purchase.js";
import Course from "../models/course.js";

export const clerkWebhooks = async (req, res) => {
    try {
        console.log("🔵 Received Webhook Request:", JSON.stringify(req.body, null, 2));

        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

        // ✅ Verify Webhook Signature
        try {
            await whook.verify(JSON.stringify(req.body), {
                "svix-id": req.headers["svix-id"],
                "svix-signature": req.headers["svix-signature"],
                "svix-timestamp": req.headers["svix-timestamp"]
            });
        } catch (error) {
            console.error("❌ Webhook Verification Failed:", error);
            return res.status(401).json({ success: false, message: "Invalid Webhook Signature" });
        }

        console.log("✅ Webhook verified successfully");

        const { data, type } = req.body;

        switch (type) {
            case "user.created": {
                console.log("🟢 Creating user:", data);

                const userData = {
                    _id: data.id,
                    email: data.email_addresses?.[0]?.email_address || "unknown@email.com",
                    name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                    imageUrl: data.image_url || "",
                };

                console.log("📌 User Data before saving:", userData);

                const newUser = await User.create(userData);

                console.log("✅ User saved in DB:", newUser);

                res.json({ success: true });
                break;
            }

            case "user.updated": {
                console.log("🟡 Updating user:", data);

                const updatedUser = await User.findByIdAndUpdate(
                    data.id,
                    {
                        email: data.email_addresses?.[0]?.email_address,
                        name: `${data.first_name || ""} ${data.last_name || ""}`.trim(),
                        imageUrl: data.image_url || "",
                    },
                    { new: true, upsert: true }
                );

                console.log("✅ User updated in DB:", updatedUser);

                res.json({ success: true });
                break;
            }

            case "user.deleted": {
                console.log("🔴 Deleting user:", data.id);

                await User.findByIdAndDelete(data.id);
                console.log("✅ User deleted from DB");

                res.json({ success: true });
                break;
            }

            default:
                console.log("⚠️ Unknown event type:", type);
                res.status(400).json({ message: "Unknown event type" });
                break;
        }

    } catch (error) {
        console.error("❌ Webhook Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

export const stripeWebhooks = async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
        event = Stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        response.status(400).send(`Webhook Error: ${err.message}`);
    }
    // Handle the event
    switch (event.type) {
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            const { purchaseId } = session.data[0].metadata;

            const purchaseData = await Purchase.findById(purchaseId);
            const userData = await User.findById(purchaseData.userId);
            const courseData = await Course.findById(purchaseData.courseId.toString());

            courseData.enrolledStudents.push(userData);
            await courseData.save();
            userData.enrolledCourses.push(courseData._id);
            await userData.save();


            purchaseData.status = "completed";
            await purchaseData.save();

            break;
        }


        case 'payment_intent.payment_failed': {
            const paymentIntent = event.data.object;
            const paymentIntentId = paymentIntent.id;

            const session = await stripeInstance.checkout.sessions.list({
                payment_intent: paymentIntentId
            });

            const { purchaseId } = session.data[0].metadata;
            const purchaseData = await Purchase.findById(purchaseId);
            purchaseData.status = "failed";
            await purchaseData.save();

            break;
        }
        // ... handle other event types
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    // Return a response to acknowledge receipt of the event
    response.json({ received: true });
};


