# Project Blueprint: Mini Games Pro+ (Revamped)

## Purpose and Capabilities
A modern, extensible web-based gaming platform featuring a variety of mini-games, from classic 2D games to physics-based 3D experiences. It features a global coin system, persistent storage, and a polished, responsive UI.

## Project Outline
- **Design:** Cyberpunk/Neon theme with Glassmorphism UI. Responsive design using modern CSS.
- **Platform Features:**
  - **GameManager:** Centralized control for game lifecycle (init, start, destroy).
  - **Persistence:** Coins are saved in `localStorage`.
  - **Dynamic Menu:** Games are registered and the menu is built automatically.
- **Games:**
  - **Clicker:** Simple upgrade-based game.
  - **Snake:** Enhanced classic snake with better graphics.
  - **Flappy:** Physics-based bird flight.
  *New Games:*
  - **Ball Roller 3D:** 3D physics game using Three.js.
  - **Shape Smasher:** Fast-paced action game.
  - **Speed Tiles:** Rhythm and reaction test.
  - **Stacker:** Physics-based balancing game using Matter.js.
  - **Omok:** Traditional 5-in-a-row strategy game.
  - **Baduk:** Classic Go game with capture logic.
  - **Janggi:** Traditional Korean chess with unique pieces.

## Current Plan: Platform Revamp & New Games
1. **Infrastructure:** Implement `GameManager` and `BaseGame` in `main.js`.
2. **UI/UX:** Overhaul `style.css` for a modern look.
3. **Core Games:** Refactor existing games into the new system.
4. **New Games:** Implement Ball Roller 3D, Shape Smasher, Speed Tiles, and Stacker.
5. **Deployment:** Push to GitHub to trigger automatic deployment.
