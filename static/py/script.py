# pyright: reportMissingImports=false
try:
    from js import document
    from pyodide.http import pyfetch
    from pyscript import when
except ImportError:
    print("Warning: PyScript is only available in a browser environment.")

import json

# Get HTML elements
board_element = document.getElementById("sudoku-board")
strike_counter_element = document.getElementById("strike-counter")

solution = []
strikes = 0

async def fetch_sudoku(event=None):
    """Fetches a new Sudoku puzzle from Flask API and updates the board."""
    global strikes
    strikes = 0
    strike_counter_element.innerText = f"Strikes: {strikes}"

    difficulty = document.querySelector("#difficulty").value
    response = await pyfetch(f"/start_game?difficulty={difficulty}", method="GET", headers={"Content-Type": "application/json"})
    data = await response.json()
    
    create_board(data["board"], data["solution"])

def create_board(board, solved_board):
    """Creates and renders the Sudoku board in the UI."""
    global solution
    solution = solved_board
    board_element.innerHTML = ""  # Clear the board before rendering a new one

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

                # Use a closure function to correctly capture the number value
                def make_highlight_func(num):
                    return lambda event: highlight_numbers(num)

                input_element.onclick = make_highlight_func(input_element.value)
            else:
                input_element.setAttribute("oninput", "handle_input(event)")

            if i % 3 == 0 and i != 0:
                input_element.classList.add("bold-border-top")
            if j % 3 == 0 and j != 0:
                input_element.classList.add("bold-border-left")

            board_element.appendChild(input_element)

def handle_input(event):
    """Handles user input for Sudoku cells."""
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

        # Ensure highlight functionality works for newly placed numbers
        def make_highlight_func(num):
            return lambda event: highlight_numbers(num)

        input_element.onclick = make_highlight_func(value)
    else:
        input_element.value = ""
        strikes += 1
        strike_counter_element.innerText = f"Strikes: {strikes}"

def highlight_numbers(number):
    """Highlights all occurrences of the selected number."""
    inputs = document.querySelectorAll(".sudoku-board input")
    for input_element in inputs:
        input_element.classList.remove("highlight")
        if input_element.value == str(number):
            input_element.classList.add("highlight")

# Reset highlights when clicking outside the board
when("click", "body", lambda event: (
    [input_element.classList.remove("highlight") for input_element in document.querySelectorAll(".sudoku-board input")]
    if not event.target.matches("input:disabled, .correct") else None
))

# Attach event listener for starting the game
when("click", "#startGameBtn", fetch_sudoku)
