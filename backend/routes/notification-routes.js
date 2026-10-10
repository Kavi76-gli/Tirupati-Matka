const express = require("express");

const router = express.Router();

const { registerDevice } = require("../controllers/notification-controller");
const { auth } = require("../middleware/auth-middleware");


// ======================================================
// VALIDATE REQUIRED FUNCTIONS
// ======================================================

if (typeof auth !== "function") {
    throw new TypeError(
        "❌ auth middleware is not a function. Check middleware/auth-middleware.js"
    );
}

if (typeof registerDevice !== "function") {
    throw new TypeError(
        "❌ registerDevice is not a function. Check notification-controller.js"
    );
}


// ======================================================
// REGISTER DEVICE FOR PUSH NOTIFICATIONS
// ======================================================
//
// POST /api/notifications/register-device
//
// Requires:
// Authorization: Bearer <JWT>
// Body:
// {
//     "token": "FCM_DEVICE_TOKEN"
// }
//
// ======================================================

router.post(
    "/register-device",
    auth,
    registerDevice
);


module.exports = router;