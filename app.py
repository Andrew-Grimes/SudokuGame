from flask import Flask, render_template, request, jsonify, send_from_directory
import random
import copy
import os

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

def fill_board(board):
    """Recursively fills a Sudoku board using backtracking."""
    numbers = list(range(1, 10))
    for i in range(9):
        for j in range(9):
            if board[i][j] == 0:
                random.shuffle(numbers)
                for num in numbers:
                    if is_valid(board, i, j, num):
                        board[i][j] = num
                        if fill_board(board):
                            return True
                        board[i][j] = 0
                return False
    return True

def is_valid(board, row, col, num):
    """Checks if a number placement is valid in Sudoku rules."""
    for i in range(9):
        if board[row][i] == num or board[i][col] == num:
            return False
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(start_row, start_row + 3):
        for j in range(start_col, start_col + 3):
            if board[i][j] == num:
                return False
    return True

def generate_puzzle(difficulty):
    """Generates a Sudoku puzzle by removing numbers from a completed board."""
    board = [[0 for _ in range(9)] for _ in range(9)]
    fill_board(board)
    solution = copy.deepcopy(board)

    difficulty_levels = {"easy": 40, "medium": 30, "hard": 20}
    num_clues = difficulty_levels.get(difficulty, 30)  # Default to "medium" if invalid input
    cells_to_remove = 81 - num_clues

    removed_cells = set()
    while len(removed_cells) < cells_to_remove:
        i, j = random.randint(0, 8), random.randint(0, 8)
        if (i, j) not in removed_cells:
            board[i][j] = 0
            removed_cells.add((i, j))

    puzzle_with_meta = [
        [{'value': board[i][j], 'prefilled': board[i][j] != 0, 'solution': solution[i][j]} for j in range(9)]
        for i in range(9)
    ]

    return puzzle_with_meta, copy.deepcopy(solution)  # Return deep copy to avoid modification issues

@app.route('/')
def index():
    """Renders the main Sudoku game page."""
    return render_template('sudoku.html')

@app.route('/start_game')
def start_game():
    """Starts a new game with the selected difficulty."""
    difficulty = request.args.get('difficulty', 'medium')  # Default to medium if invalid
    board, solution = generate_puzzle(difficulty)
    app.config['solution'] = copy.deepcopy(solution)  # Store a copy to prevent unintended changes
    return jsonify({"board": board, "solution": solution})

@app.route('/check_solution', methods=['POST'])
def check_solution():
    """Checks if the submitted board matches the solution."""
    user_board = request.json.get('board')
    solution = app.config.get('solution')

    if not user_board or not isinstance(user_board, list):
        return jsonify({"error": "Invalid board data"}), 400  # Return 400 for bad requests

    if user_board == solution:
        return jsonify({"correct": True})
    else:
        return jsonify({"correct": False})

@app.route('/static/py/<path:filename>')
def serve_pyscript(filename):
    """Serves PyScript Python files securely."""
    safe_directory = os.path.join(app.static_folder, 'py')
    return send_from_directory(safe_directory, filename)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
