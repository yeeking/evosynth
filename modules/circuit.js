/**
 * functions for generating circuits specifications
 */
module.exports = {
  /** used to generate unique module indexes in conjunction with getModuleId */
  //gene_length: 8,
  gene_length: 10,
  /** top level genome parsing function which converts a genome into a set of modules and wires*/
  genomeToModuleAndWireSpecs: function(genome) {
    var mod_specs = this.genomeToModuleSpecs(genome.dna);
    var wire_specs = this.moduleSpecToWireSpec(mod_specs);
    return {
      "modules": mod_specs,
      "wires": wire_specs,
      "genome": genome
    };
  },

  /** converts a single gene into a module spec, describing the properties of the module encoded by that gene*/
  geneToModuleSpec: function(gene) {
    var type, sub, x, y, t1, t2, r, start_p1, start_p2, connect_to_input, available_inputs;
    type = this.parseHelpers.getModuleType(gene[0]);
    sub = this.parseHelpers.getModuleSubType(gene[1], type);
    x = gene[2]; //this.parseHelpers.normalise(gene[2], 0, 1, 0, grid_size);
    y = gene[3]; //this.parseHelpers.normalise(gene[3], 0, 1, 0, grid_size);
    t1 = this.parseHelpers.getTheta(gene[4]);
    t2 = this.parseHelpers.getTheta(gene[5]);
    r = gene[6]; //* 2; //this.parseHelpers.normalise(gene[6], 0, 1, 0, grid_size);
    start_p1 = gene[7]; // allows the module to be configured with a starter settings, e.g. starting freq
    start_p2 = gene[8]; // another starter settings

    // in port, the port this mod will connnect to on other modules  is normalised at genome intepretation time
    // as it depends upon the number of ports available on that module.
    connect_to_input = gene[9];
    // this is the number of ports this module has
    available_inputs = this.parseHelpers.getModuleInputNames(type, sub);
    var spec = {
      "module_id": this.parseHelpers.getModuleId(),
      "type": type,
      "sub_type": sub,
      "x": x,
      "y": y,
      "theta1": t1,
      "theta2": t2,
      "radius": r,
      "connect_to_input": connect_to_input,
      "start_parameter_1": start_p1,
      "start_parameter_2": start_p2,
      "available_inputs": available_inputs
    }
    return spec;
  },



  /** converts an array of module specs as retrieved from
   * this.genomeToModuleSpecs into an array of wire specs describing
   * of a set of wires connecting them based on the connection
   * radii*/
  moduleSpecToWireSpec: function(specs) {
    var wires = [];
    for (var i = 0; i < specs.length; i++) {
      // check from module i-1 to module 0 to see if module[i] should connect
      var new_mod = specs[i];
      for (j = i - 1; j >= 0; j--) {
        var old_mod = specs[j];
        //if (this.isPointInArc(px, py, ax, ay, theta1, theta2, radius){
        if (this.isPointInArc(old_mod.x, old_mod.y,
            new_mod.x, new_mod.y, new_mod.theta1, new_mod.theta2, new_mod.radius)) {
          var in_port = Math.round(this.parseHelpers.normalise(new_mod.connect_to_input, 0, 1, 0,
            old_mod.available_inputs.length - 1));
          in_port = old_mod.available_inputs[in_port];
          wires.push({
            "x1": new_mod.x,
            "y1": new_mod.y,
            "x2": old_mod.x,
            "y2": old_mod.y,
            "out_mod_id": new_mod.module_id,
            "in_mod_id": old_mod.module_id,
            "in_port_label": in_port
          });
        }
      }
    }
    return wires;
  },
  /** tests if point x1, y2 is in the arc centred at x2, y2, with
   * range theta1 to theta2 radians with sent radius*/
  isPointInArc: function(px, py, ax, ay, theta1, theta2, radius) {
    // 1. convert theta1 and theta2 to highest and lowest angles.
    var t1, t2;
    if (theta1 > theta2) {
      t1 = theta2;
      t2 = theta1
    } else t1 = theta1;
    t2 = theta2;
    // two tests:
    // 2. is distance from x1,y1 to x2,y2 < radius
    var dist = this.calcDistance(px, py, ax, ay);
    //console.log("distance "+dist+" radius "+radius);
    if (dist > radius) {
      return false;
    }
    // 3. angle from north at x2, y2 -> x1,y1 is > theta1 and < theta2
    var angle = this.calcAngleFromNorth(ax, ay, px, py);
    //console.log("angle "+angle+" between? "+t1+" and "+t2);
    if (angle > t1 && angle < t2) {
      return true;
    }
    return false;
  },
  /** calcualte the angle from north at x1,y1 to x2,y2 */
  calcAngleFromNorth: function(x1, y1, x2, y2) {
    var angle = this.calcAngle(x1, y1, x2, y2);
    var add;
    // now work out what to add to the angle so it is taken from north
    // by identifying which quadrant x2, y2 is in relative to
    // x1, y1
    // NE
    if (x2 >= x1 && y2 <= y1) {
      add = 0;
    }
    // SE -> add 90 degrees or PI / 2 radians
    if (x2 >= x1 && y2 > y1) {
      add = Math.PI / 2;
    }
    // SW -> add 180 degress or PI radians
    if (x2 < x1 && y2 > y1) {
      add = Math.PI;
    }
    // NW -> add 270 degrees or PI / 4 * 3 radians
    if (x2 < x1 && y2 <= y1) {
      add = (Math.PI / 2) * 3;
    }
    return angle + add;
  },

  /** calculate the angle between two points*/
  calcAngle: function(x1, y1, x2, y2) {
    // treat x2, y2 as the origin
    var a, b, c, sin_theta;
    a = Math.abs(y2 - y1);
    b = Math.abs(x2 - x1);
    //console.log("a is "+a);
    //console.log("b is "+b);

    c = Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2));
    sin_theta = a / c;
    //console.log("sin theta is "+sin_theta);
    // now convert from sin_theta to theta
    //console.log(Math.asin(sin_theta));
    angle = Math.asin(sin_theta);
    return angle;
  },
  /** calculate the distance between two points */
  calcDistance: function(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
  },

  /** converts a complete genome into an array of module specs*/
  genomeToModuleSpecs: function(genome) {
    var gene_count = genome.length / this.gene_length;
    var specs = [];
    for (var ind = 0; ind < gene_count; ind++) {
      var s, e;
      s = ind * this.gene_length;
      e = s + this.gene_length;
      // maybe we'll use this:
      // http://jsperf.com/new-array-vs-splice-vs-slice/31
      // to speed it up but this is cleaner for now.
      gene = genome.slice(s, e);
      specs[ind] = this.geneToModuleSpec(gene);
    }
    return specs;
  },
  parseHelpers: {
    module_id: 1,
    getModuleId: function() {
      this.module_id++;
      return this.module_id;
    },
    /** top level module types*/
    getModuleType: function(val) {
      if (val < 0.65) {
        return "oscillator";
      } else {
        return "filter";
      }
    },
    /** types within a module type*/
    getModuleSubType: function(val, module_type) {
      var osc_types = ["sine", "square", "sawtooth", "triangle"];
      var filter_types = ["lowpass", "highpass", "bandpass", "lowshelf", "highshelf", "allpass", "notch"];
      if (module_type == "oscillator") {
        var sub_types = osc_types;
      }
      if (module_type == "filter") {
        var sub_types = filter_types;
      }
      //console.log(val);
      val = Math.round(val * (sub_types.length - 1));
      //console.log(val);
      return sub_types[val];
    },
    /** inputs for different moduies + sub types. Need cases for all things*/
    getModuleInputNames: function(type, sub_type) {
      if (type == "oscillator") {
        // freq ana amp
        return ["frequency", "gain"];
      }
      if (type == "filter") {
        // filter input, freq, Q, gain
        return ["filter_in", "frequency", "q", "gain"];
      }
    },
    /** connection radii*/
    getTheta: function(val) {
      return this.normalise(val, 0, 1, 0, Math.PI * 2);
    },
    /** utility function*/
    normalise: function(val1, min1, max1, min2, max2) {
      // normalise to 0-1
      val1 = val1 - min1;
      range1 = max1 - min1;
      val1 /= range1;
      // scale to the new range
      range2 = max2 - min2;
      val1 = val1 * range2;
      // putin the offset
      val1 += min2;
      return val1
    }
  },


}
