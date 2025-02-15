document.addEventListener("DOMContentLoaded", () => {
    const boardElement = document.getElementById("sudoku-board");
    const strikeCounterElement = document.getElementById("strike-counter");
    const startGameBtn = document.getElementById("startGameBtn");
    const timerElement = document.getElementById("timer");
    const pauseBtn = document.getElementById("pauseBtn"); // Pause button
    
    let solution = [];
    let strikes = 0;
    let timerInterval;
    let secondsElapsed = 0;
    let isPaused = false;

    function createBoard(board, solvedBoard) {
        boardElement.innerHTML = ""; // Clear the board before rendering
        solution = solvedBoard;

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
                    input.addEventListener("click", () => highlightNumbers(input.value));
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
    }

    function startGame() {
        const difficulty = document.getElementById("difficulty").value;
        strikes = 0;
        strikeCounterElement.textContent = `${strikes}`; // Reset only the number

        resetTimer(); // Reset timer when a new game starts
        startTimer(); // Start timer
        isPaused = false;
        pauseBtn.innerHTML = `<i class="fas fa-pause"></i>`; // Default to pause icon

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
            input.addEventListener("click", () => highlightNumbers(value));
        } else {
            input.value = "";
            strikes++;
            strikeCounterElement.textContent = `${strikes}`; // Update only the number
        }
    }

    function highlightNumbers(number) {
        const inputs = document.querySelectorAll(".sudoku-board input");
        inputs.forEach(input => {
            input.classList.remove("highlight");
            if (input.value == number) {
                input.classList.add("highlight");
            }
        });
    }

    document.addEventListener("click", event => {
        if (!event.target.matches("input:disabled")) {
            document.querySelectorAll(".sudoku-board input").forEach(input => {
                input.classList.remove("highlight");
            });
        }
    });

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
            ? `<i class="fas fa-play"></i>` // Play icon when paused
            : `<i class="fas fa-pause"></i>`; // Pause icon when running
    }

    startGameBtn.addEventListener("click", startGame);
    pauseBtn.addEventListener("click", togglePause);
});
