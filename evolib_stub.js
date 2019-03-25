var evolib_spec = {load:function(){
    console.log("evolib loading...");

    // private variables that maintain the state of the evolib
    // such current population and so on

    /** the current population */
    var currentPopulation = [];
    var currentSynthesizer = undefined;

    // modules supplying the actual functionality.
    this.population_funcs = require('./modules/population.js');
    this.genome_funcs = require('./modules/genome.js');
    this.circuit_funcs = require("./modules/circuit.js");
    this.dsp_funcs = require("./modules/dsp.js");

    try {
    var context = new (window.AudioContext || window.webkitAudioContext)();
    this.dsp_funcs.setContext(context);
    console.log("evolib loaded!");
	} catch(error){
    alert("Evollb could not intialise audio context.")
		//console.log("Error initialisting audio context. Evollib will not work...");
	}


	// define the top level functions that are directly exposed to users of the lib:

	/** create new population of sounds.
	* size is how many circuits to generate
	* synthesis model is the type of synthesis. Available models: 'modular', 'fm', 'physical_tube'
	*/
	//this.newPopulation = function(size, synthesis_model){
	this.newPopulation = function(popSize, synthSize){
		currentPopulation = this.population_funcs.newPopulation(popSize, synthSize);
	}
	/** listen to a particular sound */
	this.play = function(ind){
		// todo - check ind...
		var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(currentPopulation[ind]);
		var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(spec);
		this.stop();
		currentSynthesizer = new_synth;
		currentSynthesizer.start();

	}
	/** stop playing the sound */
	this.stop = function(){
		if (currentSynthesizer != undefined){// something was already playing
			 currentSynthesizer.stop();
		}
	}
/**
 * Evolve the population from the selected breedIds, which refer to
 * indexes of sounds you want in the current population, e.g. [0,1] for the
 * first two.
  */
  this.evolve = function(breedIds, mutationRate, mutationSize){
    currentPopulation = this.population_funcs.breedPopulation(currentPopulation, breedIds, mutationRate, mutationSize);
  }

	/** listen at a particular x, y position in the circuit, where x, y are in the range 0-1*/
	this.setListeningPosition = function(x, y){}
	/** play the first circuit then interpolate the parameters to the second circuit in time seconds*/
	this.listenInterpolate = function(ind1, ind2, time){}

	/** select an individual for breeding */
	this.select = function(ind){}
	/** unselect an individual for breeding */
	this.unselect = function(ind){}

	/** returns a nodes and edges description of the circuit, suitable foe visualisation
	* e.g. {nodes:[{id:10, type:'sin', x:0.1, y:0.6}, ... ],
	*       edges:[{from:10, to:2, bias:0.4}, ...]}
	*/
	this.getSynthGraph = function(){}

	/** attempt to match the sent sound which is an audio file
	*/
	this.matchSound = function(audio_file){}


    return this;
}}


//console.log("Here goes nothing");
window.Evolib = evolib_spec.load();
