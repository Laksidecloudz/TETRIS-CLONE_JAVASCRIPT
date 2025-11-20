const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

// Scale up blocks for better visibility
context.scale(20, 20);

// Draw a simple red square (test)
context.fillStyle = 'red';
context.fillRect(0, 0, 1, 1);
context.imageSmoothingEnabled = false;

// Scale up blocks for better visibility
// (Note: already scaled once above; keeping this comment as-is to preserve notes)

// Draw a simple red square (test)
// (Initial test above; main game rendering occurs below)

// --- Tetris core setup ---
const scale = 20; // cell size in pixels (matches the context.scale above)

function createMatrix(w, h) {
  const matrix = [];
  while (h--) {
    matrix.push(new Array(w).fill(0));
  }
  return matrix;
}

function createPiece(type) {
  // Standard Tetris tetromino definitions using numbers as color IDs
  switch (type) {
    case 'T': return [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ];
    case 'O': return [
      [2, 2],
      [2, 2],
    ];
    case 'L': return [
      [0, 3, 0],
      [0, 3, 0],
      [0, 3, 3],
    ];
    case 'J': return [
      [0, 4, 0],
      [0, 4, 0],
      [4, 4, 0],
    ];
    case 'I': return [
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
      [0, 5, 0, 0],
    ];
    case 'S': return [
      [0, 6, 6],
      [6, 6, 0],
      [0, 0, 0],
    ];
    case 'Z': return [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0],
    ];
    default:
      return [[1]]; // Fallback
  }
}

function collide(arena, player) {
  const m = player.matrix;
  const o = player.pos;
  for (let y = 0; y < m.length; ++y) {
    for (let x = 0; x < m[y].length; ++x) {
      if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
        return true;
      }
    }
  }
  return false;
}

function merge(arena, player) {
  player.matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        arena[y + player.pos.y][x + player.pos.x] = value;
      }
    });
  });
}

function arenaSweep() {
  let rowCount = 1;
  outer: for (let y = arena.length - 1; y >= 0; --y) {
    for (let x = 0; x < arena[y].length; ++x) {
      if (arena[y][x] === 0) {
        continue outer;
      }
    }
    const row = arena.splice(y, 1)[0].fill(0);
    arena.unshift(row);
    ++y; // recheck same row index after unshift

    // Scoring: exponentially increasing for consecutive clears
    score += rowCount * 10;
    rowCount *= 2;
  }
  updateScore();
}

function rotate(matrix, dir) {
  for (let y = 0; y < matrix.length; ++y) {
    for (let x = 0; x < y; ++x) {
      [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
    }
  }
  if (dir > 0) {
    matrix.forEach(row => row.reverse());
  } else {
    matrix.reverse();
  }
}

function drawMatrix(matrix, offset) {
  matrix.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value !== 0) {
        context.fillStyle = colors[value];
        context.fillRect(x + offset.x, y + offset.y, 1, 1);
      }
    });
  });
}

function draw() {
  // Clear the canvas (units are in scaled cells)
  context.clearRect(0, 0, canvas.width, canvas.height);

  // Draw arena and current piece
  drawMatrix(arena, { x: 0, y: 0 });
  drawMatrix(player.matrix, player.pos);
}

function playerReset() {
  const pieces = 'TJLOSZI';
  const type = pieces[(pieces.length * Math.random()) | 0];
  player.matrix = createPiece(type);
  player.pos.y = 0;
  player.pos.x = ((arena[0].length / 2) | 0) - ((player.matrix[0].length / 2) | 0);
  
  if (collide(arena, player)) {
    // Game over: reset arena and score
    arena.forEach(row => row.fill(0));
    score = 0;
    updateScore();
  }
}

function playerDrop() {
  player.pos.y++;
  if (collide(arena, player)) {
    player.pos.y--;
    merge(arena, player);
    arenaSweep();
    playerReset();
  }
  dropCounter = 0;
}

function playerMove(dir) {
  player.pos.x += dir;
  if (collide(arena, player)) {
    player.pos.x -= dir;
  }
}

function playerRotate(dir) {
  const pos = player.pos.x;
  let offset = 1;
  rotate(player.matrix, dir);
  while (collide(arena, player)) {
    player.pos.x += offset;
    offset = -(offset + (offset > 0 ? 1 : -1));
    if (offset > player.matrix[0].length) {
      // Revert rotation if no valid position
      rotate(player.matrix, -dir);
      player.pos.x = pos;
      return;
    }
  }
}

// Colors mapped to piece IDs
const colors = [
  null,
  '#FF0D72', // 1 - T
  '#0DC2FF', // 2 - O
  '#0DFF72', // 3 - L
  '#F538FF', // 4 - J
  '#FF8E0D', // 5 - I
  '#FFE138', // 6 - S
  '#3877FF', // 7 - Z
];

// Arena and player state
const arena = createMatrix(12, 20);
const player = {
  pos: { x: 0, y: 0 },
  matrix: null,
};

let score = 0;
function updateScore() {
  const el = document.getElementById('score');
  if (el) el.textContent = score;
}

let dropCounter = 0;
let dropInterval = 1000; // ms
let lastTime = 0;

function update(time = 0) {
  const deltaTime = time - lastTime;
  lastTime = time;

  dropCounter += deltaTime;
  if (dropCounter > dropInterval) {
    playerDrop();
  }

  draw();
  requestAnimationFrame(update);
}

// Keyboard controls
document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    playerMove(-1);
  } else if (event.key === 'ArrowRight') {
    playerMove(1);
  } else if (event.key === 'ArrowDown') {
    playerDrop();
  } else if (event.key === 'q' || event.key === 'Q') {
    playerRotate(-1);
  } else if (event.key === 'w' || event.key === 'W' || event.key === 'ArrowUp') {
    playerRotate(1);
  }
});

// Initialize game
playerReset();
updateScore();
update();
