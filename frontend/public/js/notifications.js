// ======================================================
// TIRUPATI MATKA
// ANDROID PUSH NOTIFICATIONS
// ======================================================

(function () {

    "use strict";


    // ==================================================
    // CONFIG
    // ==================================================

    const API_BASE =
        "https://tirupati-matka.onrender.com";

    const REGISTER_URL =
        `${API_BASE}/api/notifications/register-device`;

    const NOTIFICATION_CHANNEL_ID =
        "game_results";


    // ==================================================
    // CHECK CAPACITOR
    // ==================================================

    if (
        !window.Capacitor ||
        !window.Capacitor.registerPlugin
    ) {

        console.log(
            "ℹ️ Push notifications skipped: Capacitor not available."
        );

        return;
    }


    // ==================================================
    // LOAD PUSH NOTIFICATION PLUGIN
    // ==================================================

    const PushNotifications =
        window.Capacitor.registerPlugin(
            "PushNotifications"
        );


    if (!PushNotifications) {

        console.error(
            "❌ PushNotifications plugin unavailable."
        );

        return;
    }


    // ==================================================
    // GET AUTH TOKEN
    // ==================================================

    function getAuthToken() {

        return (
            localStorage.getItem("token") ||
            localStorage.getItem("ki_token") ||
            localStorage.getItem("authToken") ||
            ""
        );

    }


    // ==================================================
    // WAIT FOR LOGIN TOKEN
    // ==================================================

    async function waitForAuthToken(
        attempts = 10,
        delay = 1000
    ) {

        for (
            let i = 0;
            i < attempts;
            i++
        ) {

            const token =
                getAuthToken();

            if (token) {

                console.log(
                    "✅ User authentication token found."
                );

                return token;
            }

            console.log(
                `⏳ Waiting for login token... ${i + 1}/${attempts}`
            );

            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        delay
                    )
            );
        }

        console.warn(
            "⚠️ Authentication token not available."
        );

        return "";
    }


    // ==================================================
    // CREATE ANDROID NOTIFICATION CHANNEL
    // ==================================================

    async function createNotificationChannel() {

        try {

            if (
                typeof PushNotifications.createChannel !==
                "function"
            ) {

                console.warn(
                    "⚠️ createChannel() is not available."
                );

                return;
            }


            await PushNotifications.createChannel({

                id:
                    NOTIFICATION_CHANNEL_ID,

                name:
                    "Game Results",

                description:
                    "Open, close and Gali/Desawar result notifications",

                importance:
                    5,

                visibility:
                    1,

                sound:
                    "default",

                vibration:
                    true

            });


            console.log(
                "✅ Game Results notification channel ready."
            );

        } catch (error) {

            console.error(
                "❌ Notification channel error:",
                error
            );

        }

    }


    // ==================================================
    // SEND DEVICE TOKEN TO BACKEND
    // ==================================================

    async function saveDeviceToken(
        fcmToken
    ) {

        if (!fcmToken) {

            console.warn(
                "⚠️ Empty FCM token."
            );

            return false;
        }


        // ----------------------------------------------
        // WAIT FOR AUTH TOKEN
        // ----------------------------------------------

        const authToken =
            await waitForAuthToken();


        if (!authToken) {

            console.warn(
                "⚠️ User is not authenticated yet."
            );

            return false;
        }


        try {

            console.log(
                "📡 Registering device with backend..."
            );


            const response =
                await fetch(
                    REGISTER_URL,
                    {

                        method:
                            "POST",

                        headers: {

                            "Content-Type":
                                "application/json",

                            "Authorization":
                                `Bearer ${authToken}`

                        },

                        body:
                            JSON.stringify({

                                token:
                                    fcmToken

                            })

                    }
                );


            let data = {};

            try {

                data =
                    await response.json();

            } catch {

                data = {};

            }


            if (!response.ok) {

                throw new Error(

                    data.message ||
                    data.msg ||
                    "Unable to register device."

                );

            }


            console.log(
                "=========================================="
            );

            console.log(
                "✅ DEVICE REGISTERED FOR PUSH"
            );

            console.log(
                "📱 FCM Token:",
                fcmToken
            );

            console.log(
                "📡 Backend:",
                REGISTER_URL
            );

            console.log(
                "=========================================="
            );


            // ------------------------------------------
            // SAVE LOCAL FLAG
            // ------------------------------------------

            localStorage.setItem(
                "push_registered",
                "true"
            );


            localStorage.setItem(
                "push_fcm_token",
                fcmToken
            );


            return true;


        } catch (error) {

            console.error(
                "❌ Device registration error:",
                error
            );

            return false;
        }

    }


    // ==================================================
    // REGISTRATION LISTENER
    // ==================================================

    async function setupRegistrationListener() {

        await PushNotifications.addListener(

            "registration",

            async function (token) {

                console.log(
                    "=========================================="
                );

                console.log(
                    "📱 FCM REGISTRATION SUCCESS"
                );

                console.log(
                    "FCM TOKEN:",
                    token.value
                );

                console.log(
                    "=========================================="
                );


                await saveDeviceToken(
                    token.value
                );

            }

        );

    }


    // ==================================================
    // REGISTRATION ERROR LISTENER
    // ==================================================

    async function setupRegistrationErrorListener() {

        await PushNotifications.addListener(

            "registrationError",

            function (error) {

                console.error(
                    "=========================================="
                );

                console.error(
                    "❌ FCM REGISTRATION ERROR"
                );

                console.error(
                    error
                );

                console.error(
                    "=========================================="
                );

            }

        );

    }


    // ==================================================
    // FOREGROUND NOTIFICATION
    // ==================================================

    async function setupForegroundListener() {

        await PushNotifications.addListener(

            "pushNotificationReceived",

            function (notification) {

                console.log(
                    "=========================================="
                );

                console.log(
                    "🔔 PUSH NOTIFICATION RECEIVED"
                );

                console.log(
                    "Title:",
                    notification?.title
                );

                console.log(
                    "Body:",
                    notification?.body
                );

                console.log(
                    "Data:",
                    notification?.data
                );

                console.log(
                    "=========================================="
                );

            }

        );

    }


    // ==================================================
    // NOTIFICATION TAP
    // ==================================================

    async function setupNotificationActionListener() {

        await PushNotifications.addListener(

            "pushNotificationActionPerformed",

            function (action) {

                console.log(
                    "=========================================="
                );

                console.log(
                    "👉 PUSH NOTIFICATION TAPPED"
                );

                console.log(
                    action
                );

                console.log(
                    "=========================================="
                );


                const data =
                    action
                        ?.notification
                        ?.data;


                if (!data) {

                    console.warn(
                        "⚠️ Notification data not found."
                    );

                    return;
                }


                console.log(
                    "🔔 Notification type:",
                    data.type
                );


                // ======================================
                // NORMAL GAME RESULT
                // ======================================

                if (
                    data.screen ===
                    "gamezone"
                ) {

                    window.location.href =
                        "gamezone.html";

                    return;
                }


                // ======================================
                // GALI / DESAWAR RESULT
                // ======================================

                if (
                    data.screen ===
                    "gali"
                ) {

                    window.location.href =
                        "gali.html";

                    return;
                }

            }

        );

    }


    // ==================================================
    // CHECK NOTIFICATION PERMISSION
    // ==================================================

    async function checkNotificationPermission() {

        let permission =
            await PushNotifications
                .checkPermissions();


        console.log(
            "🔔 Current push permission:",
            permission
        );


        // ----------------------------------------------
        // ANDROID 13+
        // ----------------------------------------------

        if (
            permission.receive ===
            "prompt"
        ) {

            console.log(
                "📢 Requesting notification permission..."
            );


            permission =
                await PushNotifications
                    .requestPermissions();


            console.log(
                "🔔 Permission after request:",
                permission
            );

        }


        if (
            permission.receive !==
            "granted"
        ) {

            console.warn(
                "⚠️ Push notification permission denied."
            );

            return false;
        }


        console.log(
            "✅ Push notification permission granted."
        );

        return true;

    }


    // ==================================================
    // REGISTER DEVICE WITH FCM
    // ==================================================

    async function registerWithFCM() {

        try {

            await PushNotifications.register();

            console.log(
                "✅ Push notification registration started."
            );

        } catch (error) {

            console.error(
                "❌ FCM register() error:",
                error
            );

        }

    }


    // ==================================================
    // COMPLETE PUSH SETUP
    // ==================================================

    async function setupPushNotifications() {

        try {

            console.log(
                "=========================================="
            );

            console.log(
                "🚀 TIRUPATI MATKA PUSH SETUP"
            );

            console.log(
                "=========================================="
            );


            // ------------------------------------------
            // LISTENERS MUST BE REGISTERED FIRST
            // ------------------------------------------

            await setupRegistrationListener();

            await setupRegistrationErrorListener();

            await setupForegroundListener();

            await setupNotificationActionListener();


            // ------------------------------------------
            // CHECK PERMISSION
            // ------------------------------------------

            const permissionGranted =
                await checkNotificationPermission();


            if (!permissionGranted) {

                return;
            }


            // ------------------------------------------
            // CREATE ANDROID CHANNEL
            // ------------------------------------------

            await createNotificationChannel();


            // ------------------------------------------
            // REGISTER WITH FCM
            // ------------------------------------------

            await registerWithFCM();


        } catch (error) {

            console.error(
                "❌ PUSH SETUP ERROR:",
                error
            );

        }

    }


    // ==================================================
    // START PUSH SYSTEM
    // ==================================================

    document.addEventListener(

        "DOMContentLoaded",

        function () {

            console.log(
                "📲 Push notification script loaded."
            );


            setTimeout(

                setupPushNotifications,

                800

            );

        }

    );


})();