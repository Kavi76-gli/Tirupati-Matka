const { firebaseAuth } = require("../config/firebase");

// ======================================================
// FIREBASE AUTH MIDDLEWARE
// Verifies Firebase SMS phone authentication token
// ======================================================

const firebaseAuthMiddleware = async (req, res, next) => {
    try {
        // -----------------------------------------------
        // Get Authorization header
        // -----------------------------------------------

        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Firebase authentication token is required."
            });
        }

        // Expected:
        // Authorization: Bearer FIREBASE_ID_TOKEN

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization format."
            });
        }

        const idToken = authHeader.substring(7).trim();

        if (!idToken) {
            return res.status(401).json({
                success: false,
                message: "Firebase authentication token is missing."
            });
        }

        // -----------------------------------------------
        // Verify Firebase ID Token
        // -----------------------------------------------

        const decodedToken = await firebaseAuth.verifyIdToken(idToken);

        if (!decodedToken) {
            return res.status(401).json({
                success: false,
                message: "Invalid Firebase authentication token."
            });
        }

        // -----------------------------------------------
        // Attach Firebase user to request
        // -----------------------------------------------

        req.firebaseUser = decodedToken;

        // Continue
        next();

    } catch (error) {

        console.error(
            "FIREBASE AUTH MIDDLEWARE ERROR:",
            error.message
        );

        return res.status(401).json({
            success: false,
            message: "Firebase authentication failed."
        });
    }
};

module.exports = firebaseAuthMiddleware;