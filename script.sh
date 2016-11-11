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
if grep failing testResults
then
echo "Error! Failed to commit due to failing test cases."
exit 1
fi
value=`grep 'Statements' testResults |cut -d: -f2|cut -d' ' -f2|cut -d'%' -f1|cut -d'.' -f1`
value=$(($value+3-3))
if [ "$value" -lt 50 ];then
echo "Error! Failed to commit due to less code coverage."
exit 1
fi
node_modules/.bin/jshint checkBugs.js > findBugs
if grep line findBugs
then
echo "Error! Failed to commit due to bugs found in the code."
exit 1
fi
