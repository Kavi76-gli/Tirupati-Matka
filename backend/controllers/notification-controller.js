// ======================================================
// TIRUPATI MATKA
// NOTIFICATION CONTROLLER
// ======================================================
// Handles:
// 1. Android FCM device registration
// 2. Subscribe device to game_results topic
// ======================================================

const {
    getApps
} = require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");


// ======================================================
// FCM TOPIC
// ======================================================

const GAME_RESULT_TOPIC =
    "game_results";


// ======================================================
// REGISTER ANDROID DEVICE
// ======================================================
// POST
// /api/notifications/register-device
//
// Body:
// {
//     "token": "FCM_DEVICE_TOKEN"
// }
//
// Requires:
// Authorization: Bearer USER_TOKEN
// ======================================================

const registerDevice = async (req, res) => {

    try {

        console.log(
            "=========================================="
        );

        console.log(
            "📱 DEVICE REGISTRATION REQUEST"
        );


        // ==================================================
        // CHECK FIREBASE ADMIN
        // ==================================================

        if (
            getApps().length === 0
        ) {

            console.error(
                "❌ Firebase Admin is not initialized."
            );

            return res.status(500).json({

                success: false,

                message:
                    "Firebase Admin is not initialized."

            });
        }


        // ==================================================
        // GET TOKEN
        // ==================================================

        const token =
            String(
                req.body?.token || ""
            ).trim();


        // ==================================================
        // VALIDATE TOKEN
        // ==================================================

        if (!token) {

            console.warn(
                "⚠️ FCM device token missing."
            );

            return res.status(400).json({

                success: false,

                message:
                    "FCM device token is required."

            });
        }


        console.log(
            "📱 FCM token received."
        );

        console.log(
            "📱 Token length:",
            token.length
        );


        // ==================================================
        // GET CURRENT USER
        // ==================================================

        const userId =
            req.user?._id ||
            req.user?.id ||
            req.userId ||
            null;


        if (userId) {

            console.log(
                "👤 User:",
                String(userId)
            );

        } else {

            console.warn(
                "⚠️ User ID not available in request."
            );

        }


        // ==================================================
        // SUBSCRIBE DEVICE TO TOPIC
        // ==================================================

        const response =
            await getMessaging()
                .subscribeToTopic(
                    [token],
                    GAME_RESULT_TOPIC
                );


        // ==================================================
        // LOG FIREBASE RESPONSE
        // ==================================================

        console.log(
            "📡 Firebase topic subscription response:"
        );

        console.log(
            "Success:",
            response.successCount
        );

        console.log(
            "Failure:",
            response.failureCount
        );


        // ==================================================
        // SUBSCRIPTION FAILED
        // ==================================================

        if (
            response.failureCount > 0
        ) {

            console.error(
                "❌ DEVICE TOPIC SUBSCRIPTION FAILED"
            );

            console.error(
                response.errors || []
            );


            return res.status(400).json({

                success: false,

                message:
                    "Unable to subscribe device to notifications.",

                topic:
                    GAME_RESULT_TOPIC,

                details:
                    response.errors || []

            });
        }


        // ==================================================
        // SUCCESS
        // ==================================================

        console.log(
            "=========================================="
        );

        console.log(
            "✅ DEVICE REGISTERED FOR PUSH"
        );

        console.log(
            "📱 Topic:",
            GAME_RESULT_TOPIC
        );

        console.log(
            "📱 Success:",
            response.successCount
        );

        console.log(
            "❌ Failure:",
            response.failureCount
        );

        console.log(
            "=========================================="
        );


        return res.status(200).json({

            success: true,

            message:
                "Device registered successfully.",

            topic:
                GAME_RESULT_TOPIC,

            subscribed:
                response.successCount > 0

        });


    } catch (error) {

        // ==================================================
        // ERROR
        // ==================================================

        console.error(
            "=========================================="
        );

        console.error(
            "❌ DEVICE REGISTRATION ERROR"
        );

        console.error(
            error
        );

        console.error(
            "=========================================="
        );


        return res.status(500).json({

            success: false,

            message:
                "Failed to register device.",

            error:
                error.message

        });

    }

};


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    registerDevice,

    GAME_RESULT_TOPIC

};