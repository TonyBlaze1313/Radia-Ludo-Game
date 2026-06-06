# Radia Ludo Game

Radia Ludo is a radial, orbital-style Ludo game built as a single-page browser experience. It supports 3-10 players, features a circular track, separated player yards, home stretch logic, capture rules, and a polished 3D-style UI.

## Features

- Radial Ludo board with orbital yards
- Supports 3 to 10 players
- Fixed lap logic with safe spaces
- Click-to-move gameplay after dice roll
- 3D-looking dice and polished browser UI

## Run locally

You can open `RadiaLudo.html` directly in your browser, or run a simple local web server from the terminal.

### Option 1: Open directly

1. Fork this repository.
2. Clone it locally:
   ```bash
   git clone https://github.com/TonyBlaze1313/Radia-Ludo-Game.git
   cd Radia-Ludo-Game
   ```
3. Open `RadiaLudo.html` in your browser.

### Option 2: Open with a terminal web server

From the repository directory, run one of these commands:

```bash
./run.sh
```

or, if you prefer a direct Python command:

```bash
python3 -m http.server 8000
```

If you have Node.js installed, you can also use:

```bash
npx http-server .
```

Then open the browser at:

```text
http://localhost:8000/RadiaLudo.html
```

## How to play

1. Choose a player count from 3 to 10.
2. Choose how many human players will play in the game.
3. Click `REBUILD BOARD` to initialize the game.
4. Click `ROLL DICE`.
5. Click a glowing token to move it.
6. Roll a 6 to enter a token onto the track and earn an extra turn.
7. Capture opponents by landing on their piece when it is not on a safe space.

## Player vs Computer

- Set `HUMANS` to `1` to play solo against 2-9 computer opponents.
- Additional players will be labeled `BOT` and take automatic turns.
- CPU opponents are active whenever their turn comes up.

## Notes

- The board uses 52 outer track positions and home stretch paths for each player.
- This version is designed for browser play and is easy to fork and run locally.
