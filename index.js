const mineflayer = require('mineflayer');
const http = require('http');

const HOST = process.env.MC_HOST || 'FrostvaleSMP-FJRA.aternos.me';
const PORT = parseInt(process.env.MC_PORT || '20309', 10);
const USERNAME = process.env.MC_USERNAME || 'FrostBot';
const VERSION = process.env.MC_VERSION || '1.21.4';
const RETRY_MS = parseInt(process.env.RETRY_MS || '30000', 10);

const rand = (a, b) => a + Math.random() * (b - a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function wander(bot, isRunning) {
  while (isRunning() && bot.entity) {
    const roll = Math.random();
    try {
      if (roll < 0.5) {
        // walk in a random direction
        bot.look(rand(0, Math.PI * 2), 0, true);
        bot.setControlState('forward', true);
        bot.setControlState('sprint', Math.random() < 0.3);
        const end = Date.now() + rand(2000, 6000);
        while (Date.now() < end && isRunning()) {
          if (bot.entity.isInWater || Math.random() < 0.15) {
            bot.setControlState('jump', true);
            await sleep(300);
            bot.setControlState('jump', false);
          }
          await sleep(400);
        }
        bot.clearControlStates();
      } else if (roll < 0.65) {
        bot.look(rand(0, Math.PI * 2), rand(-0.5, 0.5), false);
      } else if (roll < 0.8) {
        bot.setControlState('jump', true);
        await sleep(300);
        bot.setControlState('jump', false);
      } else if (roll < 0.9) {
        bot.setControlState('sneak', true);
        await sleep(rand(800, 2000));
        bot.setControlState('sneak', false);
      } else {
        bot.swingArm();
      }
    } catch (e) {
      console.log('[bot] action error:', e.message);
    }
    await sleep(rand(1500, 6000));
  }
}

function start() {
  console.log(`[bot] Connecting to ${HOST}:${PORT} (v${VERSION}) as ${USERNAME}`);
  const bot = mineflayer.createBot({
    host: HOST,
    port: PORT,
    username: USERNAME,
    version: VERSION,
    auth: 'offline',
  });
  let running = false;

  bot.once('spawn', () => {
    console.log('[bot] Joined the server');
    running = true;
    wander(bot, () => running);
  });
  bot.on('death', () => console.log('[bot] Died, respawning...'));
  bot.on('kicked', (r) => console.log('[bot] Kicked:', JSON.stringify(r)));
  bot.on('error', (e) => console.log('[bot] Error:', e.message));
  bot.on('end', (reason) => {
    running = false;
    console.log(`[bot] Disconnected (${reason}). Retrying in ${RETRY_MS / 1000}s`);
    setTimeout(start, RETRY_MS);
  });
}

http
  .createServer((req, res) => res.end('Bot is running'))
  .listen(process.env.PORT || 3000);

start();
