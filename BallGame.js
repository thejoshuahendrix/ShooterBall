canvas = document.querySelector("canvas");
canvas.width = innerWidth;
canvas.height = innerHeight;

const centerx = canvas.width / 2;
const centery = canvas.height / 2;
let particles = [];
let projectiles = [];
let enemies = [];
let enemyParticles = [];
x: Math.random() * 2 - 1, (context = canvas.getContext("2d"));

const scoreEl = document.getElementById("score");
const startGameBtn = document.querySelector("#startGameBtn");
const cardEl = document.querySelector("#cardEl");
const bigScoreEl = document.querySelector("#bigScoreEl");
const difficultySelect = document.getElementById("difficultySelect");
const visualEffectsCheckbox = document.getElementById("visualEffects");

var score = 0;
var level = 1;
var enemySpawnRate = 3000; // milliseconds
var enemySpeed = 1;

// Add game stats
var gameStats = {
  shotsFired: 0,
  enemiesKilled: 0,
  powerUpsCollected: 0,
  timePlayed: 0,
};

var gameTimer = null;
var powerUps = [];
var powerUpTimer = null;
var activePowerUp = null;

function updateTimer() {
  gameStats.timePlayed++;
  const minutes = Math.floor(gameStats.timePlayed / 60);
  const seconds = gameStats.timePlayed % 60;
  document.getElementById("timer").innerHTML = `${minutes}:${
    seconds < 10 ? "0" : ""
  }${seconds}`;
}

class Player {
  constructor(x, y, radius, color) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
  }
  draw() {
    // Outer glow
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      this.radius / 2,
      this.x,
      this.y,
      this.radius * 2
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    context.beginPath();
    context.arc(this.x, this.y, this.radius * 2, 0, Math.PI * 2, false);
    context.fillStyle = gradient;
    context.fill();

    // Main player circle
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
}
const player = new Player(centerx, centery, 10, "white");

class Projectile {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }
  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
  update() {
    this.draw();

    // Create trail particles
    if (Math.random() > 0.5) {
      particles.push(
        new Particle(this.x, this.y, Math.random() * 2, this.color, {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        })
      );
    }

    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

const friction = 0.99999;

class Particle {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
    this.alpha = 1;
  }
  draw() {
    context.save();
    context.globalAlpha = this.alpha;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
    context.restore();
  }
  update() {
    this.draw();
    this.velocity.x *= friction;
    this.velocity.y *= friction;
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
    this.alpha -= 0.005;
  }
}

class Enemy {
  constructor(x, y, radius, color, velocity) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;
    this.velocity = velocity;
  }
  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();
  }
  update() {
    this.draw();
    this.x = this.x + this.velocity.x;
    this.y = this.y + this.velocity.y;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.type = type; // 'multishot', 'speedup', 'shield'

    // Different colors for different power-ups
    if (this.type === "multishot") {
      this.color = "yellow";
    } else if (this.type === "speedup") {
      this.color = "cyan";
    } else if (this.type === "shield") {
      this.color = "green";
    }
  }

  draw() {
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    context.fillStyle = this.color;
    context.fill();

    // Add icon or letter to identify power-up
    context.fillStyle = "black";
    context.font = "12px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(this.type[0].toUpperCase(), this.x, this.y);
  }

  update() {
    this.draw();
  }
}

function spawnPowerUp() {
  const types = ["multishot", "speedup", "shield"];
  const type = types[Math.floor(Math.random() * types.length)];
  const x = Math.random() * (canvas.width - 100) + 50;
  const y = Math.random() * (canvas.height - 100) + 50;

  powerUps.push(new PowerUp(x, y, type));

  // Remove power-up after 7 seconds if not collected
  setTimeout(() => {
    powerUps.shift();
  }, 7000);
}

function startPowerUpSpawner() {
  return setInterval(spawnPowerUp, 15000); // Spawn every 15 seconds
}

function activatePowerUp(type) {
  if (activePowerUp) {
    clearTimeout(powerUpTimer);
  }

  activePowerUp = type;

  // Display power-up activation message
  const powerUpEl = document.createElement("div");
  powerUpEl.innerHTML = `${type.toUpperCase()} ACTIVATED!`;
  powerUpEl.style.position = "absolute";
  powerUpEl.style.bottom = "100px";
  powerUpEl.style.left = "50%";
  powerUpEl.style.transform = "translateX(-50%)";
  powerUpEl.style.color = "white";
  powerUpEl.style.fontSize = "24px";
  document.body.appendChild(powerUpEl);

  setTimeout(() => {
    document.body.removeChild(powerUpEl);
  }, 2000);

  // Power-up lasts for 10 seconds
  powerUpTimer = setTimeout(() => {
    activePowerUp = null;
  }, 10000);
}

function increaseDifficulty() {
  level++;
  enemySpeed += 0.2;
  enemySpawnRate = Math.max(500, enemySpawnRate - 300);

  // Display level up message
  const levelUpEl = document.createElement("div");
  levelUpEl.innerHTML = `LEVEL ${level}`;
  levelUpEl.style.position = "absolute";
  levelUpEl.style.top = "50%";
  levelUpEl.style.left = "50%";
  levelUpEl.style.transform = "translate(-50%, -50%)";
  levelUpEl.style.color = "white";
  levelUpEl.style.fontSize = "48px";
  document.body.appendChild(levelUpEl);

  setTimeout(() => {
    document.body.removeChild(levelUpEl);
  }, 2000);
}

function spawnEnemies() {
  let enemyInterval = setInterval(() => {
    let x;
    let y;
    const radius = Math.random() * (30 - 6) + 6;

    if (Math.random() < 0.5) {
      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius;
      y = Math.random() * canvas.height;
    } else {
      x = Math.random() * canvas.width;
      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius;
    }

    let color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${
      Math.random() * 255
    })`;

    const angle = Math.atan2(centery - y, centerx - x);

    const velocity = {
      x: Math.cos(angle) * enemySpeed,
      y: Math.sin(angle) * enemySpeed,
    };
    enemies.push(new Enemy(x, y, radius, color, velocity));
  }, enemySpawnRate);

  return enemyInterval;
}

let animationId;

function animate() {
  scoreEl.innerHTML = score;

  animationId = requestAnimationFrame(animate);
  // Conditional visual effects
  if (visualEffectsCheckbox.checked) {
    // Use fade effect
    context.fillStyle = "rgba(0,0,0,.3)";
  } else {
    // Clear screen completely each frame
    context.fillStyle = "rgba(0,0,0,1)";
  }
  context.fillRect(0, 0, canvas.width, canvas.height);
  player.draw();

  // Draw player shield if active
  if (activePowerUp === "shield") {
    context.beginPath();
    context.arc(player.x, player.y, player.radius + 10, 0, Math.PI * 2, false);
    context.strokeStyle = "green";
    context.lineWidth = 2;
    context.stroke();
  }

  //animate particles
  particles.forEach((particle, index) => {
    if (particle.alpha <= 0) {
      particles.splice(index, 1);
    } else {
      particle.update();
    }
  });

  //animate projectiles and check if off screen, if so remove
  projectiles.forEach((projectile, pIndex) => {
    projectile.update();
    if (
      projectile.x + projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      setTimeout(() => {
        projectiles.splice(pIndex, 1);
      }, 0);
    }
  });

  // Check for power-up collisions
  powerUps.forEach((powerUp, index) => {
    powerUp.update();

    const playerPowerUpDist = Math.hypot(
      player.x - powerUp.x,
      player.y - powerUp.y
    );
    if (playerPowerUpDist - player.radius - powerUp.radius < 1) {
      // Collect power-up
      activatePowerUp(powerUp.type);
      powerUps.splice(index, 1);
    }
  });

  //animate enemy then check if end game conditions, then check if projectiles have hit enemy
  enemies.forEach((enemy, eIndex) => {
    enemy.update();
    const playerenemydist = Math.hypot(player.x - enemy.x, player.y - enemy.y);

    //end game conditions
    if (playerenemydist - enemy.radius - player.radius < 1) {
      if (activePowerUp === "shield") {
        // Shield absorbs one hit
        activePowerUp = null;
        clearTimeout(powerUpTimer);
        enemies.splice(eIndex, 1);
      } else {
        cancelAnimationFrame(animationId);
        clearInterval(gameTimer);

        // Show game stats
        const statsHtml = `
                    <h1 class="text-4xl font-bold" id="bigScoreEl">${score}</h1>
                    <p class="text-sm text-gray-700 mb-4">Points</p>
                    <div class="text-left mb-4">
                        <p>Time played: ${Math.floor(
                          gameStats.timePlayed / 60
                        )}:${gameStats.timePlayed % 60 < 10 ? "0" : ""}${
          gameStats.timePlayed % 60
        }</p>
                        <p>Enemies destroyed: ${gameStats.enemiesKilled}</p>
                        <p>Shots fired: ${gameStats.shotsFired}</p>
                        <p>Accuracy: ${
                          Math.round(
                            (gameStats.enemiesKilled / gameStats.shotsFired) *
                              100
                          ) || 0
                        }%</p>
                        <p>Power-ups collected: ${
                          gameStats.powerUpsCollected
                        }</p>
                    </div>
                    <button class="bg-green-400 text-xl text-white w-full py-3 rounded-full" id="startGameBtn">
                        Play Again
                    </button>
                `;

        document.querySelector("#cardEl > div").innerHTML = statsHtml;
        cardEl.style.display = "flex";
      }
    }

    projectiles.forEach((projectile, pIndex) => {
      const projectilenemydist = Math.hypot(
        projectile.x - enemy.x,
        projectile.y - enemy.y
      );
      if (projectilenemydist - enemy.radius - projectile.radius < 1) {
        //create explosions
        for (let i = 0; i < enemy.radius * 2; i++) {
          particles.push(
            new Particle(
              projectile.x,
              projectile.y,
              Math.random() * 2,
              enemy.color,
              {
                x: (Math.random() - 0.5) * (Math.random() * 7),
                y: (Math.random() - 0.5) * (Math.random() * 7),
              }
            )
          );
        }
        //reduce size of enemy if over a certain radius
        if (enemy.radius - 10 > 10) {
          score += 50;

          gsap.to(enemy, {
            radius: enemy.radius - 10,
          });
          setTimeout(() => {
            projectiles.splice(pIndex, 1);
          }, 0);
          //else destroy
        } else {
          score += 150;
          gameStats.enemiesKilled++;
          setTimeout(() => {
            enemies.splice(eIndex, 1);
            projectiles.splice(pIndex, 1);
          }, 0);
        }
      }
    });
  });

  // Level up every 1000 points
  if (score >= level * 1000) {
    increaseDifficulty();
  }
}

function restartGame() {
  if (window.gameIntervals) {
    clearInterval(window.gameIntervals.enemy);
    clearInterval(window.gameIntervals.powerUp);
  }
  projectiles = [];
  enemies = [];
  particles = [];
  powerUps = [];
  score = 0;
  level = 1;
  enemySpeed = 1;
  enemySpawnRate = 3000;
  activePowerUp = null;
  if (powerUpTimer) {
    clearTimeout(powerUpTimer);
  }
}

function shootProjectile(event) {
  const angle = Math.atan2(event.clientY - player.y, event.clientX - player.x);

  if (activePowerUp === "multishot") {
    // Shoot 3 projectiles in a spread
    for (let i = -1; i <= 1; i++) {
      const spreadAngle = angle + i * 0.2;
      const velocity = {
        x: Math.cos(spreadAngle) * 10,
        y: Math.sin(spreadAngle) * 10,
      };
      projectiles.push(new Projectile(player.x, player.y, 4, "red", velocity));
    }
  } else {
    const velocity = {
      x: Math.cos(angle) * (activePowerUp === "speedup" ? 15 : 10),
      y: Math.sin(angle) * (activePowerUp === "speedup" ? 15 : 10),
    };
    projectiles.push(new Projectile(player.x, player.y, 4, "red", velocity));
  }
  gameStats.shotsFired++;
}

function movePlayer(event) {
  const speed = 25;
  switch (event.key) {
    case "w":
      player.y -= speed;
      break;
    case "a":
      player.x -= speed;
      break;
    case "s":
      player.y += speed;
      break;
    case "d":
      player.x += speed;
      break;
  }
}

function applyDifficulty() {
  const difficulty = difficultySelect.value;

  if (difficulty === "easy") {
    enemySpawnRate = 4000;
    enemySpeed = 0.7;
  } else if (difficulty === "normal") {
    enemySpawnRate = 3000;
    enemySpeed = 1;
  } else if (difficulty === "hard") {
    enemySpawnRate = 2000;
    enemySpeed = 1.5;
  }
}

window.addEventListener("keydown", movePlayer);
window.addEventListener("click", shootProjectile);
window.addEventListener("touchstart", (event) => {
  const touch = event.touches[0];
  shootProjectile({
    clientX: touch.clientX,
    clientY: touch.clientY,
  });
});

startGameBtn.addEventListener("click", () => {
  cardEl.style.display = "none";
  restartGame();
  applyDifficulty();
  let enemyInterval = spawnEnemies();
  let powerUpInterval = startPowerUpSpawner();
  animate();

  // Store intervals to clear them when game ends
  window.gameIntervals = {
    enemy: enemyInterval,
    powerUp: powerUpInterval,
  };

  // Reset game stats
  gameStats = {
    shotsFired: 0,
    enemiesKilled: 0,
    powerUpsCollected: 0,
    timePlayed: 0,
  };

  // Start timer
  gameTimer = setInterval(updateTimer, 1000);
});
