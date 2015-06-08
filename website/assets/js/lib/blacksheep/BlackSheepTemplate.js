/** helper functions for templates*/
var BlackSheepTemplate = function(_private){
    var that = {};
    /** returns some HTML which if rendered will describe which template ids are reqired to plot the sent
     * data and what their hierarchical relationship is 
     */
    that.getTemaplateDescription = function(example_data, path){
	var names = {};
	// get names as an object tree
	_private.getTemplateNames(example_data, path, names);
	// convert to html
	var html = [];
	_private.templateNamesToHTML(names, html);
	var htmlStr = "";
	for (var i=0;i<html.length;i++){
	    htmlStr += html[i];
	}
	//$('body').html(htmlStr);
	return htmlStr;

    }
    /** returns an array of objects describing which ids in the DOM
     * need to be updated given the differences detected between old_data and new_data
     * . Also specifies  which templates should be used to update
     * them, and what type of update is required (append, re-render, delete)*/
    that.getUpdateDescription = function(old_data, new_data, path,ignore_fields){
	var updates  = {};
	_private.getUpdateDescription(old_data, new_data, path, path, updates, undefined, ignore_fields);
	//console.log(updates);
	return updates;
    }
    _private.templateNamesToHTML = function(names, html){
	html.push("<ul>");
	for (var key in names){
	    html.push("<li>"+key+"</li>");
	    _private.templateNamesToHTML(names[key], html);
	}
	html.push("</ul>");
    }

    _private.getTemplateNames = function(data, path, names){
        if (data instanceof Array){
	    path += "_A";
	    var template_id = path + "_template";
	    names[template_id] = {};
	    //var t_id = path+"_Array_template";
	    for (var i=0;i<data.length;i++){
		_private.getTemplateNames(data[i], path + "_E", names[template_id]);
	    }
	}
	else if (data instanceof Object){
	    var template_id = path + "_template";
	    // add a template for this object
	    names[template_id] = {}
	    // recurse into fields of this object
	    for (var key in data){
		_private.getTemplateNames(data[key], path + "_" + key, names[template_id]);
	    }
	}
    }

    _private.templateNamesToHTML = function(names, html){
	html.push("<ul>");
	for (var key in names){
	    html.push("<li>"+key+"</li>");
	    _private.templateNamesToHTML(names[key], html);
	}
	html.push("</ul>");
    }
    
    _private.getUpdateDescription = function(old_data, new_data, template_path, dom_path, updates, parent_object, ignore_fields, parent_key){
	if (ignore_fields == undefined){
	    ignore_fields = {};
	}
	// process array types: look for insertions, deletions, re-renders
	if (old_data instanceof Array){// note that things in arrays must always have ids
	    var t_id = template_path+"_A";
	    //var el_id = dom_path+"_A";    
	    var parent_id = 0;
	    
	    if (parent_object != undefined && parent_object instanceof Object){
		//el_id += "_"+parent_object.id;
		//parent_id = el_id + "_" +  parent_object.id;
		parent_id = parent_object.bs_id + "_" + parent_key;
	    }
	    
	    // the arrays either contain lowest level objects (things with ids)
	    // or objects without ids (more difficult!)
	    // look for missing things in old data
	    for (var i=0;i<old_data.length; i++){
		var found = false;
		if (new_data != undefined){// not an empty array..
		    for (var j=0;j<new_data.length; j++){
			if (old_data[i].id == new_data[j].id){
			    found = true;
			}
		    }
		}
		if (!found){// something was missing from old_data
		    //console.log("array deletion");
		    // just trigger a delete of element containing this element of the array
		    updates[""+old_data[i].bs_id] = {template_id: t_id + "_template", type:"delete", parent_id:parent_id};
		    //console.log(el_id);
		    //console.log(updates);
		    //updates[el_id] = t_id;
		    //break;
		}
	    }
	    // look for missing things in new_data (additions)
	    if (new_data != undefined){
	    for (var i=0;i<new_data.length; i++){
		// check if we can do anything with these object, id wise
		var found = false;
		var match = undefined;
		for (var j=0;j<old_data.length; j++){
		    //console.log("comparing "+old_data[j].id + " to "+new_data[i].id);
		    if (old_data[j].id == new_data[i].id){
			found = true;
			match = old_data[j];
			new_data[i].bs_id = old_data[j].bs_id;
		    }
		}
		if (!found){// something is in new_data but not old data... insert!
		    //console.log("array addition: id "+new_data[i].id);
		    // actually, we tell it to append to the parent 
		    // template name will be
		    // el_id + "_E_template";
		    // the div to add it to will be 
		    // e_id
		    // so when we process this, we
		    var par_id = 0;
		    if (parent_object != undefined && parent_object instanceof Object){
			//el_id += "_"+parent_object.id;
			//console.log(" something not found ..."+el_id);
			par_id = parent_object.bs_id + "_"+parent_key;
		    }
		    else {
			par_id = undefined;
		    }
		    //console.log("Append detected... parent object ");
		    //console.log(parent_object);
		    updates[""+new_data[i].bs_id] = 
			{template_id: t_id + "_E_template", 
			 type:"append", 
			 data:new_data[i], 
			 parent_id:par_id};
		}
		else {// new_data and old data contain this element
		    // process this element 
		    _private.getUpdateDescription(match, new_data[i], template_path+"_A_E", "", updates, old_data, ignore_fields);
		}
	    }// end code that looks for additions and deletions in arrays of objects with ids
	    }// end if new_data is not undefined
	}// end instanceof Array code
	else if (old_data instanceof Object){// its an object, iterate and recurse array fields
	    // comapare the objects and recurse if needed
	    for (var key in old_data){
		// check if we need to dig in
		if (old_data[key] instanceof Array && ignore_fields[key] == undefined){
		   // _private.getUpdateDescription(old_data[key], new_data[key], path + "_A_"+key, updates);
		    _private.getUpdateDescription(old_data[key], new_data[key], template_path + "_"+key, "", updates, old_data, ignore_fields, key);// last arg -> parent
		}else if (old_data[key] instanceof Object && 
			 ignore_fields[key] == undefined
			 ){
		    _private.getUpdateDescription(old_data[key], new_data[key], template_path + "_"+key, "", updates, old_data, ignore_fields, key);// last arg -> parent
		}else {
		    // this field is a non array, non object field. 
		    // check if new_data has the value value for the field
//		    if (old_data[key] != new_data[key]){
		    if (key != "bs_id" && 
			old_data[key] != undefined &&
			new_data[key] != undefined && 
			new_data.id == old_data.id &&
			ignore_fields[key] == undefined &&
		        old_data[key] != new_data[key]){// they both have this key, but it has changed!
		    
			    updates[""+new_data.bs_id] = {
				template_id: template_path + "_template", 
				type:"rerender", 
				data:new_data, 
				parent_id:parent_object.bs_id};

		    }
		}
	    }
	}
    }

    _private.getUpdateDescriptionFRESH = function(old_data, new_data, template_path, dom_path, updates, parent_object, ignore_fields){
	// reimplementation 
	
	
    }

//////////// OLD VERSION with old ids
    _private.getUpdateDescriptionOLD = function(old_data, new_data, template_path, dom_path, updates, parent_object, ignore_fields){
	if (ignore_fields == undefined){
	    ignore_fields = {};
	}
	// process array types: look for insertions, deletions, re-renders
	if (old_data instanceof Array){// note that things in arrays must always have ids
	    var t_id = template_path+"_A";
	    var el_id = dom_path+"_A";    
	    var parent_id = 0;
	    
	    if (parent_object != undefined && parent_object instanceof Object){
		//el_id += "_"+parent_object.id;
		parent_id = el_id + "_" +  parent_object.id;
	    }
	    
	    // the arrays either contain lowest level objects (things with ids)
	    // or objects without ids (more difficult!)
	    // look for missing things in old data
	    for (var i=0;i<old_data.length; i++){
		var found = false;
		if (new_data != undefined){// not an empty array..
		    for (var j=0;j<new_data.length; j++){
			if (old_data[i].id == new_data[j].id){
			    found = true;
			}
		    }
		}
		if (!found){// something was missing from old_data

		    //console.log("array deletion");
		    // just trigger a delete of element containing this element of the array
		    updates[el_id + "_E_" + old_data[i].id] = {template_id: t_id + "_template", type:"delete", parent_id:parent_id};
		    //console.log(el_id);
		    //console.log(updates);
		    //updates[el_id] = t_id;
		    //break;
		}
	    }
	    // look for missing things in new_data (additions)
	    if (new_data != undefined){
	    for (var i=0;i<new_data.length; i++){
		// check if we can do anything with these object, id wise
		var found = false;
		var match = undefined;
		for (var j=0;j<old_data.length; j++){
		    //console.log("comparing "+old_data[j].id + " to "+new_data[i].id);
		    if (old_data[j].id == new_data[i].id){
			found = true;
			match = old_data[j];
		    }
		}
		if (!found){// something is in new_data but not old data... insert!
		    //console.log("array addition: id "+new_data[i].id);
		    // actually, we tell it to append to the parent 
		    // template name will be
		    // el_id + "_E_template";
		    // the div to add it to will be 
		    // e_id
		    // so when we process this, we

		    if (parent_object != undefined && parent_object instanceof Object){
			el_id += "_"+parent_object.id;
			console.log(" something not found ..."+el_id);
		    }
		    updates[el_id + "_E_" + new_data[i].id] = {template_id: t_id + "_E_template", type:"append", data:new_data[i], parent_id:el_id};
		}
		else {// new_data and old data contain this element
		    // process this element 
		    _private.getUpdateDescription(match, new_data[i], template_path+"_A_E", dom_path+"_A_E", updates, old_data, ignore_fields);
		}
	    }// end code that looks for additions and deletions in arrays of objects with ids
	    }// end if new_data is not undefined
	}// end instanceof Array code
	else if (old_data instanceof Object){// its an object, iterate and recurse array fields
	    // comapare the objects and recurse if needed
	    for (var key in old_data){
		// check if we need to dig in
		if (old_data[key] instanceof Array){
		   // _private.getUpdateDescription(old_data[key], new_data[key], path + "_A_"+key, updates);
		    _private.getUpdateDescription(old_data[key], new_data[key], template_path + "_"+key, dom_path + "_"+key, updates, old_data, ignore_fields);// last arg -> parent
		}else if (old_data[key] instanceof Object && 
			 ignore_fields[key] == undefined
			 ){
		    _private.getUpdateDescription(old_data[key], new_data[key], template_path + "_"+key, dom_path + "_"+key, updates, old_data, ignore_fields);// last arg -> parent
		}else {
		    // this field is a non array, non object field. 
		    // check if new_data has the value value for the field
//		    if (old_data[key] != new_data[key]){
		    if (key != "bs_id" && 
			old_data[key] != undefined &&
			new_data[key] != undefined && 
			new_data.id == old_data.id &&
			ignore_fields[key] == undefined &&
		        old_data[key] != new_data[key]){// they both have this key, but it has changed!
			    //console.log("rerender "+new_data.id +" new, old "+old_data.id+" changed key is "+key);
			    updates[dom_path + "_" +  new_data.id] = {
				template_id: template_path + "_template", 
				type:"rerender", 
				data:new_data, 
				parent_id:dom_path};

		    }
		}
	    }
	}
    }

    /** */
    return that;
};
