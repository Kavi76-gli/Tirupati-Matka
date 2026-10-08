const express = require("express");
const router = express.Router();

// ======================================================
// CONTROLLER
// ======================================================

const authController = require("../controllers/auth-controller");

// ======================================================
// MIDDLEWARES
// ======================================================

const { auth } = require("../middleware/auth-middleware");
const { adminOnly } = require("../middleware/admin-auth-middleware");

const upload = require("../middleware/upload-middleware");
const uploadQR = require("../middleware/uploadQr");

// Firebase phone verification middleware
const firebaseAuthMiddleware =
    require("../middleware/firebase-auth-middleware");

// ======================================================
// PUBLIC AUTH ROUTES
// ======================================================

/*
 * Firebase SMS OTP is verified on the frontend.
 * The Firebase ID token is then sent to this backend.
 *
 * IMPORTANT:
 * Firebase SMS OTP = 6 digits
 * App M-PIN       = 4 digits
 */

// Register
router.post(
    "/register",
    firebaseAuthMiddleware,
    authController.register
);

// Normal login with mobile + password
router.post(
    "/login",
    authController.login
);

// Login with 4-digit M-PIN
router.post(
    "/login-mpin",
    authController.loginMPin
);

// Check whether mobile number is registered
router.post(
    "/check-phone",
    authController.checkPhone
);

// Reset password using Firebase SMS verification
router.post(
    "/reset-password",
    firebaseAuthMiddleware,
    authController.resetPassword
);

// Reset M-PIN using Firebase SMS verification
router.post(
    "/reset-mpin",
    firebaseAuthMiddleware,
    authController.resetMPin
);

// ======================================================
// M-PIN ROUTES
// ======================================================

// Create first 4-digit M-PIN
router.post(
    "/set-mpin",
    auth,
    authController.setMPin
);

// Change existing 4-digit M-PIN
router.post(
    "/change-mpin",
    auth,
    authController.changeMPin
);

// ======================================================
// USER PROFILE
// ======================================================

router.get(
    "/profile",
    auth,
    authController.getProfile
);

router.post(
    "/update-profile",
    auth,
    authController.updateProfile
);

// ======================================================
// USER AVATAR
// ======================================================

router.post(
    "/uploads-avatars",
    auth,
    upload.single("avatar"),
    authController.uploadUserAvatar
);

// ======================================================
// USER SETTINGS
// ======================================================

// Change password while logged in
router.post(
    "/settings/change-password",
    auth,
    authController.changePassword
);

// Update contact information
router.post(
    "/settings/update-contact",
    auth,
    authController.updateContact
);

// Help
router.get(
    "/settings/help",
    auth,
    authController.getHelp
);

// Logout
router.post(
    "/settings/logout",
    auth,
    authController.logout
);

// ======================================================
// USER → DEPOSIT
// ======================================================

router.post(
    "/deposit",
    auth,
    upload.single("screenshot"),
    authController.depositRequest
);

// ======================================================
// USER → WITHDRAWAL
// ======================================================

router.post(
    "/withdraw",
    auth,
    upload.single("screenshot"),
    authController.requestWithdrawal
);

// ======================================================
// USER → BALANCE
// ======================================================

router.get(
    "/balance",
    auth,
    authController.getBalance
);

// ======================================================
// USER → TRANSACTIONS
// ======================================================

router.get(
    "/transactions",
    auth,
    authController.getUserTransactions
);

// ======================================================
// USER → PAYMENT DETAILS
// ======================================================

router.get(
    "/payment-details",
    auth,
    authController.getPaymentDetails
);

// ======================================================
// USER → REFERRALS
// ======================================================

router.get(
    "/my-referrals",
    auth,
    authController.getMyReferrals
);

// Public referral redirect
router.get(
    "/ref/:code",
    authController.referralRedirect
);

// ======================================================
// USER → CURRENT USER
// ======================================================

router.get(
    "/me",
    auth,
    authController.getMe
);

// ======================================================
// ADMIN → MAKE ADMIN
// ======================================================

router.post(
    "/make-admin",
    auth,
    adminOnly,
    authController.makeAdmin
);

// ======================================================
// ADMIN → USER MANAGEMENT
// ======================================================

// Ban user
router.post(
    "/admin/users/ban/:userId",
    auth,
    adminOnly,
    authController.banUser
);

// Unban user
router.post(
    "/admin/users/unban/:userId",
    auth,
    adminOnly,
    authController.unbanUser
);

// Reset user password
router.post(
    "/admin/users/reset-password/:userId",
    auth,
    adminOnly,
    authController.resetUserPassword
);

// Get all users
router.get(
    "/admin/users",
    auth,
    adminOnly,
    authController.getAllUsers
);

// ======================================================
// ADMIN → DEPOSITS
// ======================================================

// Approve/reject deposit
router.post(
    "/admin/deposit/approve",
    auth,
    adminOnly,
    authController.adminApproveDeposit
);

// View all deposits
router.get(
    "/admin/deposits",
    auth,
    adminOnly,
    authController.getAllDeposits
);

// Delete single deposit
router.delete(
    "/admin/deposit/:id",
    auth,
    adminOnly,
    authController.deleteSingleDeposit
);

// Delete all deposits
router.delete(
    "/admin/deposits",
    auth,
    adminOnly,
    authController.deleteAllDeposits
);

// Hide single deposit
router.post(
    "/admin/deposit/hide",
    auth,
    adminOnly,
    authController.hideSingleDepositAdminView
);

// Hide all deposits
router.post(
    "/admin/deposits/hide-all",
    auth,
    adminOnly,
    authController.hideAllDepositsAdminView
);

// ======================================================
// ADMIN → WITHDRAWALS
// ======================================================

// Pending withdrawals
router.get(
    "/admin/withdrawals/pending",
    auth,
    adminOnly,
    authController.getPendingWithdrawals
);

// Approve/reject withdrawal
router.post(
    "/admin/withdrawals/handle",
    auth,
    adminOnly,
    authController.handleWithdrawal
);

// ======================================================
// ADMIN → WALLETS
// ======================================================

router.get(
    "/admin/users-wallet",
    auth,
    adminOnly,
    authController.getAllUsersWallet
);

// ======================================================
// ADMIN → PAYMENT CONFIGURATION
// ======================================================

router.post(
    "/admin/payment-config",
    auth,
    adminOnly,
    uploadQR.single("qrImage"),
    authController.adminUpdatePayment
);

// ======================================================
// ADMIN → TRANSACTIONS
// ======================================================

router.get(
    "/admin/transactions",
    auth,
    adminOnly,
    authController.getAllTransactions
);

// ======================================================
// EXPORT
// ======================================================

module.exports = router;