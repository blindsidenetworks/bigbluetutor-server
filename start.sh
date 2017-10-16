SLEEPTIME=1.5
sleep $SLEEPTIME && node client.js &
sleep $SLEEPTIME && node providerSearch.js &
npm start
