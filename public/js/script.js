(function (window, document, undefined) {

    var State = Backbone.Model.extend({});
    var States = Backbone.Collection.extend({
        model: State,
        url: '/json',
        initialize: function() {
	    _.extend(this,Backbone.Events);
	    this.url = {};
	    this.sockets = {};
	    this.urls = {};
            this.palette = new Rickshaw.Color.Palette({scheme: "classic9"});
            this.series = new Rickshaw.Series.FixedDuration([{name:"_"}],this.pallete,{
		color: this.palette.color(),
		timeInterval: 100,
		maxDataPoints: 100
	    });
	    var that = this;
	    // get hosts available

	    this.on("hosts_inited",function() {
		this.transition();
	    });
	    this.on("urls_found",function(){
		_.each(_.keys(that.urls),function(url){
		    that.sockets[url] = new WebSocket(that.urls[url]);
		    that.trigger('connected');
		});
	    });
	    this.fetchHosts();
	    this.on("change",function() {
		if(this.length == 1) 
		    that.trigger("first-data");
	    });
        },
	fetchHosts: function() {
	    var that = this;
	    $.ajax({
		type: "GET",
		url: '/hosts',
		success: function(data) {
		    that.hosts = data;
		    that.trigger("hosts_inited");
		}
	    });
	},
	transition: function() {
	    // Transition from AJAX to Websockets
	    var that = this;
	    $.ajax({
		type : 'GET',
		url: '/websockets',
		success: function(data) {
		    _.each(_.keys(data),function(url_name){ 
			that.urls[url_name] = data[url_name];
		    });
		    that.trigger("urls_found");
		}
	    });
	}
    });

    var StateView = Backbone.View.extend({
        collection: States,
        initialize: function() {
            this.graph = new Rickshaw.Graph({
		renderer : 'line',
                element: this.el,
                width: 580,
                height: 230,
                series: this.collection.series
            });
	    this.legend = new Rickshaw.Graph.Legend({
		graph: this.graph,
		element: document.querySelector('#legend')
	    });

	    this.highlighter = new Rickshaw.Graph.Behavior.Series.Highlight({
		graph: this.graph,
		legend: this.legend
	    });
	    
	    this.hoverDetail = new Rickshaw.Graph.HoverDetail({
		graph: this.graph,
		xFormatter: function(x) { return x + "seconds"; },
		yFormatter: function(y) { return Math.floor(y) + " percent" }
	    });
	    
	    this.axis = {};
	    this.axis.x =  new Rickshaw.Graph.Axis.Time({
		graph: this.graph
	    });
	    this.axis.y = new Rickshaw.Graph.Axis.Y({
		graph: this.graph
	    });
	    var that = this;
	    this.collection.on('series-update',function() { 
		that.render();
	    });

        },
        render: function() {
            this.graph.render();
	    this.axis.x.render();
	    this.axis.y.render();
        }
    });

    var states = new States();
    states.on('connected',function(){
	_.each(_.keys(states.sockets),function(socket){
	    states.sockets[socket].onopen = function() {};
	    states.sockets[socket].onmessage = function(e) {
		var data = JSON.parse(e.data);
		states.add(new State(data));
		states.series.addData(data);
		if (states.length == 1 ) {
		    /* Hotfix for buggy rendering of fixedDuration series*/
		    if(states.series[0].name == "_") {
			states.series.shift();
		    }
		    states.trigger('first-data');
		    console.log(states.series[0]);

		} else {
		    states.trigger('series-update');
		}
	    };
	    states.sockets[socket].onerror = function(e) {
		console.log(e);
	    };
	});
	
    });
    var view;
    states.on('first-data', function() { 
	view = new StateView({el: $('#root'), collection: states});
    });
})(this, this.document);
