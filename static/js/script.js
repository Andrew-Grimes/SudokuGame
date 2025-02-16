document.addEventListener("DOMContentLoaded", () => {
    const boardElement = document.getElementById("sudoku-board");
    const strikeCounterElement = document.getElementById("strike-counter");
    const startGameBtn = document.getElementById("startGameBtn");
    const timerElement = document.getElementById("timer");
    const pauseBtn = document.getElementById("pauseBtn");
    const numButtons = document.querySelectorAll(".num-btn");
    const winModal = document.getElementById("win-modal");
    const winMessage = document.getElementById("win-message");
    const winDetails = document.getElementById("win-details");
    const closeWinModalBtn = document.getElementById("closeWinModal");
    const playAgainBtn = document.getElementById("playAgainBtn");

    let solution = [];
    let strikes = 0;
    let timerInterval;
    let secondsElapsed = 0;
    let isPaused = false;
    let selectedNumber = null;
    let numberCounts = {};

    function createBoard(board, solvedBoard) {
        boardElement.innerHTML = "";
        solution = solvedBoard;
        numberCounts = {};

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                const input = document.createElement("input");
                input.type = "text";
                input.maxLength = 1;
                input.dataset.row = i;
                input.dataset.col = j;

                if (board[i][j].prefilled) {
                    input.value = board[i][j].value;
                    input.disabled = true;
                    input.classList.add("prefilled");
                    numberCounts[input.value] = (numberCounts[input.value] || 0) + 1;
                } else {
                    input.addEventListener("input", handleInput);
                }

                if (i % 3 === 0 && i !== 0) {
                    input.classList.add("bold-border-top");
                }
                if (j % 3 === 0 && j !== 0) {
                    input.classList.add("bold-border-left");
                }

                boardElement.appendChild(input);
            }
        }

        updateNumberButtons();
    }

    function startGame() {
        const difficulty = document.getElementById("difficulty").value;
        strikes = 0;
        strikeCounterElement.textContent = `${strikes}`;

        resetTimer();
        startTimer();
        isPaused = false;
        pauseBtn.innerHTML = `<i class="fas fa-pause"></i>`;

        // ✅ Reset Number Buttons (Removes Crossed-Out State)
        numButtons.forEach(button => {
            button.classList.remove("selected-num", "crossed-out");
            button.disabled = false;
        });

        selectedNumber = null;

        // ✅ Remove any existing highlights
        document.querySelectorAll(".sudoku-board input").forEach(input => {
            input.classList.remove("highlight");
        });

        // ✅ Hide the win modal if it's open
        winModal.style.display = "none";

        fetch(`/start_game?difficulty=${difficulty}`)
            .then(response => response.json())
            .then(data => {
                createBoard(data.board, data.solution);
            })
            .catch(error => console.error("Error fetching Sudoku board:", error));
    }

    function handleInput(event) {
        const input = event.target;
        const row = parseInt(input.dataset.row);
        const col = parseInt(input.dataset.col);
        const value = input.value.trim();

        if (!/^\d$/.test(value)) {
            input.value = "";
            return;
        }

        if (parseInt(value) === solution[row][col]) {
            input.disabled = true;
            numberCounts[value] = (numberCounts[value] || 0) + 1;
            updateNumberButtons();
            checkCompletion();
            if (selectedNumber === value) {
                highlightNumbers(value);
            }
        } else {
            input.value = "";
            strikes++;
            strikeCounterElement.textContent = `${strikes}`;
        }
    }

    function highlightNumbers(number) {
        const inputs = document.querySelectorAll(".sudoku-board input");
        inputs.forEach(input => input.classList.remove("highlight"));
        numButtons.forEach(btn => btn.classList.remove("highlight", "selected-num"));

        if (!number) return;

        inputs.forEach(input => {
            if (input.value === number) {
                input.classList.add("highlight");
            }
        });

        numButtons.forEach(btn => {
            if (btn.dataset.num === number && !btn.classList.contains("crossed-out")) {
                btn.classList.add("selected-num");
            }
        });
    }

    function updateNumberButtons() {
        Object.keys(numberCounts).forEach(num => {
            if (numberCounts[num] === 9) {
                const btn = document.querySelector(`.num-btn[data-num="${num}"]`);
                if (btn) {
                    btn.classList.add("crossed-out");
                    btn.disabled = true;
                    btn.classList.remove("selected-num");
                }
            }
        });
    }

    function checkCompletion() {
        const inputs = document.querySelectorAll(".sudoku-board input");
        let allFilled = true;
        
        inputs.forEach(input => {
            if (!input.disabled || input.value === "") {
                allFilled = false;
            }
        });

        if (allFilled) {
            clearInterval(timerInterval);
            showWinScreen();
        }
    }

    function showWinScreen() {
        const difficulty = document.getElementById("difficulty").value;
        const formattedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

        winMessage.innerHTML = `🎉 Congrats! You beat <u>${formattedDifficulty}</u> mode!`;
        winDetails.textContent = `Final Time: ${timerElement.textContent} | Strikes: ${strikes}`;

        winModal.style.display = "flex"; // Show modal
    }

    function closeWinScreen() {
        winModal.style.display = "none";
    }

    /* Timer Functions */
    function formatTime(time) {
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    function startTimer() {
        secondsElapsed = 0;
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (!isPaused) {
                secondsElapsed++;
                timerElement.textContent = formatTime(secondsElapsed);
            }
        }, 1000);
    }

    function resetTimer() {
        clearInterval(timerInterval);
        secondsElapsed = 0;
        timerElement.textContent = "00:00";
    }

    function togglePause() {
        isPaused = !isPaused;
        pauseBtn.innerHTML = isPaused
            ? `<i class="fas fa-play"></i>`
            : `<i class="fas fa-pause"></i>`;
    }

    numButtons.forEach(button => {
        button.addEventListener("click", () => {
            if (button.classList.contains("crossed-out")) return;
            if (selectedNumber === button.dataset.num) {
                selectedNumber = null;
                highlightNumbers(null);
            } else {
                selectedNumber = button.dataset.num;
                highlightNumbers(selectedNumber);
            }
        });
    });

    startGameBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
    closeWinModalBtn.addEventListener("click", closeWinScreen);
    playAgainBtn.addEventListener("click", startGame);
});
