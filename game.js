const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const timeElement = document.getElementById('time');
const gameOverElement = document.getElementById('gameOver');
const restartBtn = document.getElementById('restartBtn');
const collectSound = document.getElementById('collectSound');
const explodeSound = document.getElementById('explodeSound');

const config = {
    playerSpeed: 8,
    meteorSpawnRate: 0.03,
    crystalSpawnRate: 0.015,
    starCount: 200,
    gameTime: 0,
    difficultyInterval: 5
};

let game = {
    player: { x: canvas.width / 2, y: canvas.height - 60, size: 30 },
    meteors: [],
    crystals: [],
    stars: [],
    score: 0,
    lives: 3,
    isGameOver: false,
    keys: {},
    lastTime: 0,
    difficultyLevel: 1
};

function initStars() {
    game.stars = [];
    for (let i = 0; i < config.starCount; i++) {
        game.stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 3 + 1,
            speed: Math.random() * 5 + 1,
            alpha: Math.random()
        });
    }
}

function drawBackground() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    game.stars.forEach(star => {
        star.alpha += (Math.random() - 0.5) * 0.05;
        star.alpha = Math.max(0.3, Math.min(1, star.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

function drawPlayer() {
    const g = ctx.createLinearGradient(game.player.x, game.player.y - 15, game.player.x, game.player.y + 15);
    g.addColorStop(0, '#00f');
    g.addColorStop(1, '#0ff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(game.player.x, game.player.y - game.player.size / 2);
    ctx.lineTo(game.player.x - game.player.size / 2, game.player.y + game.player.size / 2);
    ctx.lineTo(game.player.x + game.player.size / 2, game.player.y + game.player.size / 2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 100, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(game.player.x, game.player.y + 30, 10 + Math.random() * 5, 0, Math.PI * 2);
    ctx.fill();
}

function updatePlayer() {
    if (game.keys['arrowleft'] || game.keys['a']) {
        game.player.x = Math.max(game.player.size / 2, game.player.x - config.playerSpeed);
    }
    if (game.keys['arrowright'] || game.keys['d']) {
        game.player.x = Math.min(canvas.width - game.player.size / 2, game.player.x + config.playerSpeed);
    }
}

function spawnMeteors() {
    const spawnRate = config.meteorSpawnRate * game.difficultyLevel;
    if (Math.random() < spawnRate) {
        game.meteors.push({
            x: Math.random() * canvas.width,
            y: -50,
            speed: 2 + Math.random() * 3 * game.difficultyLevel,
            size: 20 + Math.random() * 30,
            color: `hsl(${Math.random() * 30 + 10}, 70%, 50%)`
        });
    }
}

function spawnCrystals() {
    if (Math.random() < config.crystalSpawnRate) {
        const isShield = Math.random() < 0.1;
        game.crystals.push({
            x: Math.random() * canvas.width,
            y: -30,
            speed: 1 + Math.random() * 2,
            size: 15,
            color: isShield ? '#ff0' : `hsl(${Math.random() * 60 + 180}, 100%, 60%)`,
            type: isShield ? 'shield' : 'score',
            points: isShield ? 0 : 10 + Math.floor(Math.random() * 10)
        });
    }
}

function updateObjects() {
    game.meteors.forEach((m, i) => {
        m.y += m.speed;
        if (checkCollision(game.player, m)) {
            game.lives--;
            livesElement.textContent = game.lives;
            game.meteors.splice(i, 1);
            explodeSound.play();
            if (game.lives <= 0) endGame();
        }
        if (m.y > canvas.height + m.size) game.meteors.splice(i, 1);
    });

    game.crystals.forEach((c, i) => {
        c.y += c.speed;
        if (checkCollision(game.player, c)) {
            if (c.type === 'shield') {
                game.lives++;
                livesElement.textContent = game.lives;
            } else {
                game.score += c.points;
                scoreElement.textContent = Math.floor(game.score);
            }
            game.crystals.splice(i, 1);
            collectSound.play();
        }
        if (c.y > canvas.height + c.size) game.crystals.splice(i, 1);
    });
}

function drawObjects() {
    game.meteors.forEach(m => {
        ctx.fillStyle = m.color;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.size / 2, 0, Math.PI * 2);
        ctx.fill();
    });

    game.crystals.forEach(c => {
        ctx.fillStyle = c.color;
        ctx.beginPath();
        ctx.moveTo(c.x, c.y - c.size / 2);
        ctx.lineTo(c.x - c.size / 2, c.y);
        ctx.lineTo(c.x, c.y + c.size / 2);
        ctx.lineTo(c.x + c.size / 2, c.y);
        ctx.closePath();
        ctx.fill();
    });
}

function checkCollision(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.size / 2 + b.size / 2);
}

function endGame() {
    game.isGameOver = true;
    gameOverElement.style.display = 'block';
    restartBtn.style.display = 'block';
}

function restartGame() {
    game = {
        player: { x: canvas.width / 2, y: canvas.height - 60, size: 30 },
        meteors: [],
        crystals: [],
        stars: [],
        score: 0,
        lives: 3,
        isGameOver: false,
        keys: {},
        lastTime: 0,
        difficultyLevel: 1
    };
    config.gameTime = 0;
    scoreElement.textContent = '0';
    livesElement.textContent = '3';
    timeElement.textContent = '0';
    gameOverElement.style.display = 'none';
    restartBtn.style.display = 'none';
    initStars();
    game.lastTime = performance.now();
    gameLoop(game.lastTime);
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    restartGame();
}

function gameLoop(timestamp) {
    if (!game.isGameOver) {
        const deltaTime = timestamp - game.lastTime;
        game.lastTime = timestamp;
        if (deltaTime < 100) {
            config.gameTime += deltaTime / 1000;
            timeElement.textContent = Math.floor(config.gameTime);
            if (Math.floor(config.gameTime) % config.difficultyInterval === 0 &&
                config.gameTime - deltaTime / 1000 < Math.floor(config.gameTime)) {
                game.difficultyLevel += 0.2;
            }
        }
        drawBackground();
        updatePlayer();
        spawnMeteors();
        spawnCrystals();
        updateObjects();
        drawPlayer();
        drawObjects();
        game.score += 0.1;
        scoreElement.textContent = Math.floor(game.score);
        requestAnimationFrame(gameLoop);
    }
}

window.addEventListener('keydown', e => game.keys[e.key.toLowerCase()] = true);
window.addEventListener('keyup', e => game.keys[e.key.toLowerCase()] = false);
canvas.addEventListener('touchmove', e => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    game.player.x = touch.clientX - rect.left;
});
restartBtn.addEventListener('click', restartGame);
initStars();
