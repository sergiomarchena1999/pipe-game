# Pipe Mania Game

A strategic puzzle game built with Phaser 3 and TypeScript where you connect pipes to create a path for water flow. Race against time to build a complete pipeline before the water reaches a dead end!

### How to Play

1. **Select Difficulty**: Choose Easy, Medium, or Hard mode from the main menu
2. **Place Pipes**: Click on grid cells to place the next queued pipe
3. **Build a Path**: Create connections for water to flow through
4. **Use Bombs**: Click on existing pipes to replace them
5. **Win Condition**: Fill the target number of pipes before water gets stuck

## Play Now

[**Play the game here!**](https://sergiomarchena1999.github.io/pipe-game)

Or run it locally:

```bash
# Clone the repository
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name

# Install dependencies
npm install

# Start development server
npm run dev
```

### Game Features

- **Three Difficulty Levels**: Progressively challenging grid sizes and objectives
- **Strategic Gameplay**: Plan ahead using the longest-path algorithm
- **Bomb Mechanic**: Replace poorly placed pipes with timed explosives
- **Score Tracking**: Earn points for each pipe the water flows through

## Technology Stack

- **Game Engine**: Phaser 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **Architecture**: Clean Architecture with domain-driven design

##  Key Architecture Decisions

### Separation of Concerns

- **Core Logic**: Pure TypeScript, no Phaser dependencies
- **Rendering Layer**: Phaser-specific visualization
- **Configuration**: Centralized game parameters

### Event-Driven Design

The game uses EventEmitter3 for decoupled communication:

```typescript
// Game state emits events
state.on("onGameWon", (score, pipes) => { ... });

// Flow network notifies score controller
flowNetwork.on("onPipeFlowed", (pipe) => { ... });
```

### Result Types

Explicit error handling using discriminated unions:

```typescript
type Result<T, E> = 
  | { success: true; value: T }
  | { success: false; error: E };
```

## Game Mechanics

### Flow Network

The `FlowNetwork` class simulates water movement:

1. **Path Selection**: Uses longest-path heuristic to choose optimal exits
2. **Progress Tracking**: Animates water flow from 0% to 100%
3. **Port Management**: Tracks which connections have been used
4. **Cache Optimization**: Memoizes path calculations for performance

### Bomb System

- **Limited Uses**: Configure max simultaneous bombs per difficulty
- **Queue Integration**: Replacement pipe comes from queue

### Score System

- **Points Per Pipe**: Earn points as water flows through pipes
- **Win Condition**: Fill target number of pipes (varies by difficulty)
- **Lose Conditions**: 
  - Water gets stuck (no valid exit)
  - No path available (missing connecting pipe)

## Credits

- **Game Design & Code**: Sergio Marchena
- **Sprite Art**: Pablo Cáceres
- **Font**: Jersey10 (custom TTF)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Code licensed under MIT. Sprite artwork by Pablo Cáceres - all rights reserved.
