SLEEPTIME=2
sleep $SLEEPTIME && node client.js &
sleep $SLEEPTIME && node providerSearch.js &
npm start
