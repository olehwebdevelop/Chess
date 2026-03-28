const squares = document.querySelectorAll('.board-square');

let activePiece = null;
let currentTurn = 'white';
let isPaused = false;
let gameStarted = false;
let gameMode = null;

let selectedDifficulty = null;
let selectedColor = null;
let selectedTime = null;

let playerColor = 'white';
let botColor = 'black';

let whiteTime = 600;
let blackTime = 600;
let timerInterval = null;

let hasMoved = {
    'white-king': false, 'white-rook1': false, 'white-rook2': false,
    'black-king': false, 'black-rook1': false, 'black-rook2': false
};

const botBtn = document.getElementById('bot-game');
const pvpBtn = document.getElementById('pvp-game');

const difficultyBlock = document.getElementById('difficulty');
const colorBlock = document.getElementById('color');
const timeBlock = document.getElementById('time');
const timerContainer = document.querySelector('.timer-container');
const startBtn = document.getElementById('start-btn');

difficultyBlock.style.display = 'none';
colorBlock.style.display = 'none';
timeBlock.style.display = 'none';
timerContainer.style.display = 'none';

botBtn.addEventListener('click', () => {
    gameMode = 'bot';
    difficultyBlock.style.display = 'flex';
    colorBlock.style.display = 'flex';
    timeBlock.style.display = 'none';
    timerContainer.style.display = 'none';
});

pvpBtn.addEventListener('click', () => {
    gameMode = 'pvp';
    difficultyBlock.style.display = 'none';
    colorBlock.style.display = 'none';
    timeBlock.style.display = 'flex';
    timerContainer.style.display = 'flex';
});

function flipBoard(color) {
    const board = document.getElementById('board');
    const columns = Array.from(board.children);
    if (color === 'black') {
        columns.reverse().forEach(col => {
            const squares = Array.from(col.children);
            squares.reverse().forEach(sq => col.appendChild(sq));
            board.appendChild(col);
        });
    }
}

document.querySelectorAll('.dif-but').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedDifficulty = btn.id;
        document.querySelectorAll('.dif-but').forEach(b => b.style.border = '2px solid transparent');
        btn.style.border = '2px solid white';
    });
});

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.color-btn').forEach(b => b.style.border = '2px solid transparent');
        btn.style.border = '2px solid white';

        if (btn.id === 'white-btn') playerColor = 'white';
        else if (btn.id === 'black-btn') playerColor = 'black';
        else playerColor = Math.random() < 0.5 ? 'white' : 'black';

        selectedColor = playerColor;
    });
});

document.querySelectorAll('.time-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        selectedTime = btn.id;
        document.querySelectorAll('.time-btn').forEach(b => b.style.border = '2px solid transparent');
        btn.style.border = '2px solid white';
    });
});

function getSecondsFromTime(id) {
    if (id === '1m') return 60;
    if (id === '5m') return 300;
    if (id === '10m') return 600;
    if (id === '30m') return 1800;
    if (id === '1h') return 3600;
    if (id === 'inf') return Infinity;
}

function formatTime(sec) {
    if (sec === Infinity) return '∞';
    const minutes = Math.floor(sec / 60);
    const seconds = sec % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimerUI() {
    document.getElementById('timer-white').textContent = formatTime(whiteTime);
    document.getElementById('timer-black').textContent = formatTime(blackTime);
}

function startTimer() {
    if (selectedTime === 'inf') return;

    timerInterval = setInterval(() => {
        if (currentTurn === 'white') {
            whiteTime--;
            if (whiteTime <= 0) {
                clearInterval(timerInterval);
                alert('Black wins on time');
                location.reload();
            }
        } else {
            blackTime--;
            if (blackTime <= 0) {
                clearInterval(timerInterval);
                alert('White wins on time');
                location.reload();
            }
        }
        updateTimerUI();
    }, 1000);
}

startBtn.addEventListener('click', () => {
    if (!gameMode) return alert('Choose game mode');
    if (gameMode === 'bot' && (!selectedDifficulty || !selectedColor)) return alert('Choose difficulty and color');
    if (gameMode === 'pvp' && !selectedTime) return alert('Choose time');

    if (gameMode === 'bot') botColor = playerColor === 'white' ? 'black' : 'white';
    if (gameMode === 'bot' && playerColor === 'black') flipBoard('black');

    gameStarted = true;

    if (gameMode === 'pvp') {
        const time = getSecondsFromTime(selectedTime);
        whiteTime = time;
        blackTime = time;
        updateTimerUI();
        startTimer();
    }

    document.getElementById('settings').style.display = 'none';

    if (gameMode === 'bot' && botColor === 'white') triggerBotMove();
});

function clearHighlight() {
    squares.forEach(sq => sq.classList.remove('highlight', 'active-sq'));
}

function clearCheckHighlight() {
    squares.forEach(sq => sq.classList.remove('check-warning'));
}

function getPieceAt(col, row) {
    const square = document.getElementById(col + row);
    return square ? square.querySelector('.pieces') : null;
}

function isValid(col, row) {
    return col >= 'A' && col <= 'H' && row >= 1 && row <= 8;
}

function getPos(sq) {
    return { col: sq.id[0], row: parseInt(sq.id[1]) };
}

function updateCheckStatus() {
    clearCheckHighlight();
    if (isCheck(currentTurn)) {
        const king = document.querySelector(`.pieces[data-type="king"][data-color="${currentTurn}"]`);
        if (king) king.parentElement.classList.add('check-warning');
    }
}

function isCheck(color) {
    const king = document.querySelector(`.pieces[data-type="king"][data-color="${color}"]`);
    if (!king) return false;
    const kingSquare = king.parentElement;
    const opponentColor = color === 'white' ? 'black' : 'white';
    const opponentPieces = document.querySelectorAll(`.pieces[data-color="${opponentColor}"]`);
    for (let p of opponentPieces) {
        if (getMoves(p, true).includes(kingSquare)) return true;
    }
    return false;
}

function isMoveLegal(piece, targetSquare) {
    const originalSquare = piece.parentElement;
    const targetPiece = targetSquare.querySelector('.pieces');
    const color = piece.dataset.color;

    let tempCaptured = null;
    if (targetPiece) {
        if (targetPiece.dataset.type === 'king') return false;
        tempCaptured = targetPiece;
        targetPiece.remove();
    }

    targetSquare.appendChild(piece);
    const inCheck = isCheck(color);
    originalSquare.appendChild(piece);
    if (tempCaptured) targetSquare.appendChild(tempCaptured);

    return !inCheck;
}

function getMoves(piece, ignoreCheck = false) {
    const square = piece.parentElement;
    const pos = getPos(square);
    const color = piece.dataset.color;
    const type = piece.dataset.type;

    let moves = [];
    const directions = {
        rook: [[1, 0], [-1, 0], [0, 1], [0, -1]],
        bishop: [[1, 1], [1, -1], [-1, 1], [-1, -1]],
        queen: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        king: [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]],
        knight: [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]]
    };

    if (type === 'pawn') {
        const dir = color === 'white' ? 1 : -1;
        const forwardRow = pos.row + dir;
        if (isValid(pos.col, forwardRow) && !getPieceAt(pos.col, forwardRow)) {
            moves.push(document.getElementById(pos.col + forwardRow));
            const startRow = color === 'white' ? 2 : 7;
            if (pos.row === startRow && !getPieceAt(pos.col, pos.row + dir * 2)) {
                moves.push(document.getElementById(pos.col + (pos.row + dir * 2)));
            }
        }
        [-1, 1].forEach(dCol => {
            const charCode = pos.col.charCodeAt(0) + dCol;
            if (charCode >= 65 && charCode <= 72) {
                const nextCol = String.fromCharCode(charCode);
                if (isValid(nextCol, forwardRow)) {
                    const target = getPieceAt(nextCol, forwardRow);
                    if (ignoreCheck || (target && target.dataset.color !== color)) {
                        moves.push(document.getElementById(nextCol + forwardRow));
                    }
                }
            }
        });
    } else if (type === 'knight') {
        directions.knight.forEach(d => {
            const nextCol = String.fromCharCode(pos.col.charCodeAt(0) + d[0]);
            const nextRow = pos.row + d[1];
            if (isValid(nextCol, nextRow)) {
                const target = getPieceAt(nextCol, nextRow);
                if (!target || target.dataset.color !== color) moves.push(document.getElementById(nextCol + nextRow));
            }
        });
    } else {
        const maxSteps = type === 'king' ? 1 : 8;
        directions[type].forEach(d => {
            for (let step = 1; step <= maxSteps; step++) {
                const nextCol = String.fromCharCode(pos.col.charCodeAt(0) + d[0] * step);
                const nextRow = pos.row + d[1] * step;
                if (!isValid(nextCol, nextRow)) break;
                const targetSquare = document.getElementById(nextCol + nextRow);
                const targetPiece = getPieceAt(nextCol, nextRow);
                if (!targetPiece) moves.push(targetSquare);
                else {
                    if (targetPiece.dataset.color !== color) moves.push(targetSquare);
                    break;
                }
            }
        });

        if (type === 'king' && !ignoreCheck && !hasMoved[`${color}-king`] && !isCheck(color)) {
            const r = pos.row;

            const rookH = getPieceAt('H', r);
            if (rookH && !hasMoved[`${color}-rook2`] && !getPieceAt('F', r) && !getPieceAt('G', r)) {
                if (isMoveLegal(piece, document.getElementById('F' + r))) moves.push(document.getElementById('G' + r));
            }

            const rookA = getPieceAt('A', r);
            if (rookA && !hasMoved[`${color}-rook1`] && !getPieceAt('B', r) && !getPieceAt('C', r) && !getPieceAt('D', r)) {
                if (isMoveLegal(piece, document.getElementById('D' + r))) moves.push(document.getElementById('C' + r));
            }
        }
    }

    return ignoreCheck ? moves : moves.filter(m => isMoveLegal(piece, m));
}


function hasAnyLegalMoves(color) {
    const pieces = document.querySelectorAll(`.pieces[data-color="${color}"]`);
    for (let p of pieces) {
        if (getMoves(p).length > 0) return true;
    }
    return false;
}

function checkGameEnd() {
    if (!hasAnyLegalMoves(currentTurn)) {
        if (isCheck(currentTurn)) {
            const winner = currentTurn === 'white' ? 'Black' : 'White';
            setTimeout(() => alert(winner + ' wins by checkmate'), 100);
        } else {
            setTimeout(() => alert('Stalemate'), 100);
        }
        setTimeout(() => location.reload(), 200);
    }
}

function handlePromotion(piece, callback) {
    const isBot = (gameMode === 'bot' && piece.dataset.color === botColor);
    const color = piece.dataset.color;
    const prefix = color === 'white' ? 'white-' : 'black-';

    if (isBot) {
        const types = ['queen', 'rook', 'bishop', 'knight'];
        const choice = types[Math.floor(Math.random() * types.length)];
        piece.dataset.type = choice;
        piece.src = prefix + (choice === 'queen' ? 'crown.png' : `${choice}.png`);
        callback();
    } else {
        const square = piece.parentElement;
        const menu = document.createElement('div');
        menu.className = 'promotion-menu';
        
        const types = ['queen', 'rook', 'bishop', 'knight'];
        types.forEach(type => {
            const img = document.createElement('img');
            img.src = prefix + (type === 'queen' ? 'crown.png' : `${type}.png`);
            img.className = 'promotion-option';
            img.onclick = () => {
                piece.dataset.type = type;
                piece.src = img.src;
                menu.remove();
                isPaused = false;
                callback();
            };
            menu.appendChild(img);
        });

        isPaused = true;
        square.appendChild(menu);
    }
}

function makeBotMove() {
    if (!gameStarted || isPaused) return;
    if (currentTurn !== botColor) return;

    const pieces = document.querySelectorAll(`.pieces[data-color="${botColor}"]`);
    let allMoves = [];
    let captureMoves = [];

    pieces.forEach(p => {
        const moves = getMoves(p);
        moves.forEach(m => {
            const target = m.querySelector('.pieces');
            const moveObj = { p, m };
            allMoves.push(moveObj);
            if (target && target.dataset.color !== botColor) captureMoves.push(moveObj);
        });
    });

    if (allMoves.length === 0) return;

    let chosenMove;
    if (selectedDifficulty === 'Easy') {
        chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (selectedDifficulty === 'Medium') {
        const useRandom = Math.random() < 0.5;
        if (!useRandom && captureMoves.length > 0) chosenMove = captureMoves[Math.floor(Math.random() * captureMoves.length)];
        else chosenMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    } else if (selectedDifficulty === 'Hard') {
        chosenMove = getBestMove() || allMoves[Math.floor(Math.random() * allMoves.length)];
    }

    const target = chosenMove.m.querySelector('.pieces');
    if (target) target.remove();
    chosenMove.m.appendChild(chosenMove.p);

    const finishMove = () => {
        currentTurn = currentTurn === 'white' ? 'black' : 'white';
        updateCheckStatus();
        checkGameEnd();
        triggerBotMove();
    };

    const pos = getPos(chosenMove.m);
    if (chosenMove.p.dataset.type === 'pawn' && (pos.row === 1 || pos.row === 8)) {
        handlePromotion(chosenMove.p, finishMove);
    } else {
        finishMove();
    }
}

function triggerBotMove() {
    if (currentTurn !== botColor) return;
    const delay = Math.floor(Math.random() * 2000) + 1000;
    setTimeout(makeBotMove, delay);
}

squares.forEach(square => {
    square.addEventListener('click', () => {
        if (!gameStarted || isPaused) return;
        
        if (gameMode === 'bot' && currentTurn === botColor) return;
        
        if (gameMode === 'pvp' && activePiece === null && square.querySelector('.pieces')?.dataset.color !== currentTurn) {
            if (!square.classList.contains('highlight')) return;
        }

        const pieceInSquare = square.querySelector('.pieces');

        if (activePiece && square.classList.contains('highlight')) {
            const targetPos = getPos(square);
            const startSquare = activePiece.parentElement;
            const startPos = getPos(startSquare);
            const color = activePiece.dataset.color;
            const type = activePiece.dataset.type;

            if (type === 'king') {
                const dist = targetPos.col.charCodeAt(0) - startPos.col.charCodeAt(0);
                if (Math.abs(dist) === 2) {
                    if (targetPos.col === 'G') {
                        const rook = getPieceAt('H', targetPos.row);
                        if (rook) document.getElementById('F' + targetPos.row).appendChild(rook);
                    } else if (targetPos.col === 'C') {
                        const rook = getPieceAt('A', targetPos.row);
                        if (rook) document.getElementById('D' + targetPos.row).appendChild(rook);
                    }
                }
                hasMoved[`${color}-king`] = true;
            }

            if (type === 'rook') {
                const side = startPos.col === 'A' ? 'rook1' : 'rook2';
                hasMoved[`${color}-${side}`] = true;
            }

            const targetPiece = square.querySelector('.pieces');
            if (targetPiece) {
                if (targetPiece.dataset.type === 'rook') {
                    const targetSide = targetPos.col === 'A' ? 'rook1' : 'rook2';
                    hasMoved[`${targetPiece.dataset.color}-${targetSide}`] = true;
                }
                targetPiece.remove();
            }

            square.appendChild(activePiece);

            const finishMove = () => {
                activePiece = null;
                currentTurn = currentTurn === 'white' ? 'black' : 'white';
                clearHighlight();
                updateCheckStatus();
                checkGameEnd();
                if (gameMode === 'bot' && currentTurn === botColor) triggerBotMove();
            };

            if (type === 'pawn' && (targetPos.row === 1 || targetPos.row === 8)) {
                handlePromotion(activePiece, finishMove);
            } else {
                finishMove();
            }
            return;
        }

        if (pieceInSquare) {
            if (gameMode === 'bot' && pieceInSquare.dataset.color !== playerColor) return;
            if (gameMode === 'pvp' && pieceInSquare.dataset.color !== currentTurn) return;

            const wasActive = activePiece === pieceInSquare;
            clearHighlight();
            if (!wasActive) {
                activePiece = pieceInSquare;
                square.classList.add('active-sq');
                getMoves(activePiece).forEach(m => m.classList.add('highlight'));
            } else {
                activePiece = null;
            }
        } else {
            activePiece = null;
            clearHighlight();
        }
    });
});



updateCheckStatus();

function evaluateBoard() {
    const values = { pawn:1, knight:3, bishop:3, rook:5, queen:9, king:1000 };
    let score = 0;
    document.querySelectorAll('.pieces').forEach(p => {
        score += p.dataset.color === botColor ? values[p.dataset.type] : -values[p.dataset.type];
    });
    return score;
}

function simulateMove(move) {
    const from = move.p.parentElement;
    const to = move.m;
    const captured = to.querySelector('.pieces');
    if (captured) captured.remove();
    to.appendChild(move.p);
    return { from, to, captured };
}

function undoMove(move, state) {
    state.from.appendChild(move.p);
    if (state.captured) state.to.appendChild(state.captured);
}

function minimax(depth, isMaximizing) {
    if (depth === 0) return evaluateBoard();
    const color = isMaximizing ? botColor : (botColor === 'white' ? 'black' : 'white');
    const pieces = document.querySelectorAll(`.pieces[data-color="${color}"]`);
    let best = isMaximizing ? -Infinity : Infinity;
    for (let p of pieces) {
        const moves = getMoves(p);
        for (let m of moves) {
            const move = { p, m };
            const state = simulateMove(move);
            const score = minimax(depth - 1, !isMaximizing);
            undoMove(move, state);
            if (isMaximizing) best = Math.max(best, score);
            else best = Math.min(best, score);
        }
    }
    return best;
}

function getBestMove() {
    const pieces = document.querySelectorAll(`.pieces[data-color="${botColor}"]`);
    let bestScore = -Infinity;
    let bestMove = null;
    for (let p of pieces) {
        const moves = getMoves(p);
        for (let m of moves) {
            const move = { p, m };
            const state = simulateMove(move);
            const score = minimax(2, false);
            undoMove(move, state);
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
    }
    return bestMove;
}
