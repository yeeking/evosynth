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
  /**
   * getInBetweenGenome: interpolates beteeen the two genomes and returns the 
   * genome placed at position, if position = 0.5, half way between and so on
   * @param {array of floats} genome1 
   * @param {array of floats} genome2 
   * @param {float 0-1} position 
   * @return a new genome
   */
  getInBetweenGenome: function(g1, g2, position){
    if (position < 0 || position > 1){
      console.log('genome:getInBetweenGenome:WARNING position must be 0-1 '+position);
      return g1;
    }
    // calculate a 100 point interpolation:
    gs = this.interpolateBetweenGenomes(g1, g2, 100);
    ind = Math.round(position * 100);
    return gs[ind];
  },
  /**
   * Interpolate between the two genomes, returning the in-between genomes
   * @param {array of floats} genome1 
   * @param {array of floats} genome2 
   * @param {int} steps 
   * @return an array of arrays representing the interpolation steps beteeen the genomes
   */
  interpolateBetweenGenomes: function (g1, g2, steps){
    var removeZeroes;
    var len_diff = Math.abs(g1.length - g2.length);
    if (g1.length > g2.length){
      removeZeroes = true;// fade then remove unwanted zeroes at the end
      for (var i=0;i<len_diff;i++)  g2.push(0);
    }
    if (g2.length > g1.length){
      removeZeroes = false; // add zeroes then fade
      //zeropad it
      for (var i=0;i<len_diff;i++)  g1.push(0); // pad g1
    }
    // now interpolate each element
    var inters = [];
    for (var i=0;i<steps;i++) inters.push([]);
    for (var i=0;i<g1.length;i++)
    {
      var sub_inters = this.interpolateBetweenValues(g1[i], g2[i], steps);
      for (var j=0;j<steps;j++)
      {
        inters[j].push(sub_inters[j]);
      }
    }
    if (removeZeroes){
      // trim off the zeros
      for (var i=0;i<len_diff;i++)  inters[steps-1].pop(); 
    }
    return inters;
  }, 

  /**
   * Interpolates between v1 and v2 in steps and returns 
   * an array of the values in between the two values
   * @param {float} v1 - start value
   * @param {float} v2 - end value
   * @param {int} steps - number of steps
   */
  interpolateBetweenValues(v1, v2, steps){
    var vals = [];
    var d = (v2 - v1)/(steps+1);
    var x = v1;
    for (var i=0;i<steps;i++)
    {
      x += d;
      vals.push(x);
    }
    return vals;
  }
}
