document.addEventListener("DOMContentLoaded", () => {
    const boardElement = document.getElementById("sudoku-board");
    const strikeCounterElement = document.getElementById("strike-counter");
    const startGameBtn = document.getElementById("startGameBtn");
    let solution = [];
    let strikes = 0;

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
        strikeCounterElement.textContent = `Strikes: ${strikes}`;

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
            input.classList.add("correct");
            input.disabled = true;
            input.addEventListener("click", () => highlightNumbers(value));
        } else {
            input.value = "";
            strikes++;
            strikeCounterElement.textContent = `Strikes: ${strikes}`;
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
        if (!event.target.matches("input:disabled, .correct")) {
            document.querySelectorAll(".sudoku-board input").forEach(input => {
                input.classList.remove("highlight");
            });
        }
    });

    startGameBtn.addEventListener("click", startGame);
});