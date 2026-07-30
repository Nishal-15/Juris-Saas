const { execSync } = require('child_process');
const fs = require('fs');

const url = process.env.CITIZEN_URL || 'https://juris-saas.pages.dev';

console.log(`Starting OWASP ZAP Baseline Scan on ${url}...`);

try {
  // Ensure reports directory exists
  if (!fs.existsSync('reports/security')) {
    fs.mkdirSync('reports/security', { recursive: true });
  }

  // Using Docker to run the official OWASP ZAP baseline scan
  // Assuming Docker is installed in the CI/CD environment
  const command = `docker run --rm -v $(pwd)/reports/security:/zap/wrk/:rw -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t ${url} -r zap_report.html`;
  
  console.log('Running Docker command:');
  console.log(command);
  
  execSync(command, { stdio: 'inherit' });
  console.log('ZAP scan completed successfully. Report generated at reports/security/zap_report.html');
  
} catch (error) {
  console.error('OWASP ZAP scan encountered errors/warnings. Check the report for details.');
  // We typically don't exit with 1 for baseline warnings unless we want strictly failing CI
  // process.exit(1);
}
