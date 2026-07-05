# Next Agent Checklist

Use this as the shortest practical handoff for continuing the Radia Platform work.

## Immediate goals
- Keep the current Ludo game playable and polished.
- Extract the game rules from the UI logic.
- Introduce a room-based state model.
- Prepare the project for a Discord or web gateway.

## Recommended order
1. Review the current browser game flow in [game.js](../game.js) and [renderer.js](../renderer.js).
2. Stabilize the existing Ludo rules and UI behavior.
3. Extract core game state into a reusable engine module.
4. Introduce an event bus for commands and updates.
5. Add room/session state for players, spectators, and game lifecycle.
6. Connect a web client or Discord gateway to the engine.
7. Build a second game to prove reusability.

## Important architecture rule
- The engine should not know whether actions come from a browser, Discord, Telegram, mobile, or AI.
- The engine should only process normalized commands and emit normalized events.

## First implementation target
- Build a small rules engine for Ludo first.
- Keep the renderer as a separate adapter.
- Do not couple Discord or social logic into the core gameplay logic.

## Definition of done for the first milestone
- The browser version still works.
- Game state can be driven through a reusable engine interface.
- A room can host a live match with players and spectators.

## Useful references
- [docs/radia-platform-spec.md](radia-platform-spec.md)
- [README.md](../README.md)
