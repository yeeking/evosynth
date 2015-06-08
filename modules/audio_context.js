/**
* Wrapper around the audio context. 
*/
module.exports = {
    /** property set providing all the bits needed to be able to test
     * the web audio api context on the command line with mocha (i.e. in node)*/
    fake_audio_context : {
	createOscillator : function(){
	    var osc = {
		connect : function(){
		}, 
		frequency : 1, 
		/** TODO: implement the rest of the bits of an osciilator that we need. */
	    };
	    return osc;
	}, 
	createGain : function(){
	    var gain = {
		connect : function(){
		}, 
		/** TODO: implement the rest of the bits of a gain node that we need. */
		gain : 
	    };
	}, 
    }, 
}
