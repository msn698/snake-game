import React from 'react'
import Game from './components/Game'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="App">
      <h1>Snake Game</h1>
      <Game width={400} height={400} />
    </div>
  )
}

export default App
