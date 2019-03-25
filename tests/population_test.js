var population = require('../modules/population');
var expect = require('chai').expect;

describe("population", function() {
  describe("newPopulation", function() {
    it("should return a population with things in it", function() {
      var pop = population.newPopulation(10);
      expect(pop.length).to.equal(10);
    })
    it("should return a population even with no size argument", function() {
      var pop = population.newPopulation();
      expect(pop.length).to.be.above(0);
    })

  })
  describe("breedPopulation", function() {
    it("should return a population with things in it (crossbreed mode)", function() {
      var pop = population.newPopulation(10);

      pop = population.breedPopulation(
        pop,
        [0, 1],
        0.1,
        0.1);
      expect(pop.length).to.equal(10);
    })
    it("should return a population different from the input", function() {
      var pop = population.newPopulation(10);
      pop2 = population.breedPopulation(
        pop,
        [0, 1],
        0.1,
        0.1);
      expect(pop2[0].dna).to.not.deep.equal(pop[0].dna);
    })
    it("should generate right size population from single parent", function() {
      var pop = population.newPopulation(10);
      pop2 = population.breedPopulation(
        pop,
        [0],
        0.1,
        0.1);
        expect(pop.length).to.equal(pop2.length);
    })
    it("should generate mutated population from single parent", function() {
      var pop = population.newPopulation(2, 1); // 2 sounds, 1 gene each
      pop2 = population.breedPopulation(
        pop,
        [0],
        1.0, // max mutatoin rate.
        1.0);
      expect(pop2[0].dna).to.not.deep.equal(pop[0].dna);
    })

  })
})
