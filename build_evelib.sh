echo building lib into 
#browserify evolib_stub.js | uglifyjs >  $1/evolib.js
browserify evolib_stub.js >  ./evolib.js
