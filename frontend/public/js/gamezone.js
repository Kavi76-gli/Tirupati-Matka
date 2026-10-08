
// ======================================================
// GAMEZONE.JS
// Tirupati Matka
// Premium Scroll Reveal + Magnetic UI
// ======================================================


const API_BASE =
    "https://tirupati-matka.onrender.com";

const AUTH_API =
    `${API_BASE}/api/auth`;

const GAMEZONE_API =
    `${API_BASE}/api/match/gamezone`;


// ======================================================
// AUTH TOKEN
// ======================================================

function getToken() {

    return (
        localStorage.getItem("token") ||
        localStorage.getItem("ki_token") ||
        ""
    );

}


// ======================================================
// TIME
// ======================================================

function toDate(timeStr) {

    if (!timeStr) {
        return new Date();
    }

    const d = new Date();

    const parts =
        String(timeStr).split(":");

    const h =
        Number(parts[0]) || 0;

    const m =
        Number(parts[1]) || 0;

    d.setHours(h, m, 0, 0);

    return d;
}


function formatTime12(time) {

    if (!time) {
        return "--:--";
    }

    const parts =
        String(time).split(":");

    const h =
        Number(parts[0]) || 0;

    const m =
        Number(parts[1]) || 0;

    const d =
        new Date();

    d.setHours(h, m, 0, 0);

    const hr =
        d.getHours() % 12 || 12;

    const ampm =
        d.getHours() >= 12
            ? "PM"
            : "AM";

    return (
        `${hr}:${String(m).padStart(2, "0")} ${ampm}`
    );
}


// ======================================================
// BET STATUS
// ======================================================

function getBetPermission(
    game,
    now = new Date()
) {

    const openTime =
        toDate(game.openTime);

    const closeTime =
        toDate(game.closeTime);


    if (closeTime <= openTime) {

        closeTime.setDate(
            closeTime.getDate() + 1
        );

    }


    if (now < openTime) {

        return {

            openAllowed: true,

            closeAllowed: true,

            playAllowed: true,

            marketStatus:
                "Running Today"

        };

    }


    if (
        now >= openTime &&
        now < closeTime
    ) {

        return {

            openAllowed: false,

            closeAllowed: true,

            playAllowed: true,

            marketStatus:
                "Close Running"

        };

    }


    return {

        openAllowed: false,

        closeAllowed: false,

        playAllowed: false,

        marketStatus:
            "Market Closed"

    };

}


// ======================================================
// RESULT
// ======================================================

function getResultText(game) {

    const openPanel =
        game.openResult?.panel ||
        "XXX";

    const closePanel =
        game.closeResult?.panel ||
        "XXX";


    let jodi = "XX";


    const openSingle =
        game.openResult?.single;

    const closeSingle =
        game.closeResult?.single;


    if (
        openSingle !== null &&
        openSingle !== undefined &&
        (
            closeSingle === null ||
            closeSingle === undefined
        )
    ) {

        jodi =
            `${openSingle}X`;

    }


    if (
        openSingle !== null &&
        openSingle !== undefined &&
        closeSingle !== null &&
        closeSingle !== undefined
    ) {

        jodi =
            `${openSingle}${closeSingle}`;

    }


    return (
        `${openPanel}-${jodi}-${closePanel}`
    );

}


// ======================================================
// OPEN GAME
// ======================================================

async function openGame(
    gameId,
    playAllowed
) {

    if (!playAllowed) {

        alert(
            "Bidding closed for this game."
        );

        return;
    }


    if (!gameId) {

        alert(
            "Game ID is missing."
        );

        return;
    }


    const token =
        getToken();


    if (!token) {

        window.location.href =
            "auth.html";

        return;
    }


    try {

        const response =
            await fetch(
                `${GAMEZONE_API}/${gameId}`,
                {
                    method: "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }
            );


        const data =
            await response.json();


        console.log(
            "OPEN GAME RESPONSE:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            alert(
                data.message ||
                "Game not found."
            );

            return;
        }


        if (data.game) {

            localStorage.setItem(
                "selectedGame",
                JSON.stringify(
                    data.game
                )
            );

        }


        window.location.href =
            "play.html";

    }
    catch (error) {

        console.error(
            "OPEN GAME ERROR:",
            error
        );

        alert(
            "Unable to open game."
        );

    }

}


// ======================================================
// CREATE GAME CARD
// ======================================================

function createGameCard(
    game,
    index = 0
) {

    // ======================================================
    // GAME PERMISSION / STATUS
    // ======================================================

    const {
        playAllowed,
        marketStatus
    } = getBetPermission(game);


    // ======================================================
    // RESULT
    // ======================================================

    const resultText =
        getResultText(game);


    // ======================================================
    // GAME TIMINGS
    // ======================================================

    const openTime =
        formatTime12(
            game.openTime
        );


    const closeTime =
        formatTime12(
            game.closeTime
        );


    // ======================================================
    // STATUS CLASS
    // ======================================================

    let statusClass = "running";


    if (
        marketStatus ===
        "Market Closed"
    ) {

        statusClass = "closed";

    }

    else if (
        marketStatus ===
        "Close Running"
    ) {

        statusClass = "close-running";

    }


    // ======================================================
    // CREATE CARD
    // ======================================================

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "game-card";


    /*
        DO NOT ADD .show HERE.

        IntersectionObserver will add
        .show when the card enters
        the viewport.
    */

    card.style.transitionDelay =
        `${Math.min(index * 60, 300)}ms`;


    // ======================================================
    // GAME NAME
    // ======================================================

    const gameName =
        game.gameName ||
        game.name ||
        game.title ||
        "Game";


    // ======================================================
    // GAME ID
    // ======================================================

    const gameId =
        game.gameId ||
        game._id ||
        game.id;


    // ======================================================
    // CARD HTML
    // ======================================================

    card.innerHTML = `

        <!-- ==========================================
             CARD HEADER
        =========================================== -->

        <div class="game-card-header">


            <!-- GAME INFORMATION -->

            <div class="game-title-area">

                <div class="game-name">

                    ${gameName}

                </div>


                <div
                    class="game-status ${statusClass}"
                >

                    ${marketStatus}

                </div>

            </div>


            <!-- GAME ICON -->

            <div class="game-icon-box">

                <img
                    src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png"
                    class="chart-icon"
                    alt="Game"
                    loading="lazy"
                >

            </div>


        </div>


        <!-- ==========================================
             TODAY RESULT
        =========================================== -->

        <div class="game-result-section">


            <span class="result-label">

                TODAY'S RESULT

            </span>


            <div class="game-result">

                ${resultText}

            </div>


        </div>


        <!-- ==========================================
             CARD FOOTER
        =========================================== -->

        <div class="game-card-footer">


            <!-- GAME TIMINGS -->

            <div class="game-timings">


                <!-- OPEN -->

                <div class="time-item">

                    <span class="time-label">

                        OPEN

                    </span>


                    <strong>

                        ${openTime}

                    </strong>

                </div>


                <!-- DIVIDER -->

                <div class="time-divider"></div>


                <!-- CLOSE -->

                <div class="time-item">

                    <span class="time-label">

                        CLOSE

                    </span>


                    <strong>

                        ${closeTime}

                    </strong>

                </div>


            </div>


            <!-- PLAY BUTTON -->

            <button
                class="play-btn"
                type="button"
                aria-label="Play ${gameName}"
            >

                <i class="fa-solid fa-play"></i>

                <span>

                    Play

                </span>

            </button>


        </div>

    `;


    // ======================================================
    // PLAY BUTTON EVENT
    // ======================================================

    const playButton =
        card.querySelector(
            ".play-btn"
        );


    if (playButton) {

        playButton.addEventListener(
            "click",
            () => {

                openGame(
                    gameId,
                    playAllowed
                );

            }
        );

    }


    // ======================================================
    // RETURN CARD
    // ======================================================

    return card;

}

// ======================================================
// EXTRACT GAMES
// ======================================================

function extractGames(data) {

    console.log(
        "GAMEZONE API FULL RESPONSE:",
        data
    );


    if (
        Array.isArray(
            data?.games
        )
    ) {

        return data.games;

    }


    if (
        Array.isArray(
            data?.data?.games
        )
    ) {

        return data.data.games;

    }


    if (
        Array.isArray(
            data?.matches
        )
    ) {

        return data.matches;

    }


    if (
        Array.isArray(
            data?.data
        )
    ) {

        return data.data;

    }


    if (
        Array.isArray(data)
    ) {

        return data;

    }


    return [];

}


// ======================================================
// PREMIUM SCROLL REVEAL
// ======================================================

function observeGameCards() {

    const cards =
        document.querySelectorAll(
            ".game-card"
        );


    if (!cards.length) {
        return;
    }


    /*
        If browser doesn't support
        IntersectionObserver,
        show everything normally.
    */

    if (
        !("IntersectionObserver" in window)
    ) {

        cards.forEach(
            card => {

                card.classList.add(
                    "show"
                );

            }
        );

        return;
    }


    const observer =
        new IntersectionObserver(
            (
                entries,
                observerInstance
            ) => {

                entries.forEach(
                    entry => {

                        if (
                            entry.isIntersecting
                        ) {

                            const card =
                                entry.target;


                            card.classList.add(
                                "show"
                            );


                            /*
                                Once revealed,
                                stop observing it.
                            */

                            observerInstance.unobserve(
                                card
                            );

                        }

                    }
                );

            },
            {

                root:
                    null,

                rootMargin:
                    "0px 0px -70px 0px",

                threshold:
                    0.08

            }
        );


    cards.forEach(
        card => {

            observer.observe(
                card
            );

        }
    );

}


// ======================================================
// MAGNETIC BUTTON EFFECT
// ======================================================

function setupMagneticElements() {

    /*
        Magnetic effect is intentionally
        disabled on touch devices.

        This keeps mobile scrolling smooth.
    */

    if (
        window.matchMedia(
            "(hover: none)"
        ).matches
    ) {

        return;
    }


    const elements =
        document.querySelectorAll(
            ".menu-icon, .header-icon, .header-balance, .action-card, .play-btn"
        );


    elements.forEach(
        element => {

            element.addEventListener(
                "mousemove",
                event => {

                    const rect =
                        element.getBoundingClientRect();


                    const x =
                        event.clientX -
                        rect.left -
                        rect.width / 2;


                    const y =
                        event.clientY -
                        rect.top -
                        rect.height / 2;


                    const moveX =
                        Math.max(
                            -7,
                            Math.min(
                                7,
                                x / 7
                            )
                        );


                    const moveY =
                        Math.max(
                            -7,
                            Math.min(
                                7,
                                y / 7
                            )
                        );


                    element.style.transform =
                        `translate(${moveX}px, ${moveY}px) scale(1.02)`;

                }
            );


            element.addEventListener(
                "mouseleave",
                () => {

                    element.style.transform =
                        "";

                }
            );

        }
    );

}


// ======================================================
// LOAD GAMEZONE
// ======================================================

async function loadGameZone() {

    const container =
        document.getElementById(
            "gameContainer"
        );


    if (!container) {

        console.error(
            "gameContainer not found."
        );

        return;
    }


    container.innerHTML = `

        <div class="loading-box">

            <div class="loader"></div>

            <p>
                Loading Markets...
            </p>

        </div>

    `;


    const token =
        getToken();


    if (!token) {

        container.innerHTML = `

            <div class="empty-box">

                <i class="fa-solid fa-lock"></i>

                <strong>
                    Login Required
                </strong>

                <span>
                    Please login to view games.
                </span>

            </div>

        `;

        return;
    }


    try {

        console.log(
            "Loading games from:",
            GAMEZONE_API
        );


        const response =
            await fetch(
                GAMEZONE_API,
                {

                    method:
                        "GET",

                    headers: {

                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`

                    },

                    cache:
                        "no-store"

                }
            );


        console.log(
            "Gamezone HTTP status:",
            response.status
        );


        const data =
            await response.json();


        console.log(
            "Gamezone response:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.message ||
                `Server returned ${response.status}`
            );

        }


        const games =
            extractGames(data);


        console.log(
            "Games extracted:",
            games
        );


        container.innerHTML = "";


        if (!games.length) {

            container.innerHTML = `

                <div class="empty-box">

                    <i class="fa-solid fa-gamepad"></i>

                    <strong>
                        No Markets Available
                    </strong>

                    <span>
                        No games were returned by the server.
                    </span>

                </div>

            `;

            return;
        }


        /*
            Create all cards.
        */

        games.forEach(
            (game, index) => {

                const card =
                    createGameCard(
                        game,
                        index
                    );


                container.appendChild(
                    card
                );

            }
        );


        /*
            Wait one frame before
            starting observation.
        */

        requestAnimationFrame(
            () => {

                observeGameCards();

            }
        );


        /*
            Reinitialize magnetic
            elements after cards
            are created.
        */

        setupMagneticElements();

    }
    catch (error) {

        console.error(
            "GAMEZONE LOAD ERROR:",
            error
        );


        container.innerHTML = `

            <div class="error-box">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <strong>
                    Server Error
                </strong>

                <span>
                    ${error.message ||
                    "Unable to load games."}
                </span>

                <button
                    type="button"
                    onclick="loadGameZone()"
                >
                    Try Again
                </button>

            </div>

        `;

    }

}


// ======================================================
// LOAD BALANCE
// ======================================================

async function loadBalance() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${AUTH_API}/balance`,
                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    },

                    cache:
                        "no-store"

                }
            );


        const data =
            await response.json();


        console.log(
            "Balance response:",
            data
        );


        if (
            response.ok &&
            data.success
        ) {

            const balance =
                Math.floor(
                    Number(
                        data.balance ??
                        data.user?.balance ??
                        data.user?.wallet ??
                        0
                    )
                );


            const balanceElement =
                document.getElementById(
                    "balance"
                );


            if (balanceElement) {

                balanceElement.innerText =
                    `₹${balance}`;

            }

        }

    }
    catch (error) {

        console.error(
            "BALANCE ERROR:",
            error
        );

    }

}


// ======================================================
// LOAD USER
// ======================================================

async function loadUserInfo() {

    const token =
        getToken();


    if (!token) {
        return;
    }


    try {

        const response =
            await fetch(
                `${AUTH_API}/profile`,
                {

                    method:
                        "GET",

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    },

                    cache:
                        "no-store"

                }
            );


        const data =
            await response.json();


        console.log(
            "Profile response:",
            data
        );


        if (
            !response.ok ||
            !data.success
        ) {

            return;

        }


        const user =
            data.user || {};


        const nameElement =
            document.getElementById(
                "menuUserName"
            );


        const phoneElement =
            document.getElementById(
                "menuUserPhone"
            );


        const menuBalanceElement =
            document.getElementById(
                "menuBalance"
            );


        if (nameElement) {

            nameElement.innerText =
                user.name ||
                "Player";

        }


        if (phoneElement) {

            phoneElement.innerText =
                user.phone ||
                user.mobile ||
                "-";

        }


        if (menuBalanceElement) {

            const balance =
                Math.floor(
                    Number(
                        user.balance ??
                        user.wallet ??
                        0
                    )
                );


            menuBalanceElement.innerText =
                `₹${balance}`;

        }

    }
    catch (error) {

        console.error(
            "PROFILE ERROR:",
            error
        );

    }

}


// ======================================================
// MENU
// ======================================================

async function toggleMenu() {

    const sideMenu =
        document.getElementById(
            "sideMenu"
        );


    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (!sideMenu) {
        return;
    }


    const isOpening =
        !sideMenu.classList.contains(
            "active"
        );


    sideMenu.classList.toggle(
        "active"
    );


    if (overlay) {

        overlay.classList.toggle(
            "active"
        );

    }


    if (isOpening) {

        await loadUserInfo();

    }

}


function closeMenu() {

    const sideMenu =
        document.getElementById(
            "sideMenu"
        );


    const overlay =
        document.getElementById(
            "menuOverlay"
        );


    if (sideMenu) {

        sideMenu.classList.remove(
            "active"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

    }

}


// ======================================================
// NAVIGATION
// ======================================================

function go(page) {

    window.location.href =
        page;

}


function goPage(page) {

    window.location.href =
        page;

}


// ======================================================
// WHATSAPP
// ======================================================

function openWhatsApp() {

    const phoneNumber =
        "917412850353";


    const message =
        "Hello, I need support";


    const url =
        `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;


    window.open(
        url,
        "_blank"
    );

}


// ======================================================
// LOGOUT
// ======================================================

function logout() {

    localStorage.removeItem(
        "token"
    );


    localStorage.removeItem(
        "ki_token"
    );


    localStorage.removeItem(
        "user"
    );


    window.location.href =
        "auth.html";

}


// ======================================================
// PAGE INIT
// ======================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        console.log(
            "GAMEZONE INITIALIZED"
        );


        loadBalance();


        loadUserInfo();


        loadGameZone();


        /*
            Balance refresh
        */

        setInterval(
            loadBalance,
            30000
        );


        /*
            Game refresh

            Existing behavior preserved.
        */

        setInterval(
            loadGameZone,
            30000
        );


        /*
            Magnetic header/action
            elements.
        */

        setupMagneticElements();

    }
);

