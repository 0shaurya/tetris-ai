// input.js - User input handler for Tetris

// Set up keyboard input handlers
function initInputs() {
    // Handle keyboard input
    document.addEventListener('keydown', handleKeyDown);
    
    // Add restart button functionality
    document.getElementById('restartButton').addEventListener('click', window.gameModule.restartGame);
  }
  
  // Handle keyboard events
  function handleKeyDown(event) {
    const { playerMove, playerRotate, playerDrop, playerHardDrop, gameOver } = window.gameModule;
    
    // If AI is controlling or game over, don't process user input
    if (window.aiModule.aiControlEnabled || gameOver) return;
    
    if (event.key === 'ArrowLeft' || event.key === 'a') {
      playerMove(-1);
    } else if (event.key === 'ArrowRight' || event.key === 'd') {
      playerMove(1);
    } else if (event.key === 'ArrowDown' || event.key === 's') {
      playerDrop();
    } else if (event.key === 'ArrowUp' || event.key === 'w') {
      playerRotate(1);
    } else if (event.key === ' ') {
      playerHardDrop();
    }
  }
  
  // Export functions
  window.inputModule = {
    initInputs
  };