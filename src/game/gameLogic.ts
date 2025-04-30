import { GameState, Position, Food, Snake, SnakeSkin, HighScore } from '../types/game';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 300; // Slower initial speed
const MAX_SPEED = 100; // Maximum speed cap
const SPEED_INCREASE = 20; // How much to increase speed by

// Load high scores from localStorage
const loadHighScores = (): HighScore[] => {
  const savedScores = localStorage.getItem('snakeHighScores');
  return savedScores ? JSON.parse(savedScores) : [];
};

// Save high scores to localStorage
const saveHighScores = (scores: HighScore[]) => {
  localStorage.setItem('snakeHighScores', JSON.stringify(scores));
};

export const createInitialState = (skin: SnakeSkin = 'classic'): GameState => {
  const initialSnake: Snake = {
    body: [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 }
    ],
    direction: 'up',
    speed: INITIAL_SPEED,
    skin
  };

  return {
    snake: initialSnake,
    food: generateFood(GRID_SIZE, initialSnake.body),
    score: 0,
    isGameOver: false,
    gridSize: GRID_SIZE,
    cellSize: CELL_SIZE,
    gameSpeed: INITIAL_SPEED,
    highScores: loadHighScores(),
    playerName: ''
  };
};

export const generateFood = (gridSize: number, snakeBody: Position[]): Food => {
  const types = ['normal', 'special', 'bonus'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  
  const colors = {
    normal: '#FF5252',
    special: '#FFD700',
    bonus: '#7C4DFF'
  };

  const values = {
    normal: 1,
    special: 3,
    bonus: 5
  };

  // Create a list of all possible positions - ensure integers
  const allPositions: Position[] = [];
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      allPositions.push({ x, y });
    }
  }

  // Filter out positions occupied by the snake - ensure integers for comparison
  const availablePositions = allPositions.filter(
    pos => !snakeBody.some(segment => 
      Math.floor(segment.x) === pos.x && Math.floor(segment.y) === pos.y
    )
  );

  // If no available positions, return a default position (shouldn't happen in normal gameplay)
  if (availablePositions.length === 0) {
    console.warn('No available positions for food!');
    return {
      position: { x: 0, y: 0 },
      type,
      value: values[type],
      color: colors[type]
    };
  }

  // Randomly select from available positions
  const randomIndex = Math.floor(Math.random() * availablePositions.length);
  const position = availablePositions[randomIndex];

  return {
    position,
    type,
    value: values[type],
    color: colors[type]
  };
};

export const moveSnake = (gameState: GameState): GameState => {
  // Create a deep copy of the state to avoid mutation
  const newState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const { snake } = newState;
  const head = { ...snake.body[0] };

  // Move head based on direction
  switch (snake.direction) {
    case 'up':
      head.y -= 1;
      break;
    case 'down':
      head.y += 1;
      break;
    case 'left':
      head.x -= 1;
      break;
    case 'right':
      head.x += 1;
      break;
  }

  // Check for collisions with walls
  if (
    head.x < 0 ||
    head.x >= gameState.gridSize ||
    head.y < 0 ||
    head.y >= gameState.gridSize
  ) {
    newState.isGameOver = true;
    return newState;
  }

  // Check for collisions with self (excluding the tail since it will move)
  const bodyWithoutTail = snake.body.slice(0, -1);
  if (bodyWithoutTail.some(segment => 
    Math.floor(segment.x) === Math.floor(head.x) && 
    Math.floor(segment.y) === Math.floor(head.y))
  ) {
    newState.isGameOver = true;
    return newState;
  }

  // Add new head
  snake.body.unshift(head);

  // Check if snake ate food - use integer position comparison
  const headX = Math.floor(head.x);
  const headY = Math.floor(head.y);
  const foodX = Math.floor(gameState.food.position.x);
  const foodY = Math.floor(gameState.food.position.y);
  
  // Simple exact position match
  const foodEaten = (headX === foodX && headY === foodY);
  
  if (foodEaten) {
    console.log('FOOD EATEN! Score now:', newState.score + gameState.food.value);
    newState.score += gameState.food.value;
    
    // Increase speed gradually
    if (newState.score % 5 === 0) {
      newState.gameSpeed = Math.max(MAX_SPEED, INITIAL_SPEED - (newState.score / 5) * SPEED_INCREASE);
    }
    
    // Generate new food at a different position
    const newFood = generateFood(gameState.gridSize, snake.body);
    
    // Verify the new food position is different from the old one
    if (
      Math.floor(newFood.position.x) === foodX && 
      Math.floor(newFood.position.y) === foodY
    ) {
      // Try again if the position is the same (unlikely but possible)
      newState.food = generateFood(gameState.gridSize, snake.body);
      console.log('Generated new food at different position:', newState.food.position);
    } else {
      newState.food = newFood;
      console.log('Generated new food at:', newState.food.position);
    }
  } else {
    // Remove tail if no food was eaten
    snake.body.pop();
  }

  return newState;
};

export const changeDirection = (
  gameState: GameState,
  newDirection: 'up' | 'down' | 'left' | 'right'
): GameState => {
  const newState = { ...gameState };
  const { snake } = newState;

  // Prevent 180-degree turns
  if (
    (newDirection === 'up' && snake.direction === 'down') ||
    (newDirection === 'down' && snake.direction === 'up') ||
    (newDirection === 'left' && snake.direction === 'right') ||
    (newDirection === 'right' && snake.direction === 'left')
  ) {
    return newState;
  }

  snake.direction = newDirection;
  return newState;
};

export const updateHighScores = (gameState: GameState, name: string): GameState => {
  const newState = { ...gameState };
  const newScore: HighScore = {
    name,
    score: gameState.score,
    date: new Date().toISOString()
  };

  const updatedScores = [...gameState.highScores, newScore]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Keep only top 10 scores

  newState.highScores = updatedScores;
  saveHighScores(updatedScores);
  return newState;
}; 