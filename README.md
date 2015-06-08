
Evosynth: Interactive Genetic Algorithm Sound Synthesis in the Browser!
=======
Imagine a modular synth with 10s of modules that could be instantly wired up at random. Imagine then being able to combine or breed different circuits, or to create multiple variations of a circuit with subtle wiring changes. That's basically what evosynth does.

To be more specific, EvoSynth is a sound synthesis system which uses an interactive genetic algorithm to search the space of all possible configurations of a set of oscillators and filters. It is based on an idea I first experimented with back in 2000 with a system I called AudioServe. You can read all about that system here: [AudioServe](http://www.yeeking.net/html/audioserve/abstract.html).

[Click to see Evosynth running](http://www.yeeking.net/evosynth)

### Run it on your own server
* Put the website folder on your server. 
* edit the file website/assets/js/app_launch.js to reflect your settings. 
* it probably works without the API back end, but... 
* to allow saving etc. of circuits, edit ebsite/api/inc.php to reflect your server



### build the minified library into the website folder 
(yeah grunt etc. is better I am sure)

./build_evosynth.sh

### the unit tests require mocha
npm install -g mocha

mocha tests/


