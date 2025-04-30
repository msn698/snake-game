import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState, SnakeSkin } from '../types/game';
import { moveSnake, changeDirection, createInitialState, updateHighScores } from '../game/gameLogic';

interface GameProps {
  width: number;
  height: number;
}

const Game: React.FC<GameProps> = ({ width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedSkin, setSelectedSkin] = useState<SnakeSkin>('classic');
  const [showNameInput, setShowNameInput] = useState(false);
  const [tempName, setTempName] = useState('');
  
  // Initialize the game state only once with a stable reference
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialState = createInitialState(selectedSkin);
    console.log('Game initialized with food at:', initialState.food.position);
    return initialState;
  });
  
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastUpdateTimeRef = useRef<number>(0);
  // Store current game state in a ref to avoid re-renders
  const gameStateRef = useRef<GameState>(gameState);

  // Update the ref whenever the state changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  // Function to safely update game state
  const updateGameState = useCallback((newState: GameState) => {
    setGameState(newState);
  }, []);

  // Function to restart the game
  const restartGame = useCallback(() => {
    const newState = createInitialState(selectedSkin);
    console.log('Game restarted with new skin:', selectedSkin, 'and food at:', newState.food.position);
    updateGameState(newState);
  }, [selectedSkin, updateGameState]);

  // Track previous skin for skin change detection
  const prevSkinRef = useRef<SnakeSkin>(selectedSkin);

  useEffect(() => {
    // Only restart game when skin changes after initial render
    if (prevSkinRef.current !== selectedSkin && !gameStateRef.current.isGameOver) {
      restartGame();
    }
    prevSkinRef.current = selectedSkin;
  }, [selectedSkin, restartGame]);

  const getSnakeColor = (index: number, skin: SnakeSkin) => {
    switch (skin) {
      case 'classic':
        return index === 0 ? ['#81C784', '#4CAF50'] : ['#4CAF50', '#388E3C'];
      case 'rainbow':
        const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const colorIndex = (index + Math.floor(Date.now() / 100)) % colors.length;
        return [colors[colorIndex], colors[(colorIndex + 1) % colors.length]];
      case 'fire':
        return index === 0 ? ['#FF4500', '#FF8C00'] : ['#FF8C00', '#FFA500'];
      case 'ice':
        return index === 0 ? ['#00BFFF', '#1E90FF'] : ['#1E90FF', '#4169E1'];
      default:
        return ['#4CAF50', '#388E3C'];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStateRef.current.isGameOver) return;

      // Prevent default behavior for arrow keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
      }

      let direction: 'up' | 'down' | 'left' | 'right' | null = null;
      switch (e.key) {
        case 'ArrowUp':
          direction = 'up';
          break;
        case 'ArrowDown':
          direction = 'down';
          break;
        case 'ArrowLeft':
          direction = 'left';
          break;
        case 'ArrowRight':
          direction = 'right';
          break;
      }

      if (direction) {
        const newState = changeDirection(gameStateRef.current, direction);
        updateGameState(newState);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = (timestamp: number) => {
      const currentGameState = gameStateRef.current;
      
      if (!currentGameState.isGameOver) {
        // Only update game state at the specified interval
        if (timestamp - lastUpdateTimeRef.current >= currentGameState.gameSpeed) {
          const newState = moveSnake(currentGameState);
          updateGameState(newState);
          lastUpdateTimeRef.current = timestamp;
        }
      }

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw grid
      ctx.strokeStyle = '#E0E0E0';
      for (let i = 0; i < currentGameState.gridSize; i++) {
        for (let j = 0; j < currentGameState.gridSize; j++) {
          ctx.strokeRect(
            i * currentGameState.cellSize,
            j * currentGameState.cellSize,
            currentGameState.cellSize,
            currentGameState.cellSize
          );
        }
      }

      // Draw food
      const { food } = currentGameState;
      
      // Ensure food is rendered at the center of the cell
      const foodX = Math.floor(food.position.x) * currentGameState.cellSize + currentGameState.cellSize / 2;
      const foodY = Math.floor(food.position.y) * currentGameState.cellSize + currentGameState.cellSize / 2;
      
      // Make food more visible with multiple layers
      // 1. Draw a white background circle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(
        foodX,
        foodY,
        currentGameState.cellSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // 2. Draw the colored food
      ctx.fillStyle = food.color;
      ctx.beginPath();
      ctx.arc(
        foodX,
        foodY,
        currentGameState.cellSize / 2 - 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      
      // 3. Add a border to make the food more visible
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw snake
      const { snake } = currentGameState;
      snake.body.forEach((segment, index) => {
        const gradient = ctx.createLinearGradient(
          segment.x * currentGameState.cellSize,
          segment.y * currentGameState.cellSize,
          segment.x * currentGameState.cellSize + currentGameState.cellSize,
          segment.y * currentGameState.cellSize + currentGameState.cellSize
        );

        const [color1, color2] = getSnakeColor(index, snake.skin);
        gradient.addColorStop(0, color1);
        gradient.addColorStop(1, color2);

        ctx.fillStyle = gradient;
        ctx.fillRect(
          segment.x * currentGameState.cellSize + 1,
          segment.y * currentGameState.cellSize + 1,
          currentGameState.cellSize - 2,
          currentGameState.cellSize - 2
        );
      });

      // Draw game over screen
      if (currentGameState.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#FFF';
        ctx.font = '30px Arial';
        ctx.fillText('Game Over!', width / 2 - 80, height / 2 - 30);
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${currentGameState.score}`, width / 2 - 70, height / 2 + 10);
        
        if (!showNameInput) {
          ctx.fillText('Press R to restart', width / 2 - 80, height / 2 + 50);
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    // Start the game loop
    gameLoopRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [width, height, showNameInput, updateGameState]); // Remove gameState from dependencies to avoid re-renders

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'r' && gameStateRef.current.isGameOver && !showNameInput) {
        restartGame();
      }
    };

    window.addEventListener('keypress', handleKeyPress);
    return () => window.removeEventListener('keypress', handleKeyPress);
  }, [showNameInput, restartGame]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      setGameState(prevState => updateHighScores(prevState, tempName.trim()));
      setShowNameInput(false);
      setTempName('');
    }
  };

  return (
    <div className="game-container" style={{ color: '#000000' }}>
      <div className="game-controls">
        <select 
          value={selectedSkin} 
          onChange={(e) => setSelectedSkin(e.target.value as SnakeSkin)}
          style={{ 
            color: '#000000', 
            backgroundColor: '#FFFFFF', 
            padding: '5px 10px', 
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          <option value="classic">Classic Snake</option>
          <option value="rainbow">Rainbow Snake</option>
          <option value="fire">Fire Snake</option>
          <option value="ice">Ice Snake</option>
        </select>
      </div>
      
      <div className="game-display" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{ border: '1px solid black', borderRadius: '8px' }}
        />
        
        <div className="game-info" style={{ marginLeft: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '8px', color: '#000000' }}>
          <div className="score-display" style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px', color: '#000000' }}>
            Score: {gameStateRef.current.score}
          </div>
          
          <div className="controls-info" style={{ marginBottom: '20px', color: '#000000' }}>
            <p style={{ color: '#000000', fontWeight: 'bold' }}><strong>Controls:</strong></p>
            <p style={{ color: '#000000' }}>↑ ↓ ← → Arrow keys to move</p>
            <p style={{ color: '#000000' }}>R to restart when game over</p>
          </div>
        </div>
      </div>
      
      {gameStateRef.current.isGameOver && !showNameInput && (
        <button 
          className="submit-score-button"
          onClick={() => setShowNameInput(true)}
          style={{ 
            color: '#FFFFFF', 
            backgroundColor: '#4CAF50', 
            padding: '10px 20px', 
            border: 'none', 
            borderRadius: '5px', 
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Submit Score
        </button>
      )}
      {showNameInput && (
        <form onSubmit={handleNameSubmit} className="name-input-form" style={{ color: '#000000' }}>
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            placeholder="Enter your name"
            maxLength={20}
            autoFocus
            style={{ color: '#000000' }}
          />
          <button type="submit" style={{ color: '#000000' }}>Submit</button>
        </form>
      )}
      {gameStateRef.current.highScores.length > 0 && (
        <div className="high-scores" style={{ color: '#000000' }}>
          <h3 style={{ color: '#000000' }}>High Scores</h3>
          <ol style={{ color: '#000000' }}>
            {gameStateRef.current.highScores.map((score, index) => (
              <li key={index} style={{ color: '#000000' }}>
                {score.name}: {score.score}
              </li>
            ))}
          </ol>
        </div>
      )}
      <p className="game-instructions" style={{ color: '#000000' }}>
        Use arrow keys to move the snake. Collect food to grow and earn points!
      </p>
    </div>
  );
};

export default Game; 