from flask import Flask, request, jsonify
from flask_cors import CORS
import copy
import random
import os

app = Flask(__name__)
CORS(app)

# Heuristic weights
HEIGHT_WEIGHT = -0.510066
ROWS_CLEARED_WEIGHT = 0.760666
HOLES_WEIGHT = -1.35663
BUMPINESS_WEIGHT = -0.184483

MAX_DEPTH = 2  # Depth for minimax search

# Utility functions (same as before)
def get_height(arena, x):
    for y in range(len(arena)):
        if arena[y][x] != 0:
            return len(arena) - y
    return 0

def calculate_holes(arena):
    holes = 0
    for x in range(len(arena[0])):
        block_found = False
        for y in range(len(arena)):
            if arena[y][x] != 0:
                block_found = True
            elif block_found:
                holes += 1
    return holes

def calculate_bumpiness(arena):
    heights = [get_height(arena, x) for x in range(len(arena[0]))]
    return sum(abs(heights[i] - heights[i+1]) for i in range(len(heights)-1))

def calculate_aggregate_height(arena):
    return sum(get_height(arena, x) for x in range(len(arena[0])))

def place_piece(arena, piece, pos):
    new_arena = copy.deepcopy(arena)
    # drop
    while not collides(new_arena, piece, pos):
        pos['y'] += 1
    pos['y'] -= 1
    for y in range(len(piece)):
        for x in range(len(piece[0])):
            if piece[y][x]:
                new_arena[y+pos['y']][x+pos['x']] = piece[y][x]
    rows_cleared = 0
    for y in range(len(new_arena)-1, -1, -1):
        if all(new_arena[y]):
            new_arena.pop(y)
            new_arena.insert(0, [0]*len(new_arena[0]))
            rows_cleared += 1
    return new_arena, rows_cleared

def collides(arena, piece, pos):
    for y in range(len(piece)):
        for x in range(len(piece[0])):
            if piece[y][x]:
                if (pos['y']+y >= len(arena) or pos['x']+x < 0 or
                    pos['x']+x >= len(arena[0]) or arena[pos['y']+y][pos['x']+x]):
                    return True
    return False

def rotate_piece(piece):
    rotated = list(zip(*piece[::-1]))
    return [list(row) for row in rotated]

# Heuristic evaluation
def heuristic(arena, rows_cleared):
    agg_height = calculate_aggregate_height(arena)
    holes = calculate_holes(arena)
    bumpiness = calculate_bumpiness(arena)
    return (HEIGHT_WEIGHT * agg_height +
            ROWS_CLEARED_WEIGHT * rows_cleared +
            HOLES_WEIGHT * holes +
            BUMPINESS_WEIGHT * bumpiness)

# Generate all possible moves for a given piece

def get_all_moves(arena, piece, position):
    moves = []
    for rot in range(4):
        rotated = copy.deepcopy(piece)
        for _ in range(rot): rotated = rotate_piece(rotated)
        # find horizontal limits
        left = -len(rotated[0])
        while not collides(arena, rotated, {'x': position['x']+left, 'y': position['y']}):
            left -= 1
        left += 1
        right = len(arena[0])
        while not collides(arena, rotated, {'x': position['x']+right, 'y': position['y']}):
            right += 1
        right -= 1
        for dx in range(left, right+1):
            pos = {'x': position['x']+dx, 'y': position['y']}
            if collides(arena, rotated, pos): continue
            new_arena, rows = place_piece(arena, rotated, copy.deepcopy(pos))
            moves.append({'rot': rot, 'dx': dx, 'arena': new_arena, 'rows': rows})
    return moves

# Minimax with alpha-beta pruning
def minimax(arena, next_piece, depth, alpha, beta, maximizing):
    if depth == 0 or not next_piece:
        # No next piece means terminal
        return 0
    if maximizing:
        max_eval = float('-inf')
        moves = get_all_moves(arena, next_piece, {'x':3, 'y':0})
        for m in moves:
            eval = heuristic(m['arena'], m['rows'])
            eval += minimax(m['arena'], random_piece(), depth-1, alpha, beta, False)
            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)
            if beta <= alpha:
                break
        return max_eval
    else:
        # Simulate random opponent piece - average heuristic
        total = 0
        pieces = all_pieces()
        for p in pieces:
            total += minimax(arena, p, depth-1, alpha, beta, True)
            beta = min(beta, total)
            if beta <= alpha:
                break
        return total/len(pieces)

# Generate random next piece

def random_piece():
    return random.choice(all_pieces())

def all_pieces():
    # Define 7 Tetris pieces
    return [
        [[1,1,1,1]],  # I
        [[2,2,0],[0,2,2]],  # Z
        [[0,3,3],[3,3,0]],  # S
        [[4,0,0],[4,4,4]],  # J
        [[0,0,5],[5,5,5]],  # L
        [[6,6],[6,6]],      # O
        [[0,7,0],[7,7,7]]   # T
    ]

@app.route("/api", methods=["POST"])
def move():
    try:
        data = request.get_json()
        arena = data.get('arena', [])
        piece = data.get('piece', [])
        position = data.get('position', {'x':3,'y':0})

        best_score = float('-inf')
        best_move = {'move':0,'rotate':0,'drop':True,'soft_drop':False}
        for m in get_all_moves(arena, piece, position):
            score = heuristic(m['arena'], m['rows']) + \
                    minimax(m['arena'], random_piece(), MAX_DEPTH-1, float('-inf'), float('inf'), False)
            if score > best_score:
                best_score = score
                best_move = {'move': m['dx'], 'rotate': m['rot'], 'drop': True, 'soft_drop': False}

        return jsonify(best_move)
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'move':0,'rotate':0,'drop':True,'soft_drop':False})

@app.route('/', methods=['GET'])
def home():
    return 'backend running'

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
