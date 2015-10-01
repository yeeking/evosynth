echo building lib into $1
browserify evolib.js | uglifyjs >  $1/evolib.js
