var genome = require('../modules/genome');
var circuit = require('../modules/circuit');
var expect = require('chai').expect;

describe("circuit", function(){
    describe ("moduleTypes", function(){
	it("should return oscillator and filter", function(){
	    var osc_result = circuit.parseHelpers.getModuleType(0);
	    var filt_result = circuit.parseHelpers.getModuleType(0.7);
	    expect(osc_result).to.equal("oscillator");
	    expect(filt_result).to.equal("filter");
	})
    })
    describe ("moduleSubTypes", function(){
	it("should return sine ", function(){
	    var osc_result = circuit.parseHelpers.getModuleSubType(0, "oscillator");
	    expect(osc_result).to.equal("sine");
	})
	it("should return lowshelf", function(){
	    var filt_result = circuit.parseHelpers.getModuleSubType(0.49, "filter");
	    expect(filt_result).to.equal("lowshelf");
	})
	it("should return notch", function(){
	    var filt_result = circuit.parseHelpers.getModuleSubType(0.99, "filter");
	    expect(filt_result).to.equal("notch");
	})
    })
    describe ("normalise", function(){
	it("should return 6", function(){
            var result = circuit.parseHelpers.normalise(0.5, 0, 1, 1, 11);
            expect(result).to.equal(6);
	})
	it("should return 5", function(){
            var result2 = circuit.parseHelpers.normalise(0.5, 0, 1, 0, 10);
            expect(result2).to.equal(5);
        })
    })
    describe ("getTheta", function(){
	it("should return PI", function(){
            var result = circuit.parseHelpers.getTheta(0.5);
            expect(result).to.equal(Math.PI);
        })
	it("should return two pi ", function(){
            var result = circuit.parseHelpers.getTheta(1.0);
            expect(result).to.equal(Math.PI * 2);
        })
    })

    describe ("geneToModuleSpec", function(){
	var gene = [0, 0, 0.75, 0.25, 0.5, 0.75, 0.5, 0];
	var result = circuit.geneToModuleSpec(gene);
	it("should be length 12", function(){
	    var count = 0;
	    for(var propertyName in result) {
		count ++;
	    }
	    expect(count).to.equal(12);
	});
	it("should be an osc", function(){
	    expect(result.type).to.equal("oscillator");
	});
	it("should be a sine", function(){
	    expect(result.sub_type).to.equal("sine");
	});
	it("should be 3/4 across the grid", function(){
	    expect(result.x).to.equal(0.75);
	});
	it("should be 1/4 way down the grid ", function(){
	    expect(result.y).to.equal(0.25);
	});
	it("should connect in range starting at PI radians (South)", function(){
	    // t1 -> 0.5 goes to PI
	    expect(result.theta1).to.equal(Math.PI);
	});
	it("should connect in range ending at PI * 1.5 radians (South West)", function(){
	    expect(result.theta2).to.equal(Math.PI * 1.5);
	});
	it("should have a connection radius of gridsize / 2", function(){
	    expect(result.radius).to.equal(0.5);
	});
	it("should have 2 inports as it is an oscillator ", function(){
	    expect(result.available_inputs.length).to.equal(2);
	});
	var gene2 = [1, 1, 0, 0.25, 0, 1, 0.5, 0];
	var result2 = circuit.geneToModuleSpec(gene2);
	it("should be a filter", function(){
	    expect(result2.type).to.equal("filter");
	});
	it("should be a notch", function(){
	    expect(result2.sub_type).to.equal("notch");
	});
	it("should be 0 across the grid", function(){
	    expect(result2.x).to.equal(0);
	});
	it("should be 1/4 way down the grid ", function(){
	    expect(result2.y).to.equal(0.25);
	});
	it("should connect in range starting at 0 radians (North)", function(){
	    // t1 -> 0.5 goes to PI
	    expect(result2.theta1).to.equal(0);
	});
	it("should connect in range ending at PI * 2 radians (North)", function(){
	    expect(result2.theta2).to.equal(Math.PI * 2);
	});
	it("should have a connection radius of gridsize / 2", function(){
	    expect(result2.radius).to.equal(0.5);
	});
	it("should have 4 inports as it is a filter ", function(){
	    expect(result2.available_inputs.length).to.equal(4);
	});
	it("should have 2 different module ids ", function(){
	    expect(result2.module_id).to.not.equal(result.module_id);
	});
    })
    
    describe("random spec checker", function(){
	var gene, result;
	var g_spec = [];
	for (var i=0;i<10;i++){
	    gene = genome.generateRandom(8);
	    g_spec[i] = circuit.geneToModuleSpec(gene);
	}
	//console.log(g_spec);
	it("should have a string with a length", function(){
	    expect(g_spec[0].type.length).to.be.above(0);
	    expect(g_spec[1].type.length).to.be.above(0);
	    expect(g_spec[2].type.length).to.be.above(0);
	    expect(g_spec[3].type.length).to.be.above(0);
	    expect(g_spec[4].type.length).to.be.above(0);
	})
    })

    describe("genomeToModuleSpecs", function(){
	var gene_count = 5;
	var dna = genome.generateRandom(circuit.gene_length * gene_count);
	var g_spec = circuit.genomeToModuleSpecs(dna.dna);
	it("should have a string with a length", function(){
	    expect(g_spec[0].type.length).to.be.above(0);
	    expect(g_spec[1].type.length).to.be.above(0);
	    expect(g_spec[2].type.length).to.be.above(0);
	    expect(g_spec[3].type.length).to.be.above(0);
	    expect(g_spec[4].type.length).to.be.above(0);
	})

    })
    describe("calcDistance", function(){
	var dist = circuit.calcDistance(0, 0, 5, 10);
	it("should be root of (5^2 + 10^2)", function(){
	    expect(dist).to.equal(Math.sqrt(25 + 100));
	})
	var dist2 = circuit.calcDistance(0, 0, -5, -10);
	it("should be root of (5^2 + 10^2)", function(){
	    expect(dist).to.equal(Math.sqrt(25 + 100));
	})
    })
    describe("calcAngle", function(){
	// generate points in a circle around the 
	// x1, y1 and check they are all at 45 degress. 
	var angle = circuit.calcAngle(3, 1, 2, 2);
	it("should be 45 degrees or PI / 4", function(){
	    expect(angle.toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
	var angle2 = circuit.calcAngle(2, 2, 3, 1);
	it("should be 45 degrees or PI / 4", function(){
	    expect(angle.toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
	var froms, tos, angle3, angles;
	froms = [[3, 3]];
	tos = [[4, 2], [4,4], [2,4], [2,2]];
	angles = [0, 0, 0,0]
	for (var i=0;i<tos.length;i++){
	    angles[i] = circuit.calcAngle(froms[0][0], froms[0][1], tos[i][0], tos[i][1]); 
	}
	it("should be 45 degrees or PI / 4", function(){
	    expect(angles[0].toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
	it("should be 45 degrees or PI / 4", function(){
	    expect(angles[1].toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
	it("should be 45 degrees or PI / 4", function(){
	    expect(angles[2].toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
	it("should be 45 degrees or PI / 4", function(){
	    expect(angles[3].toPrecision(5)).to.equal((Math.PI / 4).toPrecision(5));
	})
    })
    describe("calcAngleFromNorth", function(){
	var froms, tos, angle3, deg45, angles, anglesFromNorth;
	froms = [[3, 3]];
	tos = [[4, 2], [4,4], [2,4], [2,2]];
	deg45 = Math.PI / 4;
	angles = [deg45, deg45 * 3, deg45 * 5, deg45 * 7]
	anglesFromNorth = [0, 0, 0, 0];
	for (var i=0;i<tos.length;i++){
	    anglesFromNorth[i] = circuit.calcAngleFromNorth(froms[0][0], froms[0][1], tos[i][0], tos[i][1]); 
	}
	it("should be 45, degrees", function(){
	    expect(anglesFromNorth[0].toPrecision(5)).to.equal(angles[0].toPrecision(5));
	})
	it("should be 135, degrees", function(){
	    expect(anglesFromNorth[1].toPrecision(5)).to.equal(angles[1].toPrecision(5));
	})
	it("should be 225, degrees", function(){
	    expect(anglesFromNorth[2].toPrecision(5)).to.equal(angles[2].toPrecision(5));
	})
	it("should be 315 degrees", function(){
	    expect(anglesFromNorth[3].toPrecision(5)).to.equal(angles[3].toPrecision(5));
	})
    })
    describe("isPointInArc", function(){
	// right in the arc
	it("in range, in arc should be true", function(){
	    //var result = circuit.isPointInArc(px, py, ax, ay, theta1, theta2, radius)
	    var result = circuit.isPointInArc(2, 2, 3, 3, Math.PI, Math.PI*2, 10);
	    expect(result).to.equal(true);
	})
	// out of range
	it("out of range, in arc should be false", function(){
	    var result = circuit.isPointInArc(2, 2, 3, 3, Math.PI, Math.PI*2, 0.5);
	    expect(result).to.equal(false);
	})
	// in range, not in the arc
	it("in range, not in arc should be false", function(){
	    var result = circuit.isPointInArc(4, 4, 3, 3, Math.PI, Math.PI*2, 10);
	    expect(result).to.equal(false);
	})
	// out of range, out of arc
	it("not in  range, not in arc should be false", function(){
	    var result = circuit.isPointInArc(4, 4, 3, 3, Math.PI, Math.PI*2, 0.5);
	    expect(result).to.equal(false);
	})
    })
    describe("moduleSpecToWireSpec", function(){
	// create a simple spec with three sin modules
	// one should connect to the other.
	var dna = [
	    0, 0, 0.8, 0.5, 0, Math.PI, 10, 0, 0, 0, // sin at 0.8,0.5, 0-PI arc radius 10, connect to first port. first module doesn't connect
	    0, 0, 0.75, 0.25, 0, Math.PI * 2, 10, 0, 0, 0, // sin at 0.75, 0.25 with 360 deg arc with large radius, connect to first module
	    1, 0, 0.25, 0.75, 0, Math.PI * 2, 10, 0, 0, 1, // filter that will connect to both the previous modules
	];
	// module 2 should connect to module 1
	//console.log(dna);
	var mod_specs = circuit.genomeToModuleSpecs(dna);
	var wire_specs = circuit.moduleSpecToWireSpec(mod_specs);
	// there whould be two modules and one wire since the second module connects to the first
	//console.log("got some modes...");
	//console.log(wire_specs);
	it("should have three modules", function(){
	    expect(mod_specs.length).to.equal(3);
	})
	it("should have 3 wires", function(){
	    expect(wire_specs.length).to.equal(3);
	})
	it("first wire connects to frequency input", function(){
	    expect(wire_specs[0].in_port_label).to.equal("frequency");
	})
	
	it("second wire connects to gain input", function(){
	    expect(wire_specs[1].in_port_label).to.equal("gain");
	})
    })
    describe ("genomeToModuleAndWireSpecs", function(){
	var dna = [
	    0, 0, 0.8, 0.5, 0, Math.PI, 10, 0, 0, 0, // sin at 0.8,0.5, 0-PI arc radius 10, connect to first port. first module doesn't connect
	    0, 0, 0.75, 0.25, 0, Math.PI * 2, 10, 0, 0, 0, // sin at 0.75, 0.25 with 360 deg arc with large radius, connect to first module
	    1, 0, 0.25, 0.75, 0, Math.PI * 2, 10, 0, 0, 1, // filter that will connect to both the previous modules
	];
	
	var full_spec = circuit.genomeToModuleAndWireSpecs({"dna":dna});
	// check for wires and modules keys
	it("proper genome should have wires", function(){
	    expect(full_spec.wires).to.not.equal(undefined);
	})
	it("proper genome should have modules", function(){
	    expect(full_spec.modules).to.not.equal(undefined);
	})
	// even empty dnam should produce an empty spec
	dna = [];
	full_spec = circuit.genomeToModuleAndWireSpecs({"dna":dna});
	it("empty genome should have wires", function(){
	    expect(full_spec.wires).to.not.equal(undefined);
	})
	it("empty genome should have modules", function(){
	    expect(full_spec.modules).to.not.equal(undefined);
	})
	
    })
})


