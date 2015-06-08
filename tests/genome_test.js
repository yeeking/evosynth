var genome = require('../modules/genome');
var circuit = require('../modules/circuit');
var expect = require('chai').expect;

describe("genome", function(){
    describe ("generateRandom", function(){
	it("should return array of length 10", function(){
            var result = genome.generateRandom(10);
            expect(result.dna.length).to.equal(10);
        })
    });
    describe ("pointMutateGenome", function(){
	it("should all be the same length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var pm_dna = genome.pointMutateGenome(dna, 0.1, 0.1);
	    expect(pm_dna.length).to.equal(dna.length);
	});
	it("should return a mutated array", function(){
	    var dna = genome.generateRandom(10).dna;
	    var pm_dna = genome.pointMutateGenome(dna, 1.0, 0.1);
	    expect(pm_dna).to.not.deep.equal(dna);
	})

    });
    describe ("pointMutateLocus", function(){
	var val = 0.5;
	var new_val = genome.mutateLocus(val, 0.1);
	it("should be different than 0.5", function(){
	    expect(new_val).to.not.equal(0.5);
	})
	it("should be greater than 0.4", function(){
	    expect(new_val).to.be.above(0.4);
	})
	it("should be less than 0.6", function(){
	    expect(new_val).to.be.below(0.6);
	})
    });
    describe("repeatMutateGenome", function(){
	it("should be double the length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.repeatMutateGenome(dna, 10, 1.0);
	    expect(new_dna.length).to.equal(dna.length * 2);
	})
	it("should be quadruple the length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.repeatMutateGenome(dna, 10, 1.0);
	    new_dna = genome.repeatMutateGenome(new_dna, 10, 1.0);
	    expect(new_dna.length).to.equal(dna.length * 4);
	})
	it("should be the same length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.repeatMutateGenome(dna, 10, 0.0);
	    expect(new_dna.length).to.equal(dna.length);
	})
    });
    describe("growMutateGenome", function(){
	it("should be double the length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.growMutateGenome(dna, 10, 1.0);
	    expect(new_dna.length).to.equal(dna.length * 2);
	})
	it("should be the same length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.growMutateGenome(dna, 10, 0.0);
	    expect(new_dna.length).to.equal(dna.length);
	})
    });

    describe("deleteMutateGenome", function(){
	it("should be zero length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.deleteMutateGenome(dna, 10, 1.0);
	    expect(new_dna.length).to.equal(0);
	})
	it("should be same length", function(){
	    var dna = genome.generateRandom(10).dna;
	    var new_dna = genome.deleteMutateGenome(dna, 10, 0.0);
	    expect(new_dna.length).to.equal(dna.length);
	})
    })
    describe ("crossoverGenomesAtLoci", function(){
	var dna1, dna2;
	dna1 = [1,2,3,4,5,6];
	dna2 = [7,8,9,10,11,12];
	it("should return an array of same length as input arrays", function(){
            var dna = genome.crossoverGenomesAtLoci(dna1, dna2, [0]);
	    expect(dna.length).to.equal(dna1.length);
        })
	it("should return the same as dna2 since there is a single crossover at locus 0", function(){
            var dna = genome.crossoverGenomesAtLoci(dna1, dna2, [0]);
	    expect(dna).to.deep.equal(dna2);
        })
	it("should return a splice with first 3 elements of dna1 and last 3 elements of dna2", function(){
            var dna = genome.crossoverGenomesAtLoci(dna1, dna2, [3]);
	    expect(dna).to.deep.equal([1,2,3,10,11,12]);
        })
	it("should be [1,2,8,9,5,6]", function(){
            var dna = genome.crossoverGenomesAtLoci(dna1, dna2, [2, 4]);
	    expect(dna).to.deep.equal([1,2,9,10,5,6]);
        })
    });
    describe ("getCrossoverPoints", function(){
	var dna;
	dna = [1,2,3,4,5,6];
	var loci = genome.getCrossoverPoints(dna, dna, 3);
	it("should countain 3 loci", function(){
	    expect(loci.length).to.equal(3);
        })
	it("should be in the range 0 to 5", function(){
	    //expect(loci).should.all.be.within(0, 5);
	    //[4, 11, 15].should.include.one.below(10)
	    expect(loci[0]).to.be.within(0, 5);
	    expect(loci[1]).to.be.within(0, 5);
	    expect(loci[2]).to.be.within(0, 5);
        })
    })
    describe ("crossover", function(){
	var dna1, dna2;
	dna1 = [1,2,3,4,5,6];
	dna2 = [7,8,9,10,11,12];
	it("should be [1,2,8,9,5,6]", function(){
            var dna = genome.crossover(dna1, dna2, 2);
	    expect(dna.length).to.equal(dna1.length);
        })
    });
    describe ("generateNewPopulation", function(){
	var dna1, dna2;
	dna1 = {"dna":[1,2,3,4,5,6]};
	dna2 = {"dna":[7,8,9,10,11,12]};
	it("should be length 5", function(){
	    var pop = genome.generateNewPopulation([dna1, dna2], 5, circuit.gene_length, 0.1, 0.1);
	    expect(pop.length).to.equal(5);
        })
	it("should cope with a single parent family", function(){
	    var pop = genome.generateNewPopulation([dna1], 5, circuit.gene_length, 0.1, 0.1);
	    expect(pop.length).to.equal(5);
        })
	it("children should be different", function(){
	    var pop = genome.generateNewPopulation([dna1], 3, circuit.gene_length, 1.0, 0.1);
	    expect(pop[0].dna).to.not.deep.equal(dna1.dna);
	    expect(pop[1].dna).to.not.deep.equal(dna1.dna);
	    expect(pop[2].dna).to.not.deep.equal(dna1.dna);
        })
    });
    
    describe ("calculateGeneDistance", function(){
	var dna1 = [0, 0, 0, 0];
        var dna2 = [0, 0, 0, 0];
	var dna3 = [0.5, 0.5, 0.5, 0];
	it("should be 0", function(){
	    var dist = genome.calculateGeneDistance(dna1, dna2);
	    expect(dist).to.equal(0);
	})
	it("should be square root of 0.75", function(){
	    var dist = genome.calculateGeneDistance(dna1, dna3);
	    expect(dist).to.equal(Math.sqrt(0.25 + 0.25 + 0.25));
	})
	
    });
    
    describe ("calculateClosestGeneDistance", function(){
	var gene1 = [0, 1, 0.5];
	var genome1 = [0, 1, 0,   
		       1, 1, 1] ;
	var gene2 = [0, 1, 0];
	var genome2 = [1, 1, 1,   
		       0, 1, 0] ;
	it("should be square root of 0.25", function(){
	    var dist = genome.calculateClosestGeneDistance(gene1, genome1, 3);
	    expect(dist).to.equal(Math.sqrt(0.25));
	})
	it("should be zero", function(){
	    var dist = genome.calculateClosestGeneDistance(gene2, genome2, 3);
	    expect(dist).to.equal(0);
	})
	
    });
    
    describe ("estimateGenomeDistance", function(){
	var genome1 = [0, 1, 0,   
		       1, 1, 1] ;
	var genome2 = [0, 1, 0,   
		       1, 1, 1] ;
	var genome3 = [1, 1, 1,   
		       0, 1, 0] ;
	var genome4 = [1, 1, 1,   
		       0, 1, 0, 
		       0, 0, 0] ;
	it("should be zero for same sequence", function(){
	    var dist = genome.estimateGenomeDistance(genome1, genome2, 3);
	    expect(dist).to.equal(0);
	})
	it("should be zero for re-arranged genes", function(){
	    var dist = genome.estimateGenomeDistance(genome1, genome3, 3);
	    expect(dist).to.equal(0);
	})	
	it("should be zero for re-arranged genes", function(){
	    var dist = genome.estimateGenomeDistance(genome1, genome3, 3);
	    expect(dist).to.equal(0);
	})
	it("should cope with different length genomes - short to long", function(){
	    var dist = genome.estimateGenomeDistance(genome1, genome4, 3);
	    expect(dist).to.equal(Math.sqrt(0.25+0.25+0.25));
	})
	it("should cope with different length genomes - long to short", function(){
	    var dist = genome.estimateGenomeDistance(genome1, genome4, 3);
	    expect(dist).to.equal(Math.sqrt(0.25+0.25+0.25));
	})
    });

    describe ("findParents", function(){
	it("should return an array with at least one element", function(){
            var result = genome.findParents([1,2,3], "crossover", [[1,2,3],[1,2,3],[3,4,5]], 3);
            expect(result.length).to.be.above(0);
        })
	it("should return an array with 1 in it", function(){
            var result = genome.findParents([1,2,3], "point", [[0,2,2],[0,2,3],[3,4,5]], 3);
            expect(result[0]).to.equal(1);
        })
	it("should return an array with 2 in it", function(){
            var result = genome.findParents([2,2,5], "point", [[0,2,2],[0,2,3],[2,4,5]], 3);
            expect(result[0]).to.equal(2);
        })
	it("should return an array with a 1 and a 0 in it", function(){
            var result = genome.findParents([2,2,7, 0,2,1], "crossover", [[0,2,2, 1,1,1],[0,2,3, 1,1,1],[2,4,5, 7,8,9]], 3);
            expect(result[0]).to.equal(1);// closest
            expect(result[1]).to.equal(0);// next closest
        })
    });
    

    describe ("createFamilyTree", function(){
	var sessions;
	sessions = [
	    // gen 1
	    {"breeders":[
		{"dna":[0.5, 0.7], "type":"random"},
		{"dna":[0.1, 0.1], "type":"random"}, 
		{"dna":[0.9, 0.9], "type":"random"}, 
	    ]}, 
	    // gen 2
	    {"breeders":[
		{"dna":[0.1, 0.05], "type": "point mutant"}, 
		{"dna":[0.15, 0.1], "type": "point mutant"}, 
		{"dna":[0.8, 0.7], "type": "point mutant"}, 
	    ]}, 
	];
	var sessions2 = [
	      // gen 1
	    {"breeders":[
		[0.5, 0.7],
		[0.1, 0.1],
		[0.9, 0.9],
	    ]}, 
	    // gen 2
	    {"breeders":[
		{"dna":[0.1, 0.05], "type": "crossover"}, 
		{"dna":[0.15, 0.1], "type": "crossover"}, 
		{"dna":[0.8, 0.7], "type": "crossover"}, 
	    ]}, 
	];
	var sessions3 = [
	      // gen 1
	    {"breeders":[
		[0.5, 0.7],
		[0.1, 0.1],
		[0.9, 0.9],
	    ]}, 
	    // gen 2
	    {"breeders":[
		[0.1, 0.05],
		[0.15, 0.1],
		[0.8, 0.7], 
	    ]}, 
	];

	it("should connect both gen 2 children to item 0 in prev gen ", function(){
            var tree = genome.createFamilyTree(sessions, 2);
	    //console.log(tree[1].breeders[0]);
	    var g1_0_p_id = tree[1].breeders[0].parent_ids[0];
	    var g1_1_p_id = tree[1].breeders[1].parent_ids[0];
	    var g1_2_p_id = tree[1].breeders[2].parent_ids[0];
	    expect(g1_0_p_id).to.equal(1);// 
	    expect(g1_1_p_id).to.equal(1);// 
	    expect(g1_2_p_id).to.equal(2);// 
        })
	it("should work when the parent gen is flat arrays ", function(){
            var tree = genome.createFamilyTree(sessions2, 2);
	    //console.log(tree[1].breeders[0]);
	    var g1_0_p_id = tree[1].breeders[0].parent_ids[0];
	    var g1_1_p_id = tree[1].breeders[1].parent_ids[0];
	    var g1_2_p_id = tree[1].breeders[2].parent_ids[0];
	    expect(g1_0_p_id).to.equal(1);// 
	    expect(g1_1_p_id).to.equal(1);// 
	    expect(g1_2_p_id).to.equal(2);// 
        })
	it("should provide empty parent_id arrays if net gen is new random gen ", function(){
            var tree = genome.createFamilyTree(sessions3, 2);
	    //console.log(tree[1].breeders[0]);
	    expect(tree[1].breeders[0].parent_ids.length).to.equal(0);// 
        })
    })
    //describe ("findParents", function(){})

})


