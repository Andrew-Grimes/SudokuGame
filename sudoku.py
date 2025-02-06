"""

import tkinter as tk
from tkinter import messagebox
import random

class Sudoku:
    def __init__(self, root):
        self.root = root
        self.root.title("Sudoku Game")
        self.root.configure(bg='#f0f0f0')
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.entries = [[None for _ in range(9)] for _ in range(9)]
        self.difficulty = "Easy"
        self.create_widgets()

    def create_widgets(self):
        self.difficulty_label = tk.Label(self.root, text="Select Difficulty:", font=('Arial', 14, 'bold'), bg='#f0f0f0')
        self.difficulty_label.pack(pady=10)

        self.difficulty_var = tk.StringVar(value="Easy")
        self.difficulty_menu = tk.OptionMenu(self.root, self.difficulty_var, "Easy", "Medium", "Hard")
        self.difficulty_menu.config(font=('Arial', 12), bg='#d1e0e0', relief=tk.RAISED)
        self.difficulty_menu.pack(pady=5)

        self.start_button = tk.Button(self.root, text="Start Game", command=self.start_game, font=('Arial', 12, 'bold'), bg='#4CAF50', fg='white', relief=tk.RAISED)
        self.start_button.pack(pady=10)

        self.board_frame = tk.Frame(self.root, bg='black')
        self.board_frame.pack(padx=10, pady=10)

        for i in range(9):
            for j in range(9):
                entry = tk.Entry(self.board_frame, width=3, justify='center', font=('Arial', 18), bg='#ffffff', fg='#333333', relief=tk.FLAT)
                entry.grid(row=i, column=j, padx=(1, 1), pady=(1, 1), ipady=5)
                
                if i % 3 == 0 and i != 0:
                    entry.grid_configure(pady=(5, 1))
                if j % 3 == 0 and j != 0:
                    entry.grid_configure(padx=(5, 1))
                
                self.entries[i][j] = entry

        self.check_button = tk.Button(self.root, text="Check Solution", command=self.check_solution, font=('Arial', 12, 'bold'), bg='#2196F3', fg='white', relief=tk.RAISED)
        self.check_button.pack(pady=10)

    def start_game(self):
        self.difficulty = self.difficulty_var.get()
        self.clear_board()
        self.generate_puzzle()

    def clear_board(self):
        for i in range(9):
            for j in range(9):
                self.entries[i][j].delete(0, tk.END)
                self.entries[i][j].config(state=tk.NORMAL)
        self.board = [[0 for _ in range(9)] for _ in range(9)]

    def generate_puzzle(self):
        self.solve_board()
        num_clues = {"Easy": 40, "Medium": 30, "Hard": 20}[self.difficulty]
        cells_to_remove = 81 - num_clues
        
        removed_cells = set()
        while len(removed_cells) < cells_to_remove:
            i, j = random.randint(0, 8), random.randint(0, 8)
            if (i, j) not in removed_cells:
                self.board[i][j] = 0
                removed_cells.add((i, j))

        for i in range(9):
            for j in range(9):
                if self.board[i][j] != 0:
                    self.entries[i][j].insert(0, self.board[i][j])
                    self.entries[i][j].config(state=tk.DISABLED)

    def check_solution(self):
        for i in range(9):
            for j in range(9):
                try:
                    val = int(self.entries[i][j].get())
                    if val != self.solution[i][j]:
                        messagebox.showerror("Incorrect", "The solution is incorrect!")
                        return
                except ValueError:
                    messagebox.showerror("Invalid Input", "Please enter numbers between 1 and 9!")
                    return
        messagebox.showinfo("Correct", "Congratulations! You've solved the Sudoku!")

    def solve_board(self):
        self.board = [[0 for _ in range(9)] for _ in range(9)]
        self.solution = [[0 for _ in range(9)] for _ in range(9)]
        self.fill_board(self.board)
        for i in range(9):
            for j in range(9):
                self.solution[i][j] = self.board[i][j]

    def fill_board(self, board):
        numbers = list(range(1, 10))
        for i in range(9):
            for j in range(9):
                if board[i][j] == 0:
                    random.shuffle(numbers)
                    for num in numbers:
                        if self.is_valid(board, i, j, num):
                            board[i][j] = num
                            if self.fill_board(board):
                                return True
                            board[i][j] = 0
                    return False
        return True

    def is_valid(self, board, row, col, num):
        for i in range(9):
            if board[row][i] == num or board[i][col] == num:
                return False
        start_row, start_col = 3 * (row // 3), 3 * (col // 3)
        for i in range(start_row, start_row + 3):
            for j in range(start_col, start_col + 3):
                if board[i][j] == num:
                    return False
        return True

if __name__ == "__main__":
    root = tk.Tk()
    game = Sudoku(root)
    root.mainloop() 

"""