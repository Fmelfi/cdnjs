YUI.add('dd-ddm-base', function(Y) {


    /**
     * Provides the base Drag Drop Manger required for making a Node draggable.
     * @module dd
     * @submodule dd-ddm-base
     */     
     /**
     * Provides the base Drag Drop Manger required for making a Node draggable.
     * @class DDM
     * @extends Base
     * @constructor
     * @namespace DD
     */
    
    var DDMBase = function() {
        DDMBase.superclass.constructor.apply(this, arguments);
    };

    DDMBase.NAME = 'ddm';

    DDMBase.ATTRS = {
        /**
        * @attribute dragCursor
        * @description The cursor to apply when dragging, if shimmed the shim will get the cursor.
        * @type String
        */
        dragCursor: {
            value: 'move'
        },
        /**
        * @attribute clickPixelThresh
        * @description The number of pixels to move to start a drag operation, default is 3.
        * @type Number
        */
        clickPixelThresh: {
            value: 3
        },
        /**
        * @attribute clickTimeThresh
        * @description The number of milliseconds a mousedown has to pass to start a drag operation, default is 1000.
        * @type Number
        */        
        clickTimeThresh: {
            value: 1000
        },
        /**
        * @attribute throttleTime
        * @description The number of milliseconds to throttle the mousemove event. Default: 150
        * @type Number
        */        
        throttleTime: {
            //value: 150
            value: -1
        },
        /**
        * @attribute dragMode
        * @description This attribute only works if the dd-drop module is active. It will set the dragMode (point, intersect, strict) of all future Drag instances. 
        * @type String
        */        
        dragMode: {
            value: 'point',
            setter: function(mode) {
                this._setDragMode(mode);
                return mode;
            }           
        }

    };

    Y.extend(DDMBase, Y.Base, {
        _createPG: function() {},
        /**
        * @property _active
        * @description flag set when we activate our first drag, so DDM can start listening for events.
        * @type {Boolean}
        */
        _active: null,
        /**
        * @private
        * @method _setDragMode
        * @description Handler for dragMode attribute setter.
        * @param String/Number The Number value or the String for the DragMode to default all future drag instances to.
        * @return Number The Mode to be set
        */
        _setDragMode: function(mode) {
            if (mode === null) {
                mode = Y.DD.DDM.get('dragMode');
            }
            switch (mode) {
                case 1:
                case 'intersect':
                    return 1;
                case 2:
                case 'strict':
                    return 2;
                case 0:
                case 'point':
                    return 0;
            }
            return 0;       
        },
        /**
        * @property CSS_PREFIX
        * @description The PREFIX to attach to all DD CSS class names
        * @type {String}
        */
        CSS_PREFIX: Y.ClassNameManager.getClassName('dd'),
        _activateTargets: function() {},        
        /**
        * @private
        * @property _drags
        * @description Holder for all registered drag elements.
        * @type {Array}
        */
        _drags: [],
        /**
        * @property activeDrag
        * @description A reference to the currently active draggable object.
        * @type {Drag}
        */
        activeDrag: false,
        /**
        * @private
        * @method _regDrag
        * @description Adds a reference to the drag object to the DDM._drags array, called in the constructor of Drag.
        * @param {Drag} d The Drag object
        */
        _regDrag: function(d) {
            if (this.getDrag(d.get('node'))) {
                return false;
            }
            
            if (!this._active) {
                this._setupListeners();
            }
            this._drags.push(d);
            return true;
        },
        /**
        * @private
        * @method _unregDrag
        * @description Remove this drag object from the DDM._drags array.
        * @param {Drag} d The drag object.
        */
        _unregDrag: function(d) {
            var tmp = [];
            Y.each(this._drags, function(n, i) {
                if (n !== d) {
                    tmp[tmp.length] = n;
                }
            });
            this._drags = tmp;
        },
        /**
        * @private
        * @method _setupListeners
        * @description Add the document listeners.
        */
        _setupListeners: function() {
            this._createPG();
            this._active = true;

            var doc = Y.one(Y.config.doc);
            doc.on('mousemove', Y.throttle(Y.bind(this._move, this), this.get('throttleTime')));
            doc.on('mouseup', Y.bind(this._end, this));
        },
        /**
        * @private
        * @method _start
        * @description Internal method used by Drag to signal the start of a drag operation
        */
        _start: function() {
            this.fire('ddm:start');
            this._startDrag();
        },
        /**
        * @private
        * @method _startDrag
        * @description Factory method to be overwritten by other DDM's
        * @param {Number} x The x position of the drag element
        * @param {Number} y The y position of the drag element
        * @param {Number} w The width of the drag element
        * @param {Number} h The height of the drag element
        */
        _startDrag: function() {},
        /**
        * @private
        * @method _endDrag
        * @description Factory method to be overwritten by other DDM's
        */
        _endDrag: function() {},
        _dropMove: function() {},
        /**
        * @private
        * @method _end
        * @description Internal method used by Drag to signal the end of a drag operation
        */
        _end: function() {
            if (this.activeDrag) {
                this._endDrag();
                this.fire('ddm:end');
                this.activeDrag.end.call(this.activeDrag);
                this.activeDrag = null;
            }
        },
        /**
        * @method stopDrag
        * @description Method will forcefully stop a drag operation. For example calling this from inside an ESC keypress handler will stop this drag.
        * @return {Self}
        * @chainable
        */       
        stopDrag: function() {
            if (this.activeDrag) {
                this._end();
            }
            return this;
        },
        /**
        * @private
        * @method _move
        * @description Internal listener for the mousemove DOM event to pass to the Drag's move method.
        * @param {Event.Facade} ev The Dom mousemove Event
        */
        _move: function(ev) {
            if (this.activeDrag) {
                this.activeDrag._move.call(this.activeDrag, ev);
                this._dropMove();
            }
        },
        /**
        * //TODO Private, rename??...
        * @private
        * @method cssSizestoObject
        * @description Helper method to use to set the gutter from the attribute setter.
        * @param {String} gutter CSS style string for gutter: '5 0' (sets top and bottom to 5px, left and right to 0px), '1 2 3 4' (top 1px, right 2px, bottom 3px, left 4px)
        * @return {Object} The gutter Object Literal.
        */
        cssSizestoObject: function(gutter) {
            var x = gutter.split(' ');
                
            switch (x.length) {
                case 1: x[1] = x[2] = x[3] = x[0]; break;
                case 2: x[2] = x[0]; x[3] = x[1]; break;
                case 3: x[3] = x[1]; break;
            }

            return {
                top   : parseInt(x[0],10),
                right : parseInt(x[1],10),
                bottom: parseInt(x[2],10),
                left  : parseInt(x[3],10)
            };
        },
        /**
        * @method getDrag
        * @description Get a valid Drag instance back from a Node or a selector string, false otherwise
        * @param {String/Object} node The Node instance or Selector string to check for a valid Drag Object
        * @return {Object}
        */
        getDrag: function(node) {
            var drag = false,
                n = Y.one(node);
            if (n instanceof Y.Node) {
                Y.each(this._drags, function(v, k) {
                    if (n.compareTo(v.get('node'))) {
                        drag = v;
                    }
                });
            }
            return drag;
        },
        /**
        * @method swapPosition
        * @description Swap the position of 2 nodes based on their CSS positioning.
        * @param {Node} n1 The first node to swap
        * @param {Node} n2 The first node to swap
        * @return {Node}
        */
        swapPosition: function(n1, n2) {
            n1 = Y.DD.DDM.getNode(n1);
            n2 = Y.DD.DDM.getNode(n2);
            var xy1 = n1.getXY(),
                xy2 = n2.getXY();

            n1.setXY(xy2);
            n2.setXY(xy1);
            return n1;
        },
        /**
        * @method getNode
        * @description Return a node instance from the given node, selector string or Y.Base extended object.
        * @param {Node/Object/String} n The node to resolve.
        * @return {Node}
        */
        getNode: function(n) {
            if (n && n.get) {
                if (Y.Widget && (n instanceof Y.Widget)) {
                    n = n.get('boundingBox');
                } else {
                    n = n.get('node');
                }
            } else {
                n = Y.one(n);
            }
            return n;
        },
        /**
        * @method swapNode
        * @description Swap the position of 2 nodes based on their DOM location.
        * @param {Node} n1 The first node to swap
        * @param {Node} n2 The first node to swap
        * @return {Node}
        */
        swapNode: function(n1, n2) {
            n1 = Y.DD.DDM.getNode(n1);
            n2 = Y.DD.DDM.getNode(n2);
            var p = n2.get('parentNode'),
                s = n2.get('nextSibling');

            if (s == n1) {
                p.insertBefore(n1, n2);
            } else if (n2 == n1.get('nextSibling')) {
                p.insertBefore(n2, n1);
            } else {
                n1.get('parentNode').replaceChild(n2, n1);
                p.insertBefore(n1, s);
            }
            return n1;
        }
    });

    Y.namespace('DD');
    Y.DD.DDM = new DDMBase();

    /**
    * @event ddm:start
    * @description Fires from the DDM before all drag events fire.
    * @type {Event.Custom}
    */
    /**
    * @event ddm:end
    * @description Fires from the DDM after the DDM finishes, before the drag end events.
    * @type {Event.Custom}
    */




}, '@VERSION@' ,{requires:['node', 'base', 'yui-throttle', 'classnamemanager'], skinnable:false});
YUI.add('dd-ddm', function(Y) {


    /**
     * Extends the dd-ddm-base Class to add support for the viewport shim to allow a draggable node to drag to be dragged over an iframe or any other node that traps mousemove events.
     * It is also required to have Drop Targets enabled, as the viewport shim will contain the shims for the Drop Targets.
     * @module dd
     * @submodule dd-ddm
     * @for DDM
     * @namespace DD
     */
    Y.mix(Y.DD.DDM, {
        /**
        * @private
        * @property _pg
        * @description The shim placed over the screen to track the mousemove event.
        * @type {Node}
        */
        _pg: null,
        /**
        * @private
        * @property _debugShim
        * @description Set this to true to set the shims opacity to .5 for debugging it, default: false.
        * @type {Boolean}
        */
        _debugShim: false,
        _activateTargets: function() { },
        _deactivateTargets: function() {},
        _startDrag: function() {
            if (this.activeDrag && this.activeDrag.get('useShim')) {
                this._pg_activate();
                this._activateTargets();
            }
        },
        _endDrag: function() {
            this._pg_deactivate();
            this._deactivateTargets();
        },
        /**
        * @private
        * @method _pg_deactivate
        * @description Deactivates the shim
        */
        _pg_deactivate: function() {
            this._pg.setStyle('display', 'none');
        },
        /**
        * @private
        * @method _pg_activate
        * @description Activates the shim
        */
        _pg_activate: function() {
            var ah = this.activeDrag.get('activeHandle'), cur = 'auto';
            if (ah) {
                cur = ah.getStyle('cursor');
            }
            if (cur == 'auto') {
                cur = this.get('dragCursor');
            }
            
            this._pg_size();
            this._pg.setStyles({
                top: 0,
                left: 0,
                display: 'block',
                opacity: ((this._debugShim) ? '.5' : '0'),
                cursor: cur
            });
        },
        /**
        * @private
        * @method _pg_size
        * @description Sizes the shim on: activatation, window:scroll, window:resize
        */
        _pg_size: function() {
            if (this.activeDrag) {
                var b = Y.one('body'),
                h = b.get('docHeight'),
                w = b.get('docWidth');
                this._pg.setStyles({
                    height: h + 'px',
                    width: w + 'px'
                });
            }
        },
        /**
        * @private
        * @method _createPG
        * @description Creates the shim and adds it's listeners to it.
        */
        _createPG: function() {
            var pg = Y.Node.create('<div></div>'),
            bd = Y.one('body'), win;
            pg.setStyles({
                top: '0',
                left: '0',
                position: 'absolute',
                zIndex: '9999',
                overflow: 'hidden',
                backgroundColor: 'red',
                display: 'none',
                height: '5px',
                width: '5px'
            });
            pg.set('id', Y.stamp(pg));
            pg.addClass(Y.DD.DDM.CSS_PREFIX + '-shim');
            bd.prepend(pg);
            this._pg = pg;
            this._pg.on('mousemove', Y.throttle(Y.bind(this._move, this), this.get('throttleTime')));
            this._pg.on('mouseup', Y.bind(this._end, this));
            
            win = Y.one('win');
            Y.on('window:resize', Y.bind(this._pg_size, this));
            win.on('scroll', Y.bind(this._pg_size, this));
        }   
    }, true);




}, '@VERSION@' ,{requires:['dd-ddm-base', 'event-resize'], skinnable:false});
YUI.add('dd-ddm-drop', function(Y) {


    /**
     * Extends the dd-ddm Class to add support for the placement of Drop Target shims inside the viewport shim. It also handles all Drop Target related events and interactions.
     * @module dd
     * @submodule dd-ddm-drop
     * @for DDM
     * @namespace DD
     */

    //TODO CSS class name for the bestMatch..
    Y.mix(Y.DD.DDM, {
        /**
        * @private
        * @property _noShim
        * @description This flag turns off the use of the mouseover/mouseout shim. It should not be used unless you know what you are doing.
        * @type {Boolean}
        */
        _noShim: false,
        /**
        * @private
        * @property _activeShims
        * @description Placeholder for all active shims on the page
        * @type {Array}
        */
        _activeShims: [],
        /**
        * @private
        * @method _hasActiveShim
        * @description This method checks the _activeShims Object to see if there is a shim active.
        * @return {Boolean}
        */
        _hasActiveShim: function() {
            if (this._noShim) {
                return true;
            }
            return this._activeShims.length;
        },
        /**
        * @private
        * @method _addActiveShim 
        * @description Adds a Drop Target to the list of active shims
        * @param {Object} d The Drop instance to add to the list.
        */
        _addActiveShim: function(d) {
            this._activeShims[this._activeShims.length] = d;
        },
        /**
        * @private
        * @method _removeActiveShim 
        * @description Removes a Drop Target to the list of active shims
        * @param {Object} d The Drop instance to remove from the list.
        */
        _removeActiveShim: function(d) {
            var s = [];
            Y.each(this._activeShims, function(v, k) {
                if (v._yuid !== d._yuid) {
                    s[s.length] = v;
                }
                
            });
            this._activeShims = s;
        },
        /**
        * @method syncActiveShims
        * @description This method will sync the position of the shims on the Drop Targets that are currently active.
        * @param {Boolean} force Resize/sync all Targets.
        */
        syncActiveShims: function(force) {
            Y.later(0, this, function(force) {
                var drops = ((force) ? this.targets : this._lookup());
                Y.each(drops, function(v, k) {
                    v.sizeShim.call(v);
                }, this);
            }, force);
        },
        /**
        * @private
        * @property mode
        * @description The mode that the drag operations will run in 0 for Point, 1 for Intersect, 2 for Strict
        * @type Number
        */
        mode: 0,
        /**
        * @private
        * @property POINT
        * @description In point mode, a Drop is targeted by the cursor being over the Target
        * @type Number
        */
        POINT: 0,
        /**
        * @private
        * @property INTERSECT
        * @description In intersect mode, a Drop is targeted by "part" of the drag node being over the Target
        * @type Number
        */
        INTERSECT: 1,
        /**
        * @private
        * @property STRICT
        * @description In strict mode, a Drop is targeted by the "entire" drag node being over the Target
        * @type Number
        */
        STRICT: 2,
        /**
        * @property useHash
        * @description Should we only check targets that are in the viewport on drags (for performance), default: true
        * @type {Boolean}
        */
        useHash: true,
        /**
        * @property activeDrop
        * @description A reference to the active Drop Target
        * @type {Object}
        */
        activeDrop: null,
        /**
        * @property validDrops
        * @description An array of the valid Drop Targets for this interaction.
        * @type {Array}
        */
        //TODO Change array/object literals to be in sync..
        validDrops: [],
        /**
        * @property otherDrops
        * @description An object literal of Other Drop Targets that we encountered during this interaction (in the case of overlapping Drop Targets)
        * @type {Object}
        */
        otherDrops: {},
        /**
        * @property targets
        * @description All of the Targets
        * @type {Array}
        */
        targets: [],
        /**
        * @private 
        * @method _addValid
        * @description Add a Drop Target to the list of Valid Targets. This list get's regenerated on each new drag operation.
        * @param {Object} drop
        * @return {Self}
        * @chainable
        */
        _addValid: function(drop) {
            this.validDrops[this.validDrops.length] = drop;
            return this;
        },
        /**
        * @private 
        * @method _removeValid
        * @description Removes a Drop Target from the list of Valid Targets. This list get's regenerated on each new drag operation.
        * @param {Object} drop
        * @return {Self}
        * @chainable
        */
        _removeValid: function(drop) {
            var drops = [];
            Y.each(this.validDrops, function(v, k) {
                if (v !== drop) {
                    drops[drops.length] = v;
                }
            });

            this.validDrops = drops;
            return this;
        },
        /**
        * @method isOverTarget
        * @description Check to see if the Drag element is over the target, method varies on current mode
        * @param {Object} drop The drop to check against
        * @return {Boolean}
        */
        isOverTarget: function(drop) {
            if (this.activeDrag && drop) {
                var xy = this.activeDrag.mouseXY, r, dMode = this.activeDrag.get('dragMode'),
                    aRegion, node = drop.shim;
                if (xy && this.activeDrag) {
                    aRegion = this.activeDrag.region;
                    if (dMode == this.STRICT) {
                        return this.activeDrag.get('dragNode').inRegion(drop.region, true, aRegion);
                    } else {
                        if (drop && drop.shim) {
                            if ((dMode == this.INTERSECT) && this._noShim) {
                                r = ((aRegion) ? aRegion : this.activeDrag.get('node'));
                                return drop.get('node').intersect(r, drop.region).inRegion;
                            } else {
                                if (this._noShim) {
                                    node = drop.get('node');
                                }
                                return node.intersect({
                                    top: xy[1],
                                    bottom: xy[1],
                                    left: xy[0], 
                                    right: xy[0]
                                }, drop.region).inRegion;
                            }
                        } else {
                            return false;
                        }
                    }
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        /**
        * @method clearCache
        * @description Clears the cache data used for this interaction.
        */
        clearCache: function() {
            this.validDrops = [];
            this.otherDrops = {};
            this._activeShims = [];
        },
        /**
        * @private
        * @method _activateTargets
        * @description Clear the cache and activate the shims of all the targets
        */
        _activateTargets: function() {
            this._noShim = true;
            this.clearCache();
            Y.each(this.targets, function(v, k) {
                v._activateShim([]);
                if (v.get('noShim') == true) {
                    this._noShim = false;
                }
            }, this);
            this._handleTargetOver();
            
        },
        /**
        * @method getBestMatch
        * @description This method will gather the area for all potential targets and see which has the hightest covered area and return it.
        * @param {Array} drops An Array of drops to scan for the best match.
        * @param {Boolean} all If present, it returns an Array. First item is best match, second is an Array of the other items in the original Array.
        * @return {Object or Array} 
        */
        getBestMatch: function(drops, all) {
            var biggest = null, area = 0, out;
            
            Y.each(drops, function(v, k) {
                var inter = this.activeDrag.get('dragNode').intersect(v.get('node'));
                v.region.area = inter.area;

                if (inter.inRegion) {
                    if (inter.area > area) {
                        area = inter.area;
                        biggest = v;
                    }
                }
            }, this);
            if (all) {
                out = [];
                //TODO Sort the others in numeric order by area covered..
                Y.each(drops, function(v, k) {
                    if (v !== biggest) {
                        out[out.length] = v;
                    }
                }, this);
                return [biggest, out];
            } else {
                return biggest;
            }
        },
        /**
        * @private
        * @method _deactivateTargets
        * @description This method fires the drop:hit, drag:drophit, drag:dropmiss methods and deactivates the shims..
        */
        _deactivateTargets: function() {
            var other = [], tmp,
                activeDrag = this.activeDrag,
                activeDrop = this.activeDrop;
            
            //TODO why is this check so hard??
            if (activeDrag && activeDrop && this.otherDrops[activeDrop]) {
                if (!activeDrag.get('dragMode')) {
                    //TODO otherDrops -- private..
                    other = this.otherDrops;
                    delete other[activeDrop];
                } else {
                    tmp = this.getBestMatch(this.otherDrops, true);
                    activeDrop = tmp[0];
                    other = tmp[1];
                }
                activeDrag.get('node').removeClass(this.CSS_PREFIX + '-drag-over');
                if (activeDrop) {
                    activeDrop.fire('drop:hit', { drag: activeDrag, drop: activeDrop, others: other });
                    activeDrag.fire('drag:drophit', { drag: activeDrag,  drop: activeDrop, others: other });
                }
            } else if (activeDrag && activeDrag.get('dragging')) {
                activeDrag.get('node').removeClass(this.CSS_PREFIX + '-drag-over');
                activeDrag.fire('drag:dropmiss', { pageX: activeDrag.lastXY[0], pageY: activeDrag.lastXY[1] });
            } else {
            }
            
            this.activeDrop = null;

            Y.each(this.targets, function(v, k) {
                v._deactivateShim([]);
            }, this);
        },
        /**
        * @private
        * @method _dropMove
        * @description This method is called when the move method is called on the Drag Object.
        */
        _dropMove: function() {
            if (this._hasActiveShim()) {
                this._handleTargetOver();
            } else {
                Y.each(this.otherDrops, function(v, k) {
                    v._handleOut.apply(v, []);
                });
            }
        },
        /**
        * @private
        * @method _lookup
        * @description Filters the list of Drops down to those in the viewport.
        * @return {Array} The valid Drop Targets that are in the viewport.
        */
        _lookup: function() {
            if (!this.useHash || this._noShim) {
                return this.validDrops;
            }
            var drops = [];
            //Only scan drop shims that are in the Viewport
            Y.each(this.validDrops, function(v, k) {
                if (v.shim && v.shim.inViewportRegion(false, v.region)) {
                    drops[drops.length] = v;
                }
            });
            return drops;
                
        },
        /**
        * @private
        * @method _handleTargetOver
        * @description This method execs _handleTargetOver on all valid Drop Targets
        */
        _handleTargetOver: function() {
            var drops = this._lookup();
            Y.each(drops, function(v, k) {
                v._handleTargetOver.call(v);
            }, this);
        },
        /**
        * @private
        * @method _regTarget
        * @description Add the passed in Target to the targets collection
        * @param {Object} t The Target to add to the targets collection
        */
        _regTarget: function(t) {
            this.targets[this.targets.length] = t;
        },
        /**
        * @private
        * @method _unregTarget
        * @description Remove the passed in Target from the targets collection
        * @param {Object} drop The Target to remove from the targets collection
        */
        _unregTarget: function(drop) {
            var targets = [], vdrops;
            Y.each(this.targets, function(v, k) {
                if (v != drop) {
                    targets[targets.length] = v;
                }
            }, this);
            this.targets = targets;

            vdrops = [];
            Y.each(this.validDrops, function(v, k) {
                if (v !== drop) {
                    vdrops[vdrops.length] = v;
                }
            });

            this.validDrops = vdrops;
        },
        /**
        * @method getDrop
        * @description Get a valid Drop instance back from a Node or a selector string, false otherwise
        * @param {String/Object} node The Node instance or Selector string to check for a valid Drop Object
        * @return {Object}
        */
        getDrop: function(node) {
            var drop = false,
                n = Y.one(node);
            if (n instanceof Y.Node) {
                Y.each(this.targets, function(v, k) {
                    if (n.compareTo(v.get('node'))) {
                        drop = v;
                    }
                });
            }
            return drop;
        }
    }, true);
    






}, '@VERSION@' ,{requires:['dd-ddm'], skinnable:false});
YUI.add('dd-drag', function(Y) {


    /**
     * Provides the ability to drag a Node.
     * @module dd
     * @submodule dd-drag
     */     
    /**
     * Provides the ability to drag a Node.
     * @class Drag
     * @extends Base
     * @constructor
     * @namespace DD
     */

    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAGGING = 'dragging',
        DRAG_NODE = 'dragNode',
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth',        
        /**
        * @event drag:mouseDown
        * @description Handles the mousedown DOM event, checks to see if you have a valid handle then starts the drag timers.
        * @preventable _defMouseDownFn
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>ev</dt><dd>The original mousedown event.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_MOUSE_DOWN = 'drag:mouseDown',
        /**
        * @event drag:afterMouseDown
        * @description Fires after the mousedown event has been cleared.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>ev</dt><dd>The original mousedown event.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_AFTER_MOUSE_DOWN = 'drag:afterMouseDown',
        /**
        * @event drag:removeHandle
        * @description Fires after a handle is removed.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>handle</dt><dd>The handle that was removed.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_REMOVE_HANDLE = 'drag:removeHandle',
        /**
        * @event drag:addHandle
        * @description Fires after a handle is added.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>handle</dt><dd>The handle that was added.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_ADD_HANDLE = 'drag:addHandle',
        /**
        * @event drag:removeInvalid
        * @description Fires after an invalid selector is removed.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>handle</dt><dd>The handle that was removed.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_REMOVE_INVALID = 'drag:removeInvalid',
        /**
        * @event drag:addInvalid
        * @description Fires after an invalid selector is added.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl><dt>handle</dt><dd>The handle that was added.</dd></dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_ADD_INVALID = 'drag:addInvalid',
        /**
        * @event drag:start
        * @description Fires at the start of a drag operation.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>pageX</dt><dd>The original node position X.</dd>
        * <dt>pageY</dt><dd>The original node position Y.</dd>
        * <dt>startTime</dt><dd>The startTime of the event. getTime on the current Date object.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_START = 'drag:start',
        /**
        * @event drag:end
        * @description Fires at the end of a drag operation.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>pageX</dt><dd>The current node position X.</dd>
        * <dt>pageY</dt><dd>The current node position Y.</dd>
        * <dt>startTime</dt><dd>The startTime of the event, from the start event.</dd>
        * <dt>endTime</dt><dd>The endTime of the event. getTime on the current Date object.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_END = 'drag:end',
        /**
        * @event drag:drag
        * @description Fires every mousemove during a drag operation.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>pageX</dt><dd>The current node position X.</dd>
        * <dt>pageY</dt><dd>The current node position Y.</dd>
        * <dt>scroll</dt><dd>Should a scroll action occur.</dd>
        * <dt>info</dt><dd>Object hash containing calculated XY arrays: start, xy, delta, offset</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_DRAG = 'drag:drag',
        /**
        * @event drag:align
        * @preventable _defAlignFn
        * @description Fires when this node is aligned.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>pageX</dt><dd>The current node position X.</dd>
        * <dt>pageY</dt><dd>The current node position Y.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_ALIGN = 'drag:align',
        /**
        * @event drag:over
        * @description Fires when this node is over a Drop Target. (Fired from dd-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The drop object at the time of the event.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        /**
        * @event drag:enter
        * @description Fires when this node enters a Drop Target. (Fired from dd-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The drop object at the time of the event.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        /**
        * @event drag:exit
        * @description Fires when this node exits a Drop Target. (Fired from dd-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The drop object at the time of the event.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        /**
        * @event drag:drophit
        * @description Fires when this node is dropped on a valid Drop Target. (Fired from dd-ddm-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The best guess on what was dropped on.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * <dt>others</dt><dd>An array of all the other drop targets that was dropped on.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
        /**
        * @event drag:dropmiss
        * @description Fires when this node is dropped on an invalid Drop Target. (Fired from dd-ddm-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>pageX</dt><dd>The current node position X.</dd>
        * <dt>pageY</dt><dd>The current node position Y.</dd>
        * </dl>
        * @bubbles DDM
        * @type {Event.Custom}
        */
    
    Drag = function(o) {
        this._lazyAddAttrs = false;
        Drag.superclass.constructor.apply(this, arguments);

        var valid = DDM._regDrag(this);
        if (!valid) {
            Y.error('Failed to register node, already in use: ' + o.node);
        }
    };

    Drag.NAME = 'drag';
    
    /**
    * This property defaults to "mousedown", but when drag-gestures is loaded, it is changed to "gesturemovestart"
    * @static
    * @property START_EVENT
    */
    Drag.START_EVENT = 'mousedown';

    Drag.ATTRS = {
        /**
        * @attribute node
        * @description Y.Node instance to use as the element to initiate a drag operation
        * @type Node
        */
        node: {
            setter: function(node) {
                var n = Y.one(node);
                if (!n) {
                    Y.error('DD.Drag: Invalid Node Given: ' + node);
                }
                return n;
            }
        },
        /**
        * @attribute dragNode
        * @description Y.Node instance to use as the draggable element, defaults to node
        * @type Node
        */
        dragNode: {
            setter: function(node) {
                var n = Y.one(node);
                if (!n) {
                    Y.error('DD.Drag: Invalid dragNode Given: ' + node);
                }
                return n;
            }
        },
        /**
        * @attribute offsetNode
        * @description Offset the drag element by the difference in cursor position: default true
        * @type Boolean
        */
        offsetNode: {
            value: true
        },
        /**
        * @attribute startCentered
        * @description Center the dragNode to the mouse position on drag:start: default false
        * @type Boolean
        */
        startCentered: {
            value: false
        },
        /**
        * @attribute clickPixelThresh
        * @description The number of pixels to move to start a drag operation, default is 3.
        * @type Number
        */
        clickPixelThresh: {
            value: DDM.get('clickPixelThresh')
        },
        /**
        * @attribute clickTimeThresh
        * @description The number of milliseconds a mousedown has to pass to start a drag operation, default is 1000.
        * @type Number
        */
        clickTimeThresh: {
            value: DDM.get('clickTimeThresh')
        },
        /**
        * @attribute lock
        * @description Set to lock this drag element so that it can't be dragged: default false.
        * @type Boolean
        */
        lock: {
            value: false,
            setter: function(lock) {
                if (lock) {
                    this.get(NODE).addClass(DDM.CSS_PREFIX + '-locked');
                } else {
                    this.get(NODE).removeClass(DDM.CSS_PREFIX + '-locked');
                }
                return lock;
            }
        },
        /**
        * @attribute data
        * @description A payload holder to store arbitrary data about this drag object, can be used to store any value.
        * @type Mixed
        */
        data: {
            value: false
        },
        /**
        * @attribute move
        * @description If this is false, the drag element will not move with the cursor: default true. Can be used to "resize" the element.
        * @type Boolean
        */
        move: {
            value: true
        },
        /**
        * @attribute useShim
        * @description Use the protective shim on all drag operations: default true. Only works with dd-ddm, not dd-ddm-base.
        * @type Boolean
        */
        useShim: {
            value: true
        },
        /**
        * @attribute activeHandle
        * @description This config option is set by Drag to inform you of which handle fired the drag event (in the case that there are several handles): default false.
        * @type Node
        */
        activeHandle: {
            value: false
        },
        /**
        * @attribute primaryButtonOnly
        * @description By default a drag operation will only begin if the mousedown occurred with the primary mouse button. Setting this to false will allow for all mousedown events to trigger a drag.
        * @type Boolean
        */
        primaryButtonOnly: {
            value: true
        },
        /**
        * @attribute dragging
        * @description This attribute is not meant to be used by the implementor, it is meant to be used as an Event tracker so you can listen for it to change.
        * @type Boolean
        */
        dragging: {
            value: false
        },
        parent: {
            value: false
        },
        /**
        * @attribute target
        * @description This attribute only works if the dd-drop module has been loaded. It will make this node a drop target as well as draggable.
        * @type Boolean
        */
        target: {
            value: false,
            setter: function(config) {
                this._handleTarget(config);
                return config;
            }
        },
        /**
        * @attribute dragMode
        * @description This attribute only works if the dd-drop module is active. It will set the dragMode (point, intersect, strict) of this Drag instance.
        * @type String
        */
        dragMode: {
            value: null,
            setter: function(mode) {
                return DDM._setDragMode(mode);
            }
        },
        /**
        * @attribute groups
        * @description Array of groups to add this drag into.
        * @type Array
        */
        groups: {
            value: ['default'],
            getter: function() {
                if (!this._groups) {
                    this._groups = {};
                }
                var ret = [];
                Y.each(this._groups, function(v, k) {
                    ret[ret.length] = k;
                });
                return ret;
            },
            setter: function(g) {
                this._groups = {};
                Y.each(g, function(v, k) {
                    this._groups[v] = true;
                }, this);
                return g;
            }
        },
        /**
        * @attribute handles
        * @description Array of valid handles to add. Adding something here will set all handles, even if previously added with addHandle
        * @type Array
        */
        handles: {
            value: null,
            setter: function(g) {
                if (g) {
                    this._handles = {};
                    Y.each(g, function(v, k) {
                        var key = v;
                        if (v instanceof Y.Node || v instanceof Y.NodeList) {
                            key = v._yuid;
                        }
                        this._handles[key] = v;
                    }, this);
                } else {
                    this._handles = null;
                }
                return g;
            }
        },
        /**
        * @deprecated
        * @attribute bubbles
        * @description Controls the default bubble parent for this Drag instance. Default: Y.DD.DDM. Set to false to disable bubbling. Use bubbleTargets in config
        * @type Object
        */
        bubbles: {
            setter: function(t) {
                Y.log('bubbles is deprecated use bubbleTargets: HOST', 'warn', 'dd');
                this.addTarget(t);
                return t;
            }
        },
        /**
        * @attribute haltDown
        * @description Should the mousedown event be halted. Default: true
        * @type Boolean
        */
        haltDown: {
            value: true
        }
    };

    Y.extend(Drag, Y.Base, {
        /**
        * @private
        * @property _bubbleTargets
        * @description The default bubbleTarget for this object. Default: Y.DD.DDM
        */
        _bubbleTargets: Y.DD.DDM,
        /**
        * @method addToGroup
        * @description Add this Drag instance to a group, this should be used for on-the-fly group additions.
        * @param {String} g The group to add this Drag Instance to.
        * @return {Self}
        * @chainable
        */
        addToGroup: function(g) {
            this._groups[g] = true;
            DDM._activateTargets();
            return this;
        },
        /**
        * @method removeFromGroup
        * @description Remove this Drag instance from a group, this should be used for on-the-fly group removals.
        * @param {String} g The group to remove this Drag Instance from.
        * @return {Self}
        * @chainable
        */
        removeFromGroup: function(g) {
            delete this._groups[g];
            DDM._activateTargets();
            return this;
        },
        /**
        * @property target
        * @description This will be a reference to the Drop instance associated with this drag if the target: true config attribute is set..
        * @type {Object}
        */
        target: null,
        /**
        * @private
        * @method _handleTarget
        * @description Attribute handler for the target config attribute.
        * @param {Boolean/Object}
        * @return {Boolean/Object}
        */
        _handleTarget: function(config) {
            if (Y.DD.Drop) {
                if (config === false) {
                    if (this.target) {
                        DDM._unregTarget(this.target);
                        this.target = null;
                    }
                    return false;
                } else {
                    if (!Y.Lang.isObject(config)) {
                        config = {};
                    }
                    config.bubbleTargets = ('bubbleTargets' in config) ? config.bubbleTargets : Y.Object.values(this._yuievt.targets);
                    config.node = this.get(NODE);
                    config.groups = config.groups || this.get('groups');
                    this.target = new Y.DD.Drop(config);
                }
            } else {
                return false;
            }
        },
        /**
        * @private
        * @property _groups
        * @description Storage Array for the groups this drag belongs to.
        * @type {Array}
        */
        _groups: null,
        /**
        * @private
        * @method _createEvents
        * @description This method creates all the events for this Event Target and publishes them so we get Event Bubbling.
        */
        _createEvents: function() {
            
            this.publish(EV_MOUSE_DOWN, {
                defaultFn: this._defMouseDownFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });
            
            this.publish(EV_ALIGN, {
                defaultFn: this._defAlignFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });
            
            this.publish(EV_DRAG, {
                defaultFn: this._defDragFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });
            
            this.publish(EV_END, {
                defaultFn: this._defEndFn,
                preventedFn: this._prevEndFn,
                queuable: false,
                emitFacade: true,
                bubbles: true,
                prefix: 'drag'
            });
            
            var ev = [
                EV_AFTER_MOUSE_DOWN,
                EV_REMOVE_HANDLE,
                EV_ADD_HANDLE,
                EV_REMOVE_INVALID,
                EV_ADD_INVALID,
                EV_START,
                'drag:drophit',
                'drag:dropmiss',
                'drag:over',
                'drag:enter',
                'drag:exit'
            ];
            
            Y.each(ev, function(v, k) {
                this.publish(v, {
                    type: v,
                    emitFacade: true,
                    bubbles: true,
                    preventable: false,
                    queuable: false,
                    prefix: 'drag'
                });
            }, this);
        },
        /**
        * @private
        * @property _ev_md
        * @description A private reference to the mousedown DOM event
        * @type {Event.Facade}
        */
        _ev_md: null,
        /**
        * @private
        * @property _startTime
        * @description The getTime of the mousedown event. Not used, just here in case someone wants/needs to use it.
        * @type Date
        */
        _startTime: null,
        /**
        * @private
        * @property _endTime
        * @description The getTime of the mouseup event. Not used, just here in case someone wants/needs to use it.
        * @type Date
        */
        _endTime: null,
        /**
        * @private
        * @property _handles
        * @description A private hash of the valid drag handles
        * @type {Object}
        */
        _handles: null,
        /**
        * @private
        * @property _invalids
        * @description A private hash of the invalid selector strings
        * @type {Object}
        */
        _invalids: null,
        /**
        * @private
        * @property _invalidsDefault
        * @description A private hash of the default invalid selector strings: {'textarea': true, 'input': true, 'a': true, 'button': true, 'select': true}
        * @type {Object}
        */
        _invalidsDefault: {'textarea': true, 'input': true, 'a': true, 'button': true, 'select': true },
        /**
        * @private
        * @property _dragThreshMet
        * @description Private flag to see if the drag threshhold was met
        * @type {Boolean}
        */
        _dragThreshMet: null,
        /**
        * @private
        * @property _fromTimeout
        * @description Flag to determine if the drag operation came from a timeout
        * @type {Boolean}
        */
        _fromTimeout: null,
        /**
        * @private
        * @property _clickTimeout
        * @description Holder for the setTimeout call
        * @type {Boolean}
        */
        _clickTimeout: null,
        /**
        * @property deltaXY
        * @description The offset of the mouse position to the element's position
        * @type {Array}
        */
        deltaXY: null,
        /**
        * @property startXY
        * @description The initial mouse position
        * @type {Array}
        */
        startXY: null,
        /**
        * @property nodeXY
        * @description The initial element position
        * @type {Array}
        */
        nodeXY: null,
        /**
        * @property lastXY
        * @description The position of the element as it's moving (for offset calculations)
        * @type {Array}
        */
        lastXY: null,
        /**
        * @property actXY
        * @description The xy that the node will be set to. Changing this will alter the position as it's dragged.
        * @type {Array}
        */
        actXY: null,
        /**
        * @property realXY
        * @description The real xy position of the node.
        * @type {Array}
        */
        realXY: null,
        /**
        * @property mouseXY
        * @description The XY coords of the mousemove
        * @type {Array}
        */
        mouseXY: null,
        /**
        * @property region
        * @description A region object associated with this drag, used for checking regions while dragging.
        * @type Object
        */
        region: null,       
        /**
        * @private
        * @method _handleMouseUp
        * @description Handler for the mouseup DOM event
        * @param {Event.Facade}
        */
        _handleMouseUp: function(ev) {
            this._fixIEMouseUp();
            if (DDM.activeDrag) {
                DDM._end();
            }
        },
        /** 
        * @private
        * @method _fixDragStart
        * @description The function we use as the ondragstart handler when we start a drag in Internet Explorer. This keeps IE from blowing up on images as drag handles.
        */
        _fixDragStart: function(e) {
            e.preventDefault();
        },
        /** 
        * @private
        * @method _ieSelectFix
        * @description The function we use as the onselectstart handler when we start a drag in Internet Explorer
        */
        _ieSelectFix: function() {
            return false;
        },
        /** 
        * @private
        * @property _ieSelectBack
        * @description We will hold a copy of the current "onselectstart" method on this property, and reset it after we are done using it.
        */
        _ieSelectBack: null,
        /**
        * @private
        * @method _fixIEMouseDown
        * @description This method copies the onselectstart listner on the document to the _ieSelectFix property
        */
        _fixIEMouseDown: function(e) {
            if (Y.UA.ie) {
                this._ieSelectBack = Y.config.doc.body.onselectstart;
                Y.config.doc.body.onselectstart = this._ieSelectFix;
            }           
        },
        /**
        * @private
        * @method _fixIEMouseUp
        * @description This method copies the _ieSelectFix property back to the onselectstart listner on the document.
        */
        _fixIEMouseUp: function() {
            if (Y.UA.ie) {
                Y.config.doc.body.onselectstart = this._ieSelectBack;
            }           
        },
        /**
        * @private
        * @method _handleMouseDownEvent
        * @description Handler for the mousedown DOM event
        * @param {Event.Facade}
        */
        _handleMouseDownEvent: function(ev) {
            this.fire(EV_MOUSE_DOWN, { ev: ev });
        },
        /**
        * @private
        * @method _defMouseDownFn
        * @description Handler for the mousedown DOM event
        * @param {Event.Facade}
        */
        _defMouseDownFn: function(e) {
            var ev = e.ev;

            this._dragThreshMet = false;
            this._ev_md = ev;
            
            if (this.get('primaryButtonOnly') && ev.button > 1) {
                return false;
            }
            if (this.validClick(ev)) {
                this._fixIEMouseDown(ev);
                if (this.get('haltDown')) {
                    Y.log('Halting MouseDown', 'info', 'drag');
                    ev.halt();
                } else {
                    Y.log('Preventing Default on MouseDown', 'info', 'drag');
                    ev.preventDefault();
                }
                
                this._setStartPosition([ev.pageX, ev.pageY]);

                DDM.activeDrag = this;
                
                this._clickTimeout = Y.later(this.get('clickTimeThresh'), this, this._timeoutCheck);
            }
            this.fire(EV_AFTER_MOUSE_DOWN, { ev: ev });
        },
        /**
        * @method validClick
        * @description Method first checks to see if we have handles, if so it validates the click against the handle. Then if it finds a valid handle, it checks it against the invalid handles list. Returns true if a good handle was used, false otherwise.
        * @param {Event.Facade}
        * @return {Boolean}
        */
        validClick: function(ev) {
            var r = false, n = false,
            tar = ev.target,
            hTest = null,
            els = null,
            nlist = null,
            set = false;
            if (this._handles) {
                Y.each(this._handles, function(i, n) {
                    if (i instanceof Y.Node || i instanceof Y.NodeList) {
                        if (!r) {
                            nlist = i;
                            if (nlist instanceof Y.Node) {
                                nlist = new Y.NodeList(i._node);
                            }
                            nlist.each(function(nl) {
                                if (nl.contains(tar)) {
                                    r = true;
                                }
                            });
                        }
                    } else if (Y.Lang.isString(n)) {
                        //Am I this or am I inside this
                        if (tar.test(n + ', ' + n + ' *') && !hTest) {
                            hTest = n;
                            r = true;
                        }
                    }
                });
            } else {
                n = this.get(NODE);
                if (n.contains(tar) || n.compareTo(tar)) {
                    r = true;
                }
            }
            if (r) {
                if (this._invalids) {
                    Y.each(this._invalids, function(i, n) {
                        if (Y.Lang.isString(n)) {
                            //Am I this or am I inside this
                            if (tar.test(n + ', ' + n + ' *')) {
                                r = false;
                            }
                        }
                    });
                }
            }
            if (r) {
                if (hTest) {
                    els = ev.currentTarget.all(hTest);
                    set = false;
                    els.each(function(n, i) {
                        if ((n.contains(tar) || n.compareTo(tar)) && !set) {
                            set = true;
                            this.set('activeHandle', n);
                        }
                    }, this);
                } else {
                    this.set('activeHandle', this.get(NODE));
                }
            }
            return r;
        },
        /**
        * @private
        * @method _setStartPosition
        * @description Sets the current position of the Element and calculates the offset
        * @param {Array} xy The XY coords to set the position to.
        */
        _setStartPosition: function(xy) {
            this.startXY = xy;
            
            this.nodeXY = this.lastXY = this.realXY = this.get(NODE).getXY();
            
            if (this.get('offsetNode')) {
                this.deltaXY = [(this.startXY[0] - this.nodeXY[0]), (this.startXY[1] - this.nodeXY[1])];
            } else {
                this.deltaXY = [0, 0];
            }
        },
        /**
        * @private
        * @method _timeoutCheck
        * @description The method passed to setTimeout to determine if the clickTimeThreshold was met.
        */
        _timeoutCheck: function() {
            if (!this.get('lock') && !this._dragThreshMet && this._ev_md) {
                this._fromTimeout = this._dragThreshMet = true;
                this.start();
                this._alignNode([this._ev_md.pageX, this._ev_md.pageY], true);
            }
        },
        /**
        * @method removeHandle
        * @description Remove a Selector added by addHandle
        * @param {String} str The selector for the handle to be removed. 
        * @return {Self}
        * @chainable
        */
        removeHandle: function(str) {
            var key = str;
            if (str instanceof Y.Node || str instanceof Y.NodeList) {
                key = str._yuid;
            }
            if (this._handles[key]) {
                delete this._handles[key];
                this.fire(EV_REMOVE_HANDLE, { handle: str });
            }
            return this;
        },
        /**
        * @method addHandle
        * @description Add a handle to a drag element. Drag only initiates when a mousedown happens on this element.
        * @param {String} str The selector to test for a valid handle. Must be a child of the element.
        * @return {Self}
        * @chainable
        */
        addHandle: function(str) {
            if (!this._handles) {
                this._handles = {};
            }
            var key = str;
            if (str instanceof Y.Node || str instanceof Y.NodeList) {
                key = str._yuid;
            }
            this._handles[key] = str;
            this.fire(EV_ADD_HANDLE, { handle: str });
            return this;
        },
        /**
        * @method removeInvalid
        * @description Remove an invalid handle added by addInvalid
        * @param {String} str The invalid handle to remove from the internal list.
        * @return {Self}
        * @chainable
        */
        removeInvalid: function(str) {
            if (this._invalids[str]) {
                this._invalids[str] = null;
                delete this._invalids[str];
                this.fire(EV_REMOVE_INVALID, { handle: str });
            }
            return this;
        },
        /**
        * @method addInvalid
        * @description Add a selector string to test the handle against. If the test passes the drag operation will not continue.
        * @param {String} str The selector to test against to determine if this is an invalid drag handle.
        * @return {Self}
        * @chainable
        */
        addInvalid: function(str) {
            if (Y.Lang.isString(str)) {
                this._invalids[str] = true;
                this.fire(EV_ADD_INVALID, { handle: str });
            }
            return this;
        },
        /**
        * @private
        * @method initializer
        * @description Internal init handler
        */
        initializer: function(cfg) {
            this.get(NODE).dd = this;

            if (!this.get(NODE).get('id')) {
                var id = Y.stamp(this.get(NODE));
                this.get(NODE).set('id', id);
            }

            this.actXY = [];
            
            this._invalids = Y.clone(this._invalidsDefault, true);

            this._createEvents();
            
            if (!this.get(DRAG_NODE)) {
                this.set(DRAG_NODE, this.get(NODE));
            }

            //Fix for #2528096
            //Don't prep the DD instance until all plugins are loaded.
            this.on('initializedChange', Y.bind(this._prep, this));

            //Shouldn't have to do this..
            this.set('groups', this.get('groups'));
        },
        /**
        * @private
        * @method _prep
        * @description Attach event listners and add classname
        */
        _prep: function() {
            this._dragThreshMet = false;
            var node = this.get(NODE);
            node.addClass(DDM.CSS_PREFIX + '-draggable');

            node.addClass(DDM.CSS_PREFIX + '-draggable');
            node.on(Drag.START_EVENT, Y.bind(this._handleMouseDownEvent, this));
            node.on('mouseup', Y.bind(this._handleMouseUp, this));
            node.on('dragstart', Y.bind(this._fixDragStart, this));
        },
        /**
        * @private
        * @method _unprep
        * @description Detach event listeners and remove classname
        */
        _unprep: function() {
            var node = this.get(NODE);
            node.removeClass(DDM.CSS_PREFIX + '-draggable');
            node.detachAll();
        },
        /**
        * @method start
        * @description Starts the drag operation
        * @return {Self}
        * @chainable
        */
        start: function() {
            if (!this.get('lock') && !this.get(DRAGGING)) {
                var node = this.get(NODE), ow, oh, xy;
                this._startTime = (new Date()).getTime();

                DDM._start();
                node.addClass(DDM.CSS_PREFIX + '-dragging');
                this.fire(EV_START, {
                    pageX: this.nodeXY[0],
                    pageY: this.nodeXY[1],
                    startTime: this._startTime
                });
                node = this.get(DRAG_NODE);
                xy = this.nodeXY;
                
                ow = node.get(OFFSET_WIDTH);
                oh = node.get(OFFSET_HEIGHT);
                
                if (this.get('startCentered')) {
                    this._setStartPosition([xy[0] + (ow / 2), xy[1] + (oh / 2)]);
                }
                
                
                this.region = {
                    '0': xy[0], 
                    '1': xy[1],
                    area: 0,
                    top: xy[1],
                    right: xy[0] + ow,
                    bottom: xy[1] + oh,
                    left: xy[0]
                };
                this.set(DRAGGING, true);
            }
            return this;
        },
        /**
        * @method end
        * @description Ends the drag operation
        * @return {Self}
        * @chainable
        */
        end: function() {
            this._endTime = (new Date()).getTime();
            if (this._clickTimeout) {
                this._clickTimeout.cancel();
            }
            this._dragThreshMet = this._fromTimeout = false;

            if (!this.get('lock') && this.get(DRAGGING)) {
                this.fire(EV_END, {
                    pageX: this.lastXY[0],
                    pageY: this.lastXY[1],
                    startTime: this._startTime,
                    endTime: this._endTime
                });
            }
            this.get(NODE).removeClass(DDM.CSS_PREFIX + '-dragging');
            this.set(DRAGGING, false);
            this.deltaXY = [0, 0];

            return this;
        },
        /**
        * @private
        * @method _defEndFn
        * @description Handler for fixing the selection in IE
        */
        _defEndFn: function(e) {
            this._fixIEMouseUp();
            this._ev_md = null;
        },
        /**
        * @private
        * @method _prevEndFn
        * @description Handler for preventing the drag:end event. It will reset the node back to it's start position
        */
        _prevEndFn: function(e) {
            this._fixIEMouseUp();
            //Bug #1852577
            this.get(DRAG_NODE).setXY(this.nodeXY);
            this._ev_md = null;
            this.region = null;
        },
        /**
        * @private
        * @method _align
        * @description Calculates the offsets and set's the XY that the element will move to.
        * @param {Array} xy The xy coords to align with.
        */
        _align: function(xy) {
            this.fire(EV_ALIGN, {pageX: xy[0], pageY: xy[1] });
        },
        /**
        * @private
        * @method _defAlignFn
        * @description Calculates the offsets and set's the XY that the element will move to.
        * @param {Event.Facade} e The drag:align event.
        */
        _defAlignFn: function(e) {
            this.actXY = [e.pageX - this.deltaXY[0], e.pageY - this.deltaXY[1]];
        },
        /**
        * @private
        * @method _alignNode
        * @description This method performs the alignment before the element move.
        * @param {Array} eXY The XY to move the element to, usually comes from the mousemove DOM event.
        */
        _alignNode: function(eXY) {
            this._align(eXY);
            this._moveNode();
        },
        /**
        * @private
        * @method _moveNode
        * @description This method performs the actual element move.
        */
        _moveNode: function(scroll) {
            //if (!this.get(DRAGGING)) {
            //    return;
            //}
            var diffXY = [], diffXY2 = [], startXY = this.nodeXY, xy = this.actXY;

            diffXY[0] = (xy[0] - this.lastXY[0]);
            diffXY[1] = (xy[1] - this.lastXY[1]);

            diffXY2[0] = (xy[0] - this.nodeXY[0]);
            diffXY2[1] = (xy[1] - this.nodeXY[1]);


            this.region = {
                '0': xy[0], 
                '1': xy[1],
                area: 0,
                top: xy[1],
                right: xy[0] + this.get(DRAG_NODE).get(OFFSET_WIDTH),
                bottom: xy[1] + this.get(DRAG_NODE).get(OFFSET_HEIGHT),
                left: xy[0]
            };

            this.fire(EV_DRAG, {
                pageX: xy[0],
                pageY: xy[1],
                scroll: scroll,
                info: {
                    start: startXY,
                    xy: xy,
                    delta: diffXY,
                    offset: diffXY2
                } 
            });
            
            this.lastXY = xy;
        },
        /**
        * @private
        * @method _defDragFn
        * @description Default function for drag:drag. Fired from _moveNode.
        * @param {Event.Facade} ev The drag:drag event
        */
        _defDragFn: function(e) {
            if (this.get('move')) {
                if (e.scroll) {
                    e.scroll.node.set('scrollTop', e.scroll.top);
                    e.scroll.node.set('scrollLeft', e.scroll.left);
                }
                this.get(DRAG_NODE).setXY([e.pageX, e.pageY]);
                this.realXY = [e.pageX, e.pageY];
            }
        },
        /**
        * @private
        * @method _move
        * @description Fired from DragDropMgr (DDM) on mousemove.
        * @param {Event.Facade} ev The mousemove DOM event
        */
        _move: function(ev) {
            if (this.get('lock')) {
                return false;
            } else {
                this.mouseXY = [ev.pageX, ev.pageY];
                if (!this._dragThreshMet) {
                    var diffX = Math.abs(this.startXY[0] - ev.pageX),
                    diffY = Math.abs(this.startXY[1] - ev.pageY);
                    if (diffX > this.get('clickPixelThresh') || diffY > this.get('clickPixelThresh')) {
                        this._dragThreshMet = true;
                        this.start();
                        this._alignNode([ev.pageX, ev.pageY]);
                    }
                } else {
                    if (this._clickTimeout) {
                        this._clickTimeout.cancel();
                    }
                    this._alignNode([ev.pageX, ev.pageY]);
                }
            }
        },
        /**
        * @method stopDrag
        * @description Method will forcefully stop a drag operation. For example calling this from inside an ESC keypress handler will stop this drag.
        * @return {Self}
        * @chainable
        */
        stopDrag: function() {
            if (this.get(DRAGGING)) {
                DDM._end();
            }
            return this;
        },
        /**
        * @private
        * @method destructor
        * @description Lifecycle destructor, unreg the drag from the DDM and remove listeners
        */
        destructor: function() {
            this._unprep();
            this.detachAll();
            if (this.target) {
                this.target.destroy();
            }
            DDM._unregDrag(this);
        }
    });
    Y.namespace('DD');    
    Y.DD.Drag = Drag;





}, '@VERSION@' ,{requires:['dd-ddm-base'], skinnable:false});
YUI.add('dd-proxy', function(Y) {


    /**
     * Plugin for dd-drag for creating a proxy drag node, instead of dragging the original node.
     * @module dd
     * @submodule dd-proxy
     */
    /**
     * Plugin for dd-drag for creating a proxy drag node, instead of dragging the original node.
     * @class DDProxy
     * @extends Base
     * @constructor
     * @namespace Plugin     
     */
    var DDM = Y.DD.DDM,
        NODE = 'node',
        DRAG_NODE = 'dragNode',
        HOST = 'host',
        TRUE = true, proto,
        P = function(config) {
            P.superclass.constructor.apply(this, arguments);
        };
    
    P.NAME = 'DDProxy';
    /**
    * @property NS
    * @default con
    * @readonly
    * @protected
    * @static
    * @description The Proxy instance will be placed on the Drag instance under the proxy namespace.
    * @type {String}
    */
    P.NS = 'proxy';

    P.ATTRS = {
        host: {
        },
        /**
        * @attribute moveOnEnd
        * @description Move the original node at the end of the drag. Default: true
        * @type Boolean
        */
        moveOnEnd: {
            value: TRUE
        },
        /**
        * @attribute hideOnEnd
        * @description Hide the drag node at the end of the drag. Default: true
        * @type Boolean
        */
        hideOnEnd: {
            value: TRUE
        },
        /**
        * @attribute resizeFrame
        * @description Make the Proxy node assume the size of the original node. Default: true
        * @type Boolean
        */
        resizeFrame: {
            value: TRUE
        },
        /**
        * @attribute positionProxy
        * @description Make the Proxy node appear in the same place as the original node. Default: true
        * @type Boolean
        */
        positionProxy: {
            value: TRUE
        },
        /**
        * @attribute borderStyle
        * @description The default border style for the border of the proxy. Default: 1px solid #808080
        * @type Boolean
        */
        borderStyle: {
            value: '1px solid #808080'
        },
        /**
        * @attribute cloneNode
        * @description Should the node be cloned into the proxy for you. Default: false
        * @type Boolean
        */
        cloneNode: {
            value: false
        }
    };

    proto = {
        /**
        * @private
        * @property _hands
        * @description Holds the event handles for setting the proxy
        */
        _hands: null,
        /**
        * @private
        * @method _init
        * @description Handler for the proxy config attribute
        */
        _init: function() {
            if (!DDM._proxy) {
                DDM._createFrame();
                Y.on('domready', Y.bind(this._init, this));
                return;
            }
            if (!this._hands) {
                this._hands = [];
            }
            var h, h1, host = this.get(HOST), dnode = host.get(DRAG_NODE);
            if (dnode.compareTo(host.get(NODE))) {
                if (DDM._proxy) {
                    host.set(DRAG_NODE, DDM._proxy);
                }
            }
            Y.each(this._hands, function(v) {
                v.detach();
            });
            h = DDM.on('ddm:start', Y.bind(function() {
                if (DDM.activeDrag === host) {
                    DDM._setFrame(host);
                }
            }, this));
            h1 = DDM.on('ddm:end', Y.bind(function() {
                if (host.get('dragging')) {
                    if (this.get('moveOnEnd')) {
                        host.get(NODE).setXY(host.lastXY);
                    }
                    if (this.get('hideOnEnd')) {
                        host.get(DRAG_NODE).setStyle('display', 'none');
                    }
                    if (this.get('cloneNode')) {
                        host.get(DRAG_NODE).remove();
                        host.set(DRAG_NODE, DDM._proxy);
                    }
                }
            }, this));
            this._hands = [h, h1];
        },
        initializer: function() {
            this._init();
        },
        destructor: function() {
            var host = this.get(HOST);
            Y.each(this._hands, function(v) {
                v.detach();
            });
            host.set(DRAG_NODE, host.get(NODE));
        },
        clone: function() {
            var host = this.get(HOST),
                n = host.get(NODE),
                c = n.cloneNode(true);

            delete c._yuid;
            c.setAttribute('id', Y.guid());
            c.setStyle('position', 'absolute');
            n.get('parentNode').appendChild(c);
            host.set(DRAG_NODE, c);
            return c;
        }
    };
    
    Y.namespace('Plugin');
    Y.extend(P, Y.Base, proto);
    Y.Plugin.DDProxy = P;

    //Add a couple of methods to the DDM
    Y.mix(DDM, {
        /**
        * @private
        * @for DDM
        * @namespace DD
        * @method _createFrame
        * @description Create the proxy element if it doesn't already exist and set the DD.DDM._proxy value
        */
        _createFrame: function() {
            if (!DDM._proxy) {
                DDM._proxy = TRUE;

                var p = Y.Node.create('<div></div>'),
                b = Y.one('body');

                p.setStyles({
                    position: 'absolute',
                    display: 'none',
                    zIndex: '999',
                    top: '-999px',
                    left: '-999px'
                });

                b.prepend(p);
                p.set('id', Y.guid());
                p.addClass(DDM.CSS_PREFIX + '-proxy');
                DDM._proxy = p;
            }
        },
        /**
        * @private
        * @for DDM
        * @namespace DD
        * @method _setFrame
        * @description If resizeProxy is set to true (default) it will resize the proxy element to match the size of the Drag Element.
        * If positionProxy is set to true (default) it will position the proxy element in the same location as the Drag Element.
        */
        _setFrame: function(drag) {
            var n = drag.get(NODE), d = drag.get(DRAG_NODE), ah, cur = 'auto';
            
            ah = DDM.activeDrag.get('activeHandle');
            if (ah) {
                cur = ah.getStyle('cursor');
            }
            if (cur == 'auto') {
                cur = DDM.get('dragCursor');
            }

            d.setStyles({
                visibility: 'hidden',
                display: 'block',
                cursor: cur,
                border: drag.proxy.get('borderStyle')
            });

            if (drag.proxy.get('cloneNode')) {
                d = drag.proxy.clone();
            }

            if (drag.proxy.get('resizeFrame')) {
                d.setStyles({
                    height: n.get('offsetHeight') + 'px',
                    width: n.get('offsetWidth') + 'px'
                });
            }

            if (drag.proxy.get('positionProxy')) {
                d.setXY(drag.nodeXY);
            }
            d.setStyle('visibility', 'visible');
        }
    });

    //Create the frame when DOM is ready
    //Y.on('domready', Y.bind(DDM._createFrame, DDM));



}, '@VERSION@' ,{requires:['dd-ddm', 'dd-drag'], skinnable:false});
YUI.add('dd-constrain', function(Y) {


	/**
	 * The Drag & Drop Utility allows you to create a draggable interface efficiently, buffering you from browser-level abnormalities and enabling you to focus on the interesting logic surrounding your particular implementation. This component enables you to create a variety of standard draggable objects with just a few lines of code and then, using its extensive API, add your own specific implementation logic.
	 * @module dd
	 * @submodule dd-constrain
	 */
	/**
	 * Plugin for the dd-drag module to add the constraining methods to it. It supports constraining to a node or viewport. It supports tick based moves and XY axis constraints.
	 * @class DDConstrained
	 * @extends Base
	 * @constructor
	 * @namespace Plugin
	 */

	var DRAG_NODE = 'dragNode',
	    OFFSET_HEIGHT = 'offsetHeight',
	    OFFSET_WIDTH = 'offsetWidth',
	    HOST = 'host',
	    TICK_X_ARRAY = 'tickXArray',
	    TICK_Y_ARRAY = 'tickYArray',
	    DDM = Y.DD.DDM,
	    TOP = 'top',
	    RIGHT = 'right',
	    BOTTOM = 'bottom',
	    LEFT = 'left',
	    VIEW = 'view',
	    proto = null,

		/**
	    * @event drag:tickAlignX
	    * @description Fires when this node is aligned with the tickX value.
	    * @param {Event.Facade} event An Event Facade object
	    * @type {Event.Custom}
	    */
	    EV_TICK_ALIGN_X = 'drag:tickAlignX',

		/**
	    * @event drag:tickAlignY
	    * @description Fires when this node is aligned with the tickY value.
	    * @param {Event.Facade} event An Event Facade object
	    * @type {Event.Custom}
	    */
	    EV_TICK_ALIGN_Y = 'drag:tickAlignY',

	    C = function(config) {
	        this._lazyAddAttrs = false;
	        C.superclass.constructor.apply(this, arguments);
	    };

	C.NAME = 'ddConstrained';
	/**
	* @property NS
	* @default con
	* @readonly
	* @protected
	* @static
	* @description The Constrained instance will be placed on the Drag instance under the con namespace.
	* @type {String}
*/
	C.NS = 'con';

	C.ATTRS = {
	    host: {
	    },
	    /**
	    * @attribute stickX
	    * @description Stick the drag movement to the X-Axis. Default: false
	    * @type Boolean
	    */
	    stickX: {
	        value: false
	    },
	    /**
	    * @attribute stickY
	    * @description Stick the drag movement to the Y-Axis
	    * @type Boolean
	    */
	    stickY: {
	        value: false
	    },
	    /**
	    * @attribute tickX
	    * @description The X tick offset the drag node should snap to on each drag move. False for no ticks. Default: false
	    * @type Number/false
	    */
	    tickX: {
	        value: false
	    },
	    /**
	    * @attribute tickY
	    * @description The Y tick offset the drag node should snap to on each drag move. False for no ticks. Default: false
	    * @type Number/false
	    */
	    tickY: {
	        value: false
	    },
	    /**
	    * @attribute tickXArray
	    * @description An array of page coordinates to use as X ticks for drag movement.
	    * @type Array
	    */
	    tickXArray: {
	        value: false
	    },
	    /**
	    * @attribute tickYArray
	    * @description An array of page coordinates to use as Y ticks for drag movement.
	    * @type Array
	    */
	    tickYArray: {
	        value: false
	    },
	    /**
	    * @attribute gutter
	    * @description CSS style string for the gutter of a region (supports negative values): '5 0' (sets top and bottom to 5px, left and right to 0px), '1 2 3 4' (top 1px, right 2px, bottom 3px, left 4px)
	    * @type String
	    */
	    gutter: {
	        value: '0',
	        setter: function(gutter) {
	            return Y.DD.DDM.cssSizestoObject(gutter);
	        }
	    },
	    /**
	    * @attribute constrain
	    * @description Will attempt to constrain the drag node to the boundaries. Arguments:<br>
	    * 'view': Contrain to Viewport<br>
	    * '#selector_string': Constrain to this node<br>
	    * '{Region Object}': An Object Literal containing a valid region (top, right, bottom, left) of page positions
	    * @type {String/Object/Node}
	    */
	    constrain: {
	        value: VIEW,
	        setter: function(con) {
	            var node = Y.one(con);
	            if (node) {
	                con = node;
	            }
	            return con;
	        }
	    },
	    /**
	    * @deprecated
	    * @attribute constrain2region
	    * @description An Object Literal containing a valid region (top, right, bottom, left) of page positions to constrain the drag node to.
	    * @type Object
	    */
	    constrain2region: {
	        setter: function(r) {
	            return this.set('constrain', r);
	        }
	    },
	    /**
	    * @deprecated
	    * @attribute constrain2node
	    * @description Will attempt to constrain the drag node to the boundaries of this node.
	    * @type Object
	    */
	    constrain2node: {
	        setter: function(n) {
	            return this.set('constrain', Y.one(n));
	        }
	    },
	    /**
	    * @deprecated
	    * @attribute constrain2view
	    * @description Will attempt to constrain the drag node to the boundaries of the viewport region.
	    * @type Object
	    */
	    constrain2view: {
	        setter: function(n) {
	            return this.set('constrain', VIEW);
	        }
	    },
	    /**
	    * @attribute cacheRegion
	    * @description Should the region be cached for performace. Default: true
	    * @type Boolean
	    */
	    cacheRegion: {
	        value: true
	    }
	};

	proto = {
		_lastTickXFired: null,
		_lastTickYFired: null,

	    initializer: function() {
			this._createEvents();

	        this.get(HOST).on('drag:end', Y.bind(this._handleEnd, this));
	        this.get(HOST).on('drag:start', Y.bind(this._handleStart, this));
	        this.get(HOST).after('drag:align', Y.bind(this.align, this));
	        this.get(HOST).after('drag:drag', Y.bind(this.drag, this));
	    },
	    /**
	    * @private
	    * @method _createEvents
	    * @description This method creates all the events for this Event Target and publishes them so we get Event Bubbling.
	    */
		_createEvents: function() {
			var instance = this;

			var ev = [
				EV_TICK_ALIGN_X,
				EV_TICK_ALIGN_Y
			];

			Y.each(ev, function(v, k) {
	            this.publish(v, {
	                type: v,
	                emitFacade: true,
	                bubbles: true,
	                queuable: false,
	                prefix: 'drag'
	            });
	        }, this);
		},
		/**
	    * @private
	    * @method _handleEnd
	    * @description Fires on drag:end
	    */
	    _handleEnd: function() {
			this._lastTickYFired = null;
			this._lastTickXFired = null;
	    },
	    /**
	    * @private
	    * @method _handleStart
	    * @description Fires on drag:start and clears the _regionCache
	    */
	    _handleStart: function() {
	        this.resetCache();
	    },
	    /**
	    * @private
	    * @property _regionCache
	    * @description Store a cache of the region that we are constraining to
	    * @type Object
	    */
	    _regionCache: null,
	    /**
	    * @private
	    * @method _cacheRegion
	    * @description Get's the region and caches it, called from window.resize and when the cache is null
	    */
	    _cacheRegion: function() {
	        this._regionCache = this.get('constrain').get('region');
	    },
	    /**
	    * @method resetCache
	    * @description Reset the internal region cache.
	    */
	    resetCache: function() {
	        this._regionCache = null;
	    },
	    /**
	    * @private
	    * @method _getConstraint
	    * @description Standardizes the 'constraint' attribute
	    */
	    _getConstraint: function() {
	        var con = this.get('constrain'),
	            g = this.get('gutter'),
	            region;

	        if (con) {
	            if (con instanceof Y.Node) {
	                if (!this._regionCache) {
	                    Y.on('resize', Y.bind(this._cacheRegion, this), Y.config.win);
	                    this._cacheRegion();
	                }
	                region = Y.clone(this._regionCache);
	                if (!this.get('cacheRegion')) {
	                    this.resetCache();
	                }
	            } else if (Y.Lang.isObject(con)) {
	                region = Y.clone(con);
	            }
	        }
	        if (!con || !region) {
	            con = VIEW;
	        }
	        if (con === VIEW) {
	            region = this.get(HOST).get(DRAG_NODE).get('viewportRegion');
	        }

	        Y.each(g, function(i, n) {
	            if ((n == RIGHT) || (n == BOTTOM)) {
	                region[n] -= i;
	            } else {
	                region[n] += i;
	            }
	        });
	        return region;
	    },

	    /**
	    * @method getRegion
	    * @description Get the active region: viewport, node, custom region
	    * @param {Boolean} inc Include the node's height and width
	    * @return {Object}
	    */
	    getRegion: function(inc) {
	        var r = {}, oh = null, ow = null,
	            host = this.get(HOST);

	        r = this._getConstraint();

	        if (inc) {
	            oh = host.get(DRAG_NODE).get(OFFSET_HEIGHT);
	            ow = host.get(DRAG_NODE).get(OFFSET_WIDTH);
	            r[RIGHT] = r[RIGHT] - ow;
	            r[BOTTOM] = r[BOTTOM] - oh;
	        }
	        return r;
	    },
	    /**
	    * @private
	    * @method _checkRegion
	    * @description Check if xy is inside a given region, if not change to it be inside.
	    * @param {Array} _xy The XY to check if it's in the current region, if it isn't inside the region, it will reset the xy array to be inside the region.
	    * @return {Array} The new XY that is inside the region
	    */
	    _checkRegion: function(_xy) {
	        var oxy = _xy,
	            r = this.getRegion(),
	            host = this.get(HOST),
	            oh = host.get(DRAG_NODE).get(OFFSET_HEIGHT),
	            ow = host.get(DRAG_NODE).get(OFFSET_WIDTH);

	            if (oxy[1] > (r[BOTTOM] - oh)) {
	                _xy[1] = (r[BOTTOM] - oh);
	            }
	            if (r[TOP] > oxy[1]) {
	                _xy[1] = r[TOP];

	            }
	            if (oxy[0] > (r[RIGHT] - ow)) {
	                _xy[0] = (r[RIGHT] - ow);
	            }
	            if (r[LEFT] > oxy[0]) {
	                _xy[0] = r[LEFT];
	            }

	        return _xy;
	    },
	    /**
	    * @method inRegion
	    * @description Checks if the XY passed or the dragNode is inside the active region.
	    * @param {Array} xy Optional XY to check, if not supplied this.get('dragNode').getXY() is used.
	    * @return {Boolean} True if the XY is inside the region, false otherwise.
	    */
	    inRegion: function(xy) {
	        xy = xy || this.get(HOST).get(DRAG_NODE).getXY();

	        var _xy = this._checkRegion([xy[0], xy[1]]),
	            inside = false;
	            if ((xy[0] === _xy[0]) && (xy[1] === _xy[1])) {
	                inside = true;
	            }
	        return inside;
	    },
	    /**
	    * @method align
	    * @description Modifies the Drag.actXY method from the after drag:align event. This is where the constraining happens.
	    */
	    align: function() {
	        var host = this.get(HOST),
	            _xy = [host.actXY[0], host.actXY[1]],
	            r = this.getRegion(true);

	        if (this.get('stickX')) {
	            _xy[1] = (host.startXY[1] - host.deltaXY[1]);
	        }
	        if (this.get('stickY')) {
	            _xy[0] = (host.startXY[0] - host.deltaXY[0]);
	        }

	        if (r) {
	            _xy = this._checkRegion(_xy);
	        }

	        _xy = this._checkTicks(_xy, r);

	        host.actXY = _xy;
	    },
	    /**
	    * @method drag
	    * @description Fires after drag:drag. Handle the tickX and tickX align events.
	    */
		drag: function(event) {
			var host = this.get(HOST),
				xt = this.get('tickX'),
				yt = this.get('tickY'),
				_xy = [host.actXY[0], host.actXY[1]];

			if ((Y.Lang.isNumber(xt) || this.get(TICK_X_ARRAY)) && (this._lastTickXFired !== _xy[0])) {
				this._tickAlignX();
				this._lastTickXFired = _xy[0];
			}

			if ((Y.Lang.isNumber(yt) || this.get(TICK_Y_ARRAY)) && (this._lastTickYFired !== _xy[1])) {
				this._tickAlignY();
				this._lastTickYFired = _xy[1];
			}
		},
	    /**
	    * @private
	    * @method _checkTicks
	    * @description This method delegates the proper helper method for tick calculations
	    * @param {Array} xy The XY coords for the Drag
	    * @param {Object} r The optional region that we are bound to.
	    * @return {Array} The calced XY coords
	    */
	    _checkTicks: function(xy, r) {
	        var host = this.get(HOST),
	            lx = (host.startXY[0] - host.deltaXY[0]),
	            ly = (host.startXY[1] - host.deltaXY[1]),
	            xt = this.get('tickX'),
	            yt = this.get('tickY');
	            if (xt && !this.get(TICK_X_ARRAY)) {
	                xy[0] = DDM._calcTicks(xy[0], lx, xt, r[LEFT], r[RIGHT]);
	            }
	            if (yt && !this.get(TICK_Y_ARRAY)) {
	                xy[1] = DDM._calcTicks(xy[1], ly, yt, r[TOP], r[BOTTOM]);
	            }
	            if (this.get(TICK_X_ARRAY)) {
	                xy[0] = DDM._calcTickArray(xy[0], this.get(TICK_X_ARRAY), r[LEFT], r[RIGHT]);
	            }
	            if (this.get(TICK_Y_ARRAY)) {
	                xy[1] = DDM._calcTickArray(xy[1], this.get(TICK_Y_ARRAY), r[TOP], r[BOTTOM]);
	            }

	        return xy;
	    },
	    /**
	    * @private
	    * @method _tickAlignX
	    * @description Fires when the actXY[0] reach a new value respecting the tickX gap.
	    */
	    _tickAlignX: function() {
	        this.fire(EV_TICK_ALIGN_X);
	    },
	    /**
	    * @private
	    * @method _tickAlignY
	    * @description Fires when the actXY[1] reach a new value respecting the tickY gap.
	    */
	    _tickAlignY: function() {
	        this.fire(EV_TICK_ALIGN_Y);
	    }
	};

	Y.namespace('Plugin');
	Y.extend(C, Y.Base, proto);
	Y.Plugin.DDConstrained = C;

	Y.mix(DDM, {
	    /**
	    * @for DDM
	    * @namespace DD
	    * @private
	    * @method _calcTicks
	    * @description Helper method to calculate the tick offsets for a given position
	    * @param {Number} pos The current X or Y position
	    * @param {Number} start The start X or Y position
	    * @param {Number} tick The X or Y tick increment
	    * @param {Number} off1 The min offset that we can't pass (region)
	    * @param {Number} off2 The max offset that we can't pass (region)
	    * @return {Number} The new position based on the tick calculation
	    */
	    _calcTicks: function(pos, start, tick, off1, off2) {
	        var ix = ((pos - start) / tick),
	            min = Math.floor(ix),
	            max = Math.ceil(ix);
	            if ((min !== 0) || (max !== 0)) {
	                if ((ix >= min) && (ix <= max)) {
	                    pos = (start + (tick * min));
	                    if (off1 && off2) {
	                        if (pos < off1) {
	                            pos = (start + (tick * (min + 1)));
	                        }
	                        if (pos > off2) {
	                            pos = (start + (tick * (min - 1)));
	                        }
	                    }
	                }
	            }
	            return pos;
	    },
	    /**
	    * @for DDM
	    * @namespace DD
	    * @private
	    * @method _calcTickArray
	    * @description This method is used with the tickXArray and tickYArray config options
	    * @param {Number} pos The current X or Y position
	    * @param {Number} ticks The array containing our custom tick positions.
	    * @param {Number} off1 The min offset that we can't pass (region)
	    * @param {Number} off2 The max offset that we can't pass (region)
	    * @return The tick position
	    */
	    _calcTickArray: function(pos, ticks, off1, off2) {
	        var i = 0, len = ticks.length, next = 0,
	            diff1, diff2, ret;

	        if (!ticks || (ticks.length === 0)) {
	            return pos;
	        } else if (ticks[0] >= pos) {
	            return ticks[0];
	        } else {
	            for (i = 0; i < len; i++) {
	                next = (i + 1);
	                if (ticks[next] && ticks[next] >= pos) {
	                    diff1 = pos - ticks[i];
	                    diff2 = ticks[next] - pos;
	                    ret = (diff2 > diff1) ? ticks[i] : ticks[next];
	                    if (off1 && off2) {
	                        if (ret > off2) {
	                            if (ticks[i]) {
	                                ret = ticks[i];
	                            } else {
	                                ret = ticks[len - 1];
	                            }
	                        }
	                    }
	                    return ret;
	                }

	            }
	            return ticks[ticks.length - 1];
	        }
	    }
	});



}, '@VERSION@' ,{requires:['dd-drag'], skinnable:false});
YUI.add('dd-scroll', function(Y) {


    /**
     * Base scroller class used to create the Plugin.DDNodeScroll and Plugin.DDWinScroll.
     * This class should not be called on it's own, it's designed to be a plugin.
     * @module dd
     * @submodule dd-scroll
     */
    /**
     * Base scroller class used to create the Plugin.DDNodeScroll and Plugin.DDWinScroll.
     * This class should not be called on it's own, it's designed to be a plugin.
     * @class Scroll
     * @extends Base
     * @namespace DD
     * @constructor
     */

    var S = function() {
        S.superclass.constructor.apply(this, arguments);

    },
    WS, NS,
    HOST = 'host',
    BUFFER = 'buffer',
    PARENT_SCROLL = 'parentScroll',
    WINDOW_SCROLL = 'windowScroll',
    SCROLL_TOP = 'scrollTop',
    SCROLL_LEFT = 'scrollLeft',
    OFFSET_WIDTH = 'offsetWidth',
    OFFSET_HEIGHT = 'offsetHeight';


    S.ATTRS = {
        /**
        * @attribute parentScroll
        * @description Internal config option to hold the node that we are scrolling. Should not be set by the developer.
        * @type Node
        */
        parentScroll: {
            value: false,
            setter: function(node) {
                if (node) {
                    return node;
                }
                return false;
            }
        },
        /**
        * @attribute buffer
        * @description The number of pixels from the edge of the screen to turn on scrolling. Default: 30
        * @type Number
        */
        buffer: {
            value: 30,
            validator: Y.Lang.isNumber
        },
        /**
        * @attribute scrollDelay
        * @description The number of milliseconds delay to pass to the auto scroller. Default: 235
        * @type Number
        */
        scrollDelay: {
            value: 235,
            validator: Y.Lang.isNumber
        },
        /**
        * @attribute host
        * @description The host we are plugged into.
        * @type Object
        */
        host: {
            value: null
        },
        /**
        * @attribute windowScroll
        * @description Turn on window scroll support, default: false
        * @type Boolean
        */
        windowScroll: {
            value: false,
            validator: Y.Lang.isBoolean
        },
        /**
        * @attribute vertical
        * @description Allow vertical scrolling, default: true.
        * @type Boolean
        */
        vertical: {
            value: true,
            validator: Y.Lang.isBoolean
        },
        /**
        * @attribute horizontal
        * @description Allow horizontal scrolling, default: true.
        * @type Boolean
        */
        horizontal: {
            value: true,
            validator: Y.Lang.isBoolean
        }
    };

    Y.extend(S, Y.Base, {
        /**
        * @private
        * @property _scrolling
        * @description Tells if we are actively scrolling or not.
        * @type Boolean
        */
        _scrolling: null,
        /**
        * @private
        * @property _vpRegionCache
        * @description Cache of the Viewport dims.
        * @type Object
        */
        _vpRegionCache: null,
        /**
        * @private
        * @property _dimCache
        * @description Cache of the dragNode dims.
        * @type Object
        */
        _dimCache: null,
        /**
        * @private
        * @property _scrollTimer
        * @description Holder for the Timer object returned from Y.later.
        * @type {Y.later}
        */
        _scrollTimer: null,
        /**
        * @private
        * @method _getVPRegion
        * @description Sets the _vpRegionCache property with an Object containing the dims from the viewport.
        */        
        _getVPRegion: function() {
            var r = {},
                n = this.get(PARENT_SCROLL),
            b = this.get(BUFFER),
            ws = this.get(WINDOW_SCROLL),
            xy = ((ws) ? [] : n.getXY()),
            w = ((ws) ? 'winWidth' : OFFSET_WIDTH),
            h = ((ws) ? 'winHeight' : OFFSET_HEIGHT),
            t = ((ws) ? n.get(SCROLL_TOP) : xy[1]),
            l = ((ws) ? n.get(SCROLL_LEFT) : xy[0]);

            r = {
                top: t + b,
                right: (n.get(w) + l) - b,
                bottom: (n.get(h) + t) - b,
                left: l + b
            };
            this._vpRegionCache = r;
            return r;
        },
        initializer: function() {
            var h = this.get(HOST);
            h.after('drag:start', Y.bind(this.start, this));
            h.after('drag:end', Y.bind(this.end, this));
            h.on('drag:align', Y.bind(this.align, this));

            //TODO - This doesn't work yet??
            Y.one('win').on('scroll', Y.bind(function() {
                this._vpRegionCache = null;
            }, this));
        },
        /**
        * @private
        * @method _checkWinScroll
        * @description Check to see if we need to fire the scroll timer. If scroll timer is running this will scroll the window.
        * @param {Boolean} move Should we move the window. From Y.later
        */        
        _checkWinScroll: function(move) {
            var r = this._getVPRegion(),
                ho = this.get(HOST),
                ws = this.get(WINDOW_SCROLL),
                xy = ho.lastXY,
                scroll = false,
                b = this.get(BUFFER),
                win = this.get(PARENT_SCROLL),
                sTop = win.get(SCROLL_TOP),
                sLeft = win.get(SCROLL_LEFT),
                w = this._dimCache.w,
                h = this._dimCache.h,
                bottom = xy[1] + h,
                top = xy[1],
                right = xy[0] + w,
                left = xy[0],
                nt = top,
                nl = left,
                st = sTop,
                sl = sLeft;
            
            if (this.get('horizontal')) {
                if (left <= r.left) {
                    scroll = true;
                    nl = xy[0] - ((ws) ? b : 0);
                    sl = sLeft - b;
                }
                if (right >= r.right) {
                    scroll = true;
                    nl = xy[0] + ((ws) ? b : 0);
                    sl = sLeft + b;
                }
            }
            if (this.get('vertical')) {
                if (bottom >= r.bottom) {
                    scroll = true;
                    nt = xy[1] + ((ws) ? b : 0);
                    st = sTop + b;

                }
                if (top <= r.top) {
                    scroll = true;
                    nt = xy[1] - ((ws) ? b : 0);
                    st = sTop - b;
                }
            }

            if (st < 0) {
                st = 0;
                nt = xy[1];
            }

            if (sl < 0) {
                sl = 0;
                nl = xy[0];
            }

            if (nt < 0) {
                nt = xy[1];
            }
            if (nl < 0) {
                nl = xy[0];
            }
            if (move) {
                ho.actXY = [nl, nt];
                ho._moveNode({ node: win, top: st, left: sl});
                if (!st && !sl) {
                    this._cancelScroll();
                }
            } else {
                if (scroll) {
                    this._initScroll();
                } else {
                    this._cancelScroll();
                }
            }
        },
        /**
        * @private
        * @method _initScroll
        * @description Cancel a previous scroll timer and init a new one.
        */        
        _initScroll: function() {
            this._cancelScroll();
            this._scrollTimer = Y.Lang.later(this.get('scrollDelay'), this, this._checkWinScroll, [true], true);

        },
        /**
        * @private
        * @method _cancelScroll
        * @description Cancel a currently running scroll timer.
        */        
        _cancelScroll: function() {
            this._scrolling = false;
            if (this._scrollTimer) {
                this._scrollTimer.cancel();
                delete this._scrollTimer;
            }
        },
        /**
        * @method align
        * @description Called from the drag:align event to determine if we need to scroll.
        */        
        align: function(e) {
            if (this._scrolling) {
                this._cancelScroll();
                e.preventDefault();
            }
            if (!this._scrolling) {
                this._checkWinScroll();
            }
        },
        /**
        * @private
        * @method _setDimCache
        * @description Set the cache of the dragNode dims.
        */        
        _setDimCache: function() {
            var node = this.get(HOST).get('dragNode');
            this._dimCache = {
                h: node.get(OFFSET_HEIGHT),
                w: node.get(OFFSET_WIDTH)
            };
        },
        /**
        * @method start
        * @description Called from the drag:start event
        */
        start: function() {
            this._setDimCache();
        },
        /**
        * @method end
        * @description Called from the drag:end event
        */
        end: function(xy) {
            this._dimCache = null;
            this._cancelScroll();
        },
        /**
        * @method toString
        * @description General toString method for logging
        * @return String name for the object
        */
        toString: function() {
            return S.NAME + ' #' + this.get('node').get('id');
        }
    });

    Y.namespace('Plugin');

    
    /**
     * Extends the Scroll class to make the window scroll while dragging.
     * @class DDWindowScroll
     * @extends DD.Scroll
     * @namespace Plugin
     * @constructor
     */
    WS = function() {
        WS.superclass.constructor.apply(this, arguments);
    };
    WS.ATTRS = Y.merge(S.ATTRS, {
        /**
        * @attribute windowScroll
        * @description Turn on window scroll support, default: true
        * @type Boolean
        */
        windowScroll: {
            value: true,
            setter: function(scroll) {
                if (scroll) {
                    this.set(PARENT_SCROLL, Y.one('win'));
                }
                return scroll;
            }
        }
    });
    Y.extend(WS, S, {
        //Shouldn't have to do this..
        initializer: function() {
            this.set('windowScroll', this.get('windowScroll'));
        }
    });
    /**
    * @property NS
    * @default winscroll
    * @readonly
    * @protected
    * @static
    * @description The Scroll instance will be placed on the Drag instance under the winscroll namespace.
    * @type {String}
    */
    WS.NAME = WS.NS = 'winscroll';
    Y.Plugin.DDWinScroll = WS;
    

    /**
     * Extends the Scroll class to make a parent node scroll while dragging.
     * @class DDNodeScroll
     * @extends DD.Scroll
     * @namespace Plugin
     * @constructor
     */
    NS = function() {
        NS.superclass.constructor.apply(this, arguments);

    };
    NS.ATTRS = Y.merge(S.ATTRS, {
        /**
        * @attribute node
        * @description The node we want to scroll. Used to set the internal parentScroll attribute.
        * @type Node
        */
        node: {
            value: false,
            setter: function(node) {
                var n = Y.one(node);
                if (!n) {
                    if (node !== false) {
                        Y.error('DDNodeScroll: Invalid Node Given: ' + node);
                    }
                } else {
                    this.set(PARENT_SCROLL, n);
                }
                return n;
            }
        }
    });
    Y.extend(NS, S, {
        //Shouldn't have to do this..
        initializer: function() {
            this.set('node', this.get('node'));
        }
    });
    /**
    * @property NS
    * @default nodescroll
    * @readonly
    * @protected
    * @static
    * @description The NodeScroll instance will be placed on the Drag instance under the nodescroll namespace.
    * @type {String}
    */
    NS.NAME = NS.NS = 'nodescroll';
    Y.Plugin.DDNodeScroll = NS;

    Y.DD.Scroll = S;    



}, '@VERSION@' ,{requires:['dd-drag'], skinnable:false, optional:['dd-proxy']});
YUI.add('dd-drop', function(Y) {


    /**
     * Provides the ability to create a Drop Target.
     * @module dd
     * @submodule dd-drop
     */     
    /**
     * Provides the ability to create a Drop Target.
     * @class Drop
     * @extends Base
     * @constructor
     * @namespace DD
     */

    var NODE = 'node',
        DDM = Y.DD.DDM,
        OFFSET_HEIGHT = 'offsetHeight',
        OFFSET_WIDTH = 'offsetWidth',
        /**
        * @event drop:over
        * @description Fires when a drag element is over this target.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The drop object at the time of the event.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * </dl>        
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_DROP_OVER = 'drop:over',
        /**
        * @event drop:enter
        * @description Fires when a drag element enters this target.
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The drop object at the time of the event.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * </dl>        
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_DROP_ENTER = 'drop:enter',
        /**
        * @event drop:exit
        * @description Fires when a drag element exits this target.
        * @param {Event.Facade} event An Event Facade object
        * @bubbles DDM
        * @type {Event.Custom}
        */
        EV_DROP_EXIT = 'drop:exit',

        /**
        * @event drop:hit
        * @description Fires when a draggable node is dropped on this Drop Target. (Fired from dd-ddm-drop)
        * @param {Event.Facade} event An Event Facade object with the following specific property added:
        * <dl>
        * <dt>drop</dt><dd>The best guess on what was dropped on.</dd>
        * <dt>drag</dt><dd>The drag object at the time of the event.</dd>
        * <dt>others</dt><dd>An array of all the other drop targets that was dropped on.</dd>
        * </dl>        
        * @bubbles DDM
        * @type {Event.Custom}
        */
        

    Drop = function() {
        this._lazyAddAttrs = false;
        Drop.superclass.constructor.apply(this, arguments);


        //DD init speed up.
        Y.on('domready', Y.bind(function() {
            Y.later(100, this, this._createShim);
        }, this));
        DDM._regTarget(this);

        /* TODO
        if (Dom.getStyle(this.el, 'position') == 'fixed') {
            Event.on(window, 'scroll', function() {
                this.activateShim();
            }, this, true);
        }
        */
    };

    Drop.NAME = 'drop';

    Drop.ATTRS = {
        /**
        * @attribute node
        * @description Y.Node instanace to use as the element to make a Drop Target
        * @type Node
        */        
        node: {
            setter: function(node) {
                var n = Y.one(node);
                if (!n) {
                    Y.error('DD.Drop: Invalid Node Given: ' + node);
                }
                return n;               
            }
        },
        /**
        * @attribute groups
        * @description Array of groups to add this drop into.
        * @type Array
        */        
        groups: {
            value: ['default'],
            setter: function(g) {
                this._groups = {};
                Y.each(g, function(v, k) {
                    this._groups[v] = true;
                }, this);
                return g;
            }
        },   
        /**
        * @attribute padding
        * @description CSS style padding to make the Drop Target bigger than the node.
        * @type String
        */
        padding: {
            value: '0',
            setter: function(p) {
                return DDM.cssSizestoObject(p);
            }
        },
        /**
        * @attribute lock
        * @description Set to lock this drop element.
        * @type Boolean
        */        
        lock: {
            value: false,
            setter: function(lock) {
                if (lock) {
                    this.get(NODE).addClass(DDM.CSS_PREFIX + '-drop-locked');
                } else {
                    this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop-locked');
                }
                return lock;
            }
        },
        /**
        * @deprecated
        * @attribute bubbles
        * @description Controls the default bubble parent for this Drop instance. Default: Y.DD.DDM. Set to false to disable bubbling. Use bubbleTargets in config.
        * @type Object
        */
        bubbles: {
            setter: function(t) {
                Y.log('bubbles is deprecated use bubbleTargets: HOST', 'warn', 'dd');
                this.addTarget(t);
                return t;
            }
        },
        /**
        * @deprecated
        * @attribute useShim
        * @description Use the Drop shim. Default: true
        * @type Boolean
        */
        useShim: {
            value: true,
            setter: function(v) {
                Y.DD.DDM._noShim = !v;
                return v;
            }
        }
    };

    Y.extend(Drop, Y.Base, {
        /**
        * @private
        * @property _bubbleTargets
        * @description The default bubbleTarget for this object. Default: Y.DD.DDM
        */
        _bubbleTargets: Y.DD.DDM,
        /**
        * @method addToGroup
        * @description Add this Drop instance to a group, this should be used for on-the-fly group additions.
        * @param {String} g The group to add this Drop Instance to.
        * @return {Self}
        * @chainable
        */
        addToGroup: function(g) {
            this._groups[g] = true;
            return this;
        },
        /**
        * @method removeFromGroup
        * @description Remove this Drop instance from a group, this should be used for on-the-fly group removals.
        * @param {String} g The group to remove this Drop Instance from.
        * @return {Self}
        * @chainable
        */
        removeFromGroup: function(g) {
            delete this._groups[g];
            return this;
        },
        /**
        * @private
        * @method _createEvents
        * @description This method creates all the events for this Event Target and publishes them so we get Event Bubbling.
        */
        _createEvents: function() {
            
            var ev = [
                EV_DROP_OVER,
                EV_DROP_ENTER,
                EV_DROP_EXIT,
                'drop:hit'
            ];

            Y.each(ev, function(v, k) {
                this.publish(v, {
                    type: v,
                    emitFacade: true,
                    preventable: false,
                    bubbles: true,
                    queuable: false,
                    prefix: 'drop'
                });
            }, this);
        },
        /**
        * @private
        * @property _valid
        * @description Flag for determining if the target is valid in this operation.
        * @type Boolean
        */
        _valid: null,
        /**
        * @private
        * @property _groups
        * @description The groups this target belongs to.
        * @type Array
        */
        _groups: null,
        /**
        * @property shim
        * @description Node reference to the targets shim
        * @type {Object}
        */
        shim: null,
        /**
        * @property region
        * @description A region object associated with this target, used for checking regions while dragging.
        * @type Object
        */
        region: null,
        /**
        * @property overTarget
        * @description This flag is tripped when a drag element is over this target.
        * @type Boolean
        */
        overTarget: null,
        /**
        * @method inGroup
        * @description Check if this target is in one of the supplied groups.
        * @param {Array} groups The groups to check against
        * @return Boolean
        */
        inGroup: function(groups) {
            this._valid = false;
            var ret = false;
            Y.each(groups, function(v, k) {
                if (this._groups[v]) {
                    ret = true;
                    this._valid = true;
                }
            }, this);
            return ret;
        },
        /**
        * @private
        * @method initializer
        * @description Private lifecycle method
        */
        initializer: function(cfg) {
            Y.later(100, this, this._createEvents);

            var node = this.get(NODE), id;
            if (!node.get('id')) {
                id = Y.stamp(node);
                node.set('id', id);
            }
            node.addClass(DDM.CSS_PREFIX + '-drop');
            //Shouldn't have to do this..
            this.set('groups', this.get('groups'));           
        },
        /**
        * @private
        * @method destructor
        * @description Lifecycle destructor, unreg the drag from the DDM and remove listeners
        */
        destructor: function() {
            DDM._unregTarget(this);
            if (this.shim && (this.shim !== this.get(NODE))) {
                this.shim.detachAll();
                this.shim.remove();
                this.shim = null;
            }
            this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop');
            this.detachAll();
        },
        /**
        * @private
        * @method _deactivateShim
        * @description Removes classes from the target, resets some flags and sets the shims deactive position [-999, -999]
        */
        _deactivateShim: function() {
            if (!this.shim) {
                return false;
            }
            this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop-active-valid');
            this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop-active-invalid');
            this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop-over');

            if (this.get('useShim')) {
                this.shim.setStyles({
                    top: '-999px',
                    left: '-999px',
                    zIndex: '1'
                });
            }
            this.overTarget = false;
        },
        /**
        * @private
        * @method _activateShim
        * @description Activates the shim and adds some interaction CSS classes
        */
        _activateShim: function() {
            if (!DDM.activeDrag) {
                return false; //Nothing is dragging, no reason to activate.
            }
            if (this.get(NODE) === DDM.activeDrag.get(NODE)) {
                return false;
            }
            if (this.get('lock')) {
                return false;
            }
            var node = this.get(NODE);
            //TODO Visibility Check..
            //if (this.inGroup(DDM.activeDrag.get('groups')) && this.get(NODE).isVisible()) {
            if (this.inGroup(DDM.activeDrag.get('groups'))) {
                node.removeClass(DDM.CSS_PREFIX + '-drop-active-invalid');
                node.addClass(DDM.CSS_PREFIX + '-drop-active-valid');
                DDM._addValid(this);
                this.overTarget = false;
                if (!this.get('useShim')) {
                    this.shim = this.get(NODE);
                }
                this.sizeShim();
            } else {
                DDM._removeValid(this);
                node.removeClass(DDM.CSS_PREFIX + '-drop-active-valid');
                node.addClass(DDM.CSS_PREFIX + '-drop-active-invalid');
            }
        },
        /**
        * @method sizeShim
        * @description Positions and sizes the shim with the raw data from the node, this can be used to programatically adjust the Targets shim for Animation..
        */
        sizeShim: function() {
            if (!DDM.activeDrag) {
                return false; //Nothing is dragging, no reason to activate.
            }
            if (this.get(NODE) === DDM.activeDrag.get(NODE)) {
                return false;
            }
            //if (this.get('lock') || !this.get('useShim')) {
            if (this.get('lock')) {
                return false;
            }
            if (!this.shim) {
                Y.later(100, this, this.sizeShim);
                return false;
            }
            var node = this.get(NODE),
                nh = node.get(OFFSET_HEIGHT),
                nw = node.get(OFFSET_WIDTH),
                xy = node.getXY(),
                p = this.get('padding'),
                dd, dH, dW;


            //Apply padding
            nw = nw + p.left + p.right;
            nh = nh + p.top + p.bottom;
            xy[0] = xy[0] - p.left;
            xy[1] = xy[1] - p.top;
            

            if (DDM.activeDrag.get('dragMode') === DDM.INTERSECT) {
                //Intersect Mode, make the shim bigger
                dd = DDM.activeDrag;
                dH = dd.get(NODE).get(OFFSET_HEIGHT);
                dW = dd.get(NODE).get(OFFSET_WIDTH);
                
                nh = (nh + dH);
                nw = (nw + dW);
                xy[0] = xy[0] - (dW - dd.deltaXY[0]);
                xy[1] = xy[1] - (dH - dd.deltaXY[1]);

            }
            
            if (this.get('useShim')) {
                //Set the style on the shim
                this.shim.setStyles({
                    height: nh + 'px',
                    width: nw + 'px',
                    top: xy[1] + 'px',
                    left: xy[0] + 'px'
                });
            }

            //Create the region to be used by intersect when a drag node is over us.
            this.region = {
                '0': xy[0], 
                '1': xy[1],
                area: 0,
                top: xy[1],
                right: xy[0] + nw,
                bottom: xy[1] + nh,
                left: xy[0]
            };
        },
        /**
        * @private
        * @method _createShim
        * @description Creates the Target shim and adds it to the DDM's playground..
        */
        _createShim: function() {
            //No playground, defer
            if (!DDM._pg) {
                Y.later(10, this, this._createShim);
                return;
            }
            //Shim already here, cancel
            if (this.shim) {
                return;
            }
            var s = this.get('node');

            if (this.get('useShim')) {
                s = Y.Node.create('<div id="' + this.get(NODE).get('id') + '_shim"></div>');
                s.setStyles({
                    height: this.get(NODE).get(OFFSET_HEIGHT) + 'px',
                    width: this.get(NODE).get(OFFSET_WIDTH) + 'px',
                    backgroundColor: 'yellow',
                    opacity: '.5',
                    zIndex: '1',
                    overflow: 'hidden',
                    top: '-900px',
                    left: '-900px',
                    position:  'absolute'
                });

                DDM._pg.appendChild(s);

                s.on('mouseover', Y.bind(this._handleOverEvent, this));
                s.on('mouseout', Y.bind(this._handleOutEvent, this));
            }


            this.shim = s;
        },
        /**
        * @private
        * @method _handleOverTarget
        * @description This handles the over target call made from this object or from the DDM
        */
        _handleTargetOver: function() {
            if (DDM.isOverTarget(this)) {
                this.get(NODE).addClass(DDM.CSS_PREFIX + '-drop-over');
                DDM.activeDrop = this;
                DDM.otherDrops[this] = this;
                if (this.overTarget) {
                    DDM.activeDrag.fire('drag:over', { drop: this, drag: DDM.activeDrag });
                    this.fire(EV_DROP_OVER, { drop: this, drag: DDM.activeDrag });
                } else {
                    //Prevent an enter before a start..
                    if (DDM.activeDrag.get('dragging')) {
                        this.overTarget = true;
                        this.fire(EV_DROP_ENTER, { drop: this, drag: DDM.activeDrag });
                        DDM.activeDrag.fire('drag:enter', { drop: this, drag: DDM.activeDrag });
                        DDM.activeDrag.get(NODE).addClass(DDM.CSS_PREFIX + '-drag-over');
                        //TODO - Is this needed??
                        //DDM._handleTargetOver();
                    }
                }
            } else {
                this._handleOut();
            }
        },
        /**
        * @private
        * @method _handleOverEvent
        * @description Handles the mouseover DOM event on the Target Shim
        */
        _handleOverEvent: function() {
            this.shim.setStyle('zIndex', '999');
            DDM._addActiveShim(this);
        },
        /**
        * @private
        * @method _handleOutEvent
        * @description Handles the mouseout DOM event on the Target Shim
        */
        _handleOutEvent: function() {
            this.shim.setStyle('zIndex', '1');
            DDM._removeActiveShim(this);
        },
        /**
        * @private
        * @method _handleOut
        * @description Handles out of target calls/checks
        */
        _handleOut: function(force) {
            if (!DDM.isOverTarget(this) || force) {
                if (this.overTarget) {
                    this.overTarget = false;
                    if (!force) {
                        DDM._removeActiveShim(this);
                    }
                    if (DDM.activeDrag) {
                        this.get(NODE).removeClass(DDM.CSS_PREFIX + '-drop-over');
                        DDM.activeDrag.get(NODE).removeClass(DDM.CSS_PREFIX + '-drag-over');
                        this.fire(EV_DROP_EXIT);
                        DDM.activeDrag.fire('drag:exit', { drop: this });
                        delete DDM.otherDrops[this];
                    }
                }
            }
        }
    });

    Y.DD.Drop = Drop;





}, '@VERSION@' ,{requires:['dd-ddm-drop', 'dd-drag'], skinnable:false});
YUI.add('dd-delegate', function(Y) {


    /**
     * Provides the ability to drag multiple nodes under a container element using only one Y.DD.Drag instance as a delegate.
     * @module dd
     * @submodule dd-delegate
     */     
    /**
     * Provides the ability to drag multiple nodes under a container element using only one Y.DD.Drag instance as a delegate.
     * @class Delegate
     * @extends Base
     * @constructor
     * @namespace DD
     */


    var Delegate = function(o) {
        Delegate.superclass.constructor.apply(this, arguments);
    },
    CONT = 'container',
    NODES = 'nodes',
    _tmpNode = Y.Node.create('<div>Temp Node</div>');


    Y.extend(Delegate, Y.Base, {
        /**
        * @private
        * @property _bubbleTargets
        * @description The default bubbleTarget for this object. Default: Y.DD.DDM
        */
        _bubbleTargets: Y.DD.DDM,
        /**
        * @property dd
        * @description A reference to the temporary dd instance used under the hood.
        */    
        dd: null,
        /**
        * @property _shimState
        * @private
        * @description The state of the Y.DD.DDM._noShim property to it can be reset.
        */    
        _shimState: null,
        /**
        * @private
        * @property _handles
        * @description Array of event handles to be destroyed
        */
        _handles: null,
        /**
        * @private
        * @method _onNodeChange
        * @description Listens to the nodeChange event and sets the dragNode on the temp dd instance.
        * @param {Event} e The Event.
        */
        _onNodeChange: function(e) {
            this.set('dragNode', e.newVal);
        },
        /**
        * @private
        * @method _afterDragEnd
        * @description Listens for the drag:end event and updates the temp dd instance.
        * @param {Event} e The Event.
        */
        _afterDragEnd: function(e) {
            Y.DD.DDM._noShim = this._shimState;

            this.set('lastNode', this.dd.get('node'));
            this.get('lastNode').removeClass(Y.DD.DDM.CSS_PREFIX + '-dragging');
            this.dd._unprep();
            this.dd.set('node', _tmpNode);
        },
        /**
        * @private
        * @method _delMouseDown
        * @description The callback for the Y.DD.Delegate instance used
        * @param {Event} e The MouseDown Event.
        */
        _delMouseDown: function(e) {
            var tar = e.currentTarget,
                dd = this.dd;
            
            if (tar.test(this.get(NODES)) && !tar.test(this.get('invalid'))) {
                this._shimState = Y.DD.DDM._noShim;
                Y.DD.DDM._noShim = true;
                this.set('currentNode', tar);
                dd.set('node', tar);
                if (dd.proxy) {
                    dd.set('dragNode', Y.DD.DDM._proxy);
                } else {
                    dd.set('dragNode', tar);
                }
                dd._prep();
                
                dd.fire('drag:mouseDown', { ev: e });
            }
        },
        /**
        * @private
        * @method _onMouseEnter
        * @description Sets the target shim state
        * @param {Event} e The MouseEnter Event
        */
        _onMouseEnter: function(e) {
            this._shimState = Y.DD.DDM._noShim;
            Y.DD.DDM._noShim = true;
        },
        /**
        * @private
        * @method _onMouseLeave
        * @description Resets the target shim state
        * @param {Event} e The MouseLeave Event
        */
        _onMouseLeave: function(e) {
            Y.DD.DDM._noShim = this._shimState;
        },
        initializer: function(cfg) {
            this._handles = [];
            //Create a tmp DD instance under the hood.
            var conf = Y.clone(this.get('dragConfig') || {}),
                cont = this.get(CONT);

            conf.node = _tmpNode.cloneNode(true);
            conf.bubbleTargets = this;

            if (this.get('handles')) {
                conf.handles = this.get('handles');
            }

            this.dd = new Y.DD.Drag(conf);

            //On end drag, detach the listeners
            this.dd.after('drag:end', Y.bind(this._afterDragEnd, this));
            this.dd.on('dragNodeChange', Y.bind(this._onNodeChange, this));

            //Attach the delegate to the container
            this._handles.push(Y.delegate(Y.DD.Drag.START_EVENT, Y.bind(this._delMouseDown, this), cont, this.get(NODES)));

            this._handles.push(Y.on('mouseenter', Y.bind(this._onMouseEnter, this), cont));

            this._handles.push(Y.on('mouseleave', Y.bind(this._onMouseLeave, this), cont));

            Y.later(50, this, this.syncTargets);
            Y.DD.DDM.regDelegate(this);
        },
        /**
        * @method syncTargets
        * @description Applies the Y.Plugin.Drop to all nodes matching the cont + nodes selector query.
        * @return {Self}
        * @chainable
        */        
        syncTargets: function() {
            if (!Y.Plugin.Drop || this.get('destroyed')) {
                return;
            }
            var items, groups, config;

            if (this.get('target')) {
                items = Y.one(this.get(CONT)).all(this.get(NODES));
                groups = this.dd.get('groups');
                config = this.get('dragConfig');
                
                if (config && 'groups' in config) {
                    groups = config.groups;
                }

                items.each(function(i) {
                    this.createDrop(i, groups);
                }, this);
            }
            return this;
        },
        /**
        * @method createDrop
        * @description Apply the Drop plugin to this node
        * @param {Node} node The Node to apply the plugin to
        * @param {Array} groups The default groups to assign this target to.
        * @return Node
        */
        createDrop: function(node, groups) {
            var config = {
                useShim: false,
                bubbleTargets: this
            };

            if (!node.drop) {
                node.plug(Y.Plugin.Drop, config);
            }
            node.drop.set('groups', groups);
            return node;
        },
        destructor: function() {
            if (this.dd) {
                this.dd.destroy();
            }
            if (Y.Plugin.Drop) {
                var targets = Y.one(this.get(CONT)).all(this.get(NODES));
                targets.unplug(Y.Plugin.Drop);
            }
            Y.each(this._handles, function(v) {
                v.detach();
            });
        }
    }, {
        NAME: 'delegate',
        ATTRS: {
            /**
            * @attribute container
            * @description A selector query to get the container to listen for mousedown events on. All "nodes" should be a child of this container.
            * @type String
            */    
            container: {
                value: 'body'
            },
            /**
            * @attribute nodes
            * @description A selector query to get the children of the "container" to make draggable elements from.
            * @type String
            */        
            nodes: {
                value: '.dd-draggable'
            },
            /**
            * @attribute invalid
            * @description A selector query to test a node to see if it's an invalid item.
            * @type String
            */        
            invalid: {
                value: 'input, select, button, a, textarea'
            },
            /**
            * @attribute lastNode
            * @description Y.Node instance of the last item dragged.
            * @type Node
            */        
            lastNode: {
                value: _tmpNode
            },
            /**
            * @attribute currentNode
            * @description Y.Node instance of the dd node.
            * @type Node
            */        
            currentNode: {
                value: _tmpNode
            },
            /**
            * @attribute dragNode
            * @description Y.Node instance of the dd dragNode.
            * @type Node
            */        
            dragNode: {
                value: _tmpNode
            },
            /**
            * @attribute over
            * @description Is the mouse currently over the container
            * @type Boolean
            */        
            over: {
                value: false
            },
            /**
            * @attribute target
            * @description Should the items also be a drop target.
            * @type Boolean
            */        
            target: {
                value: false
            },
            /**
            * @attribute dragConfig
            * @description The default config to be used when creating the DD instance.
            * @type Object
            */        
            dragConfig: {
                value: null
            },
            /**
            * @attribute handles
            * @description The handles config option added to the temp DD instance.
            * @type Array
            */        
            handles: {
                value: null
            }
        }
    });

    Y.mix(Y.DD.DDM, {
        /**
        * @private
        * @for DDM
        * @property _delegates
        * @description Holder for all Y.DD.Delegate instances
        * @type Array
        */
        _delegates: [],
        /**
        * @for DDM
        * @method regDelegate
        * @description Register a Delegate with the DDM
        */
        regDelegate: function(del) {
            this._delegates.push(del);
        },
        /**
        * @for DDM
        * @method getDelegate
        * @description Get a delegate instance from a container node
        * @returns Y.DD.Delegate
        */
        getDelegate: function(node) {
            var del = null;
            node = Y.one(node);
            Y.each(this._delegates, function(v) {
                if (node.test(v.get(CONT))) {
                    del = v;
                }
            }, this);
            return del;
        }
    });

    Y.namespace('DD');    
    Y.DD.Delegate = Delegate;



}, '@VERSION@' ,{requires:['dd-drag', 'event-mouseenter'], skinnable:false, optional:['dd-drop-plugin']});


YUI.add('dd', function(Y){}, '@VERSION@' ,{skinnable:false, use:['dd-ddm-base', 'dd-ddm', 'dd-ddm-drop', 'dd-drag', 'dd-proxy', 'dd-constrain', 'dd-drop', 'dd-scroll', 'dd-delegate']});

