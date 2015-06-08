// TODO:
// * implement render post-processing which applies eat_render_target (makes rendered stuff siblings of render_id element then removes it)

/** We use the functional style defined in Douglas Crockford ch 5.4. 
 * note that the incoming spec object becomes private...
 */

var BlackSheepItem = function(_private){
    /** that stores all the public functions */
    var that = {};
    /** this is called by the top level app navigator. You should override this function in the top level app specifier to set app state as appropriate*/
    _private.onNavigate = _private.onNavigate || function(props){
	//console.log("BlackSheepItem onNavigate with api path "+_private.api_path+" and real path "+props.real_path);
    };
    /** helper functions for jsrender*/
    _private.jsRenderHelper = _private.jsRenderHelper || {};
    /** the id of the template to use*/
    _private.template_prefix = _private.template_prefix || "your_template_prefix_here";
    
    _private.save_key_values = _private.save_key_values|| false;
    /** the id of the template to use*/
    _private.template_id = _private.template_id || "template_element_id";
    /** the id of the element to render the template into */
    _private.render_id = _private.render_id || undefined;
    /** how to add the rendered elements to the DOM element: defaults
     * to replace, i.e. empty rebder_id and replace, append will add
     * it to the element as a child, after will add it as a sibling to
     * render_id*/
    _private.render_mode = _private.render_mode || "replace_contents";
    /** when updating this component in the dom (array additions),
     * default is to append at the end; you can override with
     * e.g. prepend to go at the start.*/
    _private.update_render_mode = _private.update_render_mode || "append";
    /** call jquery unwrap to remove render_id element from DOM after render? */
    _private.unwrap_render =  _private.unwrap_render || false;
    /** an array of className: event: pairs  used to bind events to classnames in a template.  */
    _private.events = _private.events || false;
    /** automatically check for updated data and re-render as appropriate?  */
    _private.auto_update = _private.auto_update || false;
    /** default to 4 second poll rate*/
    _private.poll_interval = _private.poll_interval || 4000;
    /** set this to true to allow this compoenent to be loaded  when a matching url is typed in*/
    _private.load_from_url = _private.load_from_url || false;
    /** fields to ignore when doing auto updates */
    _private_update_ignore = _private.update_ignore || undefined;
    /** this protected dom id will not be deleted by an update*/
    _private.protected_dom_id = _private.protected_dom_id || false;
    /** call this before loading the data from url */
    _private.beforeLoad = _private.beforeLoad || function(){
	//console.log('BlackSheepItem::beforeLoad url: '+_private.url);
    };
    /** call this after loading the data url If it returns true, and
     * the load is not an auto loaded triggered by the poller, a
     * render will automatically follow the load (since that's normally what you want)
     * If you want to block the render from happening, return false from this function
     */
    _private.afterLoad = _private.afterLoad || function(url, data){
	//console.log('BlackSheepItem::afterLoad');
	return true;
    };
    /** call this before rendering the template and inserting into DOM */
    _private.beforeRender = _private.beforeRender || function(props){
	return props.data;
	//console.log('BlackSheepItem::beforeRender');
    };
    /** call this after rendering the template and inserting into DOM */
    _private.afterRender = _private.afterRender || function(data){
	//console.log('BlackSheepItem::afterRender');
    };
    /** call this before saving updated data to 'url'/id */
    _private.beforeSave = _private.beforeSave || function(){
	//console.log('BlackSheepItem::default beforeSave');
    };
    /** call this after saving updated data to 'url'/id */
    _private.afterSave = _private.afterSave || function(url, data){
	//console.log('BlackSheepItem::afterSave');
    };
    /** call this before deleting  data to 'url'/id */
    _private.beforeDelete = _private.beforeDelete || function(){
	//console.log('BlackSheepItem::beforeDelete');
    };
    /** call this after deleting data to 'url'/id */
    _private.afterDelete = _private.afterDelete || function(url, data){
	//console.log('BlackSheepItem::afterSave');
    };
    /** this gets called in the render function (just before afterRender) if there are events to add*/
    _private.addEvents = function(render_id, update){
	if (_private.events != false){
	    var i, selector;
//	    var events = ["click", "mouseover", "mouseout"];
	    var events = ["click", "mouseover", "mouseout"];
	    // now add the log events if needed
	    
	    if (update!= undefined && update == false &&
		render_id != _private.render_id ){// they rendered to a custom render id, and it is not an update
		    selector = '#'+render_id;
	    }
	    else if (_private.render_id == undefined){
		//console.log("render id unknown - adding events to body");
		selector = "body";
	    }
	    else {
		selector = '#'+_private.render_id;
	    }
	    //console.log("adding events to "+selector);
	    //console.log(_private.events);
	    for (i=0;i<_private.events.length;i++){
		//console.log("event adder : looking in "+selector+" for "+_private.events[i].className);
		$(selector).find(_private.events[i].className).each(function(ind, obj){
		    // call the event action, passing it an id obtained from the 
		    // data-id attribute of the target element
		    var action = _private.events[i].action;//($(obj).data("id"))};
		    // clear all possible events from this element first
		    for (var j=0;j<events.length; j++){
			$(obj).unbind(events[j]);
		    }
		    if (_private.events[i].event != undefined){
			$(obj).on(_private.events[i].event, function(event){
			    action($(this).data("id"), event);});
		    }
		    else {
			$(obj).on("click", function(event){
			    action($(this).data("id"), event);});
		    }
		});
	    }
	    /// now the logging
	    if (_private.log_config != undefined && selector != "body"){// they want logging, we are being specific about DOM id..
		var loggables = $('.'+_private.log_config.log_class);
		$(selector).find("."+_private.log_config.log_class).each(function(ind, obj){
		    //console.log("Found a loggable to bind to in selector  "+selector);
		    // call the event action, passing it an id obtained from the 
		    // data-id attribute of the target element
		    var action = _private.log_config.log;
		    for (var j=0;j<events.length; j++){
			$(obj).on(events[j], function(event){
			    action(this, event);
			});
		    }
		});
	    }
	}
    };

    /** this is called prior to rendering. It remooves jquery events
     * on classes matching those in the events attribute. We do it
     * before the render since the render might remove things from the
     * DOM, making us uaable to access these dom elements. */
    _private.removeEvents = function(){
	if (_private.events != false){
	    var i, selector;
	    for (i=0;i<_private.events.length;i++){
		// try to be efficient and search in a sub branch
		if (_private.render_id == undefined){
		    selector = "body";
		}
		else {
		    selector = '#'+_private.render_id;
		}
		//console.log("event adder : looking in "+selector+" for "+_private.events[i].className);
		$(selector).find(_private.events[i].className).each(function(ind, obj){
		    $(obj).unbind( "click" );
		});
	    }
	}
    };

    /** this is called after the first call to load if
     * _private.auto_update is set upon in the init Object 
     * 
     * @param extra_props contains props such as cross domain config that should be passed to the load command.
     */
    _private.startPoller = function(extra_props){
	 //_private.poller = setInterval(function(){that.load({id:_private.id, called_by_poller:true})},2000);
	 _private.poller = setInterval(function(){
	     var props = {};
	     //console.log("poller comp "+_private.api_path+" polling on poller url "+_private.poll_url);
	     props.ids = that.extractIdsFromPath(_private.poll_url.replace(_private.server_url, ""));
	     props.called_by_poller = true;
	     props.crossDomain = extra_props.crossDomain;
	     props.xhrFields = extra_props.xhrFields;
	     props.async = extra_props.async;
	     //console.log(props);
	     that.load(props)
	 },_private.poll_interval);
     }
    /** reset the poller */
    _private.stopPoller = function(){
	_private.polling = false;
	clearInterval(_private.poller);	
    }
    
    /** call this to protect a dom id from deletion after an update */
    that.set_protected_dom_id = function(dom_id){
	_private.protected_dom_id = dom_id;
    }

     /** genreate a full url from the sent props array and _private.api_path*/
     that.insertIdsToAPIPath = function(ids){
	 var api_path = _private.api_path;
	 if (api_path == undefined){
	     return api_path;
	 }
	 // api_path will have 0 or more :id parts
	 // replace them with ids from the sent ids array
	 for (path_key in ids){
	     //console.log("replacing "+path_key);
	     api_path = api_path.replace(":"+path_key, ids[path_key]);
	 }
	 return api_path;
     }
     /** returns true if the sent path matches the api_path for this item e.g 
      * if api_path = media/:media_id/annotations/:annotation_id
      * and path = media/100/annotations/256, return true.
      */
     that.matchesPath = function(path){
	 if (_private.api_path != undefined && _private.load_from_url){
	     //console.log("path matching enabled... seeing if we match...");
	     var my_path = _private.api_path.replace(/:[a-z,_]*id/g, "*"), 
	     their_path = path.replace(/\/[a-z0-9]+/g, "/*");
	     //their_path = their_path.replace("/*", "");
	     //console.log("comparing "+their_path+" to "+my_path);
	     //console.log("matches? "+(my_path == their_path));
	     return my_path == their_path;
	 }
	 else {
	     return false;
	 }
     }
     /** return the id of the data item we are holding*/
     that.get_id = function(){
	 return _private.id;
     }
     that.get_data =  function(){
	 return _private.data;
     }

     that.get_save_key_values =  function(){
	 return _private.save_key_values;
     }

     that.get_api_path = function(){
	 return _private.api_path;
     }
     that.get_client_url = function(){
	 return _private.client_url;
     }
     that.set_client_url = function(url){
	 _private.client_url = url;
     }
     that.set_server_url = function(url){
	 _private.server_url = url;
	 _private.url = _private.server_url+_private.api_path;//
     }

     /** load an item from the BlackSheep. If props.ids.id is undefined, it
      * will load a list of items. Otherwise, props.ids.
      */
    that.load = function(props){
	_private.beforeLoad();
	if ( _private.api_path == undefined){// dummy component
	    _private.afterLoad();
	    _private.render({mode:_private.render_mode, render_id:props.render_id});
	    return;
	}
	//var url = _private.url;
	var path = that.insertIdsToAPIPath(props.ids);
	url = _private.server_url + path;
	_private.ids = props.ids;

	//	 //console.log("load: "+url);

	// make sure the poller knows the latest url
	_private.poll_url = url;
	// make the request	
	var ajax_props = {};
	if (props.data != undefined){
	    ajax_props.data = props.data;
	}
	if (props.crossDomain != undefined){
	    ajax_props.crossDomain = props.crossDomain;
	}
	if (props.xhrFields != undefined){
	    ajax_props.xhrFields = props.xhrFields;
	}
	if (props.async != undefined){
	    ajax_props.async = props.async;
	}
	ajax_props["url"] = url;
	ajax_props["type"] = "GET";
	ajax_props["success"]= function(data) {
	    var new_data = JSON.parse(data);
	    _private.assignBSIds(new_data, "");
	    //console.log("assigning bs ids");
	    //console.log(new_data);
	    // calculate ids in the data

	    var update_mode = false;
	    //console.log("Loaded data:");
	    //console.log(new_data);
	    // after the first load, we set up the poller if needed
	    if (_private.auto_update && !_private.polling){
		// _private.poll_url = url;
		_private.startPoller(props);
		_private.polling = true;
	    }
	    // is this a normal, user triggered  load or a load triggered by the auto poller
	    if (props.called_by_poller && _private.data != undefined){
		update_mode = true;
		// get the updated data spec from the template system
		//console.log("processing the updates:");
		//console.log(_private.update_ignore);
		if (_private.update_ignore == undefined){
		    _private.update_ignore = [];
		}
		var updates = BlackSheepTemplate({}).getUpdateDescription(_private.data, new_data, _private.template_prefix, _private.update_ignore);
		// print a message if there are any updates
		// for (var dom_id in updates){
		//     console.log("updates");
		//     console.log(updates);
		//     break;
		// }
		// now store the new data
		// note we need to do this after calculating the updates
		// as otherwise, we don't have the old data to compare the new data to !
		_private.data = new_data;
		//console.log(updates);
		for (var dom_id in updates){
		    var update = updates[dom_id];
		    //console.log("update dom id is "+dom_id);
		    //console.log("update! template is "+update.template_id+" rendering out to  "+dom_id);
		    //console.log(update.data);
		    //console.log(update);
		    // TODO ... check what type of render it is!
		    if (update.type=="rerender"){
			//console.log("re-rendering updated component into DOM id "+dom_id);
			_private.render({use_bs_id:true, render_id:dom_id, mode:"replace", template_id:update.template_id, data:update.data});
		    }else if (update.type=="append"){
			// the template layer always says append for new items
			// we can override that with this item's 'render_mode' flag
			//console.log("appending new component into DOM id "+update.parent_id);
			//_private.render({mode:"append", render_id:update.parent_id, template_id:update.template_id, data:update.data});
			var up_mode = "append";
			var use_bs_id = true;
			if (_private.update_render_mode){
			    up_mode = _private.update_render_mode;
			}
			if (update.parent_id == undefined){// we do not have a parent id to append to, so we'll use the main id for this component.
			    update.parent_id = _private.render_id;
			    // we need to use #id not data-bs_id
			    use_bs_id = false;
			}
			_private.render({use_bs_id:use_bs_id, mode:up_mode, render_id:update.parent_id, template_id:update.template_id, data:update.data});
			//_private.render({mode:"prepend", render_id:update.parent_id, template_id:update.template_id, data:update.data});
		    }else if (update.type=="delete" && 
			      dom_id != _private.protected_dom_id){// it is possible to protect dom ids from deletion ...
			    
			console.log("processing delete...");
			console.log(update);
			console.log(dom_id);
			//console.log("protected dom id "+_private.protected_dom_id);
			//console.log("deletion - parent id "+update.parent_id + " sub id "+dom_id);
			var target_sel = "[data-bs_id='"+dom_id+"']";
			var killme;
			if (update.parent_id != 0){
				// 
			    var parent_sel = "[data-bs_id='"+update.parent_id+"']";
			    //$('#'+update.parent_id).find('[id="'+dom_id+'"]').remove();
			    killme = $(parent_sel).find(target_sel);
			}
			else {
			    killme = $(target_sel);
			    //$('#'+dom_id).remove();
			}
			if (killme.length > 0){
			    $(killme).remove();
			}
			else {
			    console.log("Tried to find "+target_sel+" inside "+parent_sel+" but failed. Check your dom for data-bs_id='"+dom_id+"'");
			}
		    }
		}
	    }
	    else {// not an update... just store the data
	     	_private.data = new_data;
	    }
	    if (!_private.data instanceof Array){// we want all data to be an array
		_private.data = [_private.data];
	    }
	    var should_render = false;
	    if (props.afterLoad == undefined){
		should_render = _private.afterLoad(this.url, new_data);
	    }
	    else {
		should_render = props.afterLoad(this.url, new_data);
	    }
	    
	    if (!update_mode && should_render){
		_private.render({mode:_private.render_mode, update:false, render_id:props.render_id});
	    }
	};
	// do it!
	//console.log("load sending data");
	//console.log(ajax_props.data);
	$.ajax(ajax_props);
    }
    
    /** 
     * render the item to the template as _privateified in _private.template_id and push output into render_id
     */
    _private.render = function(props){
	var template, htmlOutput;
	//console.log("rendering to "+props.render_id);
	//console.log(props);
	props = props || {};
	//console.log("render");
	//console.log(props);
	//console.log(_private);
	props.render_id = props.render_id || _private.render_id;
	// store the render id for later (e.g. when we add events and search inside this render id)
	//_private.render_id = props.render_id;
	props.data = props.data || _private.data;
	props.template_id = props.template_id || _private.template_id;
	//console.log("rendering "+props.template_id);
	var processed_data = _private.beforeRender({data:props.data, mode:props.mode, render_id:props.render_id}); 
	if (processed_data != undefined){// the user implemented a data pre-processing function
	    //props.data = processed_data;
	}
	//console.log("Rendering template "+props.template_id+" to "+props.render_id);
	template = $.templates("#"+props.template_id);
	if (template == undefined){
	    //console.log("Warning - looking for template "+props.template_id+" but it does not exist. cancelling render.");
	    return;
	}
 	// remove events
	if (_private.events != undefined){
	    _private.removeEvents();
	}

	// note that we render the processed data not the raw data
	htmlOutput = template.render(processed_data, _private.jsRenderHelper);
	
	// choose the target
	var dom_target = undefined;
	if (props.use_bs_id != undefined &&
	    props.use_bs_id){// find the dom element using data-bs_id

	    var target_sel = "[data-bs_id='"+props.render_id+"']";
	    
	    dom_target = $(target_sel);
//	    console.log("rendering to  selector: $("+target_sel+")");

	    if (dom_target.length ==0){
		console.log("blacksheep warning... could not locate target for update rendering in dom. Printing render properties...");
		console.log("... check what your dom returns from this selector: "+target_sel);
		console.log(props);
	    }
	}
	else {// find the dom element using id
	    dom_target = $("#"+props.render_id);
	}

	
	//console.log(htmlOutput);
	//console.log(props);
	//... check if render_id exists. If not, 
	// append it to our top level dom id
	if (dom_target.length == 0){// we don't have this dom id yet
	    props.render_id = _private.render_id;
	    dom_target = $("#"+_private.render_id);

	}
	if (props.mode == "replace"){
	    //console.log("replacing contents for  "+_private.api_path);
	    //console.log("replacing contents of dom target   "+props.render_id);
	    $(dom_target).replaceWith(htmlOutput);
	}else if (props.mode == "replace_contents"){
	    $(dom_target).html(htmlOutput);
	}else if (props.mode == "append"){
	    $(dom_target).append(htmlOutput);
	}else if (props.mode == "prepend"){
	    $(dom_target).prepend(htmlOutput);
	}else if (props.mode == "after"){
	    $(dom_target).after(htmlOutput);
	}
	if (_private.events != undefined){
	    _private.addEvents(props.render_id, props.update);
	}
	// now add the special classes to the elements in the template so we can find them again later
	//console.log("rendered data ");
	//console.log(processed_data);
	_private.afterRender(processed_data);
	//_private.afterRender(props.data);
    };
    /** remove this module from the DOM and stop reloading */
    that.remove = function(){
	_private.stopPoller();
	_private.data = undefined;
//	//console.log("Setting contents of "+_private.render_id+"  to empty for "+_private.api_path+" mode "+_private.render_mode);
	$("#"+_private.render_id).html("");
    }
    /** save this item to the server. If we do not have an id yet, use
     * POST to create a new item @param props.data is the raw data for
     * the item to save, @param props.ids is an array of ids that if
     * set are used to configure the path (e.g. /:xyz_od/ is replaced
     * with ids["xyz_id"] @param props.afterSave is a function to call
     * afterSave, instead of calling the one set at construction
     * @param force_post forces a POST (create) instead of PUT (edit),
     * e.g. if you are posting a pre-existing item into another area
     * of your data (e.g. sharing something to a community)
     */
    that.save = function(props){
	_private.beforeSave();
	var data = props.data || _private.data;
	var path = that.insertIdsToAPIPath(props.ids);
	var url = _private.server_url + path;
	//console.log("Saving to "+url);
//	console.log(props);
	//console.log(data);
	//console.log(data);
	var ajax_props = {};
	if (props.crossDomain != undefined){
	    ajax_props.crossDomain = props.crossDomain;
	}
	if (props.xhrFields != undefined){
	    ajax_props.xhrFields = props.xhrFields;
	}
	if (props.async != undefined){
	    ajax_props.async = props.async;
	}
	ajax_props["url"] = url;
	ajax_props["success"]= function(result) {
	    // Do something with the result
	    if (props.afterSave == undefined){
		_private.afterSave(url, JSON.parse(result));
	    }
	    else {
		props.afterSave(url, JSON.parse(result));
	    }
	};
	if (_private.save_key_values){// we should save by posting key value pairs instead of raw JSON
	    ajax_props["data"] = data;
	}
	else {
	    ajax_props["data"] =  JSON.stringify(data);
	    ajax_props["processData"] = true;
	    ajax_props["contentType"] = "application/json";
	}
	if (data.id == undefined || props.force_post){// POST for a new item
	    ajax_props["type"] = "POST";
	}
	else {// PUT for a pre-existing item
	    ajax_props["type"] = "PUT";
	    ajax_props["url"] += "/"+data.id;
	}
	//console.log("saving with method "+ajax_props.type);
	//console.log("saving with url  "+ajax_props.url);
	//console.log("saving data  "+ajax_props.data);
	$.ajax(ajax_props);
    };
    /** delete this item on the server if it has an id*/
    that.delete = function(props){
	_private.beforeDelete();
	// first need to insert the sent set of ids into the delete url
	var path = that.insertIdsToAPIPath(props.ids);
	var url = _private.server_url + path;
	_private.ids = props.ids;
	// it is a post i.e. update
//	//console.log("deleting on url "+url);
	var ajax_props = {};
	if (props.crossDomain != undefined){
	    ajax_props.crossDomain = props.crossDomain;
	}
	if (props.xhrFields != undefined){
	    ajax_props.xhrFields = props.xhrFields;
	}
	if (props.async != undefined){
	    ajax_props.async = props.async;
	}
	ajax_props["url"] = url;
	ajax_props["type"] = "DELETE";
	ajax_props["success"]= function(result) {
	    if (props.afterDelete != undefined){// call the cusomt afterDelete
		props.afterDelete(ajax_props["url"], JSON.parse(result));
	    }
	    else {
		_private.afterDelete(ajax_props["url"], JSON.parse(result));
	    }
	};
	// do it!
	$.ajax(ajax_props);
    };
    /** kill off this object (e.g. kill pollers, etc.)*/
    that.deactivate = function(){
    }
    /** setup the logging config */
    that.set_log_config = function(config){
	_private.log_config = config;
    }
    /** uses the internal api_path and the sent path to generate a list of 
     * key value pairs, e.g. /media/123 is sent, api_path = /media/:id
     * then {id:123} is returned.
     */
    that.extractIdsFromPath = function(path){
	var parts = path.split("/");
	var ids = [];
	// extraat ids from the sent path, assuming alternating names/ids
	for (var i=1; i<parts.length;i+=2){
	    ids.push(parts[i]);
	}
	// extract id names from our api_path
	parts = _private.api_path.split("/");
	var id_keys = [];
	for (var i=1; i<parts.length;i+=2){
	    id_keys.push(parts[i].replace(":", ""));
	}
	// convert the ids and id names into key value pairs
	var id_kv = {};
	for (var i=0; i<id_keys.length;i++){
	    id_kv[id_keys[i]] = ids[i];
	}	
	return id_kv;
    }
    /** this is called by load. It recursively parses the data and assigns unique bs ids to all objects*/
    _private.assignBSIds = function(data, parent_hash){
	if (data instanceof Array){
	    for (var i=0;i<data.length;i++){
		// jsut recall it 
		_private.assignBSIds(data[i], parent_hash);
	    }
	}
	else if (data instanceof Object){
	    // first off, calculate a new hash for this object using parent_hash and the object's fields
	    var obj_str = JSON.stringify(data);
	    var bs_id = _private.hashString(parent_hash + obj_str);
	    data.bs_id = bs_id;
	    // now iterate the fields of the object
	     for (var key in data){
		_private.assignBSIds(data[key], bs_id);
	    }
	}
    }
    /** utility function to create a hash from a string 
     * http://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript-jquery
     */
    _private.hashString = function(str){
	var hash = 0, i, chr, len;
	if (str.length == 0) return hash;
	for (i = 0, len = str.length; i < len; i++) {
	    chr   = str.charCodeAt(i);
	    hash  = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	}
	return hash;
	//hash = "" + hash;
	// // convert into alpahnumeric
	// var str = "";
	// for (var i=0;i<hash.length;i++){
	//     if (hash.charAt(i) == '-'){
	// 	str += "Z";
	//     }
	//     else {
	// 	str +=  String.fromCharCode(97 + parseInt(hash.charAt(i)));
	//     }
	// }
	// return str;
    }
    
    return that;
}
