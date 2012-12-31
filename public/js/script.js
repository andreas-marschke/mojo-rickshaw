(function (window, document, undefined) {

    var State = Backbone.Model.extend({});
    var States = Backbone.Collection.extend({
        model: State,
        url: '/json',
        initialize: function() {
	    _.extend(this,Backbone.Events);
            this.palette = new Rickshaw.Color.Palette({scheme: "classic9"});
            this.series = new Rickshaw.Series({
                color: this.palette.color(),
                data: []
            });
        },
        fetch: function() {
            var that = this;
            $.ajax({
                type: 'GET',
                url: this.url,
                success: function(data) {
                    that.add(new State(data));
		    that.series.addData(data);
		    if(that.length === 1) {
			that.trigger('first-data');
		    }
		    that.trigger('series-update');
                }
            });
        }
    });

    var StateView = Backbone.View.extend({
        collection: States,
        initialize: function() {
            this.graph = new Rickshaw.Graph({
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
		xFormatter: function(x) { return x + "seconds" },
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

    setInterval(function() {
        states.fetch();
    },1000);
    var view;
    states.on('first-data', function() { 
	view = new StateView({el: $('#root'), collection: states});
    });


})(this, this.document);