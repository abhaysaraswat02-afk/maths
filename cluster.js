/**
 * ARROW OF MATHEMATICS — Cluster Mode
 * Spawns N worker processes (one per CPU core) for horizontal scaling
 * Workers share load via OS-level round-robin
 * Redis adapter keeps all workers in sync via pub/sub
 * 
 * Usage: node cluster.js
 * Recommended: Use with PM2 for production → pm2 start cluster.js -i max
 */

const cluster = require('cluster');
const os      = require('os');
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`\n🚀 Arrow of Mathematics — Cluster Manager`);
  console.log(`📡 Spawning ${numCPUs} worker processes...`);
  console.log(`🔴 Redis Pub/Sub will sync messages across all workers`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    console.log(`✅ Worker #${worker.id} started (PID: ${worker.process.pid})`);
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`⚠️  Worker #${worker.id} died (code: ${code}). Restarting...`);
    const newWorker = cluster.fork();
    console.log(`✅ Replacement Worker #${newWorker.id} started`);
  });

  // Monitor cluster health
  setInterval(() => {
    const workers = Object.values(cluster.workers);
    console.log(`📊 Cluster health: ${workers.length} workers active`);
  }, 60000);

} else {
  // Worker process — runs the actual server
  require('./live-server.js');
  console.log(`👷 Worker #${cluster.worker.id} ready on PID ${process.pid}`);
}
