const piggyBank = document.getElementById("piggy-bank");
const gameArea = document.getElementById("game-area");


// ========================================
// GAME VARIABLES
// ========================================

let isDragging = false;

let score = 0;

let timeRemaining = 30;

let gameRunning = true;

let timerInterval;

let coinSpawnInterval;

const coinValues = [1, 5, 10, 25, 50];

const coins = [];

const MAX_COINS = 6;


// ========================================
// PIGGY BANK DRAGGING
// ========================================

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

    const gameRect =
        gameArea.getBoundingClientRect();

    let x =
        event.clientX - gameRect.left;

    const piggyWidth =
        piggyBank.offsetWidth;

    const halfPiggyWidth =
        piggyWidth / 2;


    if (x < halfPiggyWidth) {
        x = halfPiggyWidth;
    }


    if (
        x >
        gameRect.width - halfPiggyWidth
    ) {
        x =
            gameRect.width - halfPiggyWidth;
    }


    piggyBank.style.left =
        `${x}px`;

});


piggyBank.addEventListener("pointerup", (event) => {

    isDragging = false;

    piggyBank.releasePointerCapture(
        event.pointerId
    );

});


piggyBank.addEventListener("pointercancel", () => {

    isDragging = false;

});


// ========================================
// SCORE
// ========================================

function updateScore() {

    const scoreDisplay =
        document.getElementById("score");

    scoreDisplay.textContent =
        `$${score.toFixed(2)}`;

}


// ========================================
// TIMER
// ========================================

function updateTimer() {

    const timerDisplay =
        document.getElementById("timer");

    timerDisplay.textContent =
        timeRemaining;

}


function startTimer() {

    clearInterval(timerInterval);

    timerInterval =
        setInterval(() => {

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


// ========================================
// END GAME
// ========================================

function endGame() {

    gameRunning = false;

    isDragging = false;

    clearInterval(timerInterval);

    clearInterval(coinSpawnInterval);


    // Remove coins

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        removeCoin(coins[i]);

    }


    // Show final score

    const finalScore =
        document.getElementById(
            "final-score"
        );

    finalScore.textContent =
        `$${score.toFixed(2)}`;


    // Show results screen

    const resultsScreen =
        document.getElementById(
            "results-screen"
        );

    resultsScreen.style.display =
        "flex";

}


// ========================================
// PLAY AGAIN
// ========================================

document
    .getElementById("play-again")
    .addEventListener("click", () => {

        startNewGame();

    });


// ========================================
// START NEW GAME
// ========================================

function startNewGame() {

    // Reset everything

    score = 0;

    timeRemaining = 30;

    gameRunning = true;


    updateScore();

    updateTimer();


    // Hide results

    const resultsScreen =
        document.getElementById(
            "results-screen"
        );

    resultsScreen.style.display =
        "none";


    // Remove any leftover coins

    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        removeCoin(coins[i]);

    }


    // Create starting coins

    createCoin();

    setTimeout(
        createCoin,
        500
    );

    setTimeout(
        createCoin,
        1000
    );


    // Start spawning coins

    coinSpawnInterval =
        setInterval(() => {

            createCoin();

        }, 900);


    // Start timer

    startTimer();


    // IMPORTANT:
    // Restart the coin animation loop

    requestAnimationFrame(updateCoins);

}


// ========================================
// CATCH SPARKLE EFFECT
// ========================================

function createSparkleBurst() {

    const piggyRect =
        piggyBank.getBoundingClientRect();

    const gameRect =
        gameArea.getBoundingClientRect();


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

        const sparkle =
            document.createElement("div");


        sparkle.classList.add(
            "catch-sparkle"
        );


        sparkle.textContent =
            sparkleEmojis[
                Math.floor(
                    Math.random() *
                    sparkleEmojis.length
                )
            ];


        sparkle.style.left =
            `${centerX}px`;

        sparkle.style.top =
            `${centerY}px`;


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


        gameArea.appendChild(
            sparkle
        );


        setTimeout(() => {

            sparkle.remove();

        }, 600);

    }

}


// ========================================
// CREATE COIN
// ========================================

function createCoin() {

    if (
        !gameRunning ||
        coins.length >= MAX_COINS
    ) {
        return;
    }


    const coinElement =
        document.createElement("div");


    coinElement.classList.add(
        "falling-coin"
    );


    // ----------------------------------------
    // RANDOM COIN VALUE
    // ----------------------------------------

    const randomIndex =
        Math.floor(
            Math.random() *
            coinValues.length
        );


    const value =
        coinValues[randomIndex];


    coinElement.textContent =
        `${value}¢`;


    // ----------------------------------------
    // RANDOM COIN SIZE
    // ----------------------------------------

    // Coins will be between 65px and 105px

    const size =
        65 +
        Math.random() * 40;


    coinElement.style.width =
        `${size}px`;

    coinElement.style.height =
        `${size}px`;


    // Scale the text with the coin

    coinElement.style.fontSize =
        `${size * 0.30}px`;


    // ----------------------------------------
    // ADD COIN TO GAME
    // ----------------------------------------

    gameArea.appendChild(
        coinElement
    );


    // ----------------------------------------
    // RANDOM HORIZONTAL POSITION
    // ----------------------------------------

    const gameWidth =
        gameArea.clientWidth;


    const randomX =
        Math.random() *
        (gameWidth - size);


    // ----------------------------------------
    // RANDOM FALLING SPEED
    // ----------------------------------------

    const speed =
        2 +
        Math.random() * 4;


    // ----------------------------------------
    // CREATE COIN OBJECT
    // ----------------------------------------

    const coin = {

        element:
            coinElement,

        x:
            randomX,

        y:
            -size,

        speed:
            speed,

        value:
            value,

        size:
            size

    };


    coinElement.style.left =
        `${coin.x}px`;

    coinElement.style.top =
        `${coin.y}px`;


    coins.push(coin);

}


// ========================================
// REMOVE COIN
// ========================================

function removeCoin(coin) {

    coin.element.remove();


    const index =
        coins.indexOf(coin);


    if (index !== -1) {

        coins.splice(
            index,
            1
        );

    }

}


// ========================================
// COLLISION DETECTION
// ========================================

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


// ========================================
// UPDATE COINS
// ========================================

function updateCoins() {

    // Stop this animation loop
    // when the game ends

    if (!gameRunning) {
        return;
    }


    for (
        let i = coins.length - 1;
        i >= 0;
        i--
    ) {

        const coin =
            coins[i];


        // Move coin

        coin.y +=
            coin.speed;


        coin.element.style.top =
            `${coin.y}px`;


        // Check collision

        if (
            checkCollision(coin)
        ) {

            score +=
                coin.value / 100;


            updateScore();


            createSparkleBurst();


            removeCoin(coin);


            continue;

        }


        // Remove coin at bottom

        if (
            coin.y >
            gameArea.clientHeight
        ) {

            removeCoin(coin);

        }

    }


    requestAnimationFrame(
        updateCoins
    );

}


// ========================================
// START GAME
// ========================================

startNewGame();