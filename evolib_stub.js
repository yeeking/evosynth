var evolib_spec = {
  load: function() {
    console.log("evolib loading...");

    // private variables that maintain the state of the evolib
    // such current population and so on

    /** the current population */
    var currentPopulation = [];
    var currentSynthesizer = undefined;
    var synthArray = [];
    var analyser = undefined;
    var analyserThread = undefined;
   
    // modules supplying the actual functionality.
    this.population_funcs = require('./modules/population.js');
    this.genome_funcs = require('./modules/genome.js');
    this.circuit_funcs = require("./modules/circuit.js");
    this.dsp_funcs = require("./modules/dsp.js");

    try {
      var context = new(window.AudioContext || window.webkitAudioContext)();
      this.dsp_funcs.setContext(context);
      analyser = this.dsp_funcs.getContext().createAnalyser();
      analyser.fftSize = 256;
      console.log("evolib loaded!");

    } catch (error) {
      alert("Evollb could not intialise audio context.")
      //console.log("Error initialisting audio context. Evollib will not work...");
    }


    // define the top level functions that are directly exposed to users of the lib:

    /** create new population of sounds.
     * size is how many circuits to generate
     * synthesis model is the type of synthesis. Available models: 'modular', 'fm', 'physical_tube'
     */
    //this.newPopulation = function(size, synthesis_model){
    this.newPopulation = function(popSize, synthSize) {
      currentPopulation = this.population_funcs.newPopulation(popSize, synthSize);
    }
    /** listen to a particular sound */
    this.play = function(ind) {
      var genome = currentPopulation[ind];
      this.playGenome(genome);
    }
    this.playGenome = function(genome){
      if (genome == undefined){
        console.log('playGenome::bad genome!');
        return;
      }
      if (genome.dna == undefined){
        genome = {'dna':genome};
      }
      this.stop();
      var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(genome);
      var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(spec);
      currentSynthesizer = new_synth;
      currentSynthesizer.setGain(1);
      currentSynthesizer.start();

   }// end playGenome
   /**
    * Uses the synth array to manage multiple synths. Allows smoother fading
    * between synths
    */
   this.playGenomePoly = function(genome, rampTime)
   {
    if (genome.dna == undefined){
      genome = {'dna':genome};
    }
    var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(genome);
    var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(spec);
    new_synth.start(0);
    new_synth.setGain(1.0, 2.0);
    
    if (synthArray.length < 5){// just stick the synth on the end
      synthArray.push(new_synth);
    }
    else{
      // kill off the first synth and push it on the end
      synthArray[0].stop();
      synthArray = synthArray.slice(1);
      synthArray.push(new_synth);
    }
    // now fade old synths
    for (var i=0;i<synthArray.length -1; i++){
      synthArray[i].setGain(0, 5.0);
    }
  
   }

    /** stop playing the sound */
    this.stop = function() {
      console.log('stop!');
      if (analyser != undefined){
        analyser.disconnect();
      }
      if (currentSynthesizer != undefined){
        currentSynthesizer.stop();
        currentSynthesizer = undefined;
      }
    }

    this.setGain = function(gain, rampTime){
      if (currentSynthesizer != undefined){
        currentSynthesizer.setGain(gain, rampTime);
      }
    }
    /**
     * setup a callback for analysis data
     */
    this.analyse = function(callback, interval) {
      // stop the old callback caller
      clearTimeout(analyserThread);
      // make an analyser
    //  if (currentSynthesizer != undefined) { // something was already playing
        var bufferLength = analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength)
        analyserThread = setInterval(function() {
          analyser.getByteFrequencyData(dataArray);
          callback(dataArray);
        }, interval);
    //  }
    }

    this.getAudioContext = function() {
      return this.dsp_funcs.getContext();
    }

    this.getSynthOutput = function() {
      return currentSynthesizer.getOutputNode();
    }
    /**
     * Set the scalar on the osc freq paramater
     */
    this.setOscMax = function(osc_max){
      this.dsp_funcs.setOscMax(osc_max);
    }
    /**
     * Set the scalar on the filter freq parameter
     */
    this.setFilterMax = function(filt_max){
      this.dsp_funcs.setFilterMax(filt_max);
    }
    /**
     * Evolve the population from the selected breedIds, which refer to
     * indexes of sounds you want in the current population, e.g. [0,1] for the
     * first two.
     */
    this.evolve = function(breedIds, mutationRate, mutationSize) {
      currentPopulation = this.population_funcs.breedPopulation(currentPopulation, breedIds, mutationRate, mutationSize);
    }

    /** listen at a particular x, y position in the circuit, where x, y are in the range 0-1*/
    this.setListeningPosition = function(x, y) {}
    /** return a gewnom at position between g1 and g2 based on linear interpolation. 
     * if position is 0.5, it'll be half way between. 
    */
    this.getInBetweenGenome = function(ind1, ind2, position) {
      return this.genome_funcs.getInBetweenGenome(currentPopulation[ind1].dna, 
                                                  currentPopulation[ind2].dna, 
                                                  position);
    }

    /** play the first circuit then interpolate the parameters to the second circuit in time seconds*/
    this.listenInterpolate = function(ind1, ind2, time) {}

    /** select an individual for breeding */
    this.select = function(ind) {}
    /** unselect an individual for breeding */
    this.unselect = function(ind) {}

    /** returns a nodes and edges description of the circuit, suitable foe visualisation
     * e.g. {nodes:[{id:10, type:'sin', x:0.1, y:0.6}, ... ],
     *       edges:[{from:10, to:2, bias:0.4}, ...]}
     */
    this.getSynthGraph = function() {}

    /** attempt to match the sent sound which is an audio file
     */
    this.matchSound = function(audio_file) {}


    return this;
  }
}


//console.log("Here goes nothing");
window.Evolib = evolib_spec.load();
