# pyright: reportMissingImports=false
try:
    from js import document, fetch
except ImportError:
    print("Warning: PyScript is only available in a browser environment.")

import json

# Get HTML elements
board_element = document.getElementById("sudoku-board")
strike_counter_element = document.getElementById("strike-counter")
start_game_btn = document.getElementById("startGameBtn")

solution = []
strikes = 0

def create_board(board, solved_board):
    """Creates the Sudoku board in the UI."""
    global solution
    solution = solved_board
    board_element.innerHTML = ""  # Clear the board before updating

    for i in range(9):
        for j in range(9):
            input_element = document.createElement("input")
            input_element.type = "text"
            input_element.maxLength = "1"
            input_element.setAttribute("data-row", str(i))
            input_element.setAttribute("data-col", str(j))

            if board[i][j]["prefilled"]:
                input_element.value = str(board[i][j]["value"])
                input_element.disabled = True
                input_element.classList.add("prefilled")
                input_element.onclick = lambda event, num=input_element.value: highlight_numbers(num)
            else:
                input_element.addEventListener("input", handle_input)

            if i % 3 == 0 and i != 0:
                input_element.classList.add("bold-border-top")
            if j % 3 == 0 and j != 0:
                input_element.classList.add("bold-border-left")

            board_element.appendChild(input_element)

def start_game(event=None):
    """Starts a new Sudoku game by fetching a board from Flask."""
    global strikes
    strikes = 0
    strike_counter_element.innerText = f"Strikes: {strikes}"

    difficulty = document.getElementById("difficulty").value

    fetch(f"/start_game?difficulty={difficulty}").then(
        lambda response: response.json()
    ).then(
        lambda data: create_board(data["board"], data["solution"])
    ).catch(
        lambda error: print(f"Error fetching Sudoku board: {error}")
    )

def handle_input(event):
    """Handles user input for placing numbers."""
    global strikes
    input_element = event.target
    row = int(input_element.getAttribute("data-row"))
    col = int(input_element.getAttribute("data-col"))
    value = input_element.value.strip()

    if not value.isdigit():
        input_element.value = ""
        return

    value = int(value)
    if value == solution[row][col]:
        input_element.classList.add("correct")
        input_element.disabled = True
        input_element.onclick = lambda event, num=value: highlight_numbers(num)
    else:
        input_element.value = ""
        strikes += 1
        strike_counter_element.innerText = f"Strikes: {strikes}"

def highlight_numbers(number):
    """Highlights all cells with the same number."""
    inputs = document.querySelectorAll(".sudoku-board input")
    for input_element in inputs:
        input_element.classList.remove("highlight")
        if input_element.value == str(number):
            input_element.classList.add("highlight")

# Reset highlights when clicking outside the board
document.addEventListener("click", lambda event: (
    [input_element.classList.remove("highlight") for input_element in document.querySelectorAll(".sudoku-board input")]
    if not event.target.matches("input:disabled, .correct") else None
))

# Attach event listener for starting game
if start_game_btn:
    start_game_btn.addEventListener("click", start_game)
