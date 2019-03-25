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
    if (breedIds.length == 0) {
      console.log("Warning - no breed ids set. Returning old pop untouched");
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
        child.type = "mutate";
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

      // put it back
      next_gen[i].dna = pm_dna;
    }
    // grow mutate
    return next_gen;
  }
}
