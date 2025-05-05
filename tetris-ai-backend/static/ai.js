// ai.js - AI controller for Tetris

// AI control state
let aiControlEnabled = false;
let aiMoveInProgress = false;

// Function to get AI move from the backend
async function getAIMove(state) {
  try {
    const startTime = performance.now(); // Start timing
    const res = await fetch("/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    const move = await res.json();
    const endTime = performance.now(); // End timing

    const duration = endTime - startTime;
    console.log(`AI computation time: ${duration.toFixed(2)} ms`);

    return move;
  } catch (err) {
    console.error("Error with AI move:", err);
    return null;
  }
}

// Request and apply AI moves
async function requestAIMove() {
  const { arena, player, playerMove, playerRotate, playerDrop, playerSoftDrop, playerHardDrop, gameOver } = window.gameModule;
  
  // If AI is disabled, game over, or already processing a move, don't proceed
  if (!aiControlEnabled || gameOver || aiMoveInProgress) return;
  
  // Set flag to prevent multiple simultaneous AI requests
  aiMoveInProgress = true;
  
  // Update AI thinking indicator
  const thinkingIndicator = document.getElementById('aiThinking');
  if (thinkingIndicator) thinkingIndicator.classList.remove('hidden');
  
  try {
    const state = {
      arena: arena,
      piece: player.matrix,
      position: player.pos,
      score: player.score
    };
    
    const move = await getAIMove(state);
    
    if (move && aiControlEnabled) { // Check if AI is still enabled after awaiting
      // Apply the AI's move to the game with controlled timing
      if (move.rotate) {
        // Apply rotations with a small delay between each
        for (let i = 0; i < move.rotate; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          playerRotate(1);
        }
      }
      
      // Apply horizontal movement with controlled timing
      if (move.move !== undefined) {
        const direction = Math.sign(move.move); // Get direction (-1, 0 or 1)
        const steps = Math.abs(move.move);
        
        for (let i = 0; i < steps; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          playerMove(direction);
        }
      }
      
      // Apply soft drop if requested (to speed up gameplay)
      if (move.soft_drop) {
        for (let i = 0; i < 5; i++) { // Drop a few rows quickly
          await new Promise(resolve => setTimeout(resolve, 100));
          playerSoftDrop();
        }
      }
      
      // Hard drop the piece if requested
      if (move.drop) {
        await new Promise(resolve => setTimeout(resolve, 100));
        playerHardDrop();
      }
    }
  } catch (error) {
    console.error('Error during AI move:', error);
  } finally {
    // Hide thinking indicator
    if (thinkingIndicator) thinkingIndicator.classList.add('hidden');
    
    // Reset the flag
    aiMoveInProgress = false;
    
    // Schedule next move only if AI is still enabled and game not over
    if (aiControlEnabled && !window.gameModule.gameOver) {
      setTimeout(requestAIMove, 300); // Reduced delay between moves for faster gameplay
    }
  }
}

// Toggle AI control
function toggleAI() {
  aiControlEnabled = !aiControlEnabled;
  
  // Update the status display
  const statusText = document.getElementById('statusText');
  if (statusText) {
    statusText.textContent = aiControlEnabled ? 'AI: Enabled' : 'AI: Disabled';
    statusText.style.color = aiControlEnabled ? '#0DC2FF' : '#fff';
  }
  
  // Show/hide thinking indicator
  const thinkingIndicator = document.getElementById('aiThinking');
  if (thinkingIndicator) {
    thinkingIndicator.classList.toggle('hidden', !aiControlEnabled);
  }
  
  if (aiControlEnabled && !aiMoveInProgress && !window.gameModule.gameOver) {
    // If AI is enabled and no move is in progress, start the AI move cycle
    requestAIMove();
  }
}

// Initialize and export functions
function initAI() {
  // Set up button listener
  document.getElementById('toggleAIButton').addEventListener('click', toggleAI);
}

// Export functions and variables
window.aiModule = {
  initAI,
  toggleAI,
  aiControlEnabled,
  requestAIMove
};