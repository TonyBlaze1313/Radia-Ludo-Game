# Radia Platform Upgrade Spec

## Purpose

This document is the working handoff spec for turning the current browser-based Ludo prototype into a reusable social game platform.

The short version:
- Keep the current game fun and polished.
- Extract the game rules into a reusable engine.
- Add room-based multiplayer state.
- Support social clients such as Discord and web.
- Leave room for later creator tools and a broader game ecosystem.

## Product framing

### Primary positioning
Radia is a platform for procedurally generated social board games.

### Current project status
The repository currently contains:
- a single-page browser game experience
- a canvas-based renderer
- turn-based game logic for a radial Ludo implementation

This is a strong proof of concept, but it is not yet a platform.

## Target architecture

### 1. Core layers

Radia Ludo
  -> Radia Engine
  -> Radia Platform
  -> Radia SDK

### 2. Responsibilities

#### Radia Ludo
- The flagship game.
- Demonstrates the engine in a polished, playable form.
- Should remain easy to launch and understand.

#### Radia Engine
- Owns game rules, turn resolution, movement, captures, victory conditions, and state transitions.
- Must be client-agnostic.
- Must not depend on Discord, browser UI, Telegram, or any specific client.

#### Radia Platform
- Owns rooms, players, spectators, persistence, timers, chat/meta state, and session lifecycle.
- Provides an abstraction layer between clients and the engine.

#### Radia SDK
- Gives future developers tools to create new games and integrations.
- Should support game modules, rules definitions, and client adapters.

## Architectural rule

The engine must never know whether a request came from:
- a browser UI
- a Discord button
- a Telegram command
- a mobile app
- an AI assistant

The engine should only receive structured commands such as:
- `rollDice`
- `moveToken`
- `joinRoom`
- `startGame`

The engine should emit events such as:
- `GameStarted`
- `PlayerJoined`
- `DiceRolled`
- `TokenMoved`
- `TokenCaptured`
- `PlayerWon`
- `GameEnded`
- `TimerExpired`

This event-driven model is the backbone of future extensibility.

## Repository structure plan

The current repository is simple, so the next step should be to reorganize it around clear modules.

Suggested structure:

```text
src/
  engine/
    gameEngine.js
    eventBus.js
    rules/
      ludoRules.js
  platform/
    roomStore.js
    sessionManager.js
    lobbyManager.js
  clients/
    web/
      boardRenderer.js
      uiController.js
    discord/
      bot.js
      commands.js
  games/
    ludo/
      config.js
      rules.js
      renderer.js
    treasure/
      config.js
      rules.js
      renderer.js
```

## Current file mapping

The existing files should be treated as the starting point:
- [game.js](../game.js) -> should become the engine-facing game controller or be split into engine + rules modules.
- [renderer.js](../renderer.js) -> should become a renderer adapter for the web client.
- [RadiaLudo.html](../RadiaLudo.html) -> should remain the browser entry point, but should be updated to load the new modular structure.
- [styles.css](../styles.css) -> should continue to support the web UI.

## Phase 0: stabilize the current game

### Goals
- Make the current Ludo experience polished and reliable.
- Preserve existing core mechanics.
- Ensure the current browser version remains playable.

### Tasks
- Audit and fix any obvious gameplay bugs.
- Improve turn flow clarity.
- Improve player naming and UI text.
- Add clearer win/loss and spectator messaging.
- Ensure the board is deterministic and easy to reason about.

### Definition of done
- The local browser game runs reliably.
- A full 4-player match can complete without logic errors.
- The UI clearly shows whose turn it is and why.

## Phase 1: extract the engine

### Goals
- Separate game rules from UI rendering.
- Make Ludo playable through a rules engine rather than directly embedded UI logic.

### Tasks
- Create a rules module for Ludo.
- Create a game-state model.
- Introduce a command interface for actions such as `rollDice`, `moveToken`, `passTurn`.
- Introduce an event emission layer for game updates.
- Keep the current web canvas renderer as a client adapter.

### Deliverables
- A reusable `GameEngine` abstraction.
- A clearly defined state object.
- Event-driven updates that can be consumed by different clients.

### Success criteria
- A second developer can build a non-canvas client on top of the engine without modifying the core rules.

## Phase 2: add rooms and platform state

### Goals
- Support multi-player rooms.
- Add spectators and host controls.
- Support persistence and reconnect-friendly state.

### Tasks
- Add room creation and room joining.
- Add player roles: host, player, spectator.
- Track waiting state, active game state, and completed games.
- Add simple save/load support for room state.
- Add timers and turn reminders.

### Suggested room model
```json
{
  "roomId": "abc123",
  "gameType": "ludo",
  "status": "waiting",
  "hostId": "user-1",
  "players": [
    { "id": "user-1", "name": "Alice", "role": "player" },
    { "id": "user-2", "name": "Bob", "role": "player" }
  ],
  "spectators": [],
  "gameState": {}
}
```

### Success criteria
- A host can create a room.
- Players can join.
- Spectators can watch without controlling the game.
- A room can be resumed after a refresh or reconnect.

## Phase 3: add social gateway support

### Goals
- Connect the engine to real social clients.

### First gateway target
Discord.

### Suggested Discord experience
- `/play ludo` creates a game room.
- `/join` adds a player.
- `/spectate` adds a watcher.
- Buttons or slash commands drive actions.
- The bot posts concise snapshots after each turn.

### Tasks
- Build a gateway adapter layer.
- Translate Discord commands into normalized engine commands.
- Translate engine events into Discord messages or interactive components.
- Support simple board summaries in text form.

### Success criteria
- A Discord server can host a live match using the same engine.

## Phase 4: prove reusability with a second game

### Goals
- Prove the engine is more than a Ludo implementation.

### Suggested second game
Treasure Hunt or Orbital Race.

### Requirements
- The second game should use the same engine contract.
- It should require mostly new rules and a new renderer.
- It should not require a rewrite of the platform layer.

### Success criteria
- A second game can run from the same room and gateway infrastructure with only game-specific logic changes.

## Phase 5: creator ecosystem

### Goals
- Open the platform to builders.

### Potential features
- Radia Studio for visual game composition.
- Radia Hub for browsing and discovering games.
- A simple schema for game definitions.
- Validation rules for custom game modules.

## Implementation guidance for future agents

### Recommended order
1. Stabilize the current Ludo experience.
2. Extract game-state and rules into a standalone module.
3. Introduce an event bus.
4. Add room lifecycle management.
5. Attach a web client.
6. Add Discord integration.
7. Build a second game.

### Important implementation constraints
- Keep the engine independent from presentation.
- Keep the platform independent from game-specific rules.
- Prefer event-based updates over direct state mutation across layers.
- Use clear interfaces between engine, platform, and clients.

### Suggested first code refactor
Start by splitting the current game into:
- a rules module
- a state container
- a renderer adapter
- a controller that translates UI input into engine commands

This will make the following phases much easier.

## Open questions

- Should the initial web client remain canvas-based or move to DOM-based UI?
- Should room persistence be browser-local first, or server-backed from the start?
- Should Discord be the first social gateway or should a generic webhook-based gateway come first?
- What is the minimum viable game definition schema for future custom games?

## Recommended milestone summary

- Milestone 1: polished single-game browser experience
- Milestone 2: reusable engine extracted from Ludo
- Milestone 3: room-based multiplayer and spectators
- Milestone 4: Discord gateway
- Milestone 5: second game on the same engine
- Milestone 6: creator tools and ecosystem features

## Hand-off note

If another agent continues this project, the most valuable next step is to extract the rules engine and event model before adding any social integration. That will make everything else far easier to build correctly.
