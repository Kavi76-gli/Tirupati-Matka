const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Wallet = require("../models/wallet");
const PaymentConfig = require("../models/PaymentConfig");

const fs = require("fs");
const multer = require("multer");
const path = require("path");


// ======================================================
// BASIC HELPERS
// ======================================================

const cleanIndianPhone = (phone) => {
    return String(phone || "")
        .replace(/\D/g, "")
        .slice(-10);
};


const getUserId = (req) => {
    return (
        req.user?.id ||
        req.user?._id ||
        req.userId ||
        null
    );
};


const getFirebasePhone = (req) => {
    return (
        req.firebaseUser?.phone_number ||
        req.firebaseUser?.phoneNumber ||
        null
    );
};


const createToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            isAdmin: user.isAdmin === true
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "365d"
        }
    );
};


const generateReferralCode = (name = "REF") => {
    const cleanName = String(name)
        .replace(/[^a-zA-Z]/g, "")
        .substring(0, 3)
        .toUpperCase() || "REF";

    const rand = Math.floor(
        100000 + Math.random() * 900000
    );

    return cleanName + rand;
};


const getUserResponse = (user) => {
    return {
        id: user._id,
        _id: user._id,

        name: user.name || "Player",

        phone: user.phone || null,

        referralCode:
            user.referralCode || null,

        referredBy:
            user.referredBy || null,

        wallet:
            Number(user.wallet || 0),

        isAdmin:
            user.isAdmin === true,

        role:
            user.role || "user",

        phoneVerified:
            user.phoneVerified === true,

        mpinSet:
            user.mpinSet === true
    };
};


// ======================================================
// MULTER
// ======================================================

const ensureDir = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, {
            recursive: true
        });
    }
};


const storage = multer.diskStorage({

    destination: (req, file, cb) => {

        let uploadDir = path.join(
            process.cwd(),
            "uploads",
            "screenshots"
        );

        if (
            file.fieldname === "screenshot" ||
            file.fieldname === "qrImage"
        ) {
            uploadDir = path.join(
                process.cwd(),
                "uploads",
                "qr"
            );
        }

        else if (
            file.fieldname === "avatar"
        ) {
            uploadDir = path.join(
                process.cwd(),
                "uploads",
                "avatars"
            );
        }

        ensureDir(uploadDir);

        cb(null, uploadDir);
    },


    filename: (req, file, cb) => {

        cb(
            null,
            Date.now() +
            path.extname(file.originalname)
        );
    }

});


exports.upload = multer({
    storage
});


// ======================================================
// CHECK PHONE
// Used before Firebase SMS OTP reset flows
// ======================================================

exports.checkPhone = async (req, res) => {

    try {

        let {
            phone
        } = req.body;


        if (!phone) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number is required."
            });

        }


        phone =
            cleanIndianPhone(phone);


        if (
            !/^[6-9]\d{9}$/.test(phone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid 10-digit Indian mobile number."
            });

        }


        const user =
            await User.findOne({
                phone
            }).select("_id phone");


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "No account was found with this mobile number."
            });

        }


        return res.status(200).json({
            success: true,
            message:
                "Mobile number is registered."
        });

    }

    catch (error) {

        console.error(
            "CHECK PHONE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to check mobile number."
        });

    }

};


// ======================================================
// REGISTER
// Firebase SMS OTP must already be verified
//
// Firebase OTP = 6 digits
// M-PIN = created later = 4 digits
// ======================================================

exports.register = async (req, res) => {

    try {

        const {
            name,
            phone,
            password,
            confirmPassword,
            referralCode
        } = req.body;


        // ----------------------------------------------
        // FIREBASE VERIFICATION
        // ----------------------------------------------

        if (!req.firebaseUser) {

            return res.status(401).json({
                success: false,
                message:
                    "Please verify your mobile number with SMS OTP."
            });

        }


        // ----------------------------------------------
        // REQUIRED FIELDS
        // ----------------------------------------------

        if (
            !name ||
            !phone ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Name, mobile number and password are required."
            });

        }


        // ----------------------------------------------
        // PASSWORD CONFIRMATION
        // ----------------------------------------------

        if (
            confirmPassword !== undefined &&
            password !== confirmPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Passwords do not match."
            });

        }


        // ----------------------------------------------
        // PHONE
        // ----------------------------------------------

        const cleanPhone =
            cleanIndianPhone(phone);


        if (
            !/^[6-9]\d{9}$/.test(cleanPhone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Indian mobile number."
            });

        }


        // ----------------------------------------------
        // FIREBASE PHONE
        // ----------------------------------------------

        const firebasePhone =
            getFirebasePhone(req);


        if (!firebasePhone) {

            return res.status(401).json({
                success: false,
                message:
                    "Firebase verified mobile number not found."
            });

        }


        const verifiedPhone =
            cleanIndianPhone(firebasePhone);


        if (
            verifiedPhone !== cleanPhone
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Verified mobile number does not match."
            });

        }


        // ----------------------------------------------
        // EXISTING USER
        // ----------------------------------------------

        const existingPhone =
            await User.findOne({
                phone: cleanPhone
            });


        if (existingPhone) {

            return res.status(409).json({
                success: false,
                message:
                    "This mobile number is already registered. Please login."
            });

        }


        // ----------------------------------------------
        // FIREBASE UID DUPLICATE CHECK
        // ----------------------------------------------

        const existingFirebaseUser =
            await User.findOne({
                firebaseUid:
                    req.firebaseUser.uid
            });


        if (existingFirebaseUser) {

            return res.status(409).json({
                success: false,
                message:
                    "This Firebase account is already registered."
            });

        }


        // ----------------------------------------------
        // REFERRAL
        // ----------------------------------------------

        let referrerUser = null;

        const cleanReferralCode =
            referralCode
                ? String(referralCode).trim()
                : "";


        if (cleanReferralCode) {

            referrerUser =
                await User.findOne({
                    referralCode:
                        cleanReferralCode
                });


            if (!referrerUser) {

                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid referral code."
                });

            }

        }


        // ----------------------------------------------
        // PASSWORD HASH
        // ----------------------------------------------

        const hashedPassword =
            await bcrypt.hash(
                String(password),
                12
            );


        // ----------------------------------------------
        // GENERATE REFERRAL CODE
        // ----------------------------------------------

        let myReferralCode =
            generateReferralCode(name);


        while (
            await User.findOne({
                referralCode:
                    myReferralCode
            })
        ) {

            myReferralCode =
                generateReferralCode(name);

        }


        // ----------------------------------------------
        // REFERRAL BONUS
        // ----------------------------------------------

        const newUserBonus =
            referrerUser ? 40 : 0;


        // ----------------------------------------------
        // CREATE USER
        // ----------------------------------------------

        const newUser =
            await User.create({

                name:
                    String(name).trim(),

                phone:
                    cleanPhone,

                password:
                    hashedPassword,

                firebaseUid:
                    req.firebaseUser.uid,

                phoneVerified:
                    true,

                phoneVerifiedAt:
                    new Date(),

                mpinHash:
                    null,

                mpinSet:
                    false,

                mpinFailedAttempts:
                    0,

                mpinLockedUntil:
                    null,

                mpinUpdatedAt:
                    null,

                referralCode:
                    myReferralCode,

                referredBy:
                    referrerUser
                        ? referrerUser._id
                        : null,

                wallet:
                    newUserBonus,

                role:
                    "user",

                isAdmin:
                    false,

                isBlocked:
                    false

            });


        // ----------------------------------------------
        // REFERRER BONUS
        // ----------------------------------------------

        if (referrerUser) {

            referrerUser.wallet =
                Number(
                    referrerUser.wallet || 0
                ) + 50;

            await referrerUser.save();

        }


        // ----------------------------------------------
        // JWT
        // ----------------------------------------------

        const token =
            createToken(newUser);


        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        return res.status(201).json({

            success: true,

            message:
                "Registration successful.",

            token,

            requiresMPin:
                true,

            user:
                getUserResponse(newUser),

            referral: {

                applied:
                    !!referrerUser,

                referralCode:
                    referrerUser
                        ? cleanReferralCode
                        : null,

                welcomeBonus:
                    newUserBonus,

                referrerCommission:
                    referrerUser
                        ? 50
                        : 0

            }

        });

    }

    catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );


        if (
            error.code === 11000
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Mobile number, Firebase account or referral code already exists."

            });

        }


        return res.status(500).json({

            success: false,

            message:
                "Registration failed. Please try again."

        });

    }

};


// ======================================================
// LOGIN WITH PASSWORD
// ======================================================

exports.login = async (req, res) => {

    try {

        const {
            phone,
            password
        } = req.body;


        if (
            !phone ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number and password are required."
            });

        }


        const cleanPhone =
            cleanIndianPhone(phone);


        if (
            !/^[6-9]\d{9}$/.test(cleanPhone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Indian mobile number."
            });

        }


        const user =
            await User.findOne({
                phone: cleanPhone
            }).select("+password");


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid mobile number or password."
            });

        }


        if (
            user.isBlocked === true ||
            user.isBanned === true
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked."
            });

        }


        const passwordMatch =
            await bcrypt.compare(
                String(password),
                user.password
            );


        if (!passwordMatch) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid mobile number or password."
            });

        }


        const token =
            createToken(user);


        return res.status(200).json({

            success: true,

            message:
                "Login successful.",

            token,

            isAdmin:
                user.isAdmin === true,

            requiresMPin:
                user.mpinSet !== true,

            redirect:
                user.mpinSet === true
                    ? "/index.html"
                    : "/mpin-setup.html",

            user:
                getUserResponse(user)

        });

    }

    catch (error) {

        console.error(
            "LOGIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Authentication server error."
        });

    }

};


// ======================================================
// SET 4-DIGIT M-PIN
// ======================================================

exports.setMPin = async (req, res) => {

    try {

        const {
            mpin,
            confirmMPin
        } = req.body;


        const userId =
            getUserId(req);


        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });

        }


        if (!mpin) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN is required."
            });

        }


        const cleanMpin =
            String(mpin).trim();


        // IMPORTANT:
        // M-PIN = EXACTLY 4 DIGITS

        if (
            !/^\d{4}$/.test(cleanMpin)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN must contain exactly 4 digits."
            });

        }


        if (
            confirmMPin !== undefined &&
            String(confirmMPin) !== cleanMpin
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PINs do not match."
            });

        }


        const user =
            await User.findById(userId)
                .select("+mpinHash");


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        if (
            user.isBlocked === true ||
            user.isBanned === true
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked."
            });

        }


        user.mpinHash =
            await bcrypt.hash(
                cleanMpin,
                12
            );

        user.mpinSet =
            true;

        user.mpinFailedAttempts =
            0;

        user.mpinLockedUntil =
            null;

        user.mpinUpdatedAt =
            new Date();


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "4-digit M-PIN created successfully.",

            mpinSet:
                true

        });

    }

    catch (error) {

        console.error(
            "SET MPIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create M-PIN."
        });

    }

};


// ======================================================
// LOGIN WITH 4-DIGIT M-PIN
// ======================================================

exports.loginMPin = async (req, res) => {

    try {

        const {
            phone,
            mpin
        } = req.body;


        if (
            !phone ||
            !mpin
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number and M-PIN are required."
            });

        }


        const cleanPhone =
            cleanIndianPhone(phone);

        const cleanMpin =
            String(mpin).trim();


        if (
            !/^[6-9]\d{9}$/.test(cleanPhone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Indian mobile number."
            });

        }


        if (
            !/^\d{4}$/.test(cleanMpin)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN must contain exactly 4 digits."
            });

        }


        const user =
            await User.findOne({
                phone: cleanPhone
            }).select("+mpinHash");


        if (!user) {

            return res.status(401).json({
                success: false,
                message:
                    "Invalid mobile number or M-PIN."
            });

        }


        if (
            user.isBlocked === true ||
            user.isBanned === true
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Your account has been blocked."
            });

        }


        if (
            user.mpinSet !== true ||
            !user.mpinHash
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN is not set. Please create your M-PIN first."
            });

        }


        // ----------------------------------------------
        // LOCK CHECK
        // ----------------------------------------------

        if (
            user.mpinLockedUntil &&
            user.mpinLockedUntil > new Date()
        ) {

            const remaining =
                Math.ceil(
                    (
                        user.mpinLockedUntil -
                        Date.now()
                    ) / 60000
                );


            return res.status(429).json({

                success: false,

                message:
                    `M-PIN is locked. Try again in ${remaining} minute(s).`

            });

        }


        // ----------------------------------------------
        // VERIFY
        // ----------------------------------------------

        const match =
            await bcrypt.compare(
                cleanMpin,
                user.mpinHash
            );


        if (!match) {

            user.mpinFailedAttempts =
                Number(
                    user.mpinFailedAttempts || 0
                ) + 1;


            // 5 FAILED ATTEMPTS

            if (
                user.mpinFailedAttempts >= 5
            ) {

                user.mpinFailedAttempts =
                    0;

                user.mpinLockedUntil =
                    new Date(
                        Date.now() +
                        15 * 60 * 1000
                    );

                await user.save();


                return res.status(429).json({

                    success: false,

                    message:
                        "Too many incorrect attempts. M-PIN locked for 15 minutes."

                });

            }


            await user.save();


            return res.status(401).json({

                success: false,

                message:
                    "Incorrect M-PIN.",

                remainingAttempts:
                    5 -
                    user.mpinFailedAttempts

            });

        }


        // ----------------------------------------------
        // SUCCESS
        // ----------------------------------------------

        user.mpinFailedAttempts =
            0;

        user.mpinLockedUntil =
            null;

        await user.save();


        const token =
            createToken(user);


        return res.status(200).json({

            success: true,

            message:
                "M-PIN login successful.",

            token,

            isAdmin:
                user.isAdmin === true,

            user:
                getUserResponse(user)

        });

    }

    catch (error) {

        console.error(
            "LOGIN MPIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "M-PIN login failed."
        });

    }

};


// ======================================================
// CHANGE M-PIN
// ======================================================

exports.changeMPin = async (req, res) => {

    try {

        const {
            currentMPin,
            currentMpin,
            newMPin,
            newMpin,
            confirmMPin
        } = req.body;


        const userId =
            getUserId(req);


        if (!userId) {

            return res.status(401).json({
                success: false,
                message:
                    "Authentication required."
            });

        }


        const oldPin =
            currentMPin ||
            currentMpin;

        const nextPin =
            newMPin ||
            newMpin;


        if (
            !oldPin ||
            !nextPin
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Current and new M-PIN are required."
            });

        }


        const cleanOldPin =
            String(oldPin).trim();

        const cleanNewPin =
            String(nextPin).trim();


        if (
            !/^\d{4}$/.test(cleanOldPin) ||
            !/^\d{4}$/.test(cleanNewPin)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN must contain exactly 4 digits."
            });

        }


        if (
            confirmMPin !== undefined &&
            String(confirmMPin) !== cleanNewPin
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "New M-PINs do not match."
            });

        }


        const user =
            await User.findById(userId)
                .select("+mpinHash");


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        if (
            !user.mpinHash
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN is not set."
            });

        }


        const match =
            await bcrypt.compare(
                cleanOldPin,
                user.mpinHash
            );


        if (!match) {

            return res.status(401).json({
                success: false,
                message:
                    "Current M-PIN is incorrect."
            });

        }


        user.mpinHash =
            await bcrypt.hash(
                cleanNewPin,
                12
            );

        user.mpinSet =
            true;

        user.mpinFailedAttempts =
            0;

        user.mpinLockedUntil =
            null;

        user.mpinUpdatedAt =
            new Date();


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "M-PIN changed successfully."

        });

    }

    catch (error) {

        console.error(
            "CHANGE MPIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to change M-PIN."
        });

    }

};


// ======================================================
// RESET M-PIN
// Firebase SMS OTP is verified before this endpoint
//
// Firebase OTP = 6 digits
// New M-PIN = 4 digits
// ======================================================

exports.resetMPin = async (req, res) => {

    try {

        const {
            phone,
            mpin,
            newMPin
        } = req.body;


        if (!req.firebaseUser) {

            return res.status(401).json({
                success: false,
                message:
                    "Please verify your mobile number with OTP."
            });

        }


        const requestedPin =
            mpin || newMPin;


        if (
            !phone ||
            !requestedPin
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number and new M-PIN are required."
            });

        }


        const cleanPhone =
            cleanIndianPhone(phone);

        const cleanMpin =
            String(requestedPin).trim();


        if (
            !/^[6-9]\d{9}$/.test(cleanPhone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Indian mobile number."
            });

        }


        if (
            !/^\d{4}$/.test(cleanMpin)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "M-PIN must contain exactly 4 digits."
            });

        }


        // ----------------------------------------------
        // FIREBASE PHONE
        // ----------------------------------------------

        const firebasePhone =
            getFirebasePhone(req);


        if (!firebasePhone) {

            return res.status(401).json({
                success: false,
                message:
                    "Firebase verified phone number not found."
            });

        }


        const verifiedPhone =
            cleanIndianPhone(firebasePhone);


        if (
            verifiedPhone !== cleanPhone
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Verified mobile number does not match."
            });

        }


        // ----------------------------------------------
        // USER
        // ----------------------------------------------

        const user =
            await User.findOne({
                phone: cleanPhone
            });


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User account not found."
            });

        }


        // ----------------------------------------------
        // FIREBASE ACCOUNT BINDING
        // ----------------------------------------------

        if (
            user.firebaseUid &&
            user.firebaseUid !==
                req.firebaseUser.uid
        ) {

            return res.status(403).json({
                success: false,
                message:
                    "Firebase account does not match this user."
            });

        }


        user.firebaseUid =
            req.firebaseUser.uid;

        user.phoneVerified =
            true;

        user.phoneVerifiedAt =
            new Date();


        // ----------------------------------------------
        // NEW 4-DIGIT M-PIN
        // ----------------------------------------------

        user.mpinHash =
            await bcrypt.hash(
                cleanMpin,
                12
            );

        user.mpinSet =
            true;

        user.mpinFailedAttempts =
            0;

        user.mpinLockedUntil =
            null;

        user.mpinUpdatedAt =
            new Date();


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "M-PIN reset successfully.",

            mpinSet:
                true

        });

    }

    catch (error) {

        console.error(
            "RESET MPIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to reset M-PIN."
        });

    }

};


// ======================================================
// RESET PASSWORD
// Firebase SMS OTP verified before this endpoint
// ======================================================

exports.resetPassword = async (req, res) => {

    try {

        const {
            phone,
            password,
            newPassword
        } = req.body;


        const finalPassword =
            newPassword || password;


        if (!req.firebaseUser) {

            return res.status(401).json({
                success: false,
                message:
                    "Please verify your mobile number with SMS OTP."
            });

        }


        if (
            !phone ||
            !finalPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number and new password are required."
            });

        }


        const cleanPhone =
            cleanIndianPhone(phone);


        if (
            !/^[6-9]\d{9}$/.test(cleanPhone)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid Indian mobile number."
            });

        }


        const firebasePhone =
            getFirebasePhone(req);


        if (
            !firebasePhone ||
            cleanIndianPhone(firebasePhone) !==
                cleanPhone
        ) {

            return res.status(401).json({
                success: false,
                message:
                    "Verified mobile number does not match."
            });

        }


        const user =
            await User.findOne({
                phone: cleanPhone
            });


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User account not found."
            });

        }


        user.password =
            await bcrypt.hash(
                String(finalPassword),
                12
            );


        user.firebaseUid =
            req.firebaseUser.uid;

        user.phoneVerified =
            true;

        user.phoneVerifiedAt =
            new Date();


        await user.save();


        return res.status(200).json({

            success: true,

            message:
                "Password updated successfully."

        });

    }

    catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Password reset failed."
        });

    }

};


// ======================================================
// CHANGE PASSWORD
// ======================================================

exports.changePassword = async (req, res) => {

    try {

        const {
            oldPassword,
            newPassword
        } = req.body;


        if (
            !oldPassword ||
            !newPassword
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Both old and new passwords are required."
            });

        }


        const user =
            await User.findById(
                getUserId(req)
            ).select("+password");


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        const isMatch =
            await bcrypt.compare(
                oldPassword,
                user.password
            );


        if (!isMatch) {

            return res.status(400).json({
                success: false,
                message:
                    "Old password is incorrect."
            });

        }


        user.password =
            await bcrypt.hash(
                newPassword,
                12
            );


        await user.save();


        return res.json({
            success: true,
            message:
                "Password updated successfully."
        });

    }

    catch (error) {

        console.error(
            "CHANGE PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// MAKE ADMIN
// PHONE ONLY — NO EMAIL
// ======================================================

exports.makeAdmin = async (req, res) => {

    try {

        const {
            phone
        } = req.body;


        if (!phone) {

            return res.status(400).json({
                success: false,
                message:
                    "Phone number is required."
            });

        }


        const cleanPhone =
            cleanIndianPhone(phone);


        const user =
            await User.findOne({
                phone: cleanPhone
            });


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        if (
            user.isAdmin === true
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "User is already an admin."
            });

        }


        user.isAdmin =
            true;

        user.role =
            "admin";


        await user.save();


        return res.json({

            success: true,

            message:
                `${cleanPhone} is now an admin.`

        });

    }

    catch (error) {

        console.error(
            "MAKE ADMIN ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET ALL USERS
// NEVER RETURN PASSWORD / MPIN HASH
// ======================================================

exports.getAllUsers = async (req, res) => {

    try {

        const users =
            await User.find()
                .select(
                    "-password -mpinHash"
                )
                .sort({
                    createdAt: -1
                });


        return res.json({

            success: true,

            total:
                users.length,

            users

        });

    }

    catch (error) {

        console.error(
            "GET ALL USERS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// BAN USER
// ======================================================

exports.banUser = async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        user.isBanned =
            true;

        user.isBlocked =
            true;


        await user.save();


        return res.json({
            success: true,
            message:
                `${user.name} has been banned.`
        });

    }

    catch (error) {

        console.error(
            "BAN USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// UNBAN USER
// ======================================================

exports.unbanUser = async (req, res) => {

    try {

        const {
            userId
        } = req.params;


        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        user.isBanned =
            false;

        user.isBlocked =
            false;


        await user.save();


        return res.json({
            success: true,
            message:
                `${user.name} has been unbanned.`
        });

    }

    catch (error) {

        console.error(
            "UNBAN USER ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// RESET USER PASSWORD — ADMIN
// ======================================================

exports.resetUserPassword = async (req, res) => {

    try {

        const {
            userId
        } = req.params;

        const {
            newPassword
        } = req.body;


        if (!newPassword) {

            return res.status(400).json({
                success: false,
                message:
                    "New password required."
            });

        }


        const user =
            await User.findById(userId);


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        user.password =
            await bcrypt.hash(
                newPassword,
                12
            );


        await user.save();


        return res.json({
            success: true,
            message:
                `${user.name}'s password has been reset.`
        });

    }

    catch (error) {

        console.error(
            "RESET USER PASSWORD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET PROFILE
// NO EMAIL
// ======================================================

exports.getProfile = async (req, res) => {

    try {

        const user =
            await User.findById(
                getUserId(req)
            ).select(
                "-password -mpinHash"
            );


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        const BASE_URL =
            process.env.BASE_URL ||
            "https://tirupati-matka.onrender.com/";


        return res.json({

            success: true,

            user: {

                id:
                    user._id,

                name:
                    user.name || "Player",

                phone:
                    user.phone,

                avatar:
                    user.avatar || null,

                avatarUrl:
                    user.avatar
                        ? `${BASE_URL}/uploads/avatars/${user.avatar}`
                        : null,

                isAdmin:
                    user.isAdmin === true,

                mpinSet:
                    user.mpinSet === true

            },

            dashboard:
                user.isAdmin
                    ? "Admin Area"
                    : "User Area"

        });

    }

    catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET BALANCE
// ======================================================

exports.getBalance = async (req, res) => {

    try {

        let wallet =
            await Wallet.findOne({
                userId:
                    getUserId(req)
            });


        if (!wallet) {

            wallet =
                await Wallet.create({

                    userId:
                        getUserId(req),

                    balance:
                        0

                });

        }


        return res.json({

            success: true,

            balance:
                Number(wallet.balance || 0)

        });

    }

    catch (error) {

        console.error(
            "GET BALANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// UPDATE CONTACT
// NO EMAIL
// ======================================================

exports.updateContact = async (req, res) => {

    try {

        const {
            name,
            phone
        } = req.body;


        const user =
            await User.findById(
                getUserId(req)
            );


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        if (name) {

            user.name =
                String(name).trim();

        }


        // Phone changes should ideally require
        // Firebase OTP verification.
        //
        // Therefore we do NOT silently change
        // the phone here.

        if (
            phone &&
            cleanIndianPhone(phone) !==
                user.phone
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Mobile number changes require SMS OTP verification."
            });

        }


        await user.save();


        return res.json({

            success: true,

            message:
                "Contact information updated.",

            user:
                getUserResponse(user)

        });

    }

    catch (error) {

        console.error(
            "UPDATE CONTACT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// HELP / CONTACT
// ======================================================

exports.getHelp = async (req, res) => {

    try {

        const helpData = {

            supportEmail:
                "support@battlepurse.com",

            faqLink:
                "https://battlepurse.com/faq",

            contactNumber:
                "+91 8955099474"

        };


        return res.json({

            success: true,

            help:
                helpData

        });

    }

    catch (error) {

        console.error(
            "GET HELP ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// LOGOUT
// ======================================================

exports.logout = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Logged out successfully."

        });

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// UPLOAD AVATAR
// ======================================================

exports.uploadUserAvatar = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message:
                    "No file uploaded."
            });

        }


        await User.updateOne(

            {
                _id:
                    getUserId(req)
            },

            {
                $set: {
                    avatar:
                        req.file.filename
                }
            }

        );


        const avatarUrl =
            `${
                process.env.BASE_URL ||
                "https://tirupati-matka.onrender.com/"
            }/uploads/avatars/${
                req.file.filename
            }`;


        return res.json({

            success: true,

            message:
                "Avatar uploaded successfully.",

            avatar:
                req.file.filename,

            avatarUrl

        });

    }

    catch (error) {

        console.error(
            "AVATAR UPLOAD ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// UPDATE PROFILE
// ======================================================

exports.updateProfile = async (req, res) => {

    try {

        const {
            name,
            freeFire,
            bgmi,
            candy,
            carrom,
            ludo,
            eightBall
        } = req.body;


        const update = {};


        if (name) {

            update.name =
                String(name).trim();

        }


        update.uids = {

            freeFire,
            bgmi,
            candy,
            carrom,
            ludo,
            eightBall

        };


        const user =
            await User.findByIdAndUpdate(

                getUserId(req),

                update,

                {
                    new: true
                }

            );


        return res.json({

            success: true,

            message:
                "Profile updated successfully.",

            user

        });

    }

    catch (error) {

        console.error(
            "PROFILE UPDATE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// HIDE SINGLE DEPOSIT
// ======================================================

exports.hideSingleDepositAdminView = async (req, res) => {

    try {

        const {
            userId,
            txnId
        } = req.body;


        if (
            !userId ||
            !txnId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "userId and txnId required."
            });

        }


        const wallet =
            await Wallet.findOne({
                userId
            });


        if (!wallet) {

            return res.status(404).json({
                success: false,
                message:
                    "Wallet not found."
            });

        }


        const txn =
            wallet.transactions.id(txnId);


        if (
            !txn ||
            txn.type !== "deposit"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Deposit not found."
            });

        }


        txn.adminHidden =
            true;


        await wallet.save();


        return res.json({
            success: true,
            message:
                "Deposit hidden from admin view."
        });

    }

    catch (error) {

        console.error(
            "HIDE DEPOSIT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// HIDE ALL DEPOSITS
// ======================================================

exports.hideAllDepositsAdminView = async (req, res) => {

    try {

        const wallets =
            await Wallet.find();


        for (
            const wallet of wallets
        ) {

            wallet.transactions.forEach(
                txn => {

                    if (
                        txn.type ===
                        "deposit"
                    ) {

                        txn.adminHidden =
                            true;

                    }

                }
            );


            await wallet.save();

        }


        return res.json({
            success: true,
            message:
                "All deposits hidden from admin view."
        });

    }

    catch (error) {

        console.error(
            "HIDE ALL DEPOSITS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// DELETE SINGLE DEPOSIT
// ======================================================

exports.deleteSingleDeposit = async (req, res) => {

    try {

        const {
            id
        } = req.params;


        const wallets =
            await Wallet.find();


        let found =
            false;


        for (
            const wallet of wallets
        ) {

            const txn =
                wallet.transactions.id(id);


            if (
                txn &&
                txn.type ===
                    "deposit"
            ) {

                txn.deleteOne();

                await wallet.save();

                found =
                    true;

                break;

            }

        }


        if (!found) {

            return res.status(404).json({
                success: false,
                message:
                    "Deposit not found."
            });

        }


        return res.json({
            success: true,
            message:
                "Deposit deleted successfully."
        });

    }

    catch (error) {

        console.error(
            "DELETE DEPOSIT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// DELETE ALL DEPOSITS
// ======================================================

exports.deleteAllDeposits = async (req, res) => {

    try {

        const wallets =
            await Wallet.find();


        for (
            const wallet of wallets
        ) {

            wallet.transactions =
                wallet.transactions.filter(
                    txn =>
                        txn.type !==
                        "deposit"
                );


            await wallet.save();

        }


        return res.json({
            success: true,
            message:
                "All deposits deleted successfully."
        });

    }

    catch (error) {

        console.error(
            "DELETE ALL DEPOSITS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// DEPOSIT REQUEST
// ======================================================

exports.depositRequest = async (req, res) => {

    try {

        const {
            amount,
            utr
        } = req.body;


        if (
            !amount ||
            Number(amount) <= 0 ||
            !utr
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Amount and UTR required."
            });

        }


        let wallet =
            await Wallet.findOne({
                userId:
                    getUserId(req)
            });


        if (!wallet) {

            wallet =
                await Wallet.create({

                    userId:
                        getUserId(req),

                    balance:
                        0

                });

        }


        const exists =
            wallet.transactions.find(
                t =>
                    t.utr ===
                    String(utr).trim()
            );


        if (exists) {

            return res.status(400).json({
                success: false,
                message:
                    "UTR already used."
            });

        }


        let screenshot =
            null;


        if (req.file) {

            screenshot =
                `/uploads/screenshots/${req.file.filename}`;

        }


        wallet.transactions.push({

            type:
                "deposit",

            amount:
                Number(amount),

            utr:
                String(utr).trim(),

            screenshot,

            status:
                "pending"

        });


        await wallet.save();


        return res.json({

            success: true,

            message:
                "Deposit request submitted, waiting for admin approval."

        });

    }

    catch (error) {

        console.error(
            "DEPOSIT REQUEST ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// ADMIN APPROVE / REJECT DEPOSIT
// ======================================================

exports.adminApproveDeposit = async (req, res) => {

    try {

        let {
            userId,
            txnId,
            approve
        } = req.body;


        if (
            !userId ||
            !txnId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "userId and txnId required."
            });

        }


        approve =
            approve === true ||
            approve === "true";


        const wallet =
            await Wallet.findOne({
                userId
            });


        if (!wallet) {

            return res.status(404).json({
                success: false,
                message:
                    "Wallet not found."
            });

        }


        const txn =
            wallet.transactions.id(txnId);


        if (!txn) {

            return res.status(404).json({
                success: false,
                message:
                    "Transaction not found."
            });

        }


        if (
            txn.status !==
            "pending"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Transaction already processed."
            });

        }


        if (approve) {

            txn.status =
                "approved";

            wallet.balance +=
                Number(txn.amount);

        }

        else {

            txn.status =
                "rejected";

        }


        await wallet.save();


        return res.json({

            success: true,

            balance:
                wallet.balance,

            txnId:
                txn._id,

            status:
                txn.status

        });

    }

    catch (error) {

        console.error(
            "ADMIN APPROVE DEPOSIT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET ALL DEPOSITS
// ======================================================

exports.getAllDeposits = async (req, res) => {

    try {

        const wallets =
            await Wallet.find()
                .populate(
                    "userId",
                    "name phone"
                );


        const deposits =
            [];


        wallets.forEach(
            wallet => {

                wallet.transactions.forEach(
                    txn => {

                        if (
                            txn.type ===
                            "deposit"
                        ) {

                            deposits.push({

                                txnId:
                                    txn._id,

                                user:
                                    wallet.userId,

                                amount:
                                    txn.amount,

                                utr:
                                    txn.utr,

                                status:
                                    txn.status,

                                screenshot:
                                    txn.screenshot
                                        ? `${req.protocol}://${req.get("host")}${txn.screenshot}`
                                        : null,

                                date:
                                    txn.createdAt

                            });

                        }

                    }
                );

            }
        );


        deposits.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


        return res.json({

            success: true,

            total:
                deposits.length,

            deposits

        });

    }

    catch (error) {

        console.error(
            "GET ALL DEPOSITS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// REQUEST WITHDRAWAL
// ======================================================

exports.requestWithdrawal = async (req, res) => {

    try {

        const {
            amount,
            method,
            upiId,
            name,
            account,
            ifsc
        } = req.body;


        if (
            !amount ||
            Number(amount) <= 0
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid amount."
            });

        }


        if (
            ![
                "bank",
                "upi",
                "qr"
            ].includes(method)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid withdrawal method."
            });

        }


        if (
            method === "bank" &&
            (!name ||
             !account ||
             !ifsc)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Complete bank details required."
            });

        }


        if (
            method === "upi" &&
            !upiId
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "UPI ID required."
            });

        }


        if (
            method === "qr" &&
            !req.file
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "QR screenshot is required."
            });

        }


        const wallet =
            await Wallet.findOne({
                userId:
                    getUserId(req)
            });


        if (!wallet) {

            return res.status(404).json({
                success: false,
                message:
                    "Wallet not found."
            });

        }


        if (
            Number(wallet.balance) <
            Number(amount)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Insufficient balance."
            });

        }


        const withdrawalTxn = {

            type:
                "withdraw",

            amount:
                Number(amount),

            method,

            bankDetails:
                method === "bank"
                    ? {
                        name,
                        account,
                        ifsc
                    }
                    : null,

            upiId:
                method === "upi"
                    ? upiId
                    : null,

            screenshot:
                method === "qr"
                    ? req.file.filename
                    : null,

            status:
                "pending",

            createdAt:
                new Date()

        };


        wallet.balance -=
            Number(amount);


        wallet.transactions.push(
            withdrawalTxn
        );


        await wallet.save();


        return res.json({

            success: true,

            message:
                "Withdrawal request submitted."

        });

    }

    catch (error) {

        console.error(
            "REQUEST WITHDRAWAL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET PENDING WITHDRAWALS
// ======================================================

exports.getPendingWithdrawals = async (req, res) => {

    try {

        const wallets =
            await Wallet.find({
                "transactions.type":
                    "withdraw",

                "transactions.status":
                    "pending"

            }).populate(
                "userId",
                "name phone"
            );


        const baseUrl =
            `${req.protocol}://${req.get("host")}`;


        const pending =
            [];


        wallets.forEach(
            wallet => {

                if (!wallet.userId)
                    return;


                wallet.transactions.forEach(
                    txn => {

                        if (
                            txn.type ===
                            "withdraw" &&
                            txn.status ===
                            "pending"
                        ) {

                            pending.push({

                                transactionId:
                                    txn._id,

                                userId:
                                    wallet.userId._id,

                                user:
                                    wallet.userId,

                                amount:
                                    txn.amount,

                                method:
                                    txn.method,

                                bank:
                                    txn.bankDetails ||
                                    null,

                                upiId:
                                    txn.upiId ||
                                    null,

                                screenshot:
                                    txn.screenshot
                                        ? `${baseUrl}/uploads/qr/${txn.screenshot}`
                                        : null,

                                status:
                                    txn.status,

                                createdAt:
                                    txn.createdAt

                            });

                        }

                    }
                );

            }
        );


        return res.json({

            success: true,

            total:
                pending.length,

            pending

        });

    }

    catch (error) {

        console.error(
            "GET PENDING WITHDRAWALS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// HANDLE WITHDRAWAL
// ======================================================

exports.handleWithdrawal = async (req, res) => {

    try {

        const {
            userId,
            transactionId,
            action
        } = req.body;


        if (
            ![
                "approve",
                "reject"
            ].includes(action)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Invalid action."
            });

        }


        const wallet =
            await Wallet.findOne({
                userId
            });


        if (!wallet) {

            return res.status(404).json({
                success: false,
                message:
                    "Wallet not found."
            });

        }


        const txn =
            wallet.transactions.id(
                transactionId
            );


        if (
            !txn ||
            txn.type !==
                "withdraw"
        ) {

            return res.status(404).json({
                success: false,
                message:
                    "Transaction not found."
            });

        }


        if (
            txn.status !==
            "pending"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Already processed."
            });

        }


        if (
            action ===
            "approve"
        ) {

            txn.status =
                "approved";

        }


        if (
            action ===
            "reject"
        ) {

            txn.status =
                "rejected";

            wallet.balance +=
                Number(txn.amount);

        }


        await wallet.save();


        return res.json({

            success: true,

            message:
                `Withdrawal ${action}ed successfully.`,

            balance:
                wallet.balance

        });

    }

    catch (error) {

        console.error(
            "HANDLE WITHDRAWAL ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// ADMIN USERS + BALANCES
// ======================================================

exports.getAllUsersWallet = async (req, res) => {

    try {

        const users =
            await User.find()
                .select(
                    "name phone isAdmin"
                );


        const wallets =
            await Wallet.find();


        const data =
            users.map(
                user => {

                    const wallet =
                        wallets.find(
                            w =>
                                w.userId
                                    .toString() ===
                                user._id.toString()
                        );


                    return {

                        id:
                            user._id,

                        name:
                            user.name,

                        phone:
                            user.phone,

                        isAdmin:
                            user.isAdmin,

                        balance:
                            wallet
                                ? wallet.balance
                                : 0

                    };

                }
            );


        return res.json({

            success: true,

            users:
                data

        });

    }

    catch (error) {

        console.error(
            "GET ALL USERS WALLET ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// ADMIN UPDATE BALANCE
// ======================================================

exports.adminUpdateBalance = async (req, res) => {

    try {

        const {
            userId
        } = req.params;

        const {
            amount
        } = req.body;


        if (
            amount === undefined ||
            isNaN(amount)
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "Valid amount is required."
            });

        }


        let wallet =
            await Wallet.findOne({
                userId
            });


        if (!wallet) {

            wallet =
                await Wallet.create({

                    userId,

                    balance:
                        0

                });

        }


        const numericAmount =
            Number(amount);


        wallet.transactions.push({

            type:
                "admin_update",

            amount:
                numericAmount,

            status:
                "approved"

        });


        wallet.balance +=
            numericAmount;


        if (
            wallet.balance < 0
        ) {

            wallet.balance =
                0;

        }


        await wallet.save();


        return res.json({

            success: true,

            message:
                `Wallet updated successfully. New balance: ${wallet.balance}`,

            balance:
                wallet.balance

        });

    }

    catch (error) {

        console.error(
            "ADMIN UPDATE BALANCE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// ADMIN PAYMENT CONFIG
// ======================================================

exports.adminUpdatePayment = async (req, res) => {

    try {

        const {
            upiId
        } = req.body;


        if (!upiId) {

            return res.status(400).json({
                success: false,
                message:
                    "UPI ID required."
            });

        }


        let qrImage =
            null;


        if (req.file) {

            qrImage =
                req.file.filename;

        }


        let config =
            await PaymentConfig.findOne();


        if (!config) {

            config =
                await PaymentConfig.create({

                    upiId,

                    qrImage,

                    updatedBy:
                        getUserId(req)

                });

        }

        else {

            config.upiId =
                upiId;


            if (qrImage) {

                config.qrImage =
                    qrImage;

            }


            config.updatedBy =
                getUserId(req);


            await config.save();

        }


        return res.json({

            success: true,

            message:
                "Payment config updated.",

            config

        });

    }

    catch (error) {

        console.error(
            "ADMIN UPDATE PAYMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET PAYMENT DETAILS
// ======================================================

exports.getPaymentDetails = async (req, res) => {

    try {

        const config =
            await PaymentConfig.findOne();


        if (!config) {

            return res.status(404).json({
                success: false,
                message:
                    "Payment info not set."
            });

        }


        const baseUrl =
            `${req.protocol}://${req.get("host")}`;


        return res.json({

            success: true,

            upiId:
                config.upiId,

            qrImage:
                config.qrImage
                    ? `${baseUrl}/uploads/qr/${config.qrImage}`
                    : null

        });

    }

    catch (error) {

        console.error(
            "GET PAYMENT DETAILS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// USER TRANSACTIONS
// ======================================================

exports.getUserTransactions = async (req, res) => {

    try {

        const wallet =
            await Wallet.findOne({
                userId:
                    getUserId(req)
            }).lean();


        if (!wallet) {

            return res.json({
                success: true,
                transactions: []
            });

        }


        const transactions =
            [
                ...(wallet.transactions || [])
            ].sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );


        return res.json({

            success: true,

            transactions

        });

    }

    catch (error) {

        console.error(
            "GET USER TRANSACTIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// MY TRANSACTIONS
// ======================================================

exports.getMyTransactions = async (req, res) => {

    try {

        const wallet =
            await Wallet.findOne(
                {
                    userId:
                        getUserId(req)
                },
                {
                    balance: 1,
                    transactions: 1
                }
            ).lean();


        if (!wallet) {

            return res.json({

                success: true,

                balance: 0,

                transactions: []

            });

        }


        const transactions =
            [
                ...(wallet.transactions || [])
            ]
            .sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            )
            .map(tx => {

                let displayAmount =
                    tx.amount;

                let typeLabel =
                    "Transaction";


                if (
                    tx.type ===
                    "deposit"
                ) {

                    displayAmount =
                        `+₹${tx.amount}`;

                    typeLabel =
                        "Deposit";

                }

                else if (
                    tx.type ===
                    "withdraw" ||
                    tx.type ===
                    "withdrawal"
                ) {

                    displayAmount =
                        `-₹${tx.amount}`;

                    typeLabel =
                        "Withdrawal";

                }

                else if (
                    tx.type ===
                    "bet"
                ) {

                    displayAmount =
                        `-₹${tx.amount}`;

                    typeLabel =
                        "Bet Placed";

                }

                else if (
                    tx.type ===
                    "win"
                ) {

                    displayAmount =
                        `+₹${tx.amount}`;

                    typeLabel =
                        "Winning";

                }


                return {

                    ...tx,

                    displayAmount,

                    typeLabel

                };

            });


        return res.json({

            success: true,

            balance:
                wallet.balance,

            total:
                transactions.length,

            transactions

        });

    }

    catch (error) {

        console.error(
            "GET MY TRANSACTIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// ADMIN ALL TRANSACTIONS
// ======================================================

exports.getAllTransactions = async (req, res) => {

    try {

        const wallets =
            await Wallet.find()
                .populate(
                    "userId",
                    "name phone"
                )
                .sort({
                    updatedAt: -1
                });


        const baseUrl =
            `${req.protocol}://${req.get("host")}`;


        const transactions =
            [];


        wallets.forEach(
            wallet => {

                if (!wallet.userId)
                    return;


                wallet.transactions.forEach(
                    txn => {

                        transactions.push({

                            transactionId:
                                txn._id,

                            user: {

                                id:
                                    wallet.userId._id,

                                name:
                                    wallet.userId.name,

                                phone:
                                    wallet.userId.phone

                            },

                            type:
                                txn.type,

                            amount:
                                txn.amount,

                            status:
                                txn.status,

                            method:
                                txn.method ||
                                null,

                            utr:
                                txn.utr ||
                                null,

                            screenshot:
                                txn.screenshot
                                    ? `${baseUrl}/uploads/qr/${txn.screenshot}`
                                    : null,

                            createdAt:
                                txn.createdAt

                        });

                    }
                );

            }
        );


        transactions.sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );


        return res.json({

            success: true,

            total:
                transactions.length,

            transactions

        });

    }

    catch (error) {

        console.error(
            "GET ALL TRANSACTIONS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// GET ME
// NO EMAIL
// ======================================================

exports.getMe = async (req, res) => {

    try {

        const user =
            await User.findById(
                getUserId(req)
            ).select(
                "name phone wallet referralCode mpinSet"
            );


        if (!user) {

            return res.status(404).json({
                success: false,
                message:
                    "User not found."
            });

        }


        return res.json({

            success: true,

            user: {

                name:
                    user.name,

                phone:
                    user.phone,

                wallet:
                    Number(
                        user.wallet || 0
                    ),

                referralCode:
                    user.referralCode ||
                    "----",

                mpinSet:
                    user.mpinSet === true

            }

        });

    }

    catch (error) {

        console.error(
            "GET ME ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// MY REFERRALS
// ======================================================

exports.getMyReferrals = async (req, res) => {

    try {

        const myUserId =
            getUserId(req);


        const referrals =
            await User.find({
                referredBy:
                    myUserId
            })
            .select(
                "name phone createdAt"
            )
            .sort({
                createdAt: -1
            });


        return res.json({

            success: true,

            totalReferrals:
                referrals.length,

            totalEarning:
                referrals.length * 50,

            referrals

        });

    }

    catch (error) {

        console.error(
            "GET MY REFERRALS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};


// ======================================================
// REFERRAL REDIRECT
// ======================================================

exports.referralRedirect = (req, res) => {

    try {

        const code =
            String(
                req.params.code || ""
            ).toUpperCase();


        if (
            !/^[A-Z0-9]+$/.test(code)
        ) {

            return res
                .status(404)
                .send(
                    "Invalid referral code"
                );

        }


        console.log(
            "Referral code:",
            code
        );


        const filePath =
            path.join(
                __dirname,
                "../../frontend/public/auth.html"
            );


        res.sendFile(
            filePath,
            error => {

                if (error) {

                    console.error(
                        "Error sending auth.html:",
                        error
                    );

                    if (!res.headersSent) {

                        res
                            .status(404)
                            .send(
                                "Page not found"
                            );

                    }

                }

            }
        );

    }

    catch (error) {

        console.error(
            "REFERRAL REDIRECT ERROR:",
            error
        );

        return res
            .status(500)
            .send(
                "Server error"
            );

    }

};


// ======================================================
// LOGOUT
// ======================================================

exports.logout = async (req, res) => {

    try {

        return res.json({

            success: true,

            message:
                "Logged out successfully."

        });

    }

    catch (error) {

        console.error(
            "LOGOUT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Server error."
        });

    }

};