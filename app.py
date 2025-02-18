"""
Sudoku Project - app.py
Description: Flask application for serving the Sudoku game. This script handles board generation,
game initialization, solution verification, and secure serving of static PyScript files.
"""

from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
import random
import copy
import os

app = Flask(__name__, static_url_path='/static', static_folder='static', template_folder='templates')

# SQLAlchemy configuration for persistent leaderboard
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///leaderboard.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

class LeaderboardEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    difficulty = db.Column(db.String(10), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    time = db.Column(db.String(10), nullable=False)
    strikes = db.Column(db.Integer, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "difficulty": self.difficulty,
            "name": self.name,
            "time": self.time,
            "strikes": self.strikes
        }

# fill_board Function: Recursively fills a Sudoku board using backtracking.
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

# is_valid Function: Checks if a number placement is valid according to Sudoku rules.
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

# generate_puzzle Function: Generates a Sudoku puzzle by removing numbers from a fully solved board based on difficulty.
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

    return puzzle_with_meta, solution

# index Route: Renders the main Sudoku game page.
@app.route('/')
def index():
    """Renders the main Sudoku game page."""
    return render_template('sudoku.html')

# start_game Route: Initializes a new game with the specified difficulty and returns the puzzle and solution as JSON.
@app.route('/start_game')
def start_game():
    """Starts a new game with the selected difficulty."""
    difficulty = request.args.get('difficulty', 'medium')  # Default to medium if invalid
    if difficulty not in ["easy", "medium", "hard"]:
        return jsonify({"error": "Invalid difficulty level"}), 400  # Return 400 Bad Request

    board, solution = generate_puzzle(difficulty)
    
    # Store a JSON-serializable copy of the solution
    app.config['solution'] = [[cell for cell in row] for row in solution]

    return jsonify({"board": board, "solution": app.config["solution"]})

# check_solution Route: Verifies if the submitted board matches the stored solution.
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

# get_solution Route: Provides the stored solution for debugging purposes.
@app.route('/get_solution')
def get_solution():
    """Returns the stored solution for debugging purposes."""
    solution = app.config.get('solution', None)
    if solution is None:
        return jsonify({"error": "No solution found. Start a game first!"}), 404
    return jsonify({"solution": solution})

# serve_pyscript Route: Serves PyScript Python files securely from the designated static directory.
@app.route('/static/py/<path:filename>')
def serve_pyscript(filename):
    """Serves PyScript Python files securely."""
    safe_directory = os.path.join(app.static_folder, 'py')
    return send_from_directory(safe_directory, filename)

# update_leaderboard Route: Receives a leaderboard entry and updates the persistent leaderboard.
@app.route('/update_leaderboard', methods=['POST'])
def update_leaderboard():
    data = request.json
    difficulty = data.get('difficulty')
    name = data.get('name')
    time_value = data.get('time')
    strikes = data.get('strikes')

    if not (difficulty and name and time_value is not None and strikes is not None):
        return jsonify({"error": "Missing data"}), 400

    new_entry = LeaderboardEntry(
        difficulty=difficulty,
        name=name,
        time=time_value,
        strikes=strikes
    )
    db.session.add(new_entry)
    db.session.commit()

    # Trim the leaderboard: Keep only the top 5 entries per difficulty.
    entries = LeaderboardEntry.query.filter_by(difficulty=difficulty).order_by(
        LeaderboardEntry.strikes, LeaderboardEntry.time
    ).all()
    if len(entries) > 5:
        for entry in entries[5:]:
            db.session.delete(entry)
        db.session.commit()

    return jsonify({"success": True})

# get_leaderboard Route: Fetches the persistent leaderboard data for all difficulties.
@app.route('/get_leaderboard')
def get_leaderboard():
    leaderboard = {"easy": [], "medium": [], "hard": []}
    for diff in ["easy", "medium", "hard"]:
        entries = LeaderboardEntry.query.filter_by(difficulty=diff).order_by(
            LeaderboardEntry.strikes, LeaderboardEntry.time
        ).all()
        leaderboard[diff] = [entry.to_dict() for entry in entries]
    return jsonify({"leaderboard": leaderboard})

if __name__ == '__main__':
    db.create_all()
    app.run(debug=True, host='0.0.0.0')
