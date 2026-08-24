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


/* ========================================
   GAME VARIABLES
======================================== */

let isDragging = false;
let score = 0;
let timeRemaining = 30;
let gameRunning = true;

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

    let x = event.clientX - gameRect.left;

    const piggyWidth = piggyBank.offsetWidth;

    const halfPiggyWidth = piggyWidth / 2;


    if (x < halfPiggyWidth) {
        x = halfPiggyWidth;
    }


    if (x > gameRect.width - halfPiggyWidth) {
        x = gameRect.width - halfPiggyWidth;
    }


    piggyBank.style.left = `${x}px`;

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

    earnedDisplay.textContent = `+${coinValue}¢`;

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
======================================== */

function createSparkleBurst() {

    const piggyRect = piggyBank.getBoundingClientRect();

    const gameRect = gameArea.getBoundingClientRect();


    const centerX =
        piggyRect.left +
        piggyRect.width / 2 -
        gameRect.left;


    const centerY =
        piggyRect.top +
        piggyRect.height / 2 -
        gameRect.top;


    const sparkleEmojis = [
        "✨",
        "⭐",
        "💫"
    ];


    for (let i = 0; i < 8; i++) {

        const sparkle = document.createElement("div");

        sparkle.classList.add("catch-sparkle");


        sparkle.textContent =
            sparkleEmojis[
                Math.floor(
                    Math.random() *
                    sparkleEmojis.length
                )
            ];


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


    requestAnimationFrame(updateCoins);

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

    score = 0;

    timeRemaining = 30;

    gameRunning = true;


    updateScore();

    updateTimer();


    /* Reset top message */

    earnedDisplay.textContent =
        "Catch a coin!";


    /* Hide results */

    resultsScreen.style.display =
        "none";


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


    setTimeout(() => {

        if (gameRunning) {
            createCoin();
        }

    }, 500);


    setTimeout(() => {

        if (gameRunning) {
            createCoin();
        }

    }, 1000);


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


    /* Start animation */

    requestAnimationFrame(
        updateCoins
    );

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
   START GAME
======================================== */

startNewGame();