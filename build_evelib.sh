echo building lib into $1
#browserify evolib_stub.js | uglifyjs >  $1/evolib.js
browserify evolib_stub.js >  $1/evolib.js
