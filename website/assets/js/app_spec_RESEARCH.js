/**
 * Research specification for the blacksheep app - replace app_spec.js with this
 * to get extra features
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
		//console.log(this.data);
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
		{className: '.js-nav-permute',
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
			     // hide the download button
			     $('.js-nav-download').parent().hide();
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
		// load and display all synths that have been saved by people
		{className: '.js-nav-show-saved-synths',
		 action: function (data_id, event) {
		     event.preventDefault();
		     that.load({component: "saved_synthesizers"});
		 }},
		// load and display all sessions that have been saved by people
		{className: '.js-nav-show-sessions',
		 action: function (data_id, event) {
		     event.preventDefault();
		     that.load({component: "sessions"});
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

	/////////////////////////////////////////////////
	// component for saving of synths and also loading of immigrants
	////////////////////////////////////////////////
        "synthesizers_api":BlackSheepItem({
            api_path:"synthesizers", 
	    /*            auto_update: true,
			  poll_interval: 2000,
			  template_id:"synthesizer_A_E_template",
	    */	    
//	    render_id:"bs-synthesizers",
	    template_prefix: "synthesizer",
	    // save the key values passed to save as POST variables
	    // not just as part of raw JSON
            save_key_values:true,
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

	/////////////////////////////////////////////////
	// component for logging breed events to the server
	////////////////////////////////////////////////
        "log_api":BlackSheepItem({
            api_path:"logs", 
	    // save the key values passed to save as POST variables
	    // not just as part of raw JSON
            save_key_values:true,
        }),

	/////////////////////////////////////////////////
	// component for generating lists of synthesizers
	////////////////////////////////////////////////
	"synthesizers": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path:undefined, 
	    template_id:"synthesizer_A_E_template",
	    render_id:"bs-main-panel",
	    template_prefix: "synthesizer",
	    //           jsRenderHelper: new Dsh.helperFunctions(_private),
	    afterLoad:function(){
		/*
		$("#"+this.render_id).hide('fast', function(){
		    $("#"+this.render_id).show();
		    var vis = _private.components['synthesizers'].visualisation;
		    if (vis != undefined && vis.destroy != undefined){
			vis.destroy()
		    }
		});
		*/
		var vis = _private.components['synthesizers'].visualisation;
		if (vis != undefined && vis.destroy != undefined){
		    vis.destroy()
		}
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
		// need to store the data this this component as this will not happen automatically
		this.data = data;
		return data;
	    }, 
	    afterRender:function(){
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
		 }}, 
	    ]
	}),

	/////////////////////////////////////////////////
	// list of breeding sessions 
	////////////////////////////////////////////////
	"sessions": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path:"sessions", 
	    template_id:"session_list_template",
	    render_id:"bs-main-panel",
	    template_prefix: "session",
	    events: [
		{className: '.js-load-session',
		 action: function (data_id, event) {
		     event.preventDefault();
		     that.load({component: "session", ids:{id:data_id}});
		 }}, 
	    ], 
	}),
	/////////////////////////////////////////////////
	// breeding sessions 
	////////////////////////////////////////////////
	"session": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path: "sessions/:id",
	    template_id:"session_single_template",
	    render_id:"bs-main-panel",
	    template_prefix: "session",
	    beforeRender:function(data){
		// assign parents to the 
		console.log(data);
		data.data = Evolib.genome_funcs.createFamilyTree(data.data, Evolib.circuit_funcs.gene_length);
		// rebuilt it, removing 
		console.log(data);
		return data.data;
	    }, 
	}),

	/////////////////////////////////////////////////
	// componebt for showing complete list of saved synthesizers
	////////////////////////////////////////////////
	"saved_synthesizers": BlackSheepItem({
	    // undefined api path means can load without 
	    // making a call to an api
	    api_path:"saved_synthesizers", 
	    render_id:"bs-main-panel",
	    //render_id:"bs-synthlist",
	    template_id:"synthlist_template", 
	    beforeRender:function(data){
		//console.log(data.data);
		// use next_generaetion to set up the data
		specs = [];
		for (var i=0; i<data.data.length;i++){
		    var dna = data.data[i].genome;
		    var spec = Evolib.circuit_funcs.genomeToModuleAndWireSpecs(dna);
		    spec.name = data.data[i].name;
		    spec.id = data.data[i].id;
		    specs.push(spec);
		}
		//data = specs;
		this.data = specs;
		return specs;
	    }, 
	    afterRender:function(){
		//$('#instructions').hide();
		//$('#saved_synths').show();
	    },
	    events: [
		{className: '.js-play-sound',
		 action: function (data_id, event) {
		     event.preventDefault();
		     var data = _private.components['saved_synthesizers'].get_data();
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
		{className: '.js-recordall',
		 action: function (data_id, event) {
		     //alert('yep');
		     console.log();
		     var record_length = 1000;
		     
		     // iterate the synths and play one
		     var play_synth = function(synths, index){
			 console.log("playing a synth");
			 console.log(synths[index]);
			 var new_synth = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(synths[index]);
			 if (this.synthesizer != undefined){
			     this.synthesizer.stop();
			 }
			 //this.current_synth_id = synths[index].name;
			 this.current_synth_id = synths[index].id;

			 this.synthesizer = new_synth;
			 this.synthesizer.start();

		     }
		     var record_wait_download = function(wait_time, synth_id){
			 console.log("recording...");
			 var source = Evolib.dsp_funcs.record_point;
			 recorder = new Recorder(source, {workerPath:'assets/js/lib/recordWorker.js'});
			 recorder && recorder.record();
			 // wait!
			 setTimeout(function(){
			     console.log("exporting...");
			     // wait some time
			     recorder && recorder.exportWAV(function(blob){
				 console.log("got the export blob...");
				 console.log(this.current_synth_id);
				 var hf = document.createElement('a');
				 //var hf = {};
				 var url = URL.createObjectURL(blob);
				 hf.href = url;
				 //hf.text = new Date().toISOString() + '.wav';
				 hf.text = this.current_synth_id + ".wav";
				 //hf.text = synth_id + ".wav";
				 hf.id = hf.text ;
				 //hf.innerHTML = hf.download;
				 document.getElementById('bs-main-panel').appendChild(hf);
				 // add a new download to the app
				 // which the nav component can pick up
				 _private.download = hf;
				 //this.data.downlooads.push(hf);
				 //that.load({component: "nav"});
				 console.log("Forcing download");
				 Recorder.forceDownload(blob, hf.text);
			     	 recorder.clear();
			     });

			     //alert('Hello')
			 },wait_time)

		     }
		     var data = _private.components['saved_synthesizers'].get_data();
		     //for (var synth_id=0; synth_id < data.length; synth_id ++){
		     var start_ind = 0;
		     var synth_id = start_ind;
		     var file_len = 3000;
		     //for (var step=0; step < 2; step ++){
		     console.log(data.length);
		     for (var step=start_ind; step < data.length; step ++){
			 console.log(step);
			 // wait 3 seconds then play a synth, then call the record
			 // which waits another 3 then records and downloads
			 setTimeout(function(){
			     console.log("selecting synth with  index "+synth_id);
			     play_synth(data, synth_id++);
			     record_wait_download(file_len - 50, synth_id);
			 }, file_len * (step - start_ind));
		     }
		     //record_wait_download(record_length, function(){
		     //			 play_synth(data, 0);
			 
		     //});
		 }}, 
	    ], 
	    
	}), 
	
    };
    var that = BlackSheepApp(_private);
    var app = this;
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
    }, 
    playSynth:function(app, spec){
	var synthesizer = Evolib.dsp_funcs.moduleAndWireSpecToSynthesizer(spec);
	var must_play = true;
	if (app.synthesizer != undefined){// something was already playing
	app.synthesizer.stop();
	app.synthesizer = undefined;
	}
	app.synthesizer = synthesizer;
	app.synthesizer.start();
	
    }, 
    
};

//var options = {physics: {hierarchicalRepulsion: {nodeDistance: 82}},hierarchicalLayout: {enabled:true}};

