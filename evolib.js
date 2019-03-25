(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var evolib_spec = {
  load: function() {
    console.log("evolib loading...");

    // private variables that maintain the state of the evolib
    // such current population and so on

    /** the current population */
    var currentPopulation = [];
    var currentSynthesizer = undefined;
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
      // todo - check ind...
      var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(currentPopulation[ind]);
      var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(spec);
      this.stop();
      currentSynthesizer = new_synth;
      // setup the analyser
      currentSynthesizer.start();
      this.getSynthOutput().connect(analyser);
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

    /** stop playing the sound */
    this.stop = function() {
      if (analyser != undefined){
        analyser.disconnect();
      }
      if (currentSynthesizer != undefined) { // something was already playing
        currentSynthesizer.stop();
        currentSynthesizer = undefined;
      }
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

},{"./modules/circuit.js":2,"./modules/dsp.js":3,"./modules/genome.js":4,"./modules/population.js":5}],2:[function(require,module,exports){
/**
 * functions for generating circuits specifications
 */
module.exports = {
  /** used to generate unique module indexes in conjunction with getModuleId */
  //gene_length: 8,
  gene_length: 10,
  /** top level genome parsing function which converts a genome into a set of modules and wires*/
  genomeToModuleAndWireSpecs: function(genome) {
    var mod_specs = this.genomeToModuleSpecs(genome.dna);
    var wire_specs = this.moduleSpecToWireSpec(mod_specs);
    return {
      "modules": mod_specs,
      "wires": wire_specs,
      "genome": genome
    };
  },

  /** converts a single gene into a module spec, describing the properties of the module encoded by that gene*/
  geneToModuleSpec: function(gene) {
    var type, sub, x, y, t1, t2, r, start_p1, start_p2, connect_to_input, available_inputs;
    type = this.parseHelpers.getModuleType(gene[0]);
    sub = this.parseHelpers.getModuleSubType(gene[1], type);
    x = gene[2]; //this.parseHelpers.normalise(gene[2], 0, 1, 0, grid_size);
    y = gene[3]; //this.parseHelpers.normalise(gene[3], 0, 1, 0, grid_size);
    t1 = this.parseHelpers.getTheta(gene[4]);
    t2 = this.parseHelpers.getTheta(gene[5]);
    r = gene[6]; //* 2; //this.parseHelpers.normalise(gene[6], 0, 1, 0, grid_size);
    start_p1 = gene[7]; // allows the module to be configured with a starter settings, e.g. starting freq
    start_p2 = gene[8]; // another starter settings

    // in port, the port this mod will connnect to on other modules  is normalised at genome intepretation time
    // as it depends upon the number of ports available on that module.
    connect_to_input = gene[9];
    // this is the number of ports this module has
    available_inputs = this.parseHelpers.getModuleInputNames(type, sub);
    var spec = {
      "module_id": this.parseHelpers.getModuleId(),
      "type": type,
      "sub_type": sub,
      "x": x,
      "y": y,
      "theta1": t1,
      "theta2": t2,
      "radius": r,
      "connect_to_input": connect_to_input,
      "start_parameter_1": start_p1,
      "start_parameter_2": start_p2,
      "available_inputs": available_inputs
    }
    return spec;
  },



  /** converts an array of module specs as retrieved from
   * this.genomeToModuleSpecs into an array of wire specs describing
   * of a set of wires connecting them based on the connection
   * radii*/
  moduleSpecToWireSpec: function(specs) {
    var wires = [];
    for (var i = 0; i < specs.length; i++) {
      // check from module i-1 to module 0 to see if module[i] should connect
      var new_mod = specs[i];
      for (j = i - 1; j >= 0; j--) {
        var old_mod = specs[j];
        //if (this.isPointInArc(px, py, ax, ay, theta1, theta2, radius){
        if (this.isPointInArc(old_mod.x, old_mod.y,
            new_mod.x, new_mod.y, new_mod.theta1, new_mod.theta2, new_mod.radius)) {
          var in_port = Math.round(this.parseHelpers.normalise(new_mod.connect_to_input, 0, 1, 0,
            old_mod.available_inputs.length - 1));
          in_port = old_mod.available_inputs[in_port];
          wires.push({
            "x1": new_mod.x,
            "y1": new_mod.y,
            "x2": old_mod.x,
            "y2": old_mod.y,
            "out_mod_id": new_mod.module_id,
            "in_mod_id": old_mod.module_id,
            "in_port_label": in_port
          });
        }
      }
    }
    return wires;
  },
  /** tests if point x1, y2 is in the arc centred at x2, y2, with
   * range theta1 to theta2 radians with sent radius*/
  isPointInArc: function(px, py, ax, ay, theta1, theta2, radius) {
    // 1. convert theta1 and theta2 to highest and lowest angles.
    var t1, t2;
    if (theta1 > theta2) {
      t1 = theta2;
      t2 = theta1
    } else t1 = theta1;
    t2 = theta2;
    // two tests:
    // 2. is distance from x1,y1 to x2,y2 < radius
    var dist = this.calcDistance(px, py, ax, ay);
    //console.log("distance "+dist+" radius "+radius);
    if (dist > radius) {
      return false;
    }
    // 3. angle from north at x2, y2 -> x1,y1 is > theta1 and < theta2
    var angle = this.calcAngleFromNorth(ax, ay, px, py);
    //console.log("angle "+angle+" between? "+t1+" and "+t2);
    if (angle > t1 && angle < t2) {
      return true;
    }
    return false;
  },
  /** calcualte the angle from north at x1,y1 to x2,y2 */
  calcAngleFromNorth: function(x1, y1, x2, y2) {
    var angle = this.calcAngle(x1, y1, x2, y2);
    var add;
    // now work out what to add to the angle so it is taken from north
    // by identifying which quadrant x2, y2 is in relative to
    // x1, y1
    // NE
    if (x2 >= x1 && y2 <= y1) {
      add = 0;
    }
    // SE -> add 90 degrees or PI / 2 radians
    if (x2 >= x1 && y2 > y1) {
      add = Math.PI / 2;
    }
    // SW -> add 180 degress or PI radians
    if (x2 < x1 && y2 > y1) {
      add = Math.PI;
    }
    // NW -> add 270 degrees or PI / 4 * 3 radians
    if (x2 < x1 && y2 <= y1) {
      add = (Math.PI / 2) * 3;
    }
    return angle + add;
  },

  /** calculate the angle between two points*/
  calcAngle: function(x1, y1, x2, y2) {
    // treat x2, y2 as the origin
    var a, b, c, sin_theta;
    a = Math.abs(y2 - y1);
    b = Math.abs(x2 - x1);
    //console.log("a is "+a);
    //console.log("b is "+b);

    c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    sin_theta = a / c;
    //console.log("sin theta is "+sin_theta);
    // now convert from sin_theta to theta
    //console.log(Math.asin(sin_theta));
    angle = Math.asin(sin_theta);
    return angle;
  },
  /** calculate the distance between two points */
  calcDistance: function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
  },

  /** converts a complete genome into an array of module specs*/
  genomeToModuleSpecs: function(genome) {
    var gene_count = genome.length / this.gene_length;
    var specs = [];
    for (var ind = 0; ind < gene_count; ind++) {
      var s, e;
      s = ind * this.gene_length;
      e = s + this.gene_length;
      // maybe we'll use this:
      // http://jsperf.com/new-array-vs-splice-vs-slice/31
      // to speed it up but this is cleaner for now.
      gene = genome.slice(s, e);
      specs[ind] = this.geneToModuleSpec(gene);
    }
    return specs;
  },
  parseHelpers: {
    module_id: 1,
    getModuleId: function() {
      this.module_id++;
      return this.module_id;
    },
    /** top level module types*/
    getModuleType: function(val) {
      if (val < 0.65) {
        return "oscillator";
      } else {
        return "filter";
      }
    },
    /** types within a module type*/
    getModuleSubType: function(val, module_type) {
      var osc_types = ["sine", "square", "sawtooth", "triangle"];
      var filter_types = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "allpass", "notch"];
      if (module_type == "oscillator") {
        var sub_types = osc_types;
      }
      if (module_type == "filter") {
        var sub_types = filter_types;
      }
      //console.log(val);
      val = Math.round(val * (sub_types.length - 1));
      //console.log(val);
      return sub_types[val];
    },
    /** inputs for different moduies + sub types. Need cases for all things*/
    getModuleInputNames: function(type, sub_type) {
      if (type == "oscillator") {
        // freq ana amp
        return ["frequency", "gain"];
      }
      if (type == "filter") {
        // filter input, freq, Q, gain
        return ["filter_in", "frequency", "q", "gain"];
      }
    },
    /** connection radii*/
    getTheta: function(val) {
      return this.normalise(val, 0, 1, 0, Math.PI * 2);
    },
    /** utility function*/
    normalise: function(val1, min1, max1, min2, max2) {
      // normalise to 0-1
      val1 = val1 - min1;
      range1 = max1 - min1;
      val1 /= range1;
      // scale to the new range
      range2 = max2 - min2;
      val1 = val1 * range2;
      // putin the offset
      val1 += min2;
      return val1
    }
  },


}

},{}],3:[function(require,module,exports){
/**
 * function for converting circuit specifications into DSP circuits
 */
module.exports = {
  /** audio context singleton innit */
  audio_context: false,
  osc_freq_max: 200,
  filt_freq_max: 2000,
  setContext: function(_context) {
    this.audio_context = _context;
  },
  getContext: function(){
    return this.audio_context;
  },
  /** top level function that can convert a circuit specification
   * with wire and module properties into a full synthesizer that
   * can be started and stopped.*/
  moduleAndWireSpecToSynthesizer: function(full_spec) {
    var synthesizer = {
      "start": function() {},
      "stop": function() {},
      "subgraphs": {},
      "fx": {}
    };

    // generate the actual web audio api nodes and store them to the sub graphs array
    for (var i = 0; i < full_spec.modules.length; i++) {
      var mod_spec = full_spec.modules[i];
      var key = "module_" + mod_spec.module_id;
      synthesizer.subgraphs[key] = this.getModuleSubGraph(mod_spec.type, mod_spec.sub_type,
        mod_spec.start_parameter_1,
        mod_spec.start_parameter_2,
        mod_spec.module_id);
    }
    // now create the compressor for the synth output
    var compressor = this.audio_context.createDynamicsCompressor();
    synthesizer.fx["compressor"] = compressor;
    var reverb = this.audio_context.createConvolver();
    synthesizer.fx["reverb"] = reverb;
    // interpret the wiring into connections between the webaudio nodes
    // generate the actual web audio api nodes and store them to the sub graphs array
    for (var i = 0; i < full_spec.wires.length; i++) {
      var wire_spec = full_spec.wires[i];
      var from_key, to_key;
      var out_node = synthesizer.subgraphs["module_" + wire_spec.out_mod_id].output;
      var in_module_id = "module_" + wire_spec.in_mod_id;
      var in_label = wire_spec.in_port_label;
      var input = synthesizer.subgraphs[in_module_id].inputs[in_label];
      out_node.connect(input);
    }

    // build the start function that is used to start the synth playing
    var that = this;
    synthesizer.start = function() {
      var keys = Object.keys(synthesizer.subgraphs);
      for (var i = 0; i < keys.length; i++) {
        if (synthesizer.subgraphs[keys[i]].output != false) { // got a graph
          synthesizer.subgraphs[keys[i]].start();
          //synthesizer.subgraphs[keys[i]].output.connect(that.audio_context.destination);
        }
      }
      // now create a reverb and a compressor
      var compressor = synthesizer.fx["compressor"];

      //var reverb = synthesizer.fx["reverb"];
      // we connect the first module to the output as that is likely to be the most connected one
      synthesizer.subgraphs[keys[0]].output.connect(compressor);
      //reverb.connect(compressor);
      compressor.connect(that.audio_context.destination);
      // stash the final point of the synthesis chain
      // so we can access it later.
      that.record_point = compressor;
    }
    // this funciton is called when we want to stop the synth
    // i.e.
    synthesizer.stop = function() {
      var keys = Object.keys(synthesizer.subgraphs);
      for (var i = 0; i < keys.length; i++) {
        if (synthesizer.subgraphs[keys[i]].output != false) { // got a graph
          synthesizer.subgraphs[keys[i]].stop();
          //synthesizer.subgraphs[keys[i]].output.connect(that.audio_context.destination);
        }
      }
      // disconnect the first node, which should allow it to be GC'd
      synthesizer.subgraphs[keys[0]].output.disconnect();
      // disconnect the compressor
      //synthesizer.fx["reverb"].disconnect();
      synthesizer.fx["compressor"].disconnect();
    }
    /**
    * returns a reference to the output node of the synth
    * so it can be connected to other things, e.g. analysers
    */
    synthesizer.getOutputNode = function(){
      var keys = Object.keys(synthesizer.subgraphs);
      return synthesizer.subgraphs[keys[0]].output;
    }
    return synthesizer;
  },

  /** wires the sent two modules together according to the wire spec*/
  wireModulesTogether: function(subgraph_dict, wire_spec) {

  },

  /** returns a web audio sub graph this module type and subtype,
   * including appropriately connected gain nodes*/
  getModuleSubGraph: function(type, sub_type, start_param1, start_param2, module_id) {
    //    getModuleSubGraph : function(type, sub_type, module_id){
    var subgraph = {
      "inputs": {},
      "output": false,
      "nodes": [],
      "module_id": module_id,
      "start": function() {},
      "stop": function() {}
    }
    //console.log("type: "+type);
    //console.log("sub type: "+sub_type);
    if (type == "oscillator") {
      subgraph = this.getOscillatorSubGraph(subgraph,
        sub_type,
        start_param1,
        start_param2);
    }
    if (type == "filter") {
      subgraph = this.getFilterSubGraph(subgraph,
        sub_type,
        start_param1,
        start_param2);

    }
    // define a function to stop the
    // sub graph - disconnect all nodes
    // and then set nodes to an empty array, which should hopefully
    // cause them to be cleared up.
    subgraph.stop = function() {
      for (var i = 0; i < subgraph.nodes.length; i++) {
        subgraph.nodes[i].disconnect();
      }
      subgraph.nodes = [];
    };
    return subgraph;
  },
  /** returns a web audio sub graph this module type and subtype,
   * including appropriately connected gain nodes*/
  getOscillatorSubGraph: function(subgraph, sub_type, start_param1, start_param2, module_id) {
    var osc, freq_input, output_gain;
    // G -> F -> osc -> G * A ->
    var osc = this.audio_context.createOscillator();
    osc.type = sub_type;
    // set the starter frequency for the osc (comes from the genome)
    osc.frequency.value = start_param1 * this.osc_freq_max;
    freq_input = this.audio_context.createGain();
    output_gain = this.audio_context.createGain();
    // scalar for the frequency input. Modules patching into the gain node will have their
    // output scaled by this
    freq_input.gain.value = start_param1 * this.osc_freq_max * [0.25, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][Math.round(start_param2 * 10)];
    //freq_input.gain.value = this.osc_freq_max;
    // patch the output of the frequency node into the frequecny control of the osc
    freq_input.connect(osc.frequency);
    // patch the oscillator output into the out gain node
    osc.connect(output_gain);
    subgraph.output = output_gain;
    /** TODO: make sure that these input can be connected to.*/
    subgraph.inputs = {
      "frequency": freq_input,
      "gain": output_gain
    };
    subgraph.nodes = [osc, freq_input, output_gain];
    subgraph.start = function() {
      osc.start(0);
    };
    return subgraph;

  },
  getFilterSubGraph: function(subgraph, sub_type, start_param1, start_param2, module_id) {
    var filter, filter_input, freq_input, q_input, output_gain;
    filter = this.audio_context.createBiquadFilter();
    filter.type = sub_type;
    // instantiate input gain nodes
    filter_input = filter;
    freq_input = this.audio_context.createGain();
    q_input = this.audio_context.createGain();
    output_gain = this.audio_context.createGain();
    // set some starter values
    filter.frequency.value = start_param1 * this.filt_freq_max;
    filter.Q.value = start_param2 * 100; // Q goes to 100
    // we will scale the frequency control into audio range
    freq_input.gain.value = this.filt_freq_max;
    freq_input.connect(filter.frequency);
    // Q tops out at 100
    q_input.gain.value = 100;
    q_input.connect(filter.Q);
    filter.connect(output_gain);
    subgraph.inputs = {
      "filter_in": filter_input,
      "frequency": freq_input,
      "q": q_input,
      "gain": output_gain
    };
    subgraph.output = output_gain;
    subgraph.nodes = [freq_input, q_input, filter, output_gain];
    return subgraph;
  },
}

},{}],4:[function(require,module,exports){
/** functions for manipulating genomes */
module.exports = {
  /** generate an object containing a dna field that is an array of random numbers in the range 0-1 of length length*/
  generateRandom: function(length) {
    var genome = new Array(length);
    for (var i = 0; i < length; i++) {
      genome[i] = Math.random();
    }
    return {
      "dna": genome,
      "type": "random"
    };
  },
  /** apply point mutations to a genome. The number of loci that get mutated is
   * mutation_rate * genome.length, which ensures some variation in the genomes
   * values. returns a new array
   */
  pointMutateGenome: function(genome, mutation_rate, mutation_size) {
    var new_genome;
    // select mutation|_rate * genome.length loci to mutate
    var loci = this.getCrossoverPoints(genome, genome, genome.length * mutation_rate);
    // first copy the genome to the new array
    new_genome = genome.slice();
    // now apply the point mutations
    for (var loc_ind = 0; loc_ind < loci.length; loc_ind++) {
      var locus = loci[loc_ind];
      new_genome[locus] = this.mutateLocus(new_genome[locus], mutation_size);
    }
    return new_genome;
  },
  /** returns a mutated version of the sent value by generating a
   * random number between -mutation_size/2 and mutation_size/2,
   * then returning it */
  mutateLocus: function(val, mutation_size) {
    var val = val + ((Math.random() - 0.5) * mutation_size);
    // constrain it
    val = Math.max(0, val);
    val = Math.min(1, val);
    return val;
  },
  /**
   * iterate the genes in the genome. with a prob. of mutation_chance,
   * select a gene and insert a duplicate next to the original. creates a new array.
   */
  repeatMutateGenome: function(genome, gene_length, mutation_chance) {
    var new_genome = [];
    for (var gene_ind = 0; gene_ind < genome.length / gene_length; gene_ind++) {
      // first get the gene in question
      var gene = genome.slice(gene_ind * gene_length, (gene_ind * gene_length) + gene_length);
      // add it to the new genome
      new_genome = new_genome.concat(gene);
      // then possibly also insert a copy
      if (Math.random() < mutation_chance) {
        new_genome = new_genome.concat(gene);
      }
    }
    return new_genome;
  },
  /**
   * add a random new gene to the genome
   */
  growMutateGenome: function(genome, gene_length, mutation_chance) {
    var new_genome = [];
    var new_gene;
    // make a copy of the genome
    new_genome = genome.slice();
    if (Math.random() < mutation_chance) {
      // get  new random gene
      new_gene = this.generateRandom(gene_length).dna;
      new_genome = new_genome.concat(new_gene);
    }
    return new_genome;
  },

  /**
   * randomly deletes genes from the genome
   */
  deleteMutateGenome: function(genome, gene_length, mutation_chance) {
    var new_genome = [];
    for (var gene_ind = 0; gene_ind < genome.length / gene_length; gene_ind++) {
      // get the gene
      var gene = genome.slice(gene_ind * gene_length, (gene_ind * gene_length) + gene_length);
      // possibly add it to the new genome.
      if (Math.random() > mutation_chance) {
        new_genome = new_genome.concat(gene);
      }
    }
    return new_genome;
  },
  /**
   * perform crossover on the sent genome, aiming to get 'crosses' crossovers.
   */
  crossover: function(genome1, genome2, crosses) {
    var loci = this.getCrossoverPoints(genome1, genome2, crosses);
    var genome3 = this.crossoverGenomesAtLoci(genome1, genome2, loci);
    return genome3;
  },
  /**
   * returns an array of count crossover points for a genome with the sent length
   */
  getCrossoverPoints: function(genome1, genome2, count) {
    var loci = [];
    var genome;
    if (genome1.length > genome2.length) {
      genome = genome2;
    } else {
      genome = genome1;
    }
    if (count > genome.length) {
      count = genome.length / 2;
    }
    for (var i = 0; i < count; i++) {
      var locus = Math.round(Math.random() * (genome.length - 1));
      // TODO might want to check we don't already have this crossover locus..
      loci[i] = locus;
    }
    return loci;
  },
  /**
   * perform a crossover between the two sent genomes, crossing over at the sent loci. returns a new genome
   */
  crossoverGenomesAtLoci: function(genome1, genome2, loci) {
    var genome3 = []; // we'll store the new genome here
    var src = genome1; // begin reading from genome1
    var curr_src = 0;
    var loci_ind = 0; // begin at the first crossover point
    var max;
    if (genome1.length > genome2.length) {
      max = genome2.length;
    } else {
      max = genome1.length;
    }
    for (var genome_ind = 0; genome_ind < max; genome_ind++) {
      if (genome_ind == loci[loci_ind]) { // time to crossover
        //src = genome2;
        curr_src = 1 - curr_src;
        if (curr_src == 0) {
          src = genome1;
        } else {
          src = genome2;
        }
        loci_ind++;
      }
      genome3[genome_ind] = src[genome_ind];
    }
    return genome3;
  },

  /**
   * generates a new population from the sent parents. I am leaving this in genome funcs for compatibility
   * with the original paper about this system. However, all population related functions now take place in the population module.
   */
  generateNewPopulation: function(parents, size, gene_length, mutation_rate, mutation_size) {
    var next_gen = [];
    var mut_parents = [];
    var crossover = false;
    // how many of each type of mutant to add
    var adds_per_type = Math.round(size / 4);
    var random_ind = function(array_size) {
      return Math.round(Math.random() * (array_size - 1));
    }
    if (parents.length > 1) {
      //parents.push(parents[0]);
      crossover = true;
    }
    // stage 1:
    // create point mutated versions of all the parents
    for (var i = 0; i < parents.length; i++) {
      mut_parents[i] = {};
      //console.log(parents[i]);
      mut_parents[i].dna = this.pointMutateGenome(parents[i].dna, mutation_rate, mutation_size);
    }
    // state 3:
    // add some individuals by repeats and delete mutation
    for (var i = 0; i < adds_per_type; i++) {
      //console.log("adding del/ repeeat")
      var child = {};
      var rand = random_ind(mut_parents.length);
      var decide = Math.random();
      if (decide <= 0.5) {
        child.dna = this.repeatMutateGenome(mut_parents[rand].dna,
          gene_length,
          mutation_rate);
        child.type = "repeat mutant";
      } else {
        child.dna = this.deleteMutateGenome(mut_parents[rand].dna,
          gene_length,
          mutation_rate);
        child.type = "shrink mutant";

      }
      next_gen.push(child);
    }
    // grow mutants
    for (var i = 0; i < adds_per_type; i++) {
      //console.log("adding grow")
      var child = {};
      var rand = random_ind(mut_parents.length);
      child.dna = this.growMutateGenome(mut_parents[rand].dna,
        gene_length,
        mutation_rate);
      child.type = "grow mutant";
      next_gen.push(child);
    }

    if (crossover) {
      // stage 4: do some crossover on random pairs of paernts
      for (var i = 0; i < adds_per_type; i++) {
        //console.log("adding xover");
        var ind1, ind2, parent1, parent2, child;
        child = {};
        ind1 = random_ind(mut_parents.length);
        do {
          ind2 = random_ind(mut_parents.length);
        } while (ind2 == ind1)
        parent1 = mut_parents[ind1];
        parent2 = mut_parents[ind2];
        child.dna = this.crossover(parent1.dna, parent2.dna, parent1.dna.length * mutation_rate);
        child.type = "crossover";
        next_gen.push(child);
      }
    }
    // stage 5:
    // fill up the array with some point mutated individuals to the next gen
    var added = next_gen.length;
    while (added < size) {
      //console.log("adding point")
      //	for (var i=0; i<size / 3; i++){
      var rand = random_ind(parents.length);
      var mutant = {};
      mutant.dna = this.pointMutateGenome(parents[rand].dna, mutation_rate, mutation_size);
      mutant.type = "point mutant";
      next_gen.push(mutant);
      added++;
    }
    // finally, shuffle the array
    var shuffle = function shuffle(o) { //v1.0
      for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
      return o;
    };
    next_gen = shuffle(next_gen);
    return next_gen;
  },
  /** iterate the generations array, which is assumed to be an array
   * of arrays of 'genone' type objects. For each generation, hook
   * each member to the most likely parent in the previous
   * generation */
  createFamilyTree: function(generations, gene_length) {
    for (var i = 1; i < generations.length; i++) {
      var children = generations[i].breeders;
      var previous_gen = generations[i - 1].breeders;
      // pull out the dna
      for (var j = 0; j < previous_gen.length; j++) {
        if (previous_gen[j].dna != undefined) { // the genome is buried in an object
          previous_gen[j] = previous_gen[j].dna;
        }
      }
      for (var j = 0; j < children.length; j++) {
        var child;
        if (children[j].dna != undefined) {
          child = children[j].dna;
          children[j].parent_ids = this.findParents(child, children[j].type, previous_gen, gene_length);
        } else {
          // this child is not a child, but a first gen
          children[j].parent_ids = [];
        }
      }
      generations[i].breeders = children;
    }
    return generations;
  },

  /** finds the index(es) in genomes of the most probably parents
   * for the sent genome, given the sent genome type
   * e.g. if genome_type is crossover, finds two closest parents
   * all other types, assume single parent
   */
  findParents: function(genome, genome_type, genomes, gene_length) {
    // calculate genome distances from genome to all in genomes
    var distances = [];
    for (var i = 0; i < genomes.length; i++) {
      var dist = this.estimateGenomeDistance(genome, genomes[i], gene_length);
      distances.push([dist, i]); // so we can sort on dist but remember index
    }
    distances = distances.sort();
    //	console.log(distances);
    if (genome_type != "crossover") { // simple - return 1 closest parent
      // return the index of the first distance
      return [distances[0][1]];
    } else {
      //console.log("crossover genome. ");
      //console.log(distances);
      // sometimes, crossover genomes appear with single parents
      if (distances.length == 1) {
        return [distances[0][1]];
      } else {
        return [distances[0][1], distances[1][1]];
      }
    }
  },

  /** heuristically estimate the distance between the two genomes
   * Quite tricksy - it finds the closest distance for each gene in the genome
   * then if the genomes are different lengths, assumes a 0.5... gene for each missing gene
   * and find the closest match to that.
   */
  estimateGenomeDistance: function(genome1, genome2, gene_length) {
    var total = 0;
    // sum the closest gene distance for each gene
    for (var i = 0; i < genome1.length; i += gene_length) {
      var gene = genome1.slice(i, i + gene_length);
      var closest = this.calculateClosestGeneDistance(gene, genome2, gene_length);
      total += closest;
    }
    // now compare lengths. For each gene that is missing between them,
    // assume a genome of 0.5s
    if (genome1.length != genome2.length) {
      var longest, shortest;
      if (genome1.length > genome2.length) {
        longest = genome1;
        shortest = genome2;
      } else {
        longest = genome2;
        shortest = genome1;
      }
      var add_genes = Math.abs(genome1.length - genome2.length) / gene_length;
      var avg_gene = [];
      // generate a middling gene
      for (var i = 0; i < gene_length; i++) {
        avg_gene.push(0.5);
      }
      //console.log(avg_gene);
      // assume we have a middling gene for
      // each missing gene and add this to the total
      for (var i = 0; i < add_genes; i++) {
        //console.log(this.calculateGeneDistance(avg_gene, longest, gene_length));
        total += this.calculateClosestGeneDistance(avg_gene, longest, gene_length);
      }
    }
    return total;
  },
  /** returns the shortest  euclidean distance between the sent gene and any genes in the genome*/
  calculateClosestGeneDistance: function(gene, genome, gene_length) {
    var closest;
    // iterate genome as  genes
    for (var i = 0; i < genome.length; i += gene_length) {
      // cut a gene out of the genome
      var gene2 = genome.slice(i, i + gene_length);
      var dist = this.calculateGeneDistance(gene, gene2);
      if (i == 0) { // first one
        closest = dist;
      }
      if (dist < closest) {
        closest = dist;
      }
    }
    return closest;
  },
  /** euclidean distance between two genes*/
  calculateGeneDistance: function(gene1, gene2) {
    var sum;
    if (gene1.length != gene2.length) {
      // this ought to crash them somehow
      return undefined;
    }
    sum = 0;
    for (var i = 0; i < gene1.length; i++) {
      sum += Math.pow(gene1[i] - gene2[i], 2);
    }
    sum = Math.sqrt(sum);
    return sum;
  },
}

},{}],5:[function(require,module,exports){
/** population level functions */
module.exports = {
  genome_funcs: require('../modules/genome.js'),
  circuit_funcs: require('../modules/circuit.js'),

  /**
   * generate a random population of the requested size.
   */
  newPopulation: function(popSize, synthSize) {
    popSize = (typeof popSize !== 'undefined') ? popSize : 5;
    synthSize = (typeof synthSize !== 'undefined') ?synthSize : 50;

    var pop = new Array();
    for (var i = 0; i < popSize; i++) {
      //var dna = Evolib.genome_funcs.generateRandom(Evolib.circuit_funcs.gene_length * 40);
      var dna = this.genome_funcs.generateRandom(this.circuit_funcs.gene_length * synthSize);
      pop.push(dna);
    }
    return pop;
  },
  /**
   * Returns a new population from oldPopulation using breedIds as parents.
   * assumes breed_ids is a key value array with numerical ids
   */
  breedPopulation: function(oldPopulation, breedIds, mutation_rate, mutation_size) {
    var parents, crossover, next_gen;
    mutation_rate = (typeof mutation_rate !== 'undefined') ?mutation_rate : 0.1;
    mutation_size = (typeof mutation_size !== 'undefined') ?mutation_size : 0.1;
    breedIds = (typeof breedIds !== 'undefined') ?breedIds : [0];

    if (oldPopulation.length == 0) {
      console.log("evolib breedPopulation Warning - nothing to evolve!. Returning old pop untouched");
      return oldPopulation;
    }
    crossover = false;
    parents = new Array();
    next_gen = new Array();
    var random_ind = function(array_size) {
      return Math.round(Math.random() * (array_size - 1));
    }
    // get the parent genomes
    for (key in breedIds) {
      parents.push(oldPopulation[breedIds[key]])
    }
    if (parents.length > 1) crossover = true;
    // generate the next generation
    if (crossover) {
      for (var i = 0; i < oldPopulation.length; i++) {
        //console.log("adding xover");
        var ind1, ind2, parent1, parent2, child;
        child = {};
        ind1 = random_ind(parents.length);
        do {
          ind2 = random_ind(parents.length);
        } while (ind2 == ind1)
        parent1 = parents[ind1];
        parent2 = parents[ind2];
        child.dna = this.genome_funcs.crossover(parent1.dna, parent2.dna, parent1.dna.length * mutation_rate);
        child.type = "crossover";
        next_gen.push(child);
      }
    } else { // no crossover - just mutants of single parent
      for (var i = 0; i < oldPopulation.length; i++) {
        var child = {};
        child.dna = parents[0].dna.slice(); // copy the array!!!!
        child.type = ""; // we'll set this up later
        next_gen.push(child);
      }
    }
    // mutate the genomes
    for (var i = 0; i < next_gen.length; i++) {
      // get the dna
      var dna = next_gen[i].dna;
      // mutate it
      var pm_dna = this.genome_funcs.pointMutateGenome(dna, mutation_rate, mutation_size);
      // other mutations go here...
      //....
      next_gen[i].type += " mutate "
      // put it back
      next_gen[i].dna = pm_dna;
    }
    // grow mutate
    return next_gen;
  }
}

},{"../modules/circuit.js":2,"../modules/genome.js":4}]},{},[1]);
