// ======================================================
// TIRUPATI MATKA
// FIREBASE CLOUD MESSAGING
// PUSH NOTIFICATION SERVICE
// ======================================================

const {
    initializeApp,
    getApps,
    cert
} = require("firebase-admin/app");

const {
    getMessaging
} = require("firebase-admin/messaging");


// ======================================================
// FIREBASE INITIALIZATION
// ======================================================

function initializeFirebase() {

    try {

        // ----------------------------------------------
        // Already initialized
        // ----------------------------------------------

        if (getApps().length > 0) {

            console.log(
                "✅ Firebase Admin already initialized"
            );

            return getApps()[0];
        }


        // ----------------------------------------------
        // READ ENVIRONMENT VARIABLES
        // ----------------------------------------------

        const projectId =
            process.env.FIREBASE_PROJECT_ID;

        const clientEmail =
            process.env.FIREBASE_CLIENT_EMAIL;

        const privateKey =
            process.env.FIREBASE_PRIVATE_KEY
                ? process.env.FIREBASE_PRIVATE_KEY
                    .replace(/\\n/g, "\n")
                : null;


        // ----------------------------------------------
        // CHECK CREDENTIALS
        // ----------------------------------------------

        if (
            !projectId ||
            !clientEmail ||
            !privateKey
        ) {

            console.error(
                "❌ Firebase Admin credentials are missing."
            );

            console.error(
                "Required:"
            );

            console.error(
                "FIREBASE_PROJECT_ID"
            );

            console.error(
                "FIREBASE_CLIENT_EMAIL"
            );

            console.error(
                "FIREBASE_PRIVATE_KEY"
            );

            return null;
        }


        // ----------------------------------------------
        // INITIALIZE FIREBASE
        // ----------------------------------------------

        const app =
            initializeApp({

                credential:
                    cert({

                        projectId,

                        clientEmail,

                        privateKey

                    })

            });


        console.log(
            "=========================================="
        );

        console.log(
            "✅ FIREBASE ADMIN INITIALIZED"
        );

        console.log(
            "Project:",
            projectId
        );

        console.log(
            "=========================================="
        );


        return app;


    } catch (error) {

        console.error(
            "❌ Firebase Admin initialization error:"
        );

        console.error(
            error
        );

        return null;
    }
}


// ======================================================
// INITIALIZE ON SERVER START
// ======================================================

initializeFirebase();


// ======================================================
// GAME RESULT TOPIC
// ======================================================

const GAME_RESULT_TOPIC =
    "game_results";


// ======================================================
// SEND GAME RESULT NOTIFICATION
// ======================================================

async function sendGameResultNotification({

    type,

    gameName,

    panel,

    single,

    jodi

}) {

    try {

        // ----------------------------------------------
        // CHECK FIREBASE
        // ----------------------------------------------

        if (getApps().length === 0) {

            console.error(
                "❌ Firebase Admin is not initialized."
            );

            return null;
        }


        // ----------------------------------------------
        // CLEAN DATA
        // ----------------------------------------------

        const cleanGameName =
            String(
                gameName ||
                "Game"
            ).trim();


        const cleanPanel =
            String(
                panel ?? ""
            );


        const cleanSingle =
            String(
                single ?? ""
            );


        const cleanJodi =
            String(
                jodi ?? ""
            );


        // ----------------------------------------------
        // NOTIFICATION VARIABLES
        // ----------------------------------------------

        let title = "";

        let body = "";


        // ==============================================
        // NORMAL GAME OPEN
        // ==============================================

        if (type === "open") {

            title =
                `🔓 ${cleanGameName} Open Result`;

            body =
                `Open result: ${cleanPanel}-${cleanSingle}`;

        }


        // ==============================================
        // NORMAL GAME CLOSE
        // ==============================================

        else if (type === "close") {

            title =
                `🔒 ${cleanGameName} Close Result`;

            body =
                `Close result: ${cleanPanel}-${cleanSingle}`;


            if (cleanJodi) {

                body +=
                    ` • Jodi: ${cleanJodi}`;

            }

        }


        // ==============================================
        // GALI / DESAWAR
        // ==============================================

        else if (type === "gali") {

            title =
                `🎯 ${cleanGameName} Result`;

            body =
                `Result: ${cleanJodi}`;

        }


        // ==============================================
        // UNKNOWN TYPE
        // ==============================================

        else {

            console.warn(
                "⚠️ Unknown notification type:",
                type
            );

            return null;
        }


        // ==============================================
        // FCM MESSAGE
        // ==============================================

        const message = {

            topic:
                GAME_RESULT_TOPIC,


            notification: {

                title,

                body

            },


            data: {

                type:
                    String(type),

                gameName:
                    cleanGameName,

                panel:
                    cleanPanel,

                single:
                    cleanSingle,

                jodi:
                    cleanJodi,

                screen:
                    type === "gali"
                        ? "gali"
                        : "gamezone"

            },


            android: {

                priority:
                    "high",


                notification: {

                    channelId:
                        "game_results",

                    sound:
                        "default"

                }

            }

        };


        // ==============================================
        // SEND MESSAGE
        // ==============================================

        const messaging =
            getMessaging();


        const response =
            await messaging.send(
                message
            );


        // ==============================================
        // SUCCESS LOG
        // ==============================================

        console.log(
            "=========================================="
        );

        console.log(
            "🔔 GAME RESULT PUSH SENT"
        );

        console.log(
            "Type:",
            type
        );

        console.log(
            "Game:",
            cleanGameName
        );

        console.log(
            "Title:",
            title
        );

        console.log(
            "Body:",
            body
        );

        console.log(
            "Topic:",
            GAME_RESULT_TOPIC
        );

        console.log(
            "Message ID:",
            response
        );

        console.log(
            "=========================================="
        );


        return response;


    } catch (error) {

        // ----------------------------------------------
        // PUSH FAILURE SHOULD NOT BREAK RESULT
        // ----------------------------------------------

        console.error(
            "❌ GAME RESULT PUSH ERROR:"
        );

        console.error(
            error
        );

        return null;
    }

}


// ======================================================
// EXPORT
// ======================================================

module.exports = {

    sendGameResultNotification,

    GAME_RESULT_TOPIC

};