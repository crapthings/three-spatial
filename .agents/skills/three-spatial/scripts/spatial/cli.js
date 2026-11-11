import { runSpatialCli } from './cli-runner.js'

// Execute the portable geometry CLI with only the bundled generic tools.
runSpatialCli().catch(error => { console.error(error.message); process.exitCode = 1 })
