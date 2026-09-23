/* ========================================
   GAME ELEMENTS
======================================== */

const piggyBank = document.getElementById("piggy-bank");
const gameArea = document.getElementById("game-space");
const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const earnedDisplay = document.getElementById("earned-display");
const resultsScreen = document.getElementById("results-screen");
const finalScore = document.getElementById("final-score");
const playAgainButton = document.getElementById("play-again");
const restartButton = document.getElementById("restart-button");
const startScreen = document.getElementById("start-screen");
const startButton = document.getElementById("start-button");


/* ========================================
   GAME VARIABLES
======================================== */

let isDragging = false;
let score = 0;
let timeRemaining = 30;
let gameRunning = false;

/* Handles for everything a round has running, so a restart can stop
   ALL of it before starting fresh (2026-09-23 fix: restarting mid-round
   used to start a second coin animation loop on top of the first, which
   is what made the coins fall faster after every restart). */
let coinLoopId = null;
let openingCoinTimers = [];

let timerInterval;
let coinSpawnInterval;

const coins = [];

const MAX_COINS = 6;


/* ========================================
   COIN TYPES
========================================
   Fixed sizes represent the real relative
   sizes of U.S. coins.

   Penny      = 1¢
   Nickel     = 5¢
   Dime       = 10¢
   Quarter    = 25¢
   Half Dollar = 50¢
======================================== */

const coinTypes = [

    {
        image: "images/penny.png",
        value: 1,
        size: 72
    },

    {
        image: "images/nickel.png",
        value: 5,
        size: 80
    },

    {
        image: "images/dime.png",
        value: 10,
        size: 68
    },

    {
        image: "images/quarter.png",
        value: 25,
        size: 92
    },

    {
        image: "images/half-dollar.png",
        value: 50,
        size: 98
    }

];


/* ========================================
   PIGGY BANK DRAGGING
======================================== */

piggyBank.addEventListener("pointerdown", (event) => {

    if (!gameRunning) {
        return;
    }

    isDragging = true;

    event.preventDefault();

    piggyBank.setPointerCapture(event.pointerId);

});


piggyBank.addEventListener("pointermove", (event) => {

    if (!isDragging || !gameRunning) {
        return;
    }

    const gameRect = gameArea.getBoundingClientRect();

    // #game-area is scaled down to fit the window (see the responsive
    // transform on #game-area in style.css). getBoundingClientRect()
    // reports gameRect in real screen pixels (post-scale), but the
    // piggy bank's own CSS "left" lives in the stage's unscaled
    // 1920x1080 coordinate space -- and offsetWidth is unscaled too.
    // Convert the pointer position back into stage pixels first, or
    // the piggy bank drifts away from the cursor on any screen where
    // the stage isn't shown at 100% scale.
    const scale = gameRect.width / gameArea.offsetWidth;

    const piggyWidth = piggyBank.offsetWidth;

    const halfPiggyWidth = piggyWidth / 2;

    // "left" is the piggy bank's LEFT EDGE -- there is no
    // CSS transform shifting it anymore, so this is the
    // only math involved. Center the piggy bank under the
    // pointer by pulling the edge back half its own width.
    let leftEdge =
        (event.clientX - gameRect.left) / scale - halfPiggyWidth;


    if (leftEdge < 0) {
        leftEdge = 0;
    }


    if (leftEdge > gameArea.offsetWidth - piggyWidth) {
        leftEdge = gameArea.offsetWidth - piggyWidth;
    }


    piggyBank.style.left = `${leftEdge}px`;

});


piggyBank.addEventListener("pointerup", (event) => {

    isDragging = false;

    try {

        piggyBank.releasePointerCapture(event.pointerId);

    } catch (error) {

        // Nothing needed here

    }

});


piggyBank.addEventListener("pointercancel", () => {

    isDragging = false;

});


/* ========================================
   UPDATE SCORE
======================================== */

function updateScore() {

    scoreDisplay.textContent = `$${score.toFixed(2)}`;

}


/* ========================================
   UPDATE TIMER
======================================== */

function updateTimer() {

    timerDisplay.textContent = timeRemaining;

}


/* ========================================
   SHOW LAST COIN CAUGHT
======================================== */

function showEarnedAmount(coinValue) {

    if (earnedDisplay) {
        earnedDisplay.textContent = `+${coinValue}¢`;
    }

}


/* ========================================
   START TIMER
======================================== */

function startTimer() {

    clearInterval(timerInterval);

    timerInterval = setInterval(() => {

        if (!gameRunning) {
            return;
        }

        timeRemaining--;

        updateTimer();


        if (timeRemaining <= 0) {

            endGame();

        }

    }, 1000);

}


/* ========================================
   SPARKLE EFFECT

   Same star-burst technique as the Lemonade
   Stand game's on-serve sparkle: four
   hand-drawn star shapes (images/star1-4.svg),
   each re-tinted on the fly to a random brand
   blue by swapping out their shared #8fcefa
   base fill -- see randomStarSVG() -- instead
   of the old single flat glyph recolored via
   a CSS class.
======================================== */

const STAR_SVGS = [

    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 217.246 216.698"><g><g><path d="M186.93,93.47l-48.54,21.97c-10.19,4.61-18.35,12.77-22.96,22.96l-21.97,48.54-10.11-22.35-6.69-14.78-5.16-11.41c-4.61-10.19-12.77-18.35-22.96-22.96l-15.24-6.9L0,93.47l48.54-21.96c10.19-4.61,18.35-12.77,22.96-22.96L93.46,0l18.61,41.13,3.36,7.42c4.28,9.46,11.62,17.17,20.81,21.91.7.37,1.42.72,2.15,1.05l21.29,9.63,27.25,12.33Z" fill="#8fcefa"/><path d="M186.93,93.47l-48.54,21.97c-10.19,4.61-18.35,12.77-22.96,22.96l-21.97,48.54-10.11-22.35c24.69-47.1,54.91-71.32,76.33-83.45l27.25,12.33Z" fill="#001d3a" opacity=".05"/><path d="M112.07,41.13c-11.02,2.31-28.89,10.68-41.3,39.56-6.68,15.55-23.67,23.69-37.47,27.85L0,93.47l48.54-21.96c10.19-4.61,18.35-12.77,22.96-22.96L93.46,0l18.61,41.13Z" fill="#fff" opacity=".3"/></g><g><path d="M217.246,168.838l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71-1.98-5.5-5.49-10.25-10.04-13.73-3.16-2.42-6.82-4.22-10.81-5.24l-20.85-5.32,20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68l5.32-20.85,5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39,3.38,7.16,9.48,12.74,17,15.45.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#8fcefa"/><path d="M217.246,168.838l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71,10.93-15.61,22.05-24.99,30.42-30.46.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#001d3a" opacity=".05"/><path d="M176.656,147.218c-7.265,2.09-12.868,7.753-13.42,15.45-.53,7.392-3.983,13.937-10.04,16.73-3.16-2.42-6.82-4.22-10.81-5.24l-20.85-5.32,20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68l5.32-20.85,5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39Z" fill="#fff" opacity=".3"/></g></g></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 186.93 186.94"><g><path d="M186.93,93.47l-48.54,21.97c-10.19,4.61-18.35,12.77-22.96,22.96l-21.97,48.54-10.11-22.35-6.69-14.78-5.16-11.41c-4.61-10.19-12.77-18.35-22.96-22.96l-15.24-6.9L0,93.47l48.54-21.96c10.19-4.61,18.35-12.77,22.96-22.96L93.46,0l18.61,41.13,3.36,7.42c4.28,9.46,11.62,17.17,20.81,21.91.7.37,1.42.72,2.15,1.05l21.29,9.63,27.25,12.33Z" fill="#8fcefa"/><path d="M186.93,93.47l-48.54,21.97c-10.19,4.61-18.35,12.77-22.96,22.96l-21.97,48.54-10.11-22.35c24.69-47.1,54.91-71.32,76.33-83.45l27.25,12.33Z" fill="#001d3a" opacity=".05"/><path d="M112.07,41.13c-11.02,2.31-28.89,10.68-41.3,39.56-6.68,15.55-23.67,23.69-37.47,27.85L0,93.47l48.54-21.96c10.19-4.61,18.35-12.77,22.96-22.96L93.46,0l18.61,41.13Z" fill="#fff" opacity=".3"/></g></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 95.71 95.72"><g><path d="M95.71,47.86l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71-1.98-5.5-5.49-10.25-10.04-13.73-3.16-2.42-6.82-4.22-10.81-5.24L0,47.86l20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68L47.85,0l5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39,3.38,7.16,9.48,12.74,17,15.45.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#8fcefa"/><path d="M95.71,47.86l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71,10.93-15.61,22.05-24.99,30.42-30.46.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#001d3a" opacity=".05"/><path d="M55.12,26.24c-7.265,2.09-12.868,7.753-13.42,15.45-.53,7.392-3.983,13.937-10.04,16.73-3.16-2.42-6.82-4.22-10.81-5.24L0,47.86l20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68L47.85,0l5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39Z" fill="#fff" opacity=".3"/></g></svg>',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 127.419 165.745"><g><g><path d="M95.71,47.86l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71-1.98-5.5-5.49-10.25-10.04-13.73-3.16-2.42-6.82-4.22-10.81-5.24L0,47.86l20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68L47.85,0l5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39,3.38,7.16,9.48,12.74,17,15.45.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#8fcefa"/><path d="M95.71,47.86l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71,10.93-15.61,22.05-24.99,30.42-30.46.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#001d3a" opacity=".05"/><path d="M55.12,26.24c-7.265,2.09-12.868,7.753-13.42,15.45-.53,7.392-3.983,13.937-10.04,16.73-3.16-2.42-6.82-4.22-10.81-5.24L0,47.86l20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68L47.85,0l5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39Z" fill="#fff" opacity=".3"/></g><g><path d="M127.419,117.886l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71-1.98-5.5-5.49-10.25-10.04-13.73-3.16-2.42-6.82-4.22-10.81-5.24l-20.85-5.32,20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68l5.32-20.85,5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39,3.38,7.16,9.48,12.74,17,15.45.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#8fcefa"/><path d="M127.419,117.886l-20.85,5.32c-10.65,2.72-18.96,11.04-21.68,21.68l-5.33,20.86-5.32-20.86c-.24-.92-.51-1.83-.83-2.71,10.93-15.61,22.05-24.99,30.42-30.46.89.32,1.81.6,2.74.84l20.85,5.33Z" fill="#001d3a" opacity=".05"/><path d="M86.829,96.265c-7.265,2.09-12.868,7.753-13.42,15.45-.53,7.392-3.983,13.937-10.04,16.73-3.16-2.42-6.82-4.22-10.81-5.24l-20.85-5.32,20.85-5.33c10.64-2.72,18.96-11.03,21.68-21.68l5.32-20.85,5.33,20.85c.48,1.87,1.13,3.68,1.94,5.39Z" fill="#fff" opacity=".3"/></g></g></svg>'

];

// Same full palette as the Lemonade Stand game's randomStarSVG() (2026-09-11,
// per Kayla) -- one blue anchors it back to the brand, then the fully
// saturated version of each secondary color, so a burst reads as a proper
// rainbow shower instead of one hue.
const STAR_TONES = [
    "#258BFF",
    "#FF2525",
    "#FF25BA",
    "#FF9D25",
    "#FFF025",
    "#49FF25",
    "#9D25FF"
];

function randomStarSVG() {

    const template =
        STAR_SVGS[
            Math.floor(Math.random() * STAR_SVGS.length)
        ];

    const tone =
        STAR_TONES[
            Math.floor(Math.random() * STAR_TONES.length)
        ];

    // Every star in STAR_SVGS shares this one #8fcefa base fill for its
    // main facets -- swapping it here recolors the whole star while
    // leaving its dark shadow / white highlight facets (what actually
    // give it its shape) untouched.
    return template.split("#8fcefa").join(tone);

}


function createSparkleBurst() {

    const piggyRect = piggyBank.getBoundingClientRect();

    const gameRect = gameArea.getBoundingClientRect();

    // #game-area is scaled down to fit the window (see the responsive
    // transform on #game-area in style.css), so gameRect/piggyRect are in
    // real screen pixels -- convert back into the stage's own unscaled
    // pixels before using them as a "left"/"top" position, same fix as
    // the drag handler above, or the burst lands off-center from the
    // piggy bank on any screen where the stage isn't shown at 100% scale.
    const scale = gameRect.width / gameArea.offsetWidth;


    const centerX =
        (piggyRect.left +
        piggyRect.width / 2 -
        gameRect.left) / scale;


    const centerY =
        (piggyRect.top +
        piggyRect.height / 2 -
        gameRect.top) / scale;


    for (let i = 0; i < 8; i++) {

        const sparkle = document.createElement("div");

        sparkle.classList.add("catch-sparkle");

        sparkle.innerHTML = randomStarSVG();


        sparkle.style.left = `${centerX}px`;

        sparkle.style.top = `${centerY}px`;


        const angle =
            Math.random() *
            Math.PI *
            2;


        const distance =
            50 +
            Math.random() *
            80;


        const endX =
            Math.cos(angle) *
            distance;


        const endY =
            Math.sin(angle) *
            distance;


        sparkle.style.setProperty(
            "--sparkle-x",
            `${endX}px`
        );


        sparkle.style.setProperty(
            "--sparkle-y",
            `${endY}px`
        );


        gameArea.appendChild(sparkle);


        setTimeout(() => {

            sparkle.remove();

        }, 600);

    }

}


/* ========================================
   CREATE COIN
======================================== */

function createCoin() {

    if (
        !gameRunning ||
        coins.length >= MAX_COINS
    ) {
        return;
    }


    const coinElement =
        document.createElement("div");

    coinElement.classList.add("falling-coin");


    /* ------------------------------------
       PICK RANDOM COIN
    ------------------------------------ */

    const randomIndex =
        Math.floor(
            Math.random() *
            coinTypes.length
        );


    const coinType =
        coinTypes[randomIndex];


    /* ------------------------------------
       CREATE IMAGE
    ------------------------------------ */

    const coinImage =
        document.createElement("img");


    coinImage.src =
        coinType.image;


    /*
       IMPORTANT:

       Don't display "Falling coin" if
       an image can't be found.
    */

    coinImage.alt = "";


    /*
       If an image filename is wrong,
       remove the broken coin instead of
       showing a little text box.
    */

    coinImage.onerror = () => {

        console.warn(
            `Could not load coin image: ${coinType.image}`
        );

        removeCoin(coin);

    };


    coinElement.appendChild(coinImage);


    /* ------------------------------------
       FIXED SIZE
    ------------------------------------ */

    coinElement.style.width =
        `${coinType.size}px`;

    coinElement.style.height =
        `${coinType.size}px`;


    /* ------------------------------------
       ADD TO GAME
    ------------------------------------ */

    gameArea.appendChild(coinElement);


    /* ------------------------------------
       RANDOM X POSITION
    ------------------------------------ */

    const gameWidth =
        gameArea.clientWidth;


    const randomX =
        Math.random() *
        (gameWidth - coinType.size);


    /* ------------------------------------
       RANDOM FALLING SPEED
    ------------------------------------ */

    const speed =
        2 +
        Math.random() *
        4;


    /* ------------------------------------
       COIN OBJECT
    ------------------------------------ */

    const coin = {

        element: coinElement,

        x: randomX,

        y: -coinType.size,

        speed: speed,

        value: coinType.value,

        size: coinType.size

    };


    coinElement.style.left =
        `${coin.x}px`;

    coinElement.style.top =
        `${coin.y}px`;


    coins.push(coin);

}


/* ========================================
   REMOVE COIN
======================================== */

function removeCoin(coin) {

    if (
        coin &&
        coin.element &&
        coin.element.parentNode
    ) {

        coin.element.remove();

    }


    const index =
        coins.indexOf(coin);


    if (index !== -1) {

        coins.splice(index, 1);

    }

}


/* ========================================
   CHECK COLLISION
======================================== */

function checkCollision(coin) {

    const coinRect =
        coin.element.getBoundingClientRect();

    const piggyRect =
        piggyBank.getBoundingClientRect();


    return (

        coinRect.left <
        piggyRect.right &&

        coinRect.right >
        piggyRect.left &&

        coinRect.top <
        piggyRect.bottom &&

        coinRect.bottom >
        piggyRect.top

    );

}


/* ========================================
   UPDATE COINS
======================================== */

function updateCoins() {

    if (!gameRunning) {
        return;
    }


    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin = coins[i];


        /* Move coin */

        coin.y += coin.speed;


        coin.element.style.top =
            `${coin.y}px`;


        /* Check collision */

        if (checkCollision(coin)) {

            score += coin.value / 100;

            updateScore();


            /* Show amount caught */

            showEarnedAmount(
                coin.value
            );


            /* Sparkle */

            createSparkleBurst();


            /* Remove coin */

            removeCoin(coin);

            continue;

        }


        /* Remove coin if it falls
           off the bottom */

        if (
            coin.y >
            gameArea.clientHeight
        ) {

            removeCoin(coin);

        }

    }


    coinLoopId = requestAnimationFrame(updateCoins);

}


/* ========================================
   END GAME
======================================== */

function endGame() {

    gameRunning = false;

    isDragging = false;


    clearInterval(timerInterval);

    clearInterval(coinSpawnInterval);


    /* Remove remaining coins */

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        removeCoin(coins[i]);

    }


    /* Final score */

    finalScore.textContent =
        `$${score.toFixed(2)}`;


    /* Show results */

    resultsScreen.style.display =
        "flex";

}


/* ========================================
   START NEW GAME
======================================== */

function startNewGame() {

    /* Stop whatever the previous round left running (timer, spawner,
       animation loop, queued opening coins) so only one of each exists. */
    stopRound();

    score = 0;

    timeRemaining = 30;

    gameRunning = true;


    updateScore();

    updateTimer();


    /* Reset top message */

    if (earnedDisplay) {
        earnedDisplay.textContent =
            "Catch a coin!";
    }


    /* Hide results */

    resultsScreen.style.display =
        "none";


    /* Hide start screen */

    if (startScreen) {
        startScreen.style.display =
            "none";
    }


    /* Remove old coins */

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        removeCoin(coins[i]);

    }


    /* Start with several coins */

    createCoin();


    openingCoinTimers.push(setTimeout(() => {

        if (gameRunning) {
            createCoin();
        }

    }, 500));


    openingCoinTimers.push(setTimeout(() => {

        if (gameRunning) {
            createCoin();
        }

    }, 1000));


    /* Continue spawning */

    clearInterval(coinSpawnInterval);


    coinSpawnInterval =
        setInterval(() => {

            if (gameRunning) {

                createCoin();

            }

        }, 900);


    /* Start timer */

    startTimer();


    /* Start animation (exactly one loop -- stopRound() above cancelled
       any previous one) */

    coinLoopId = requestAnimationFrame(
        updateCoins
    );

}


/* ========================================
   STOP ROUND
   Halts everything a round has running and
   clears the coins off screen. Used by
   startNewGame() and the top bar restart.
======================================== */

function stopRound() {

    gameRunning = false;

    isDragging = false;

    clearInterval(timerInterval);

    clearInterval(coinSpawnInterval);

    if (coinLoopId !== null) {
        cancelAnimationFrame(coinLoopId);
        coinLoopId = null;
    }

    openingCoinTimers.forEach(clearTimeout);
    openingCoinTimers = [];

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        removeCoin(coins[i]);

    }

}


/* ========================================
   RESTART TO START SCREEN
   Top bar restart: a real start-over, same
   as Driver Decides -- stops the round,
   resets score and timer, and brings back
   the intro popup so the player taps Start
   to begin again.
======================================== */

function restartGame() {

    stopRound();

    score = 0;

    timeRemaining = 30;

    updateScore();

    updateTimer();

    if (earnedDisplay) {
        earnedDisplay.textContent =
            "Catch a coin!";
    }

    resultsScreen.style.display =
        "none";

    if (startScreen) {
        startScreen.style.display =
            "flex";
    }

}


/* ========================================
   PLAY AGAIN
======================================== */

playAgainButton.addEventListener(
    "click",
    () => {

        startNewGame();

    }
);


/* ========================================
   TOP BAR RESTART BUTTON

   Stops the round and returns to the intro
   popup (see restartGame above).
======================================== */

if (restartButton) {

    restartButton.addEventListener(
        "click",
        () => {

            restartGame();

        }
    );

}


/* ========================================
   START SCREEN

   Show the welcome popup on load instead of
   dropping straight into play. The round
   itself only begins once Start is tapped.
======================================== */

updateScore();
updateTimer();

if (startScreen) {

    startScreen.style.display = "flex";

}

if (startButton) {

    startButton.addEventListener(
        "click",
        () => {

            startNewGame();

        }
    );

}