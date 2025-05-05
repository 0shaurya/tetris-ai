// main.js - Main entry point for Tetris application

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', initGame);

function initGame() {
  // Initialize modules
  window.inputModule.initInputs();
  window.aiModule.initAI();
  
  // Start the game
  window.gameModule.playerReset();
  window.gameModule.update();
  
  console.log('Started');
}