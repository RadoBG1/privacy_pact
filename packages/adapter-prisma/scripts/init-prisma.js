const fs = require('fs')
const { spawnSync } = require('child_process')
const path = require('path')

const cwd = path.resolve(__dirname, '..')
const envExample = path.join(cwd, '.env.example')
const envFile = path.join(cwd, '.env')

function copyEnv() {
  if (fs.existsSync(envFile)) {
    console.log('.env already exists, skipping copy')
    return
  }
  if (!fs.existsSync(envExample)) {
    console.error('.env.example not found')
    process.exit(1)
  }
  fs.copyFileSync(envExample, envFile)
  console.log('Created .env from .env.example')
}

function run(command, args, opts = {}) {
  console.log(`> ${command} ${args.join(' ')}`)
  const res = spawnSync(command, args, { stdio: 'inherit', cwd, shell: true, ...opts })
  if (res.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`)
    process.exit(res.status)
  }
}

copyEnv()

console.log('\nEnsure you have prisma & @prisma/client installed. If not, run:')
console.log('  npm install prisma @prisma/client --save-dev')
console.log('Or run the commands below to continue (they use npx):\n')

// Generate client
run('npx', ['prisma', 'generate'])

// Run migration (creates dev.db for sqlite)
run('npx', ['prisma', 'migrate', 'dev', '--name', 'init'])

console.log('\nPrisma setup complete. You should now have a local SQLite DB (dev.db).')
