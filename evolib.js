var evolib_spec = {"load":function(){
    console.log("evolib loading...");
    this.genome_funcs = require('./modules/genome.js');
    this.circuit_funcs = require("./modules/circuit.js");
    this.dsp_funcs = require("./modules/dsp.js");
    var context = new (window.AudioContext || window.webkitAudioContext)();
    this.dsp_funcs.setContext(context);
    return this;
}}
// put Evolib singleton into global scope
window.Evolib = evolib_spec.load();
