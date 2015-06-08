
/** your web app will 'extend' from this. e.g.:
 * var MyApp = function(_private){
 *     var that = BlackSheepApp(_private);
 * }
 */
var BlackSheepApp = function(_private){
    that = {};
    if (_private.allow_history_load == undefined){
	_private.allow_history_load =true;
    }
    /** generates a stripped down version of the specified app, suitable for unit testing */
    that.getUnitTestObject = function(){
    	var props = {components:{}};
		for (var comp_name in  _private.components){
			props.components[comp_name] = BlackSheepItem({
			api_path:_private.components[comp_name].get_api_path(), 
			save_key_values:_private.components[comp_name].get_save_key_values()
		    });
	    
		}
		props.server_url = _private.server_url;
		props.client_url = _private.server_url;
			var UTObj = function(_myprivate){
			_myprivate.allow_history_load = false;
			var that = BlackSheepApp(_myprivate);
			return that;
		}
		var obj = UTObj(props);
		return obj;
    }
    /** stops the system from calculating the correct page state when it loads*/
    that.disable_history_load = function(){
	_private.allow_history_load = false;
    }
    /** makes the system  calculate the correct page state when it loads (default behaviour)*/
    that.enable_history_load = function(){
	_private.allow_history_load = true;
    }
    
    /** return the id for one of the known compoenents if known   */
    that.get_id = function(props){
	return _private.components[props.component].get_id();
    }
    /** returns the url of the API server*/
    that.get_server_url = function(){
	return _private.server_url;
    }
    that.get_file_server_url=function(){
        return _private.file_server_url;
    }
    /** trigger a load action on one of the known components. */
    that.load = function(props){
	props.ids = props.ids || {};
	// props -= component, id;
	//console.log(_private);
	//console.log("Loading component "+props.component);
	_private.components[props.component].load({ids:{id:props.ids.id}, data:props.data, render_id:props.render_id, afterLoad:props.afterLoad,
			//crossDomain: props.crossDomain, xhrFields: props.xhrFields, async: props.async
			crossDomain: true, xhrFields: {withCredentials: true}, async: true
			});
    };
    /** trigger a save action on one of th4e known components*/
    that.save = function(props){
	_private.components[props.component].save({data:props.data, ids:props.ids, afterSave:props.afterSave, force_post:props.force_post, 
		//crossDomain: props.crossDomain, xhrFields: props.xhrFields, async: props.async
		crossDomain: true, xhrFields: {withCredentials: true}, async: true
	});
    }
    /** trigger a delete action on one of th4e known components*/
    that.delete = function(props){
	_private.components[props.component].delete({ids:props.ids, afterDelete:props.afterDelete, 
		//crossDomain: props.crossDomain, xhrFields: props.xhrFields, async: props.async
		crossDomain: true, xhrFields: {withCredentials: true}, async: true
		});
    }
    /** remove a rendered component from the DOM */
    that.remove = function(props){
	_private.components[props.component].remove();
    }
    
    /** clears all components from the DOm by emptying their divs*/
    that.clearAllFromDOM = function(){

	for (var comp_name in _private.components){
	    _private.components[comp_name].remove();
	}
    }

//    that.render = function(component){
//    	_private.components[component].render();
//    };
    /** generate a template desctiption for one of the known
     * components, using the sent example data (which should contain
     * all fields). If put_output_here is set, pace an HTML description of
     * the required parts for the template into this div
     */
    that.getTemplateSpec = function(component, put_output_here, data){
	if (data == undefined){
	    _private.components[component].load({data_callback: function(data){
		//console.log("Data from callback ");
		//console.log(data);
		var html = BlackSheepTemplate({}).getTemaplateDescription(JSON.parse(data), component);
		$('#'+put_output_here).html(html);
	    }});
	}
	else {
	    var html = BlackSheepTemplate({}).getTemaplateDescription(data, component);
	    $('#'+put_output_here).html(html);
	}
    }
    /** call this function to store an url in the history and to update the browser address bar*/
    that.updateAddressBarAndStore = function(props){
	var comp = _private.components[props.component];
	var path = comp.insertIdsToAPIPath(props.ids);
	var url = comp.get_client_url() +"?"+ path;
	// make sure we ignore the next statechange event, as this event will be triggered
	// by us adding to the history.
	that.ignore_next_statechange = true;
	History.pushState(null,url, url);
    }
    /** this is called when the page is loaded for the first time or when they click back or forward
     * It finds the component that matches the path and calls load on it.
     */
    _private.gotoURL = function(url){
	// find the matching component for this path and load it
	var path = url.replace(_private.client_url+"?", "");
	
	for (var comp_key in _private.components){
	    var comp = _private.components[comp_key];
	    if (comp.matchesPath(path)){
		// extract the ids from the url
		ids = comp.extractIdsFromPath(path);
		//console.log("loading comp "+comp_key);
		//console.log(ids);
		comp.load({ids:ids});
		break;
	    }
	}
    }
    /** setup the log config */
    if (_private.log_config != undefined){
	if (_private.log_config.data == undefined){
	    _private.log_config.data = [];
	}
	_private.log_config.log = function(target, event){
	    var now = Date.now();
//	    now = now.substring();
	    if (_private.log_config.data[now] == undefined){

		var logme = {
		    user_id: _private.components["user"].get_data().id, 
		    time:now, 
		    type:event.type, 
		    id:$(target).data("id"), 
		    logtype:$(target).data("logtype"), 
		};
		//_private.log_config.data[now] = logme;
		_private.log_config.data.push(logme);
		if (_private.log_config.save_now(_private.log_config.data)){
		    //console.log("save comp:"+_private.log_config.log_component);
		    //console.log(_private.log_config.data);

		    // reset
		    _private.components[_private.log_config.log_component].save({
			data:{text:JSON.stringify(_private.log_config.data)}, 
			crossDomain: true, xhrFields: {withCredentials: true}
		    });
		    //_private.components[_private.log_config.log_component].save({
			
		    //});
		    _private.log_config.data = [];
		}
	    }
	}
    }

    /** set up the server and client paths on the components */
    for (var comp_name in  _private.components){
	_private.components[comp_name].set_server_url(_private.server_url);
	_private.components[comp_name].set_client_url(_private.client_url);
	if (_private.log_config != undefined){
	    _private.components[comp_name].set_log_config(_private.log_config);
	}
    }
    
// Bind to StateChange Event
    History.Adapter.bind(window,'statechange',function(){ // Note: We are using statechange instead of popstate
        //console.log("State change!");
	var state = History.getState(); // Note: We are using History.getState() instead of event.state
	//console.log(state.data.ingore_statechange);
	if (that.ignore_next_statechange){
	    that.ignore_next_statechange = false;
	}
	else {
	    _private,gotoURL(state.url);
	}
    });    

    /** set up a responder to page loading events */
    History.Adapter.onDomLoad(function(){	
//	console.log("dom loaded!");
	if (_private.allow_history_load){
	    var state = History.getState();
	    //console.log(state);
	    _private.gotoURL(state.url);
	}
    });

    return that;
}

