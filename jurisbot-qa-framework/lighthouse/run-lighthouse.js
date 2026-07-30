const fs = require('fs');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

const url = process.env.CITIZEN_URL || 'https://juris-saas.pages.dev';

const options = {
  logLevel: 'info',
  output: 'html',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  port: 0
};

async function runLighthouse() {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  options.port = chrome.port;
  
  console.log(`Running Lighthouse Audit on ${url}`);
  
  const runnerResult = await lighthouse(url, options);

  // `.report` is the HTML report as a string
  const reportHtml = runnerResult.report;
  
  if (!fs.existsSync('reports/lighthouse')) {
    fs.mkdirSync('reports/lighthouse', { recursive: true });
  }

  fs.writeFileSync('reports/lighthouse/lhreport.html', reportHtml);

  // Print summary
  console.log('Report is done for', runnerResult.lhr.finalDisplayedUrl);
  console.log('Performance score:', runnerResult.lhr.categories.performance.score * 100);
  console.log('Accessibility score:', runnerResult.lhr.categories.accessibility.score * 100);
  console.log('Best Practices score:', runnerResult.lhr.categories['best-practices'].score * 100);
  console.log('SEO score:', runnerResult.lhr.categories.seo.score * 100);

  await chrome.kill();

  // Enforce thresholds
  if (runnerResult.lhr.categories.performance.score < 0.8) {
    console.error('Performance score is below the 80% threshold!');
    process.exit(1);
  }
}

runLighthouse().catch(err => {
  console.error('Lighthouse audit failed:', err);
  process.exit(1);
});
