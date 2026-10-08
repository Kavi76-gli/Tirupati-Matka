// ======================================================
// GAMEZONE.JS
// Tirupati Matka
// ======================================================

const API_BASE = "http://localhost:5000";
const AUTH_API = `${API_BASE}/api/auth`;
const GAMEZONE_API = `${API_BASE}/api/match/gamezone`;

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

    const parts = String(timeStr).split(":");

    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;

    d.setHours(h, m, 0, 0);

    return d;
}

function formatTime12(time) {

    if (!time) {
        return "--:--";
    }

    const parts = String(time).split(":");

    const h = Number(parts[0]) || 0;
    const m = Number(parts[1]) || 0;

    const d = new Date();

    d.setHours(h, m, 0, 0);

    const hr = d.getHours() % 12 || 12;

    const ampm =
        d.getHours() >= 12
            ? "PM"
            : "AM";

    return `${hr}:${String(m).padStart(2, "0")} ${ampm}`;
}

// ======================================================
// BET STATUS
// ======================================================

function getBetPermission(game, now = new Date()) {

    const openTime = toDate(game.openTime);
    const closeTime = toDate(game.closeTime);

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
            marketStatus: "Running Today"
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
            marketStatus: "Close Running"
        };
    }

    return {
        openAllowed: false,
        closeAllowed: false,
        playAllowed: false,
        marketStatus: "Market Closed"
    };
}

// ======================================================
// RESULT
// ======================================================

function getResultText(game) {

    const openPanel =
        game.openResult?.panel || "XXX";

    const closePanel =
        game.closeResult?.panel || "XXX";

    let jodi = "XX";

    const openSingle =
        game.openResult?.single;

    const closeSingle =
        game.closeResult?.single;

    if (
        openSingle !== null &&
        openSingle !== undefined &&
        (closeSingle === null ||
         closeSingle === undefined)
    ) {

        jodi = `${openSingle}X`;
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

    return `${openPanel}-${jodi}-${closePanel}`;
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

    const token = getToken();

    if (!token) {

        window.location.href =
            "auth.html";

        return;
    }

    try {

        const response =
            await fetch(
                `${API_BASE}/api/match/gamezone/${gameId}`,
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

        if (!response.ok || !data.success) {

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

function createGameCard(game, index = 0) {

    const {
        playAllowed,
        marketStatus
    } =
        getBetPermission(game);

    const resultText =
        getResultText(game);

    const openTime =
        formatTime12(
            game.openTime
        );

    const closeTime =
        formatTime12(
            game.closeTime
        );

    let statusClass =
        "running";

    if (
        marketStatus ===
        "Market Closed"
    ) {

        statusClass =
            "closed";

    }
    else if (
        marketStatus ===
        "Close Running"
    ) {

        statusClass =
            "close-running";
    }

    const card =
        document.createElement(
            "div"
        );

    card.className =
        "game-card";

    card.style.transitionDelay =
        `${index * 80}ms`;

    const gameName =
        game.gameName ||
        game.name ||
        game.title ||
        "Game";

    const gameId =
        game.gameId ||
        game._id ||
        game.id;

    card.innerHTML = `

        <div class="game-top">

            <div class="game-information">

                <div class="game-name">
                    ${gameName}
                </div>

                <div class="game-result">
                    ${resultText}
                </div>

                <div class="game-status ${statusClass}">
                    ${marketStatus}
                </div>

            </div>

            <div class="chart-wrapper">

                <img
                    src="https://cdn-icons-png.flaticon.com/512/2331/2331941.png"
                    class="chart-icon"
                    alt="Game"
                >

            </div>

        </div>

        <div class="game-action">

            <button
                class="play-btn"
                type="button"
            >

                <i class="fa-solid fa-play"></i>

                <span>Play</span>

            </button>

        </div>

        <div class="bid-bar">

            <span>
                OPEN BIDS : ${openTime}
            </span>

            <span>
                CLOSE BIDS : ${closeTime}
            </span>

        </div>
    `;

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

    // Standard response
    if (
        Array.isArray(
            data?.games
        )
    ) {

        return data.games;
    }

    // data.data.games
    if (
        Array.isArray(
            data?.data?.games
        )
    ) {

        return data.data.games;
    }

    // data.matches
    if (
        Array.isArray(
            data?.matches
        )
    ) {

        return data.matches;
    }

    // data.data
    if (
        Array.isArray(
            data?.data
        )
    ) {

        return data.data;
    }

    // Direct array
    if (
        Array.isArray(data)
    ) {

        return data;
    }

    return [];
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
                    method: "GET",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Authorization":
                            `Bearer ${token}`
                    },

                    cache: "no-store"
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

        requestAnimationFrame(
            () => {

                animateCards();

            }
        );

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
                    ${error.message || "Unable to load games."}
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
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    cache: "no-store"
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
                    method: "GET",

                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    },

                    cache: "no-store"
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
// CARD ANIMATION
// ======================================================

function animateCards() {

    const cards =
        document.querySelectorAll(
            ".game-card"
        );

    if (!cards.length) {
        return;
    }

    cards.forEach(
        (card, index) => {

            setTimeout(
                () => {

                    card.classList.add(
                        "show"
                    );

                },
                index * 100
            );

        }
    );
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

        setInterval(
            loadBalance,
            30000
        );

        setInterval(
            loadGameZone,
            30000
        );

    }
);