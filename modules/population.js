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
	}, 
	/**
	* Returns a new population from oldPopulation using breedIds as parents. 
	* assumes breed_ids is a key value array with numerical ids
	*/
	breedPopulation:function(oldPopulation, breedIds, mutation_rate, mutation_size){
		var parents, crossover, next_gen;
		crossover = false;
		parents = new Array();
		next_gen = new Array();
		var random_ind = function(array_size){
	    	return Math.round(Math.random() * (array_size - 1));
		}
		// get the parent genomes
		for (key in breedIds){
			parents.push(oldPopulation[breedIds[key]])
		}
		if (parents.length > 1) crossover = true;
		// generate the next generation
		if (crossover){
		  for (var i=0; i<oldPopulation.length; i++){
			//console.log("adding xover");
			var ind1, ind2, parent1, parent2, child;
			child = {};
			ind1 = random_ind(parents.length);
			do {
			    ind2 = random_ind(parents.length);
			}while(ind2 == ind1)
			parent1 = parents[ind1];
			parent2 = parents[ind2];
			child.dna = this.crossover(parent1.dna, parent2.dna, parent1.dna.length * mutation_rate);
			child.type = "crossover";
			next_gen.push(child);
		  }
		}
		// point mutate 
		for (var i=0;i<next_gen.length;i++){

		}
		// repeat and delete mutate 

		// grow mutate


	}

}