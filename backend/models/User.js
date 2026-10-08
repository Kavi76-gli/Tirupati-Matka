const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        // =========================================
        // BASIC USER INFORMATION
        // =========================================

        name: {
            type: String,
            required: true,
            trim: true
        },

        phone: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        // =========================================
        // FIREBASE PHONE VERIFICATION
        // =========================================

        firebaseUid: {
            type: String,
            unique: true,
            sparse: true
        },

        phoneVerified: {
            type: Boolean,
            default: false
        },

        phoneVerifiedAt: {
            type: Date,
            default: null
        },

        // =========================================
        // 4-DIGIT M-PIN
        // =========================================

        mpinHash: {
            type: String,
            default: null,
            select: false
        },

        mpinSet: {
            type: Boolean,
            default: false
        },

        mpinFailedAttempts: {
            type: Number,
            default: 0
        },

        mpinLockedUntil: {
            type: Date,
            default: null
        },

        mpinUpdatedAt: {
            type: Date,
            default: null
        },

        // =========================================
        // ACCOUNT STATUS
        // =========================================

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        isAdmin: {
            type: Boolean,
            default: false
        },

        isBlocked: {
            type: Boolean,
            default: false
        },

        // =========================================
        // REFERRAL
        // =========================================

        referralCode: {
            type: String,
            unique: true,
            sparse: true
        },

        referredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // =========================================
        // WALLET
        // =========================================

        wallet: {
            type: Number,
            default: 0
        },

        // =========================================
        // CREATED
        // =========================================

        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", UserSchema);