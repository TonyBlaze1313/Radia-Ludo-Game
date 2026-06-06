import { initRenderer, renderBoard } from './renderer.js';

// ---------- FIXED LAP LOGIC & YARD SEPARATION ----------
    let numPlayers = 4;
    const playerColors = ["#E34234","#2E8B57","#FFD700","#1E88E5","#FF6AC2","#9B59B6","#F39C12","#1ABC9C","#D35400","#4B0082"];
    let playerNames = [];
    let humanPlayers = 1;
    let isHuman = [];
    let startStepPerPlayer = [];     // which global step index (0..51) is this player's start?
    let homeStretchCoords = [];      // per player: array of {x,y} for home stretch (6 steps)
    
    // Token state: each token = stepCount (0..52) where:
    //   0 = just entered track (at startStep)
    //   1..51 = on global track
    //   52 = ready to enter home stretch (first home step)
    //   53..58 = inside home stretch
    //   99 = finished
    let tokens = [];
    let currentPlayer = 0;
    let diceValue = 0;
    let extraTurn = false;
    let gameWinner = null;
    let gameMessage = "";
    let validGlowTokens = [];
    
    let globalTrackCoords = [];      // 52 positions on outer ring
    let yardPositionsRing = [];       // per player, per token: {x,y}
    let outerRadius = 0;
    let yardOuterRadius = 0;
    let yardInnerRadius = 0;
    let homeStartRadius = 0;
    let finishRadius = 0;
    
    const canvas = document.getElementById('sharedTrackCanvas');
    const ctx = canvas.getContext('2d');
    let width = 700, height = 700;
    canvas.width = width; canvas.height = height;
    initRenderer(canvas, ctx);
    
    // ---------- SOUND ----------
    let audioCtx = null;
    function playTone(freq, duration, type='sine') {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        osc.start();
        osc.stop(now + duration);
    }
    function playDiceRoll() { playTone(880,0.1); setTimeout(()=>playTone(660,0.1),50); }
    function playCapture() { playTone(220,0.2,'sawtooth'); }
    function playWin() { playTone(523.25,0.3); setTimeout(()=>playTone(659.25,0.3),100); setTimeout(()=>playTone(783.99,0.5),200); }
    function playMove() { playTone(440,0.05); }
    
    // ---------- GEOMETRY WITH WIDER YARD SEPARATION ----------
    function buildGeometry() {
        const center = {x: width/2, y: height/2};
        outerRadius = Math.min(width, height) * 0.42;      // global track
        yardOuterRadius = Math.min(width, height) * 0.38;  // outer edge of yard ring (just inside track)
        yardInnerRadius = Math.min(width, height) * 0.26;  // inner edge of yard ring (clear separation)
        homeStartRadius = Math.min(width, height) * 0.22;   // where home stretch begins
        finishRadius = Math.min(width, height) * 0.08;
        
        // global track (52 positions)
        globalTrackCoords = [];
        for(let i=0; i<52; i++) {
            let angle = (i / 52) * Math.PI * 2 - Math.PI/2;
            globalTrackCoords.push({x: center.x + outerRadius * Math.cos(angle), y: center.y + outerRadius * Math.sin(angle)});
        }
        
        // home stretches: from start step inward
        const sectorAngle = (Math.PI*2)/numPlayers;
        const startOffset = -Math.PI/2;
        homeStretchCoords = [];
        for(let p=0; p<numPlayers; p++) {
            let startPos = globalTrackCoords[startStepPerPlayer[p]];
            let targetAngle = startOffset + p * sectorAngle + sectorAngle / 2;
            let endPos = {x: center.x + finishRadius * Math.cos(targetAngle), y: center.y + finishRadius * Math.sin(targetAngle)};
            let steps = 6;
            let path = [];
            for(let s=0; s<=steps; s++) {
                let t = s / steps;
                let x = startPos.x * (1-t) + endPos.x * t;
                let y = startPos.y * (1-t) + endPos.y * t;
                path.push({x,y});
            }
            homeStretchCoords.push(path);
        }
        
        // Yard ring: positioned clearly away from track, between yardOuterRadius and yardInnerRadius
        yardPositionsRing = [];
        for(let p=0; p<numPlayers; p++) {
            let startAngle = startOffset + p * sectorAngle;
            let midAngle = startAngle + sectorAngle / 2;
            let r = (yardOuterRadius + yardInnerRadius) / 2;  // middle of yard band
            let baseX = center.x + r * Math.cos(midAngle);
            let baseY = center.y + r * Math.sin(midAngle);
            let offsets = [[-14,-10],[14,-10],[-14,12],[14,12]];
            let spots = [];
            for(let t=0; t<4; t++) {
                spots.push({x: baseX + offsets[t][0], y: baseY + offsets[t][1]});
            }
            yardPositionsRing.push(spots);
        }
    }
    
    function assignStartSteps() {
        startStepPerPlayer = [];
        for(let i=0; i<numPlayers; i++) {
            startStepPerPlayer.push(Math.round(i * 52 / numPlayers) % 52);
        }
    }
    
    function rebuildGame(reset=true) {
        assignStartSteps();
        buildGeometry();
        humanPlayers = Math.min(Math.max(humanPlayers, 1), numPlayers);
        isHuman = Array(numPlayers).fill(false);
        playerNames = [];
        for(let i=0; i<numPlayers; i++) {
            isHuman[i] = i < humanPlayers;
            playerNames.push(isHuman[i] ? `P${i+1}` : `CPU${i+1-humanPlayers}`);
        }
        if(reset) {
            tokens = [];
            for(let i=0; i<numPlayers; i++) tokens.push([-1, -1, -1, -1]); // -1 means in yard
            currentPlayer = 0;
            diceValue = 0;
            extraTurn = false;
            gameWinner = null;
            gameMessage = `${playerNames[0]}'s turn • Roll dice to begin.`;
            validGlowTokens = [];
        }
        updateUI();
        drawBoard();
        if(isComputerPlayer(currentPlayer)) {
            setTimeout(() => { if(!gameWinner) rollDice(); }, 800);
        }
    }
    
    // ---------- HELPER: get physical position from token state ----------
    function getTokenPosition(playerIdx, tokenIdx) {
        let stepVal = tokens[playerIdx][tokenIdx];
        if(stepVal === -1) {
            return yardPositionsRing[playerIdx][tokenIdx];
        }
        if(stepVal === 99) {
            let last = homeStretchCoords[playerIdx][homeStretchCoords[playerIdx].length-1];
            return last;
        }
        if(stepVal >= 0 && stepVal < 52) {
            let globalIdx = (startStepPerPlayer[playerIdx] + stepVal) % 52;
            return globalTrackCoords[globalIdx];
        }
        if(stepVal >= 52 && stepVal < 58) {
            let homeIdx = stepVal - 52;
            if(homeIdx < homeStretchCoords[playerIdx].length) {
                return homeStretchCoords[playerIdx][homeIdx];
            }
        }
        return null;
    }
    
    // ---------- GAME RULES (fixed lap logic) ----------
    const SAFE_STEPS = new Set([0,8,16,24,32,40,48]);
    function isSafeStep(stepCount) {
        return SAFE_STEPS.has(stepCount % 52);
    }
    
    function getScore(p) { return tokens[p].filter(v => v === 99).length; }
    function checkWinner() { for(let i=0;i<numPlayers;i++) if(getScore(i)===4) return i; return null; }
    function isComputerPlayer(idx) { return !isHuman[idx]; }
    
    function canMovePiece(pIdx, stepVal, dice) {
        if(stepVal === 99) return false;
        if(stepVal === -1) return dice === 6;
        if(stepVal >= 0 && stepVal < 52) {
            let newStep = stepVal + dice;
            return newStep <= 52;
        }
        if(stepVal >= 52 && stepVal < 58) {
            let newStep = stepVal + dice;
            return newStep <= 57;
        }
        return false;
    }
    
    function applyCapture(playerIdx, newStepCount) {
        if(newStepCount >= 52) return false;
        let globalIdx = (startStepPerPlayer[playerIdx] + newStepCount) % 52;
        if(isSafeStep(newStepCount)) return false;
        let captured = false;
        for(let p=0; p<numPlayers; p++) {
            if(p === playerIdx) continue;
            for(let t=0; t<4; t++) {
                let other = tokens[p][t];
                if(other >= 0 && other < 52) {
                    let otherGlobal = (startStepPerPlayer[p] + other) % 52;
                    if(otherGlobal === globalIdx) {
                        tokens[p][t] = -1;
                        captured = true;
                        playCapture();
                        gameMessage += ` ⚔️ Captured ${playerNames[p]}!`;
                    }
                }
            }
        }
        return captured;
    }
    
    function movePiece(pIdx, tIdx, dice) {
        let current = tokens[pIdx][tIdx];
        if(current === -1 && dice === 6) {
            tokens[pIdx][tIdx] = 0;
            playMove();
            applyCapture(pIdx, 0);
            return true;
        }
        if(current >= 0 && current < 52) {
            let newStep = current + dice;
            if(newStep <= 52) {
                tokens[pIdx][tIdx] = newStep;
                if(newStep < 52) applyCapture(pIdx, newStep);
                playMove();
                if(newStep === 52) {
                    gameMessage = `🎉 ${playerNames[pIdx]} reaches home stretch!`;
                }
                return true;
            }
        }
        else if(current >= 52 && current < 58) {
            let newStep = current + dice;
            if(newStep <= 57) {
                tokens[pIdx][tIdx] = newStep;
                playMove();
                if(newStep === 57) {
                    tokens[pIdx][tIdx] = 99;
                    gameMessage = `🎉 ${playerNames[pIdx]} finished a token!`;
                    playWin();
                }
                return true;
            }
        }
        return false;
    }
    
    function getValidMoves(pIdx, dice) {
        let valid = [];
        for(let i=0;i<4;i++) {
            if(canMovePiece(pIdx, tokens[pIdx][i], dice)) valid.push(i);
        }
        return valid;
    }
    
    function pickComputerMove(validMoves, dice) {
        let bestChoice = validMoves[0];
        let bestScore = -Infinity;
        for(let tokenIdx of validMoves) {
            let stepVal = tokens[currentPlayer][tokenIdx];
            let newStep = stepVal === -1 ? 0 : stepVal + dice;
            let score = newStep;
            if(newStep < 52) score += (newStep % 52 === 0 ? 5 : 0);
            if(newStep === 52) score += 15;
            if(newStep < 52) {
                let targetGlobal = (startStepPerPlayer[currentPlayer] + newStep) % 52;
                for(let p=0; p<numPlayers; p++) {
                    if(p === currentPlayer) continue;
                    for(let t=0; t<4; t++) {
                        let other = tokens[p][t];
                        if(other >= 0 && other < 52) {
                            let otherGlobal = (startStepPerPlayer[p] + other) % 52;
                            if(otherGlobal === targetGlobal && !isSafeStep(newStep)) {
                                score += 40;
                            }
                        }
                    }
                }
            }
            if(score > bestScore) {
                bestScore = score;
                bestChoice = tokenIdx;
            }
        }
        return bestChoice;
    }
    
    function scheduleComputerRoll() {
        if(isComputerPlayer(currentPlayer) && !gameWinner) {
            setTimeout(() => {
                if(!gameWinner && isComputerPlayer(currentPlayer)) rollDice();
            }, 900);
        }
    }
    
    function nextTurn() {
        if(gameWinner) return;
        if(extraTurn) {
            extraTurn = false;
            gameMessage = `${playerNames[currentPlayer]} extra turn! Roll again.`;
            updateUI();
            scheduleComputerRoll();
            return;
        }
        do {
            currentPlayer = (currentPlayer + 1) % numPlayers;
        } while(getScore(currentPlayer) === 4);
        gameMessage = `${playerNames[currentPlayer]}'s turn • Roll dice`;
        validGlowTokens = [];
        updateUI();
        scheduleComputerRoll();
    }
    
    function rollDice() {
        if(gameWinner) { gameMessage = `Game over, reset.`; updateUI(); drawBoard(); return; }
        playDiceRoll();
        let dice = Math.floor(Math.random()*6)+1;
        diceValue = dice;
        updateDiceUI(dice);
        let valid = getValidMoves(currentPlayer, dice);
        if(valid.length === 0) {
            gameMessage = `${playerNames[currentPlayer]} rolled ${dice} • No moves → turn ends.`;
            extraTurn = false;
            nextTurn();
            diceValue = 0;
            updateDiceUI(0);
            drawBoard(); updateUI();
            return;
        }
        if(isComputerPlayer(currentPlayer)) {
            gameMessage = `${playerNames[currentPlayer]} rolled ${dice}! Thinking...`;
            drawBoard(); updateUI();
            setTimeout(() => {
                let choice = pickComputerMove(valid, dice);
                movePiece(currentPlayer, choice, dice);
                let winner = checkWinner();
                if(winner !== null) {
                    gameWinner = winner;
                    gameMessage = `🏆🏆 ${playerNames[winner]} WINS! 🏆🏆`;
                    playWin();
                    diceValue = 0;
                    updateDiceUI(0);
                    validGlowTokens = [];
                    drawBoard(); updateUI();
                    return;
                }
                let six = (diceValue === 6);
                diceValue = 0;
                updateDiceUI(0);
                if(six) extraTurn = true;
                else extraTurn = false;
                nextTurn();
                validGlowTokens = [];
                drawBoard(); updateUI();
            }, 800);
            return;
        }
        gameMessage = `${playerNames[currentPlayer]} rolled ${dice}! Click a glowing token.`;
        validGlowTokens = valid;
        drawBoard(); updateUI();
    }
    
    function attemptMove(tokenIdx) {
        if(gameWinner || diceValue===0) { if(diceValue===0) gameMessage="Roll first!"; updateUI(); drawBoard(); return; }
        if(isComputerPlayer(currentPlayer)) return;
        let valid = getValidMoves(currentPlayer, diceValue);
        if(!valid.includes(tokenIdx)) { gameMessage = `Cannot move token ${tokenIdx+1}.`; updateUI(); drawBoard(); return; }
        movePiece(currentPlayer, tokenIdx, diceValue);
        let winner = checkWinner();
        if(winner !== null) {
            gameWinner = winner;
            gameMessage = `🏆🏆 ${playerNames[winner]} WINS! 🏆🏆`;
            playWin();
            diceValue = 0;
            updateDiceUI(0);
            validGlowTokens = [];
            drawBoard(); updateUI();
            return;
        }
        let six = (diceValue === 6);
        diceValue = 0;
        updateDiceUI(0);
        if(six) extraTurn = true;
        else extraTurn = false;
        nextTurn();
        validGlowTokens = [];
        drawBoard(); updateUI();
    }
    
    function getRendererState() {
        return {
            ctx,
            width,
            height,
            numPlayers,
            playerColors,
            playerNames,
            currentPlayer,
            gameWinner,
            validGlowTokens,
            globalTrackCoords,
            homeStretchCoords,
            SAFE_STEPS,
            outerRadius,
            yardInnerRadius,
            homeStartRadius,
            finishRadius,
            getTokenPosition
        };
    }

    function drawBoard() {
        renderBoard(getRendererState());
    }

    function updateUI() {
        let container = document.getElementById('scoreContainer');
        let html = '';
        for(let i=0;i<numPlayers;i++) {
            let active = (i===currentPlayer && !gameWinner) ? 'active-turn' : '';
            let role = isHuman[i] ? 'HUMAN' : 'BOT';
            html += `<div class="player-card ${active}" style="border-left: 6px solid ${playerColors[i]}">
                        <div class="player-name">${playerNames[i]}</div>
                        <div class="player-score">${getScore(i)}</div>
                        <small>${role} • 🏆 / 4 finished</small>
                    </div>`;
        }
        container.innerHTML = html;
        document.getElementById('gameStatusMsg').innerHTML = gameWinner ? `🏆 WINNER: ${playerNames[gameWinner]} 🏆` : gameMessage;
    }
    
    function updateDiceUI(val) {
        const map = {0:"⚀",1:"⚀",2:"⚁",3:"⚂",4:"⚃",5:"⚄",6:"⚅"};
        document.getElementById('radialDice').innerText = map[val];
    }
    
    function handleCanvasClick(e) {
        if(gameWinner) return;
        if(isComputerPlayer(currentPlayer)) return;
        if(diceValue === 0) { gameMessage = "Roll first!"; updateUI(); drawBoard(); return; }
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let mx = (e.clientX - rect.left) * scaleX;
        let my = (e.clientY - rect.top) * scaleY;
        for(let tk=0; tk<4; tk++) {
            let pos = getTokenPosition(currentPlayer, tk);
            if(pos && Math.hypot(mx-pos.x, my-pos.y) < 22) {
                attemptMove(tk);
                drawBoard();
                updateUI();
                break;
            }
        }
    }
    
    document.getElementById('applyPlayersBtn').addEventListener('click', ()=>{
        let total = parseInt(document.getElementById('playerCountInput').value);
        let humans = parseInt(document.getElementById('humanCountInput').value);
        if(total>=3 && total<=10) numPlayers = total;
        else numPlayers = 4;
        if(humans >= 1 && humans <= numPlayers) humanPlayers = humans;
        else humanPlayers = 1;
        rebuildGame(true);
        drawBoard();
    });
    document.getElementById('playerCountInput').addEventListener('change', ()=>{
        let total = parseInt(document.getElementById('playerCountInput').value);
        if(total < 3) total = 3;
        if(total > 10) total = 10;
        document.getElementById('playerCountInput').value = total;
        document.getElementById('humanCountInput').max = total;
        if(parseInt(document.getElementById('humanCountInput').value) > total) {
            document.getElementById('humanCountInput').value = total;
        }
    });
    document.getElementById('humanCountInput').addEventListener('change', ()=>{
        let humans = parseInt(document.getElementById('humanCountInput').value);
        let total = parseInt(document.getElementById('playerCountInput').value);
        if(humans < 1) humans = 1;
        if(humans > total) humans = total;
        document.getElementById('humanCountInput').value = humans;
    });
    document.getElementById('hardResetBtn').addEventListener('click', ()=>{ rebuildGame(true); drawBoard(); });
    document.getElementById('rollSharedBtn').addEventListener('click', ()=>{ rollDice(); });
    canvas.addEventListener('click', handleCanvasClick);
    
    rebuildGame(true);
    drawBoard();
