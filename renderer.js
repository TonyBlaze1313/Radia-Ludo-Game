const renderer = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
};

export function initRenderer(canvas, ctx) {
    renderer.canvas = canvas;
    renderer.ctx = ctx;
    renderer.width = canvas.width;
    renderer.height = canvas.height;
}

function hexWithAlpha(hex, alpha) {
    if (hex.length === 7) {
        const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
        return `${hex}${alphaHex}`;
    }
    return hex;
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, width, height, radius);
        return;
    }

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function drawButtonGlow(ctx, center, radius) {
    const glow = ctx.createRadialGradient(center.x, center.y, radius * 0.3, center.x, center.y, radius * 1.1);
    glow.addColorStop(0, 'rgba(255,255,255,0.12)');
    glow.addColorStop(1, 'rgba(16,24,48,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius * 1.05, 0, Math.PI * 2);
    ctx.fill();
}

export function renderBoard(state) {
    const {
        ctx,
        width,
        height,
        numPlayers,
        playerColors,
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
        getTokenPosition,
    } = state;

    const center = { x: width / 2, y: height / 2 };
    const sectorAngle = (Math.PI * 2) / numPlayers;
    const startOffset = -Math.PI / 2;

    ctx.clearRect(0, 0, width, height);

    const background = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, width * 0.65);
    background.addColorStop(0, '#101b33');
    background.addColorStop(0.45, '#09111f');
    background.addColorStop(1, '#05090f');
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 28;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(12, 18, 38, 0.85)';
    drawRoundedRect(ctx, center.x - outerRadius - 40, center.y - outerRadius - 40, (outerRadius + 40) * 2, (outerRadius + 40) * 2, 52);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const baseRing = ctx.createRadialGradient(center.x, center.y, outerRadius * 0.3, center.x, center.y, outerRadius + 12);
    baseRing.addColorStop(0, 'rgba(255,255,255,0.05)');
    baseRing.addColorStop(0.35, 'rgba(85,130,210,0.06)');
    baseRing.addColorStop(1, 'rgba(12,16,34,0.98)');
    ctx.fillStyle = baseRing;
    ctx.beginPath();
    ctx.arc(center.x, center.y, outerRadius + 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const trackGlow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, outerRadius * 1.1);
    trackGlow.addColorStop(0, 'rgba(255,255,255,0.08)');
    trackGlow.addColorStop(0.7, 'rgba(34,50,90,0.14)');
    trackGlow.addColorStop(1, 'rgba(2,6,18,0.96)');
    ctx.fillStyle = trackGlow;
    ctx.fillRect(center.x - outerRadius - 60, center.y - outerRadius - 60, (outerRadius + 60) * 2, (outerRadius + 60) * 2);

    for (let p = 0; p < numPlayers; p++) {
        const ang1 = startOffset + p * sectorAngle;
        const ang2 = ang1 + sectorAngle;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, outerRadius, ang1, ang2);
        ctx.closePath();
        ctx.fillStyle = hexWithAlpha(playerColors[p], 0.12);
        ctx.fill();

        const sectorLine = ctx.createLinearGradient(
            center.x + Math.cos(ang1) * outerRadius,
            center.y + Math.sin(ang1) * outerRadius,
            center.x + Math.cos(ang2) * outerRadius,
            center.y + Math.sin(ang2) * outerRadius
        );
        sectorLine.addColorStop(0, hexWithAlpha(playerColors[p], 0.2));
        sectorLine.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.strokeStyle = sectorLine;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(center.x, center.y, homeStartRadius + 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(13, 20, 38, 0.94)';
    ctx.fill();
    ctx.restore();

    for (let p = 0; p < numPlayers; p++) {
        const ang1 = startOffset + p * sectorAngle;
        const ang2 = ang1 + sectorAngle;
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.arc(center.x, center.y, homeStartRadius, ang1, ang2);
        ctx.closePath();
        ctx.fillStyle = hexWithAlpha(playerColors[p], 0.16);
        ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(center.x, center.y, yardInnerRadius - 4, 0, Math.PI * 2);
    ctx.stroke();

    for (let i = 0; i < globalTrackCoords.length; i++) {
        const pos = globalTrackCoords[i];
        const safe = SAFE_STEPS.has(i);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, safe ? 14 : 10, 0, Math.PI * 2);
        const spotGrad = ctx.createRadialGradient(pos.x - 3, pos.y - 3, 2, pos.x, pos.y, safe ? 14 : 12);
        spotGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
        spotGrad.addColorStop(0.22, safe ? 'rgba(255,230,120,0.85)' : 'rgba(255,255,255,0.7)');
        spotGrad.addColorStop(1, safe ? 'rgba(255,190,60,0.18)' : 'rgba(255,255,255,0.08)');
        ctx.fillStyle = spotGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.18)';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (safe) {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 17, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255,215,0,0.14)';
            ctx.lineWidth = 1.6;
            ctx.stroke();
        }
    }

    for (let p = 0; p < numPlayers; p++) {
        const path = homeStretchCoords[p];
        for (let s = 0; s < path.length; s++) {
            ctx.beginPath();
            ctx.arc(path[s].x, path[s].y, 8, 0, Math.PI * 2);
            ctx.fillStyle = hexWithAlpha(playerColors[p], 0.88);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.14)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    for (let p = 0; p < numPlayers; p++) {
        for (let t = 0; t < 4; t++) {
            const pos = getTokenPosition(p, t);
            if (!pos) continue;

            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 18, 0, Math.PI * 2);
            const tokenGrad = ctx.createRadialGradient(pos.x - 5, pos.y - 5, 1, pos.x, pos.y, 18);
            tokenGrad.addColorStop(0, 'rgba(255,255,255,0.85)');
            tokenGrad.addColorStop(0.12, hexWithAlpha(playerColors[p], 0.98));
            tokenGrad.addColorStop(0.65, playerColors[p]);
            tokenGrad.addColorStop(1, 'rgba(8,13,36,0.94)');
            ctx.fillStyle = tokenGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.32)';
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.restore();

            ctx.beginPath();
            ctx.arc(pos.x - 4, pos.y - 6, 6, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px Segoe UI';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(t + 1), pos.x, pos.y);

            if (validGlowTokens.includes(t) && p === currentPlayer && !gameWinner) {
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 22, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 215, 0, 0.92)';
                ctx.lineWidth = 3.4;
                ctx.stroke();
            }
        }
    }

    if (!gameWinner) {
        const ang1 = startOffset + currentPlayer * sectorAngle;
        const ang2 = ang1 + sectorAngle;
        ctx.beginPath();
        ctx.arc(center.x, center.y, outerRadius + 20, ang1, ang2);
        ctx.strokeStyle = 'rgba(255, 242, 170, 0.72)';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    if (gameWinner !== null) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.96)';
        ctx.font = 'bold 32px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('🏆', center.x, center.y - 8);
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillText(`Winner: ${playerNames[gameWinner]}`, center.x, center.y + 28);
    }

    drawButtonGlow(ctx, center, outerRadius + 40);
}
