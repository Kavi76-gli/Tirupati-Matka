// ======================================================
// TIRUPATI MATKA — DEMO ACTIVITY SYSTEM
//
// Activities:
// 1. Deposit
// 2. Withdrawal
// 3. Bet Placed
// 4. Win
//
// DEMO ONLY:
// No real transactions.
// No wallet balance changes.
// No backend transaction requests.
// ======================================================

(function () {
    "use strict";

    // ==================================================
    // PREVENT DUPLICATE INITIALIZATION
    // ==================================================

    if (window.__demoActivityInitialized) {
        return;
    }

    window.__demoActivityInitialized = true;

    // ==================================================
    // CONFIGURATION
    // ==================================================

    const ACTIVITY_INTERVAL = 12000;
    const MAX_ACTIVITIES = 8;

    const TOAST_INITIAL_AGE = 4;
    const TOAST_VISIBLE_DURATION = 10000;
    const TOAST_INTERVAL = 25000;

    // ==================================================
    // FICTIONAL DEMO USERS
    // ==================================================

    const sampleUsers = [
        { name: "Arun Kumar", phone: "******4821", uid: "382301" },
        { name: "Priya Lakshmi", phone: "******1742", uid: "382302" },
        { name: "Vijay Kumar", phone: "******6518", uid: "382303" },
        { name: "Suresh Reddy", phone: "******2936", uid: "382304" },
        { name: "Kavitha Devi", phone: "******8051", uid: "382305" },
        { name: "Ramesh Babu", phone: "******4173", uid: "382306" },
        { name: "Divya Sri", phone: "******7294", uid: "382307" },
        { name: "Karthik Raj", phone: "******5362", uid: "382308" },
        { name: "Meena Kumari", phone: "******9185", uid: "382309" },
        { name: "Praveen Kumar", phone: "******2647", uid: "382310" },
        { name: "Anitha Rani", phone: "******6831", uid: "382311" },
        { name: "Gopi Krishna", phone: "******3508", uid: "382312" },
        { name: "Sathish Kumar", phone: "******1946", uid: "382313" },
        { name: "Lakshmi Priya", phone: "******5729", uid: "382314" },
        { name: "Manoj Kumar", phone: "******8364", uid: "382315" }
    ];

    // ==================================================
    // ACTIVITY TYPES
    // ==================================================

    const activityTypes = [
        {
            type: "Deposit",
            icon: "fa-wallet",
            className: "deposit",
            prefix: "+"
        },
        {
            type: "Withdrawal",
            icon: "fa-money-bill-transfer",
            className: "withdrawal",
            prefix: "-"
        },
        {
            type: "Bet Placed",
            icon: "fa-bullseye",
            className: "bet",
            prefix: "-"
        },
        {
            type: "Win",
            icon: "fa-trophy",
            className: "win",
            prefix: "+"
        }
    ];

    // ==================================================
    // RANDOM DEMO AMOUNT RANGES
    // ==================================================

    const demoAmounts = {
        "Deposit": {
            min: 100,
            max: 500000
        },

        "Withdrawal": {
            min: 500,
            max: 1000000
        },

        "Bet Placed": {
            min: 10,
            max: 100000
        },

        "Win": {
            min: 95,
            max: 1000000
        }
    };

    // ==================================================
    // RANDOM HELPERS
    // ==================================================

    function randomItem(items) {
        return items[
            Math.floor(Math.random() * items.length)
        ];
    }

    // Generate a random whole-number amount.
    function randomAmount(type) {
        const range = demoAmounts[type];

        if (!range) {
            return 500;
        }

        return Math.floor(
            Math.random() * (range.max - range.min + 1)
        ) + range.min;
    }

    // Format amounts using Indian number grouping.
    function formatAmount(amount) {
        return "₹" + Number(amount).toLocaleString("en-IN");
    }

    // Current local time.
    function getCurrentTime() {
        return new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    // ==================================================
    // DOM ELEMENTS
    // ==================================================

    const activityList =
        document.getElementById("activityList");

    const withdrawalToast =
        document.getElementById("withdrawalToast");

    const toastTitle =
        document.getElementById("withdrawalToastTitle");

    const toastAmount =
        document.getElementById("withdrawalToastAmount");

    const toastUser =
        document.getElementById("withdrawalToastUser");

    const toastTime =
        document.getElementById("withdrawalToastTime");

    // ==================================================
    // CREATE RANDOM DEMO ACTIVITY
    // ==================================================

    function createDemoActivity() {
        const user = randomItem(sampleUsers);
        const activity = randomItem(activityTypes);

        return {
            user: user,
            type: activity.type,
            icon: activity.icon,
            className: activity.className,
            prefix: activity.prefix,
            amount: randomAmount(activity.type),
            time: getCurrentTime()
        };
    }

    // ==================================================
    // CREATE ACTIVITY ROW
    // ==================================================

    function createActivityRow(activity) {
        const row = document.createElement("div");

        row.className =
            "activity-row " + activity.className;

        // Activity icon.
        const icon = document.createElement("div");

        icon.className =
            "activity-icon " + activity.className;

        const iconElement = document.createElement("i");

        iconElement.className =
            "fas " + activity.icon;

        icon.appendChild(iconElement);

        // Activity details.
        const details = document.createElement("div");

        details.className = "activity-details";

        // User name.
        const name = document.createElement("div");

        name.className = "activity-name";
        name.textContent = activity.user.name;

        // Masked phone number.
        const info = document.createElement("div");

        info.className = "activity-info";
        info.textContent = activity.user.phone;

        // Activity type.
        const type = document.createElement("div");

        type.className = "activity-type";
        type.textContent = activity.type;

        // Activity time.
        const time = document.createElement("div");

        time.className = "activity-time";
        time.textContent = activity.time;

        details.appendChild(name);
        details.appendChild(info);
        details.appendChild(type);
        details.appendChild(time);

        // Amount and demo status.
        const right = document.createElement("div");

        right.className = "activity-right";

        const amount = document.createElement("div");

        amount.className = "activity-amount";

        amount.textContent =
            activity.prefix + formatAmount(activity.amount);

        const status = document.createElement("span");

        status.className =
            "activity-status demo-status";

        status.textContent = "LIVE";

        right.appendChild(amount);
        right.appendChild(status);

        // Assemble activity row.
        row.appendChild(icon);
        row.appendChild(details);
        row.appendChild(right);

        return row;
    }

    // ==================================================
    // LOAD INITIAL ACTIVITIES
    // ==================================================

    function loadInitialActivities() {
        if (!activityList) {
            console.warn(
                "Demo activity: #activityList was not found."
            );

            return;
        }

        activityList.replaceChildren();

        for (let i = 0; i < 5; i++) {
            const activity = createDemoActivity();

            activityList.appendChild(
                createActivityRow(activity)
            );
        }
    }

    // ==================================================
    // ADD NEW ACTIVITY
    // ==================================================

    function addDemoActivity() {
        if (!activityList) {
            return;
        }

        const activity = createDemoActivity();

        const row = createActivityRow(activity);

        activityList.prepend(row);

        // Keep the list within the configured limit.
        while (activityList.children.length > MAX_ACTIVITIES) {
            activityList.lastElementChild.remove();
        }
    }

    // ==================================================
    // WITHDRAWAL POPUP TIMERS
    // ==================================================

    let toastAgeTimer = null;
    let toastHideTimer = null;
    let toastLoopTimer = null;
    let firstToastTimer = null;

    let toastDismissed = false;

    // ==================================================
    // HIDE WITHDRAWAL POPUP
    // ==================================================

    function hideWithdrawalToast() {
        if (toastAgeTimer !== null) {
            clearInterval(toastAgeTimer);
            toastAgeTimer = null;
        }

        if (toastHideTimer !== null) {
            clearTimeout(toastHideTimer);
            toastHideTimer = null;
        }

        if (withdrawalToast) {
            withdrawalToast.classList.remove("show");
            withdrawalToast.hidden = true;
        }
    }

    // ==================================================
    // CLOSE POPUP MANUALLY
    // ==================================================

    window.dismissWithdrawalToast = function () {
        toastDismissed = true;

        hideWithdrawalToast();

        if (toastLoopTimer !== null) {
            clearInterval(toastLoopTimer);
            toastLoopTimer = null;
        }

        if (firstToastTimer !== null) {
            clearTimeout(firstToastTimer);
            firstToastTimer = null;
        }
    };

    // ==================================================
    // SHOW WITHDRAWAL POPUP
    // Fictional demo notification
    // ==================================================

    function showWithdrawalToast() {
        if (!withdrawalToast || toastDismissed) {
            return;
        }

        // Choose a fictional sample user.
        const user = randomItem(sampleUsers);

        // Use the same withdrawal range as the activity list.
        // Minimum ₹500; maximum ₹10,00,000.
        const amount = randomAmount("Withdrawal");

        // Initial relative age.
        let ageInSeconds = TOAST_INITIAL_AGE;

        // ----------------------------------------------
        // POPUP TITLE
        // ----------------------------------------------

        if (toastTitle) {
            toastTitle.textContent =
                "Withdrawal ";
        }

        // ----------------------------------------------
        // POPUP AMOUNT
        // ----------------------------------------------

        if (toastAmount) {
            toastAmount.textContent =
                formatAmount(amount);
        }

        // ----------------------------------------------
        // FICTIONAL USER
        // ----------------------------------------------

        if (toastUser) {
            toastUser.textContent =
                user.name + " (" + user.phone + ")";
        }

        // ----------------------------------------------
        // RELATIVE TIMESTAMP
        // ----------------------------------------------

        if (toastTime) {
            toastTime.textContent =
                ageInSeconds + " seconds ago";
        }

        withdrawalToast.setAttribute(
            "aria-label",
            "Fictional demo withdrawal notification"
        );

        // Display popup.
        withdrawalToast.hidden = false;

        requestAnimationFrame(function () {
            withdrawalToast.classList.add("show");
        });

        // Clear any previous age timer.
        if (toastAgeTimer !== null) {
            clearInterval(toastAgeTimer);
        }

        // Update timestamp every second.
        toastAgeTimer = setInterval(function () {
            ageInSeconds++;

            if (toastTime) {
                toastTime.textContent =
                    ageInSeconds + " seconds ago";
            }
        }, 1000);

        // Clear any previous hide timer.
        if (toastHideTimer !== null) {
            clearTimeout(toastHideTimer);
        }

        // Hide popup after the configured duration.
        toastHideTimer = setTimeout(function () {
            hideWithdrawalToast();
        }, TOAST_VISIBLE_DURATION);
    }

    // ==================================================
    // START DEMO SYSTEM
    // ==================================================

    function startDemoActivity() {
        loadInitialActivities();

        // Add a new activity every 12 seconds.
        setInterval(
            addDemoActivity,
            ACTIVITY_INTERVAL
        );

        // Show the first withdrawal popup after 5 seconds.
        firstToastTimer = setTimeout(
            showWithdrawalToast,
            5000
        );

        // Show subsequent popups every 25 seconds.
        toastLoopTimer = setInterval(
            showWithdrawalToast,
            TOAST_INTERVAL
        );
    }

    // ==================================================
    // INITIALIZE AFTER DOM LOAD
    // ==================================================

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            startDemoActivity,
            { once: true }
        );
    } else {
        startDemoActivity();
    }

})();