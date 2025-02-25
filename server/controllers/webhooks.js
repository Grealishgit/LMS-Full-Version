import { Webhook } from "svix";
import User from "../models/User.js";

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
