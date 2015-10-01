/** population level functions */
module.exports = {
	/**
	* generate a random population of the requested size.
	*/
	newPopulation:function(size){
		var pop = new Array();
		for (var i=0; i<size; i++){
			var dna = Evolib.genome_funcs.generateRandom(Evolib.circuit_funcs.gene_length * 40);
			pop.push(dna);
		}
		return pop;
	}

}