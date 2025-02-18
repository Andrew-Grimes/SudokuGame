/*
  Sudoku Project - script.js
  Description: This script handles all interactive functionalities of the Sudoku game, including board creation, input validation, timer management, pause functionality, win detection, and leaderboard updates.
*/

document.addEventListener("DOMContentLoaded", () => {
    
    // Variable Declarations: Cache DOM elements and initialize game variables.
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
    const leaderboardModal = document.getElementById("leaderboard-modal");
    const leaderboardMessage = document.getElementById("leaderboard-message");
    const leaderboardDetails = document.getElementById("leaderboard-details");
    const playerNameInput = document.getElementById("playerNameInput");
    const submitLeaderboardBtn = document.getElementById("submitLeaderboardBtn");
    const closeLeaderboardModal = document.getElementById("closeLeaderboardModal");
  
    let solution = [];
    let strikes = 0;
    let timerInterval;
    let secondsElapsed = 0;
    let isPaused = false;
    let selectedNumber = null;
    let numberCounts = {};
    let leaderboard = { easy: [], medium: [], hard: [] };
  
    // createBoard Function: Generates the Sudoku board with inputs based on provided board and solution data.
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
  
    // startGame Function: Resets the game state, initializes timer and strikes, and fetches a new board.
    function startGame() {
        const difficulty = document.getElementById("difficulty").value;
        strikes = 0;
        strikeCounterElement.textContent = `${strikes}`;
  
        resetTimer();
        startTimer();
        isPaused = false;
        pauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
  
        // Reset Number Buttons: Remove any previous selected or crossed-out states.
        numButtons.forEach(button => {
            button.classList.remove("selected-num", "crossed-out");
            button.disabled = false;
        });

        selectedNumber = null;
  
        // Remove any existing highlights on board inputs.
        document.querySelectorAll(".sudoku-board input").forEach(input => {
            input.classList.remove("highlight");
        });
  
        updateLeaderboardDisplay();
        winModal.style.display = "none";
        leaderboardModal.style.display = "none";
  
        fetch(`/start_game?difficulty=${difficulty}`)
            .then(response => response.json())
            .then(data => {
                createBoard(data.board, data.solution);
            })
            .catch(error => console.error("Error fetching Sudoku board:", error));
    }
  
    // handleInput Function: Processes and validates user input for each board cell.
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
  
    // highlightNumbers Function: Highlights all board cells and number buttons matching the selected number.
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
  
    // updateNumberButtons Function: Disables a number button when its corresponding number fills all 9 cells.
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
  
    // checkCompletion Function: Checks if all board cells are correctly filled and triggers the win sequence.
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
            saveToLeaderboard();
        }
    }
  
    // saveToLeaderboard Function: Determines if the player's performance qualifies for the leaderboard.
    function saveToLeaderboard() {
        const difficulty = document.getElementById("difficulty").value;
        const finalTime = timerElement.textContent;
  
        if (
            window.location.hostname === "localhost" ||
            window.location.hostname === "127.0.0.1"
        ) {
            showWinScreen();
        } else {
            fetch("/get_leaderboard")
                .then(response => response.json())
                .then(data => {
                    const currentLeaderboard = (data.leaderboard && data.leaderboard[difficulty]) || [];
                    if (
                        currentLeaderboard.length < 5 ||
                        strikes < currentLeaderboard[currentLeaderboard.length - 1].strikes ||
                        (currentLeaderboard.length === 5 &&
                            strikes === currentLeaderboard[4].strikes &&
                            finalTime.localeCompare(currentLeaderboard[4].time) < 0)
                    ) {
                        leaderboardModal.style.display = "flex";
                        leaderboardMessage.innerHTML = `🎉 Congrats! You made the <u>${
                            difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
                        }</u> leaderboard!`;
                        leaderboardDetails.textContent = `Final Time: ${finalTime} | Strikes: ${strikes}`;
                    } else {
                        showWinScreen();
                    }
                })
                .catch(error => {
                    console.error("Error checking leaderboard qualification:", error);
                    showWinScreen();
                });
        }
    }   
  
    // Event Listener: Submits the leaderboard entry when the player enters their name.
    submitLeaderboardBtn.addEventListener("click", () => {
        const playerName = playerNameInput.value.trim() || "Anonymous";
        const difficulty = document.getElementById("difficulty").value;
        const finalTime = timerElement.textContent;
  
        const payload = {
            difficulty: difficulty,
            name: playerName,
            time: finalTime,
            strikes: strikes,
        };

        fetch("/update_leaderboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

            .then(response => response.json())
            .then(data => {
                updateLeaderboardDisplay();
                leaderboardModal.style.display = "none";
            })

            .catch(error => console.error("Error updating leaderboard:", error));
    });
  
    // Event Listener: Closes the leaderboard modal.
    closeLeaderboardModal.addEventListener("click", () => {
        leaderboardModal.style.display = "none";
    });
  
    // updateLeaderboardDisplay Function: Updates the leaderboard tables for all difficulties.
    function updateLeaderboardDisplay() {
        fetch("/get_leaderboard")
            .then((response) => response.json())
            .then((data) => {
                const leaderboard = data.leaderboard;
                const difficulties = ["easy", "medium", "hard"];
                difficulties.forEach(diff => {
                    const table = document.getElementById(`${diff}-leaderboard`);
                    table.innerHTML = `
                        <tr>
                            <th>Player</th>
                            <th>Time</th>
                            <th>Strikes</th>
                        </tr>
                    `;
  
                    if (leaderboard && leaderboard[diff]) {
                        leaderboard[diff].forEach((entry) => {
                            const row = document.createElement("tr");
                            row.innerHTML = `<td>${entry.name}</td><td>${entry.time}</td><td>${entry.strikes}</td>`;
                            table.appendChild(row);
                        });
                    }
                });
            })
            .catch((error) => console.error("Error fetching leaderboard:", error));
    }
  
    // showWinScreen Function: Displays the win modal with final results when the puzzle is completed.
    function showWinScreen() {
        const difficulty = document.getElementById("difficulty").value;
        const formattedDifficulty = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
            difficulty.charAt(0).toUpperCase() + difficulty.slice(1);

        winMessage.innerHTML = `🎉 Congrats! You beat <u>${formattedDifficulty}</u> mode!`;
        winDetails.textContent = `Final Time: ${timerElement.textContent} | Strikes: ${strikes}`;
        winModal.style.display = "flex";
    }
  
    // closeWinScreen Function: Closes the win modal.
    function closeWinScreen() {
        winModal.style.display = "none";
    }
  
    // Timer Functions: Format the time, start the timer, reset it, and toggle the pause state.
    function formatTime(time) {
        let mins = Math.floor(time / 60);
        let secs = time % 60;
        return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
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
  
    // Event Listeners: Handle number selection, game start, pause toggle, and win modal interactions.
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