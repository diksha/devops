git clone https://github.com/koopjs/koop.git
cp package.json koop/
cp main.js koop/
cp custom.js koop/
cp pre-commit koop/.git/hooks/
cd koop 
npm install
node_modules/.bin/istanbul cover node_modules/.bin/_mocha -- --recursive > TestResult
node main.js lib/Query.js
node_modules/.bin/istanbul cover test.js > AutomatedTestResult
node_modules/.bin/jshint *.js > FoundBugs
node custom.js lib/*.js > CustomMetrics
