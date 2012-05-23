(function($) {
	$.widget("xl.cellmap", {
		options: {
			// Global
			width: 50,
			height: 50, // 50x50
			devMode: true, // Design map
			mapData: null,

			// About cells
    		cellStatus: {
    			type: [1,2,3,4,5],
    			stat: [0, 1]
    		},
    		cellDefaultStatus: {
    			type: 1,
    			stat: 0
    		},
    		styleCell: null,

			// About <table>
			tbwidth: "100%",
			tbheight: "100%",
			tbborder: "1px solid #fff",
			tbcellspacing: "0",
			tbcellpadding: "0"
		},
		// Private attributes
		_devSelectedStatus: {},
		
		_create: function() {
			var self = this;
			var opt = self.options;
			
			if(opt.mapData == null) {
				// Initialize mapData
				opt.mapData = new Array(opt.width);
				$(opt.mapData).each(function(i, n) {
					opt.mapData[i] = new Array(opt.height);
					$(opt.mapData[i]).each(function(j, k) {
						opt.mapData[i][j] = $.extend({}, opt.cellDefaultStatus);
					})
				});
			}

			self._createMap(self, opt);

			if(opt.devMode) {
				self.devMode(true);
			}
			
		},
		_setOption: function(key, value) {
			var self = this;
			$.Widget.prototype._setOption.apply(this, arguments);
			//this._super("_setOption", key, value);
			if(key === "mapData") {
				self.refresh();
			}
		},
		/********************************************************************/
		/**
		 * Change to DevMode
		 */
		devMode: function(v) {
			var self = this;
			var opt = self.options;
			
			self._devSelectedStatus = $.extend({}, opt.cellDefaultStatus);
			// Set options
			opt.devMode = !!v;
			if(opt.devMode) {
				// Create toolbar
				self.element.prepend(self._createToolbar());
			} else {
				self._removeToolbar();
			}
		},
		
		mapData: function() {
			return this.options.mapData;
		},
		
		refresh: function() {
			var self = this;
			var opt = self.options;
			$(this.element).find(".cellmap-map tr").each(function(i, n) {
				$(n).find("td").each(function(j, m) {
					self.styleCell(m, j, i, opt.mapData[j][i]);
					self._trigger("cellstatechange", null, {
						el: m,
						x: j,
						y: i,
						status: opt.mapData[j][i]
					});
				});
			});
		},
		styleCell: function(el, x, y, status) {
			var self = this;
			var opt = self.options;
			if($.type(opt.styleCell) === "function") {
				arguments[0] = $(el);
				el = opt.styleCell.apply(self, arguments);
			}
			return el;
		},
		/********************************************************************/
		/**
		 * Create the map and cells
		 */
		_createMap: function() {
			var self = this;
			var opt = self.options;
			// Create table
			var el_table = $("<table>").attr({
				"class": "cellmap-map",
				"cellspacing": opt.tbcellspacing,
				"cellpadding": opt.tbcellpadding
			}).css({
				"width": opt.tbwidth,
				"height": opt.tbheight,
				"border": opt.tbborder
			});
			
			// Create cells
			for(var i = 0; i < opt.height; ++i) {
				var el_tr = $("<tr>");
				for(var j = 0; j < opt.width; ++j) {
					var el_td = $("<td>");
					// ???
					el_tr.append(el_td);
					
					el_td = self.styleCell(el_td, j, i, opt.mapData[j][i]);
					
					self._trigger("cellstatechange", null, {
						el: el_td,
						x: j,
						y: i,
						status: opt.mapData[j][i]
					});
					
				}
				el_table.append(el_tr);
			}
			
			// Add Events
			
			el_table.find("td").bind("click", function(event) {
				var axis_x = $(this).index();
				var axis_y = $(this).parent().index();
				
				var triggerEvent;
				
				console.log("You click: (" + axis_x + "," + axis_y + ")");
				
				if(opt.devMode === true) {
					triggerEvent = "devchose";
					opt.mapData[axis_x][axis_y] = $.extend({}, self._devSelectedStatus);
				} else {
					triggerEvent = "chose";
				}
				
				// Change cell style
				self.styleCell($(this), axis_x, axis_y, opt.mapData[axis_x][axis_y]);
					
				self._trigger("cellstatechange", null, {
					el: $(this),
					x: axis_x,
					y: axis_y,
					status: opt.mapData[axis_x][axis_y]
				});
				
				// Trigger handler event
				self._trigger(triggerEvent, event, {
					cell: $(this),
					status: function(v) {
						if(v) {
							opt.mapData[axis_x][axis_y] = v;
						}
						return opt.mapData[axis_x][axis_y];
					},
					x: axis_x,
					y: axis_y
				});
				console.log(opt.mapData);
			}).bind("hover", function(event) {
				var axis_x = $(this).index();
				var axis_y = $(this).parent().index();
				console.log("cell hover..");
				self._trigger("cellhover", null, {
					el: $(this),
					x: axis_x,
					y: axis_y,
					status: opt.mapData[axis_x][axis_y]
				});
			});
			
			// Append to DOM
			$(self.element).append(el_table);
			
			self._trigger("open", null, self);
		},
		
		/**
		 * Create DevMode toolbar
		 */
		_createToolbar: function() {
			var self = this;
			var opt = self.options;
			var el_toolbar = $("<div>");
			el_toolbar.attr("class", "cellmap-dev-toolbar");
			
			for(var i in opt.cellStatus) {
				var items = opt.cellStatus[i];
				$(items).each(function(j, n) {
					var el_item = $("<input>");
					el_item.attr({
						"type": "radio",
						"class": "cellmap-dev-toolbar-options",
						"name": i,
						"value": n
					});
					
					// Select default values
					if(opt.cellDefaultStatus[i] === n) {
						el_item.attr("checked", "checked");
					}
					var st = {};
					st[i] = n;
					el_item = self.styleCell(el_item, 0, 0, st);
					el_toolbar.append(el_item).append(i + "(" + n + ")");
				});
				el_toolbar.append("|");
			}
			
			// Bind event
			el_toolbar.find("input").bind("change", function(event) {
				self._devSelectedStatus[$(this).attr("name")] = $(this).attr("value");
			})
			
			return el_toolbar;
		},
		/**
		 * Remove toolbar in devMode
		 */
		_removeToolbar: function() {
			var self = this;
			var opt = self.options;
			self.element.remove($(".cellmap-dev-toolbar"));
		}
	});

})(jQuery);
