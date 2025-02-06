from flask import Flask, render_template, request, jsonify
import random
import copy

app = Flask(__name__, static_url_path='', static_folder='static', template_folder='templates')

# Generate a complete Sudoku board
def fill_board(board):
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

# Check if a number placement is valid
def is_valid(board, row, col, num):
    for i in range(9):
        if board[row][i] == num or board[i][col] == num:
            return False
    start_row, start_col = 3 * (row // 3), 3 * (col // 3)
    for i in range(start_row, start_row + 3):
        for j in range(start_col, start_col + 3):
            if board[i][j] == num:
                return False
    return True

# Generate puzzle by removing numbers
def generate_puzzle(difficulty):
    board = [[0 for _ in range(9)] for _ in range(9)]
    fill_board(board)
    solution = copy.deepcopy(board)
    num_clues = {"easy": 40, "medium": 30, "hard": 20}[difficulty]
    cells_to_remove = 81 - num_clues

    removed_cells = set()
    while len(removed_cells) < cells_to_remove:
        i, j = random.randint(0, 8), random.randint(0, 8)
        if (i, j) not in removed_cells:
            board[i][j] = 0
            removed_cells.add((i, j))

    return board, solution

@app.route('/')
def index():
    return render_template('sudoku.html')

@app.route('/start_game')
def start_game():
    difficulty = request.args.get('difficulty', 'easy')
    board, solution = generate_puzzle(difficulty)
    app.config['solution'] = solution
    return jsonify({"board": board, "solution": solution})

@app.route('/check_solution', methods=['POST'])
def check_solution():
    user_board = request.json.get('board')
    solution = app.config.get('solution')

    if user_board == solution:
        return jsonify({"correct": True})
    else:
        return jsonify({"correct": False})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')
