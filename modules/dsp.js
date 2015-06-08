/**
* function for converting circuit specifications into DSP circuits
*/
module.exports = {
    /** audio context singleton innit */
    audio_context:false, 
    osc_freq_max:200, 
    filt_freq_max:2000, 
    setContext: function(_context){
	this.audio_context = _context;
    }, 
    /** top level function that can convert a circuit specification
     * with wire and module properties into a full synthesizer that
     * can be started and stopped.*/
    moduleAndWireSpecToSynthesizer : function(full_spec){
	var synthesizer = {"start":function(){}, 
			   "stop":function(){}, 
			   "subgraphs":{}, "fx":{}};

	// generate the actual web audio api nodes and store them to the sub graphs array
	for (var i=0;i<full_spec.modules.length; i++){
	    var mod_spec = full_spec.modules[i];
	    var key = "module_"+mod_spec.module_id;
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
	for (var i=0;i<full_spec.wires.length; i++){
	    var wire_spec = full_spec.wires[i];
	    var from_key, to_key;
	    var out_node = synthesizer.subgraphs["module_"+wire_spec.out_mod_id].output;
	    var in_module_id = "module_"+ wire_spec.in_mod_id;
	    var in_label = wire_spec.in_port_label;
	    var input = synthesizer.subgraphs[in_module_id].inputs[in_label];
	    out_node.connect(input);
	}
	
	// build the start function that is used to start the synth playing
	var that = this;
	synthesizer.start = function(){
	    var keys = Object.keys(synthesizer.subgraphs);
	    for (var i=0;i<keys.length;i++){
		if (synthesizer.subgraphs[keys[i]].output != false){// got a graph
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
	synthesizer.stop = function(){
	    var keys = Object.keys(synthesizer.subgraphs);
	    for (var i=0;i<keys.length;i++){
		if (synthesizer.subgraphs[keys[i]].output != false){// got a graph
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
	return synthesizer;
    }, 

    /** wires the sent two modules together according to the wire spec*/
    wireModulesTogether : function(subgraph_dict, wire_spec){
	
    }, 

    /** returns a web audio sub graph this module type and subtype,
     * including appropriately connected gain nodes*/
    getModuleSubGraph : function(type, sub_type, start_param1, start_param2, module_id){
//    getModuleSubGraph : function(type, sub_type, module_id){
	var subgraph = {"inputs":{},
			"output":false, 
			"nodes":[], 
		       "module_id":module_id, 
		       "start":function(){}, 
		       "stop":function(){}}
	//console.log("type: "+type);
	//console.log("sub type: "+sub_type);
	if (type == "oscillator"){
	    subgraph = this.getOscillatorSubGraph(subgraph, 
						 sub_type, 
						 start_param1, 
						 start_param2);
	}
	if (type == "filter"){
	    subgraph = this.getFilterSubGraph(subgraph, 
						 sub_type, 
						 start_param1, 
						 start_param2);
	    
	}
	// define a function to stop the 
	// sub graph - disconnect all nodes
	// and then set nodes to an empty array, which should hopefully
	// cause them to be cleared up.
	subgraph.stop = function(){
	    for (var i=0;i<subgraph.nodes.length;i++){
		subgraph.nodes[i].disconnect();
	    }
	    subgraph.nodes = [];
	};
	return subgraph;
    },
   /** returns a web audio sub graph this module type and subtype,
     * including appropriately connected gain nodes*/
    getOscillatorSubGraph : function(subgraph, sub_type, start_param1, start_param2, module_id){
	var osc, freq_input, output_gain;
	// G -> F -> osc -> G * A ->
	var osc =  this.audio_context.createOscillator();
	osc.type = sub_type;
	// set the starter frequency for the osc (comes from the genome)
	osc.frequency.value = start_param1 * this.osc_freq_max;
	freq_input = this.audio_context.createGain();
	output_gain = this.audio_context.createGain();
	// scalar for the frequency input. Modules patching into the gain node will have their
	// output scaled by this 
	freq_input.gain.value = start_param1 * this.osc_freq_max * 
	    [0.25, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10][Math.round(start_param2 * 10)];
	//freq_input.gain.value = this.osc_freq_max; 
	// patch the output of the frequency node into the frequecny control of the osc
	freq_input.connect(osc.frequency);
	// patch the oscillator output into the out gain node
	osc.connect(output_gain);
	subgraph.output = output_gain;
	/** TODO: make sure that these input can be connected to.*/
	subgraph.inputs = {"frequency":freq_input, "gain":output_gain};
	subgraph.nodes = [osc, freq_input, output_gain];
	subgraph.start = function(){
	    osc.start(0);
	};
	return subgraph;

    }, 
    getFilterSubGraph : function(subgraph, sub_type, start_param1, start_param2, module_id){
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
	subgraph.inputs = {"filter_in":filter_input, 
			   "frequency":freq_input, 
			   "q":q_input, 
			   "gain":output_gain};
	subgraph.output = output_gain;
	subgraph.nodes = [freq_input, q_input, filter, output_gain];
	return subgraph;
    }, 
}
