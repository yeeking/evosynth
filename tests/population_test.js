var population = require('../modules/population');
var expect = require('chai').expect;

describe("population", function() {
        describe("newPopulation", function() {
                it("should return a population with things in it", function() {
                        var pop = population.newPopulation(10);
                        expect(pop.length).to.equal(10);
                })
        })
        describe("breedPopulation", function(){
                it("should return a population with things in it (crossbreed mode)", function() {
                        var pop = population.newPopulation(10);

                        pop = 	population.breedPopulation(
                                pop,
                                [0,1],
                                0.1,
                                0.1);
                        expect(pop.length).to.equal(10);
                })
        })
})
