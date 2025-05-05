// game.js - Core Tetris game mechanics

// Canvas setup
const scale = 20;
const ARENA_WIDTH = 10;
const ARENA_HEIGHT = 20;

const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(scale, scale);

// Set canvas dimensions based on arena size and scale
canvas.width = ARENA_WIDTH * scale;
canvas.height = ARENA_HEIGHT * scale;
context.scale(scale, scale);

// Game state
const arena = createMatrix(ARENA_WIDTH, ARENA_HEIGHT);
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
  score: 0,
};

// Colors for different pieces
const colors = [
  null, // No piece (empty)
  '#FF0D72', // T
  '#0DC2FF', // O
  '#0DFF72', // L
  '#F538FF', // J
  '#FF8E0D', // S
  '#FFE138', // Z
  '#3877FF', // I
];

// Game timing variables
let dropCounter = 0;
let dropInterval = 1000; // Drop every 1 second
let lastTime = 0;
let gameOver = false;

// Function to create a piece (T, O, L, J, S, Z, I)
function createPiece(type) {
  if (type === 'T') {
    return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
  } else if (type === 'O') {
    return [
      [2, 2],
      [2, 2],
    ];
  } else if (type === 'L') {
    return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
  } else if (type === 'J') {
    return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
  } else if (type === 'S') {
    return [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0],
    ];
  } else if (type === 'Z') {
    return [
      [6, 6, 0],
      [0, 6, 6],
      [0, 0, 0],
    ];
  } else if (type === 'I') {
    return [
      [0, 0, 0, 0],
      [7, 7, 7, 7],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
  }
}

// Function to create an empty matrix (arena)
function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

// Function to check for collisions
function collides(arena, player) {
  const [matrix, offset] = [player.matrix, player.pos];
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < matrix[y].length; x++) {
      if (matrix[y][x] !== 0 &&
         (arena[y + offset.y] &&
         arena[y + offset.y][x + offset.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

// Draw everything
function draw() {
  // Clear the canvas
  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the arena
  drawMatrix(arena, { x: 0, y: 0 });
  
  // Draw the current piece
  drawMatrix(player.matrix, player.pos);
}

// Draw a matrix (arena or piece)
function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
        
        // Draw border for each block
        context.strokeStyle = '#000';
        context.lineWidth = 0.05;
        context.strokeRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

// Merge the player's piece with the arena
function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

// Clear completed rows and update score
function arenaSweep() {
  let rowCount = 1;
  
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    
    // Remove the row and create a new empty one at the top
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y; // Offset for the removed row
    
    // Update score - more points for clearing multiple rows at once
    player.score += rowCount * 1;
    rowCount *= 2;
  }
}

// Function to reset the player (called after each piece drops)
function playerReset() {
  // Create a random piece
  const pieces = 'TOLZSJI';
  player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
  player.pos.y = 0;
  player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
  
  // Check for game over
  if (collides(arena, player)) {
    gameOver = true;
    alert(`Game Over! Final score: ${player.score}`);
    console.log(`Finished game with score ${player.score}`)
    // Reset the arena
    arena.forEach(row => row.fill(0));
    player.score = 0;
    gameOver = false;
  }
  
  // Update score display
  document.getElementById('score').textContent = player.score;
}

// Move the player's piece left or right
function playerMove(dir) {
  player.pos.x += dir;
  if (collides(arena, player)) {
    player.pos.x -= dir; // Undo move if it collides
    return false;
  }
  return true;
}

// Rotate the player's piece
function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  
  // Actual rotation
  rotate(player.matrix, dir);
  
  // Wall kick - try to adjust if rotation causes collision
  while (collides(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      rotate(player.matrix, -dir); // Undo rotation if out of bounds
      player.pos.x = pos;
      return false;
    }
  }
  return true;
}

// Function to rotate the piece
function rotate(matrix, dir) {
  // Transpose the matrix
  for (let y = 0; y < matrix.length; y++) {
    for (let x = 0; x < y; x++) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  
  // Reverse each row or column depending on direction
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

// Drop the player's piece one row
function playerDrop() {
  player.pos.y++;
  
  if (collides(arena, player)) {
    player.pos.y--; // Undo the move
    merge(arena, player); // Merge the piece with the arena
    arenaSweep(); // Check for completed rows
    playerReset(); // Reset the player with a new piece
  }
  
  dropCounter = 0; // Reset the drop counter
}

// Soft drop - accelerate dropping
function playerSoftDrop() {
  playerDrop();
  dropCounter = 0; // Reset drop counter
}

// Hard drop - drop the piece all the way down
function playerHardDrop() {
  while (!collides(arena, player)) {
    player.pos.y++;
  }
  player.pos.y--;
  merge(arena, player);
  arenaSweep();
  playerReset();
  dropCounter = 0;
}

// Update game state
function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;
  
  // Increment drop counter and move piece down if enough time has passed
  dropCounter += deltaTime;
  if (dropCounter > dropInterval && !gameOver) {
    playerDrop();
  }
  
  draw();
  requestAnimationFrame(update);
}

// Restart game function
function restartGame() {
  // Reset game state
  gameOver = false;
  dropCounter = 0;
  player.score = 0;
  document.getElementById('score').textContent = '0';
  
  // Clear the arena
  arena.forEach(row => row.fill(0));
  
  // Reset player with a new piece
  playerReset();
  
  // If AI is enabled, request a move
  if (aiControlEnabled && !aiMoveInProgress) {
    requestAIMove();
  }
}

// Export functions and variables for other modules
window.gameModule = {
  arena,
  player,
  playerMove,
  playerRotate,
  playerDrop,
  playerSoftDrop,
  playerHardDrop,
  playerReset,
  gameOver,
  restartGame,
  update
};