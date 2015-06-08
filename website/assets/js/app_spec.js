/**
 * Standard specification for the blacksheep app - you don't need to edit this
 */

var Evosynthapp = function (_private) {

    _private.components = {
	/////////////////////////////////////////////////
	// nav
	////////////////////////////////////////////////
	
	"nav": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path:undefined, 
	    render_id:"bs-nav",
	    template_id:"nav_template", 
	    beforeRender:function(data){
		// return an array containing a single black object
		// as this will just render the template once
		if (this.data == undefined){// never rendered before
		    this.data = [{downloads:[]}];
		}
		if (_private.download != undefined){// there is a new download
		    //this.data[0].downloads.push(_private.download);
		    this.data[0].downloads = [_private.download];
		    this.clickme = _private.download.id;
		    _private.download = undefined;
		}
		console.log(this.data);
		return this.data;
	    }, 
	    afterRender:function (){
		if (this.clickme != undefined){
		    $('#'+this.clickme).click();
		}
	    }, 

	    /////////////////////////////////////////////////
	    // events
	    ////////////////////////////////////////////////

	    events: [
		{className: '.js-permute',
		 action: function (data_id, event) {
		     event.preventDefault();
		     // update the set of synths from the server
		     evo.load({component: "synthesizers_api"});
		     // generate a new population using the selected population members
		     var synth_ids = _private.selected_synths;
		     // stop any playing synth
		     if (this.synthesizer != undefined){
			 this.synthesizer.stop();
		     }

		     if (synth_ids == undefined){
			 alert("no synths selected for breeding yet - hit breed buttons to select");
		     }
		     else {// we have some synths maybe
			 var breed_ids = [];
			 for (var synth_id in synth_ids) {
			     if (synth_ids.hasOwnProperty(synth_id) &&
				 synth_ids[synth_id] == true) {
				 breed_ids.push(synth_id);
			     }
			 }
			 // now get the genomes for the synths
			 var data = _private.components['synthesizers'].get_data();
			 var parents = [];
			 for (var i=0;i<breed_ids.length;i++){
			     var parent;
			     //parent = {"genome":data[breed_ids[i]].genome};
			     parents.push(data[breed_ids[i]].genome);
			 }
			 // now use the genomes to generate a new generation
			 // TODO...placeholder... just use them directly.
			 var next_gen = Evolib.genome_funcs.generateNewPopulation(parents, 
										  25, 
										  Evolib.circuit_funcs.gene_length, 
										  0.1,
										  0.5);
			 _private.next_generation = next_gen;
			 // reset the selected synths			 
			 _private.selected_synths = undefined;
			 // $('.synthblock').hide(function(){
			 //	 });
			 that.load({component: "synthesizers"});
		     }
		 }
		}, 
		{className: '.js-nav-record',
		 action: function (data_id, event) {
		     event.preventDefault();
		     if (_private.recording == true){
			 // stop recording
			 console.log("stop record");
			 /** code to stop the synth */
			 if (this.synthesizer != undefined){
			     this.synthesizer.stop();
			     this.synthesizer = undefined;
			 }
			 $('.js-play-sound').removeClass('btn-danger').addClass('btn-default');
			 /** end code to stop the synth*/
			 $(event.target).removeClass("btn-danger");
			 
			 _private.recording = false;
			 
			 recorder && recorder.stop();
			 // create WAV download link using audio data blob
			 //createDownloadLink();
			 recorder && recorder.exportWAV(function(blob){
			     //var hf = document.createElement('a');
			     var hf = {};
			     var url = URL.createObjectURL(blob);
			     hf.href = url;
			     hf.text = new Date().toISOString() + '.wav';
			     hf.id = hf.text ;
			     //hf.innerHTML = hf.download;
			     //document.getElementById('bs-nav').appendChild(hf);
			     // add a new download to the app
			     // which the nav component can pick up
			     _private.download = hf;
			     //this.data.downlooads.push(hf);
			     that.load({component: "nav"});
			     //Recorder.forceDownload(blob, hf.text);
			 });
			 recorder.clear();
			 
		     }
		     else {
			 // start recording
			 var source = undefined;
			 if (this.synthesizer != undefined){
			     //console.log("start record");
			     // hide the download button
			     $('.js-nav-download').parent().hide();
			     //console.log(this.synthesizer);
			     source = Evolib.dsp_funcs.record_point;
			     recorder = new Recorder(source, {workerPath:'assets/js/lib/recordWorker.js'});
			     recorder && recorder.record();
			     $(event.target).addClass("btn-danger");
			     _private.recording = true;
			 }

		     }
		 }}, 
		{className: '.js-nav-download',
		 action: function (data_id, event) {
		     //event.preventDefault();
		     $(event.target).parent().hide();
 		     //_private.next_generation = undefined;
		     //that.load({component: "synthesizers"});
		 }},
		{className: '.js-nav-reset',
		 action: function (data_id, event) {
		     event.preventDefault();
		     if (this.synthesizer != undefined){
			 this.synthesizer.stop();
			 this.synthesizer = undefined;
		     }
 		     _private.next_generation = undefined;
		     that.load({component: "synthesizers"});
		 }}, 
		{className: '.js-show-info',
		 action: function (data_id, event) {
		     event.preventDefault();
		     $('#main_gui').hide('fast'); 
		     $('#instructions').show('fast');
		     //$('#instructions').toggle('fast');
		 }}, 
		{className: '.js-save-sound-modal',
		 action: function (data_id, event) {
		     event.preventDefault();
		     var data = _private.components['synthesizers'].get_data();
		     var synth_id = $('#save-sound-id').val();
		     var synth = data[synth_id];
		     //console.log(data);
		     that.save({component: "synthesizers_api",
				data: 
				{"nickname":$('#save-sound-nickname').val(), 
				 "email":$('#save-sound-email').val(), 
				 "name":$('#save-sound-name').val(), 
				 "tag":$('#save-sound-tag').val(), 
				 "genome":JSON.stringify(synth.genome)
				},
			       });
		     $('#saveModal').modal('hide');
		 }}, 
		
	    ]
	}), 
        "synthesizers_api":BlackSheepItem({
            api_path:"synthesizers", 
/*            auto_update: true,
            poll_interval: 2000,
	    template_id:"synthesizer_A_E_template",
*/	    render_id:"bs-synthesizers",
	    template_prefix: "synthesizer",
	    // save the key values passed to save as POST variables
	    // not just as part of raw JSON
            save_key_values:true,
            afterSave:function(){
                //console.log("saved a synth");
		//alert("Rating saved!");
            }, 
	    // don't render... we just stash the immigrants so they can be used in the next round
	    afterLoad:function(url, data){
		var first_load = false;
		if (_private.immigrants == undefined){// first load...
		    first_load = true;
		}
		// store these - we'll add them in on the next reload of the synth list
		_private.immigrants = data;
		// now load the main synth component, which should generate some random sounds
		if (first_load){
		    that.load({component: "synthesizers"});
		}
		return false;
	    }
        }),


        "log_api":BlackSheepItem({
            api_path:"logs", 
	    // save the key values passed to save as POST variables
	    // not just as part of raw JSON
            save_key_values:true,
            afterSave:function(){
                //console.log("saved a synth");
		//alert("Rating saved!");
            }, 
        }),




	/////////////////////////////////////////////////
	// synthesizers
	////////////////////////////////////////////////

	"synthesizers": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path:undefined, 
	    template_id:"synthesizer_A_E_template",
	    render_id:"bs-synthesizers",
	    template_prefix: "synthesizer",
	    //           jsRenderHelper: new Dsh.helperFunctions(_private),
	    afterLoad:function(){
		//console.log("loaded synths.doing the render..");
		$('#bs-synthesizers').hide('fast', function(){
		    $('#bs-synthesizers').show();
		    var vis = _private.components['synthesizers'].visualisation;
		    if (vis != undefined && vis.destroy != undefined){
			vis.destroy()
		    }
		});
		return true;
	    }, 
	    beforeRender:function(data){
		// check if we had previously bred a new gnerateion
		if (_private.next_generation == false || 
		    _private.next_generation == undefined){
		    // generate an array of genomes
		    data = [];
		    for (var i=0; i<25; i++){
			var dna = Evolib.genome_funcs.generateRandom(Evolib.circuit_funcs.gene_length * 40);
			var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(dna);
			data.push(spec);
		    }
		}
		else {
		    // use next_generaetion to set up the data
		    data = [];
		    for (var i=0; i<_private.next_generation.length;i++){
			var dna = _private.next_generation[i];
			var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(dna);
			data.push(spec);
		    }
		}
		//console.log(data);
		// check if we have any immigrants
		if (_private.immigrants != undefined){
		    for (var i=0; i <_private.immigrants.length; i++){
			_private.immigrants[i].genome.type = "immigrant";

			if (_private.immigrants[i].name != ''){
			    _private.immigrants[i].genome.type += " : " + _private.immigrants[i].name;
			}
			if (_private.immigrants[i].nickname != ''){
			    _private.immigrants[i].genome.type += " by " + _private.immigrants[i].nickname;
			}
			
			var dna = _private.immigrants[i].genome.dna;
			//console.log(dna.length);
			var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(_private.immigrants[i].genome);
			data.push(spec);
		    }
		    // now shuffle the array
		    var shuffle = function shuffle(o){ //v1.0
			for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
			return o;
		    };
		    data = shuffle(data);
		    
		}
		//console.log(data);
		// need to store the data this this component as this will not happen automatically
		this.data = data;
		return data;
	    }, 
	    afterRender:function(){
		//console.log("after render was called");
		//$('#bs-synthesizers').show();
	    }, 

	    /////////////////////////////////////////////////
	    // events
	    ////////////////////////////////////////////////

	    events: [
		{className: '.js-play-sound',
		 action: function (data_id, event) {
		     event.preventDefault();
		     var data = _private.components['synthesizers'].get_data();
		     var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(data[data_id]);
		     var must_play = true;
		     if (this.synthesizer != undefined){// something was already playing
			 this.synthesizer.stop();
			 // is it the same synth?
			 if (Object.keys(this.synthesizer.subgraphs)[0] == 
			     Object.keys(new_synth.subgraphs)[0]){
			     must_play = false;
			     // remove it
			     this.synthesizer = undefined;
			     //$('.js-play-sound').removeClass('btn-danger').addClass('btn-default');
			     $(event.target).removeClass('btn-danger').addClass('btn-default');

			 }
		     }

		     if (must_play){
			 this.synthesizer = new_synth;
			 this.synthesizer.start();
			 // sort out the button
			 // switch all play buttons off
			 $('.js-play-sound').removeClass('btn-danger').addClass('btn-default');
			 $(event.target).addClass('btn-danger');
			 
			 // generate the vis
			 //EvoSynthHelperFuncs.generateVis(data[data_id], 'vis_'+data_id);
			 _private.components['synthesizers'].visualisation = 
			     EvoSynthHelperFuncs.generateVis(data[data_id], 
							     'vis', 
							     _private.components['synthesizers'].visualisation);
		     }

		 }
		},
		{className: '.js-select-sound',
		 action: function (data_id, event) {
		     event.preventDefault();
		     if ($(event.target).data('selected') == true){
			 $(event.target).data('selected', false);
			 // change button text
			 $(event.target).button('reject');//addClass('btn-info');
			 // change colour
			 $(event.target).addClass('btn-default');
			 $(event.target).removeClass('btn-warning');
		     }
		     else{
			 $(event.target).data('selected', true);
			 // change button text
			 $(event.target).button('breeder');//addClass('btn-info');
			 // change class
			 $(event.target).removeClass('btn-default');
			 $(event.target).addClass('btn-warning');
		     }
		     var checked = $(event.target).data('selected');
		     if (checked){
			 if (_private.selected_synths == undefined){// nothing clicked before - bootstrap it
			     _private.selected_synths = {};
			 }
			 _private.selected_synths[data_id] = true;
			 // post the selected synth set up to the logs
			 var synth_ids = _private.selected_synths;
			 var breed_ids = [];
			 for (var synth_id in synth_ids) {
			     if (synth_ids.hasOwnProperty(synth_id) &&
				 synth_ids[synth_id] == true) {
				 breed_ids.push(synth_id);
			     }
			 }
			 // now get the genomes for the synths
			 var data = _private.components['synthesizers'].get_data();
			 var parents = [];
			 for (var i=0;i<breed_ids.length;i++){
			     var parent;
			     //parent = {"genome":data[breed_ids[i]].genome};
			     parents.push(data[breed_ids[i]].genome);
			 }
			 
			 that.save({component: "log_api",
				    data: 
				    {"nickname":$('#save-sound-nickname').val(), 
				    // "email":$('#save-sound-email').val(), 
				     "breeders":JSON.stringify(parents)
				    },
				   });

		     }
		     else {
			 _private.selected_synths[data_id] = false;
		     }
		 }
		},
		{className: '.js-save-sound',
		 action: function (data_id, event) {
		     event.preventDefault();
		     var data = _private.components['synthesizers'].get_data();
		     if (this.synthesizer != undefined){
			 this.synthesizer.stop();
		     }
		     // reset the sound name and 
		     // tag fields
		     $('#save-sound-name').val('');
		     $('#save-sound-tag').val('');
		     $('#save-sound-id').val(data_id);
		     $('#saveModal').modal('show');
		     //console.log(data[data_id]);

		     //alert('yeah');
		 }}, 
	    ]
	}),
    };
    var that = BlackSheepApp(_private);
    return that;
}

// a handy set of functions to make the spec a bit clearer
var EvoSynthHelperFuncs = {
    generateVis:function(spec, target_div, network){// spec contains a modules and a wires field
	var nodes = null;
	var edges = null;
	// destroy the old network if needed
	if (network != undefined && network.destroy != undefined){
	    network.destroy()
	}
	//var network = null;
	//console.log(spec);
	// Called when the Visualization API is loaded.
	nodes = [];
	edges = [];
	var EDGE_LENGTH = 50;
	var connectionCount = [];

	// process the modules
	var nodeCount = spec.modules.length;
	var cols = parseInt(Math.sqrt(nodeCount));

	for (var i = 0; i < nodeCount; i++) {
	    var module = spec.modules[i];
	    var img = module.type + "-"+module.sub_type+".png";
	    var dir = "./assets/images/icons/";
	    var label = "";
	    var level = undefined;
	    if (i == 0){
		label = "AUDIO OUT";
		level = 0;
	    }
	    nodes.push({
		id: module.module_id,
		label: label, 
//		level: level, 
		//label: module.sub_type + "-" + module.type, 
		image: dir + img, 
		shape: 'image', 
	    });
	}
	// process the wires
	// first, calculate the wire lengths
	// so we can normalise the edge lengths in the graph
	var max_len = 0;
	for (var i=0; i<spec.wires.length; i++){
	    // length is euclidean distance between the two 
	    // nodes this wire connects
	    var wire =  spec.wires[i];
	    var len = Math.sqrt(Math.pow((wire.x1 - wire.x2), 2) + Math.pow((wire.y1 - wire.y2), 2));
	    if (len > max_len){
		max_len = len;
	    }
	}
	
	for (var i=0; i<spec.wires.length; i++){
	    var wire =  spec.wires[i];
	    var from = wire.out_mod_id;
	    var to = wire.in_mod_id;
	    var len = Math.sqrt(Math.pow((wire.x1 - wire.x2), 2) + Math.pow((wire.y1 - wire.y2), 2));
	    
	    edges.push({
		from: from,
		to: to,
		length: len / max_len * 250, 
		style: 'arrow'
	    });
	}


	// Create a network
	var container = document.getElementById(target_div);
	var data = {
	    nodes: nodes,
	    edges: edges
	};
	var options = {
	    stabilize: false,
	    nodes: {
		shape: 'dot',
		radius: 75,
		fontSize: 24
	    },
	    edges: {
		width: 2
	    }, 
	    physics: {hierarchicalRepulsion: {nodeDistance: 100, damping: 0.295}},hierarchicalLayout: {direction: 'DU', levelSeparation: 75, nodeSpacing:100}
	};
	network = new vis.Network(container, data, options);
	return network;
    }
};

//var options = {physics: {hierarchicalRepulsion: {nodeDistance: 82}},hierarchicalLayout: {enabled:true}};

