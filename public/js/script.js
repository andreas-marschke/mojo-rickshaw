(function (window, document, undefined) {

    var State = Backbone.Model.extend({});
    var States = Backbone.Collection.extend({
        model: State,
        url: '/json',
        initialize: function() {
	    _.extend(this,Backbone.Events);
            this.palette = new Rickshaw.Color.Palette({scheme: "classic9"});
	    this.series = this.getSeries();
        },
	getSeries: function () {},
        fetch: function() {
            var that = this;
            $.ajax({
                type: 'GET',
                url: this.url,
                success: function(data) {
		    if(that.length === 1) {
			/* Hotfix for buggy rendering of fixedDuration series*/
			if(that.series[0].name === "baseline") {
			    that.series.shift();
			}
			that.trigger('first-data');
		    }
		    that.trigger('series-update');
		    that.add(new State(data));
		    that.series.addData(data);
                }
            });
        }
    });

    var StatesNormal =  States.extend({
	getSeries: function() {
	    return new Rickshaw.Series({
		color: this.palette.color(),
		data: []
            });
	}
    });

    var StatesFixedDuration =  States.extend({
	getSeries: function(options) {
	    return new Rickshaw.Series.FixedDuration([{name:"baseline"}],this.pallete,{
                color: this.palette.color(),
		timeInterval: 100,
		maxDataPoints: 100
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
		element: this.options.legend
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

    var states_n = new StatesNormal();
    var states_f = new StatesFixedDuration();

    setInterval(function() {
        states_n.fetch();
        states_f.fetch();
    },1000);
    var view_n;
    states_n.on('first-data', function() { 
	view = new StateView({el: $('#normal div[data-rickshaw-el-type="graph"]'),
			      legend: document.querySelector('#normal div[data-rickshaw-el-type="graph"]'),
			      collection: states_n});
    });

    states_f.on('first-data', function() {
	_.each(_.keys(states_f.at(0).attributes),function(key){
	});
	view = new StateView({el: $('#fixed div[data-rickshaw-el-type="graph"]'), 
			      legend: document.querySelector('#fixed div[data-rickshaw-el-type="graph"]'),
			      collection: states_f
			     });
		
    });
    window.foo = states_f;
})(this, this.document);
