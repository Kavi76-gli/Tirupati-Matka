// ======================================================
// TIRUPATI PUSH NOTIFICATIONS
// Capacitor + Firebase Cloud Messaging
// ======================================================

(function () {

    "use strict";

    console.log("🔔 Tirupati Notifications: starting...");


    // ==================================================
    // CHECK CAPACITOR
    // ==================================================

    if (!window.Capacitor) {

        console.log(
            "🔔 Capacitor not available. Running as normal web page."
        );

        return;
    }


    // ==================================================
    // CHECK NATIVE PLATFORM
    // ==================================================

    if (
        typeof window.Capacitor.isNativePlatform === "function" &&
        !window.Capacitor.isNativePlatform()
    ) {

        console.log(
            "🔔 Web/PWA detected. Native FCM registration skipped."
        );

        return;
    }


    // ==================================================
    // GET PUSH NOTIFICATION PLUGIN
    // ==================================================

    const PushNotifications =
        window.Capacitor?.Plugins?.PushNotifications;


    if (!PushNotifications) {

        console.error(
            "❌ PushNotifications plugin not available."
        );

        return;
    }


    // ==================================================
    // INITIALIZE PUSH
    // ==================================================

    async function initializePushNotifications() {

        try {

            console.log(
                "🔔 Checking notification permission..."
            );


            // ------------------------------------------
            // CHECK PERMISSION
            // ------------------------------------------

            let permission =
                await PushNotifications.checkPermissions();


            console.log(
                "Notification permission:",
                permission
            );


            // ------------------------------------------
            // REQUEST PERMISSION
            // ------------------------------------------

            if (permission.receive === "prompt") {

                permission =
                    await PushNotifications.requestPermissions();

                console.log(
                    "Notification permission after request:",
                    permission
                );
            }


            // ------------------------------------------
            // PERMISSION DENIED
            // ------------------------------------------

            if (permission.receive !== "granted") {

                console.warn(
                    "⚠️ Notification permission was not granted."
                );

                return;
            }


            // ------------------------------------------
            // REGISTRATION LISTENER
            // ------------------------------------------

            await PushNotifications.addListener(
                "registration",
                token => {

                    console.log(
                        "================================"
                    );

                    console.log(
                        "✅ FCM DEVICE TOKEN RECEIVED"
                    );

                    console.log(
                        token.value
                    );

                    console.log(
                        "================================"
                    );


                    // Save temporarily for testing.
                    // Later we will send this token
                    // securely to our backend.

                    localStorage.setItem(
                        "fcmToken",
                        token.value
                    );

                }
            );


            // ------------------------------------------
            // REGISTRATION ERROR
            // ------------------------------------------

            await PushNotifications.addListener(
                "registrationError",
                error => {

                    console.error(
                        "❌ FCM registration error:",
                        error
                    );

                }
            );


            // ------------------------------------------
            // FOREGROUND NOTIFICATION
            // ------------------------------------------

            await PushNotifications.addListener(
                "pushNotificationReceived",
                notification => {

                    console.log(
                        "🔔 Push notification received:",
                        notification
                    );

                }
            );


            // ------------------------------------------
            // NOTIFICATION TAP
            // ------------------------------------------

            await PushNotifications.addListener(
                "pushNotificationActionPerformed",
                action => {

                    console.log(
                        "🔔 Notification opened:",
                        action
                    );

                }
            );


            // ------------------------------------------
            // REGISTER DEVICE
            // ------------------------------------------

            console.log(
                "🔔 Registering device with Firebase..."
            );

            await PushNotifications.register();


        } catch (error) {

            console.error(
                "❌ Push notification initialization failed:",
                error
            );

        }

    }


    // ==================================================
    // START
    // ==================================================

    initializePushNotifications();

})();