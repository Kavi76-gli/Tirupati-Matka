// ============================================================
// AUTHH.JS
// Authentication Controller
// Login + Register + Firebase OTP + Forgot Password + MPIN
// ============================================================

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";

import {
    getAuth,
    RecaptchaVerifier,
    signInWithPhoneNumber
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";


// ============================================================
// FIREBASE CONFIG
// ============================================================


const firebaseConfig = {
  apiKey: "AIzaSyBV4g_qG7ZnYopMt8UcznQojJnByVzynhQ",
  authDomain: "televault-ead03.firebaseapp.com",
  projectId: "televault-ead03",
  storageBucket: "televault-ead03.firebasestorage.app",
  messagingSenderId: "292306570636",
  appId: "1:292306570636:web:b1c30466a050304e6ddaa9",
  measurementId: "G-973KB6EJCB"
};



// ============================================================
// INITIALIZE FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);


// ============================================================
// API CONFIG
// ============================================================

// LOCAL DEVELOPMENT
const API_BASE = "http://localhost:5000/api";

// If using Render, change to:
// const API_BASE = "https://kalyanmaster.onrender.com/api";


const AUTH_API = `${API_BASE}/auth`;


// ============================================================
// ELEMENTS
// ============================================================

const loginPhone = document.getElementById("loginPhone");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");

const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const passwordInput = document.getElementById("password");
const mpinInput = document.getElementById("mpin");
const referralInput = document.getElementById("referral");

const sendOtpBtn = document.getElementById("sendOtpBtn");

const otpInput = document.getElementById("otp");
const verifyBtn = document.getElementById("verifyBtn");

const forgotPhone = document.getElementById("forgotPhone");
const forgotBtn = document.getElementById("forgotBtn");

const newPassword = document.getElementById("newPassword");
const resetBtn = document.getElementById("resetBtn");

const forgotMpinPhone = document.getElementById("forgotMpinPhone");
const newMpin = document.getElementById("newMpin");
const resetMpinBtn = document.getElementById("resetMpinBtn");


// ============================================================
// GLOBAL AUTH STATE
// ============================================================

let confirmationResult = null;

let authMode = "";

let pendingRegisterData = null;

let pendingForgotPhone = "";


// ============================================================
// TOKEN HELPER
// ============================================================

function saveAuth(token, user = null) {

    if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("ki_token", token);
    }

    if (user) {
        localStorage.setItem("user", JSON.stringify(user));
    }
}


// ============================================================
// PHONE FORMAT
// ============================================================

function normalizePhone(phone) {

    phone = String(phone || "").trim();

    // Remove spaces, -, brackets
    phone = phone.replace(/[\s\-()]/g, "");

    // +91XXXXXXXXXX
    if (phone.startsWith("+91")) {
        return phone;
    }

    // 91XXXXXXXXXX
    if (phone.startsWith("91") && phone.length === 12) {
        return "+" + phone;
    }

    // XXXXXXXXXX
    if (/^[6-9]\d{9}$/.test(phone)) {
        return "+91" + phone;
    }

    return null;
}


// ============================================================
// VALIDATE PHONE
// ============================================================

function validatePhone(phone) {

    const formatted = normalizePhone(phone);

    if (!formatted) {
        showMessage(
            "Please enter a valid 10-digit Indian mobile number.",
            "error"
        );

        return null;
    }

    return formatted;
}


// ============================================================
// VALIDATE PASSWORD
// ============================================================

function validatePassword(password) {

    if (!password || password.length < 6) {

        showMessage(
            "Password must be at least 6 characters.",
            "error"
        );

        return false;
    }

    return true;
}


// ============================================================
// VALIDATE MPIN
// ============================================================

function validateMpin(mpin) {

    if (!/^\d{4,6}$/.test(String(mpin || ""))) {

        showMessage(
            "MPIN must contain 4 to 6 digits.",
            "error"
        );

        return false;
    }

    return true;
}


// ============================================================
// MESSAGE SYSTEM
// ============================================================

function showMessage(message, type = "success") {

    let box = document.getElementById("authMessage");

    if (!box) {

        box = document.createElement("div");

        box.id = "authMessage";

        box.style.position = "fixed";
        box.style.top = "20px";
        box.style.left = "50%";
        box.style.transform = "translateX(-50%)";
        box.style.width = "90%";
        box.style.maxWidth = "400px";
        box.style.padding = "14px 18px";
        box.style.borderRadius = "12px";
        box.style.zIndex = "99999";
        box.style.fontSize = "14px";
        box.style.fontWeight = "600";
        box.style.textAlign = "center";
        box.style.boxShadow = "0 10px 30px rgba(0,0,0,.15)";

        document.body.appendChild(box);
    }

    box.innerText = message;

    if (type === "error") {

        box.style.background = "#ffe8e8";
        box.style.color = "#c62828";
        box.style.border = "1px solid #ffbdbd";

    } else {

        box.style.background = "#e8fff4";
        box.style.color = "#00875a";
        box.style.border = "1px solid #9de8c5";
    }

    box.style.display = "block";

    clearTimeout(box.timer);

    box.timer = setTimeout(() => {
        box.style.display = "none";
    }, 3500);
}


// ============================================================
// BUTTON LOADING
// ============================================================

function buttonLoading(button, loading, normalText) {

    if (!button) return;

    if (loading) {

        button.disabled = true;
        button.dataset.oldText = button.innerText;
        button.innerText = "Please wait...";

    } else {

        button.disabled = false;
        button.innerText =
            normalText ||
            button.dataset.oldText ||
            "Continue";
    }
}


// ============================================================
// FIREBASE RECAPTCHA
// ============================================================

let recaptchaVerifier = null;


function setupRecaptcha() {

    try {

        if (recaptchaVerifier) {
            recaptchaVerifier.clear();
            recaptchaVerifier = null;
        }

        recaptchaVerifier = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
                size: "invisible",

                callback: () => {
                    console.log("reCAPTCHA verified");
                },

                "expired-callback": () => {
                    console.log("reCAPTCHA expired");
                }
            }
        );

        return recaptchaVerifier;

    } catch (error) {

        console.error("RECAPTCHA ERROR:", error);

        showMessage(
            "Unable to initialize OTP verification.",
            "error"
        );

        return null;
    }
}


// ============================================================
// SEND FIREBASE OTP
// ============================================================

async function sendFirebaseOTP(phone, mode) {

    try {

        const formattedPhone = validatePhone(phone);

        if (!formattedPhone) {
            return false;
        }

        authMode = mode;

        const verifier = setupRecaptcha();

        if (!verifier) {
            return false;
        }

        console.log("Sending OTP to:", formattedPhone);

        confirmationResult =
            await signInWithPhoneNumber(
                auth,
                formattedPhone,
                verifier
            );

        showMessage(
            "OTP sent successfully to " + formattedPhone,
            "success"
        );

        return true;

    } catch (error) {

        console.error("FIREBASE OTP ERROR:", error);

        if (recaptchaVerifier) {

            try {
                recaptchaVerifier.clear();
            } catch (e) {}

            recaptchaVerifier = null;
        }

        let message = "Unable to send OTP.";

        if (error.code === "auth/invalid-phone-number") {
            message = "Invalid phone number.";
        }

        if (error.code === "auth/too-many-requests") {
            message =
                "Too many OTP requests. Please try again later.";
        }

        if (error.code === "auth/quota-exceeded") {
            message =
                "OTP service limit reached. Please try again later.";
        }

        if (error.code === "auth/operation-not-allowed") {
            message =
                "Phone authentication is not enabled in Firebase.";
        }

        showMessage(message, "error");

        return false;
    }
}


// ============================================================
// VERIFY FIREBASE OTP
// ============================================================

async function verifyFirebaseOTP(otp) {

    if (!confirmationResult) {

        showMessage(
            "Please request OTP first.",
            "error"
        );

        return null;
    }

    otp = String(otp || "").trim();

    if (!/^\d{6}$/.test(otp)) {

        showMessage(
            "Please enter the 6-digit OTP.",
            "error"
        );

        return null;
    }

    try {

        const result =
            await confirmationResult.confirm(otp);

        console.log(
            "Firebase OTP verified:",
            result.user.phoneNumber
        );

        return result.user;

    } catch (error) {

        console.error("OTP VERIFY ERROR:", error);

        let message = "Invalid OTP.";

        if (error.code === "auth/invalid-verification-code") {
            message = "Incorrect OTP.";
        }

        if (error.code === "auth/code-expired") {
            message =
                "OTP expired. Please request a new OTP.";
        }

        showMessage(message, "error");

        return null;
    }
}


// ============================================================
// LOGIN
// ============================================================

async function login() {

    const phone = validatePhone(loginPhone?.value);

    if (!phone) {
        return;
    }

    const password =
        loginPassword?.value?.trim() || "";

    if (!validatePassword(password)) {
        return;
    }

    buttonLoading(loginBtn, true);

    try {

        const response = await fetch(
            `${AUTH_API}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    phone,
                    password
                })
            }
        );

        const data = await response.json();

        console.log("LOGIN RESPONSE:", data);

        if (!response.ok || data.success === false) {

            throw new Error(
                data.msg ||
                data.message ||
                "Invalid phone or password."
            );
        }

        const token =
            data.token ||
            data.accessToken ||
            data.jwt;

        if (!token) {

            throw new Error(
                "Login successful but token was not received."
            );
        }

        const user =
            data.user ||
            data.data ||
            null;

        saveAuth(token, user);

        showMessage(
            "Login successful.",
            "success"
        );

        setTimeout(() => {

            window.location.href = "mpin.html";

        }, 700);

    } catch (error) {

        console.error("LOGIN ERROR:", error);

        showMessage(
            error.message ||
            "Login failed.",
            "error"
        );

    } finally {

        buttonLoading(
            loginBtn,
            false,
            "Sign In"
        );
    }
}


// ============================================================
// REGISTER - SEND OTP
// ============================================================

async function sendRegisterOTP() {

    const name =
        nameInput?.value?.trim() || "";

    const phone =
        validatePhone(phoneInput?.value);

    const password =
        passwordInput?.value?.trim() || "";

    const mpin =
        mpinInput?.value?.trim() || "";

    const referral =
        referralInput?.value?.trim() || "";


    if (!name) {

        showMessage(
            "Please enter your full name.",
            "error"
        );

        return;
    }

    if (!phone) {
        return;
    }

    if (!validatePassword(password)) {
        return;
    }

    if (!validateMpin(mpin)) {
        return;
    }


    // Save registration data
    pendingRegisterData = {

        name,
        phone,
        password,
        mpin,
        referral
    };


    buttonLoading(sendOtpBtn, true);

    const success =
        await sendFirebaseOTP(
            phone,
            "register"
        );

    if (success) {

        showPage("otpPage");

        showMessage(
            "OTP sent. Please verify your mobile number.",
            "success"
        );
    }

    buttonLoading(
        sendOtpBtn,
        false,
        "Send OTP"
    );
}


// ============================================================
// REGISTER AFTER OTP
// ============================================================

async function completeRegistration(firebaseUser) {

    if (!pendingRegisterData) {

        showMessage(
            "Registration session expired. Please start again.",
            "error"
        );

        showPage("signupPage");

        return;
    }


    const data = pendingRegisterData;


    buttonLoading(
        verifyBtn,
        true,
        "Verify OTP"
    );


    try {

        /*
         * Firebase ID token
         *
         * This is useful if your backend later
         * verifies Firebase authentication.
         */

        let firebaseIdToken = "";

        try {

            firebaseIdToken =
                await firebaseUser.getIdToken();

        } catch (e) {

            console.warn(
                "Firebase ID token unavailable:",
                e
            );
        }


        const payload = {

            name: data.name,

            phone: data.phone,

            password: data.password,

            mpin: data.mpin,

            referral:
                data.referral || "",

            referralCode:
                data.referral || "",

            referralBy:
                data.referral || "",

            firebaseUid:
                firebaseUser.uid,

            firebaseIdToken
        };


        console.log(
            "REGISTER PAYLOAD:",
            {
                ...payload,
                password: "***",
                firebaseIdToken: "***"
            }
        );


        const response = await fetch(
            `${AUTH_API}/register`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(payload)
            }
        );


        const result =
            await response.json();

        console.log(
            "REGISTER RESPONSE:",
            result
        );


        if (
            !response.ok ||
            result.success === false
        ) {

            throw new Error(
                result.msg ||
                result.message ||
                "Registration failed."
            );
        }


        const token =
            result.token ||
            result.accessToken ||
            result.jwt;


        if (token) {

            saveAuth(
                token,
                result.user || result.data || null
            );
        }


        showMessage(
            "Account created successfully.",
            "success"
        );


        pendingRegisterData = null;


        setTimeout(() => {

            if (token) {

                window.location.href =
                    "mpin.html";

            } else {

                showPage("loginPage");

                if (loginPhone) {
                    loginPhone.value = data.phone;
                }
            }

        }, 900);


    } catch (error) {

        console.error(
            "REGISTER ERROR:",
            error
        );

        showMessage(
            error.message ||
            "Registration failed.",
            "error"
        );

    } finally {

        buttonLoading(
            verifyBtn,
            false,
            "Verify OTP"
        );
    }
}


// ============================================================
// VERIFY REGISTER OTP
// ============================================================

async function verifyOTP() {

    const otp =
        otpInput?.value?.trim() || "";

    buttonLoading(
        verifyBtn,
        true,
        "Verify OTP"
    );


    const firebaseUser =
        await verifyFirebaseOTP(otp);


    if (!firebaseUser) {

        buttonLoading(
            verifyBtn,
            false,
            "Verify OTP"
        );

        return;
    }


    if (authMode === "register") {

        await completeRegistration(
            firebaseUser
        );

        return;
    }


    if (authMode === "forgotPassword") {

        await preparePasswordReset(
            firebaseUser
        );

        return;
    }


    buttonLoading(
        verifyBtn,
        false,
        "Verify OTP"
    );
}


// ============================================================
// FORGOT PASSWORD - SEND OTP
// ============================================================

async function forgotPassword() {

    const phone =
        validatePhone(
            forgotPhone?.value
        );

    if (!phone) {
        return;
    }


    buttonLoading(
        forgotBtn,
        true,
        "Send OTP"
    );


    try {

        /*
         * First check whether account exists.
         *
         * If your backend doesn't have /check-phone,
         * this request will simply be skipped.
         */

        try {

            const checkResponse =
                await fetch(
                    `${AUTH_API}/check-phone`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            phone
                        })
                    }
                );

            if (checkResponse.ok) {

                const checkData =
                    await checkResponse.json();

                if (
                    checkData.exists === false ||
                    checkData.success === false &&
                    checkData.exists === false
                ) {

                    throw new Error(
                        "No account found with this phone number."
                    );
                }
            }

        } catch (checkError) {

            /*
             * Do not block OTP if your backend
             * does not implement /check-phone.
             */

            if (
                checkError.message.includes(
                    "No account found"
                )
            ) {

                throw checkError;
            }

            console.log(
                "check-phone endpoint not available; continuing with OTP."
            );
        }


        pendingForgotPhone = phone;


        const success =
            await sendFirebaseOTP(
                phone,
                "forgotPassword"
            );


        if (success) {

            showPage("otpPage");

            showMessage(
                "OTP sent. Enter the OTP to reset your password.",
                "success"
            );
        }


    } catch (error) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            error
        );

        showMessage(
            error.message ||
            "Unable to send OTP.",
            "error"
        );

    } finally {

        buttonLoading(
            forgotBtn,
            false,
            "Send OTP"
        );
    }
}


// ============================================================
// PREPARE PASSWORD RESET
// ============================================================

async function preparePasswordReset(firebaseUser) {

    if (!pendingForgotPhone) {

        showMessage(
            "Phone verification session expired.",
            "error"
        );

        showPage("forgotPage");

        return;
    }


    // Save Firebase UID temporarily
    localStorage.setItem(
        "forgotFirebaseUid",
        firebaseUser.uid
    );


    showPage("resetPage");

    showMessage(
        "OTP verified. Enter your new password.",
        "success"
    );


    buttonLoading(
        verifyBtn,
        false,
        "Verify OTP"
    );
}


// ============================================================
// RESET PASSWORD
// ============================================================

async function resetPassword() {

    const password =
        newPassword?.value?.trim() || "";

    if (!validatePassword(password)) {
        return;
    }


    if (!pendingForgotPhone) {

        showMessage(
            "Reset session expired. Please try again.",
            "error"
        );

        showPage("forgotPage");

        return;
    }


    buttonLoading(
        resetBtn,
        true,
        "Reset Password"
    );


    try {

        const firebaseUid =
            localStorage.getItem(
                "forgotFirebaseUid"
            ) || "";


        const response =
            await fetch(
                `${AUTH_API}/reset-password`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone:
                            pendingForgotPhone,

                        password,

                        newPassword:
                            password,

                        firebaseUid
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "RESET PASSWORD RESPONSE:",
            data
        );


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.msg ||
                data.message ||
                "Unable to reset password."
            );
        }


        localStorage.removeItem(
            "forgotFirebaseUid"
        );


        pendingForgotPhone = "";


        newPassword.value = "";


        showMessage(
            "Password reset successfully.",
            "success"
        );


        setTimeout(() => {

            showPage("loginPage");

        }, 1000);


    } catch (error) {

        console.error(
            "RESET PASSWORD ERROR:",
            error
        );

        showMessage(
            error.message ||
            "Password reset failed.",
            "error"
        );

    } finally {

        buttonLoading(
            resetBtn,
            false,
            "Reset Password"
        );
    }
}


// ============================================================
// RESET MPIN
// ============================================================

async function resetMpin() {

    const phone =
        validatePhone(
            forgotMpinPhone?.value
        );

    if (!phone) {
        return;
    }


    const mpin =
        newMpin?.value?.trim() || "";


    if (!validateMpin(mpin)) {
        return;
    }


    buttonLoading(
        resetMpinBtn,
        true,
        "Reset MPIN"
    );


    try {

        /*
         * This expects:
         *
         * POST /api/auth/reset-mpin
         *
         * {
         *    phone,
         *    mpin
         * }
         *
         */

        const response =
            await fetch(
                `${AUTH_API}/reset-mpin`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        phone,

                        mpin,

                        newMpin: mpin
                    })
                }
            );


        const data =
            await response.json();


        console.log(
            "RESET MPIN RESPONSE:",
            data
        );


        if (
            !response.ok ||
            data.success === false
        ) {

            throw new Error(
                data.msg ||
                data.message ||
                "Unable to reset MPIN."
            );
        }


        forgotMpinPhone.value = "";
        newMpin.value = "";


        showMessage(
            "MPIN reset successfully.",
            "success"
        );


        setTimeout(() => {

            showPage("loginPage");

        }, 900);


    } catch (error) {

        console.error(
            "RESET MPIN ERROR:",
            error
        );

        showMessage(
            error.message ||
            "MPIN reset failed.",
            "error"
        );

    } finally {

        buttonLoading(
            resetMpinBtn,
            false,
            "Reset MPIN"
        );
    }
}


// ============================================================
// REFERRAL AUTO-FILL
// ============================================================

function loadReferralCode() {

    try {

        const params =
            new URLSearchParams(
                window.location.search
            );

        const urlReferral =
            params.get("ref");


        const storedReferral =
            localStorage.getItem(
                "referralCode"
            );


        const referral =
            urlReferral ||
            storedReferral ||
            "";


        if (referral) {

            localStorage.setItem(
                "referralCode",
                referral.toUpperCase()
            );


            if (referralInput) {

                referralInput.value =
                    referral.toUpperCase();
            }
        }

    } catch (error) {

        console.error(
            "REFERRAL LOAD ERROR:",
            error
        );
    }
}


// ============================================================
// EVENT LISTENERS
// ============================================================

loginBtn?.addEventListener(
    "click",
    login
);


sendOtpBtn?.addEventListener(
    "click",
    sendRegisterOTP
);


verifyBtn?.addEventListener(
    "click",
    verifyOTP
);


forgotBtn?.addEventListener(
    "click",
    forgotPassword
);


resetBtn?.addEventListener(
    "click",
    resetPassword
);


resetMpinBtn?.addEventListener(
    "click",
    resetMpin
);


// ============================================================
// ENTER KEY SUPPORT
// ============================================================

loginPassword?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            login();
        }
    }
);


otpInput?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            verifyOTP();
        }
    }
);


newPassword?.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            resetPassword();
        }
    }
);


// ============================================================
// OTP INPUT LIMIT
// ============================================================

otpInput?.addEventListener(
    "input",
    () => {

        otpInput.value =
            otpInput.value
                .replace(/\D/g, "")
                .slice(0, 6);
    }
);


// ============================================================
// MPIN INPUT LIMIT
// ============================================================

mpinInput?.addEventListener(
    "input",
    () => {

        mpinInput.value =
            mpinInput.value
                .replace(/\D/g, "")
                .slice(0, 6);
    }
);


newMpin?.addEventListener(
    "input",
    () => {

        newMpin.value =
            newMpin.value
                .replace(/\D/g, "")
                .slice(0, 6);
    }
);


// ============================================================
// PHONE INPUT CLEANING
// ============================================================

[
    loginPhone,
    phoneInput,
    forgotPhone,
    forgotMpinPhone
].forEach(input => {

    input?.addEventListener(
        "input",
        () => {

            input.value =
                input.value
                    .replace(/[^\d+]/g, "");
        }
    );

});


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        loadReferralCode();

        console.log(
            "AUTHH.JS initialized successfully."
        );

    }
);