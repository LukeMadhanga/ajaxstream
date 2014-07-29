(function($, win, count) {

    /**
     * A string to access objects with a property or method beginning with 'thumb'. This will allow it to be compressed better
     * @type String
     */
    var thumb = 'thumb',
    width = 'width',
    height = 'height',
    sbid = 'data-streamboundariesid',
    cache = {},
    methods = {
        init: function(opts) {
            var T = this;
            if (!T.length) {
                // There is no object, return
                return T;
            }
            if (T.length > 1) {
                // The selector matched more than one object, apply this function each individually
                T.each(function() {
                    $.fn.streamBoundaries(opts);
                });
                return T;
            }
            var prop = {},
            ef = function() {};
            T.s = $.extend({
                aspectRatio: false,
                autoRotate: !0,
                bg: '#DEDEDE',
                centerThumb: !0,
                crosshair: !0,
                bounds: !1,
                height: '5px',
                isViewport: !1,
                minResizeHeight: '20px',
                minResizeWidth: '20px',
                onFinish: ef,
                onUpdate: ef,
                orientation: 'x',
                thumb: T.find('*:first'),
                thumbBg: '#333',
                thumbHeight: '5px',
                thumbWidth: '10%',
                resizable: !1,
                round: !0,
                width: '300px',
                x: false,
                y: false
            }, opts);
            T.offsetX = 0;
            T.offsetY = 0;
            T.autobounds = !1;
            T.c = ++count;
            T.isresize;
            prop[sbid] = T.c;
            T.attr(prop);
            
            /**
             * Render the thumb and track according to the parameters that are passed to it
             * @param {float} x The new x position of the thumb
             * @param {float} y The new y position of the thumb
             */
            T.render = function(x, y) {
                var settings = T.s,
                th = settings.thumb,
                dorotate = settings.orientation === 'y' && settings.autoRotate,
                tcss = {
                    width: settings[dorotate ? height : width],
                    height: settings[dorotate ? width : height],
                    background: settings.bg,
                    position: 'relative'
                },
                thcss = {
                    width: settings[thumb + (dorotate ? 'Height' : 'Width')],
                    height: settings[thumb + (dorotate ? 'Width' : 'Height')],
                    background: settings.thumb + 'Bg',
                    position: 'relative',
                    'box-sizing': 'border-box',
                    cursor: 'pointer'
                };
                if (settings.resizable && !$('.sb_thumbres', T).length) {
                    // Only create the resize thumb if we're allowed to resize, and if we haven't already created one
                    var html = ('<style>.sb_thumbres {max-width:30px;max-height:30px;position:absolute;width:20%;' + 
                                    'height:20%;}</style>') + (
                                '<div id="sbtT" class="sb_thumbres" style="cursor:nw-resize;' + 
                                    'border-left:solid 2px #000;border-top:solid 2px #000;left:0;top:0;"></div>') + (
                                '<div id="sbtTM" class="sb_thumbres" style="cursor:n-resize;' + 
                                    'border-top:solid 2px #000;left:50%;top:0;margin-left: -15px;"></div>') + (
                                '<div id="sbtR" class="sb_thumbres" style="cursor:ne-resize;' + 
                                    'border-right:solid 2px #000;border-top:solid 2px #000;right:0;top:0;"></div>') + (
                                '<div id="sbtRM" class="sb_thumbres" style="cursor:e-resize;' + 
                                    'border-right:solid 2px #000;right:0;top:50%;margin-top: -15px;"></div>') + (
                                '<div id="sbtB" class="sb_thumbres" style="width:20%;height:20%;cursor:se-resize;' + 
                                    'border-right:solid 2px #000;border-bottom:solid 2px #000;max-width:30px;' + 
                                    'max-height:30px;right:0;bottom:0;"></div>')+ (
                                '<div id="sbtBM" class="sb_thumbres" style="cursor:s-resize;' + 
                                    'border-bottom:solid 2px #000;left:50%;bottom:0;margin-left: -15px;"></div>') + (
                                '<div id="sbtL" class="sb_thumbres" style="cursor:sw-resize;' + 
                                    'border-left:solid 2px #000;border-bottom:solid 2px #000;left:0;bottom:0;"></div>') + (
                                '<div id="sbtLM" class="sb_thumbres" style="cursor:w-resize;' + 
                                    'border-left:solid 2px #000;left:0;top:50%;margin-top: -15px;"></div>');
                    th.append(html);
                }
                if (settings.crosshair && ! $('#sb_cross', T).length) {
                    th.append('<div id="sb_cross" style="font-size: 20px;position: absolute;top: 50%;left: 50%;width: 20px;' + 
                                'height: 20px;overflow: hidden;margin: -10px 0 0 -10px;text-align: center; line-height: 20px;' + 
                                'border-radius: 20px;background: #FFF;opacity: 0.5;">+</div>');
                }
                if (x||x===0||settings.x||settings.x===0) {
                    // The user has supplied a x value, move the thumb there
                    thcss['left'] = x || settings.x;
                }
                if (y||y===0||settings.y||settings.y===0) {
                    // The user has supplied a y value, move the thumb there
                    thcss['top'] = y||settings.y;
                }
                if (T.s.isViewport) {
                    // Make the track overflow:hidden if the thumb is larger than the boundaries
                    tcss['overflow'] = 'hidden';
                }
                T.css(tcss);
                th.css(thcss);
                var tr = th[0].getBoundingClientRect(),
                r = T[0].getBoundingClientRect();
                reposition(r, tr);
                var ax = tr.left - r.left,
                ay = tr.top - r.top;
                T.positionData = {
                    bounds: settings.bounds,
                    jqueryEvent: null,
                    originalEvent: null,
                    px: ax / (settings.bounds.right - settings.bounds.left),
                    py: ay / (settings.bounds.bottom - settings.bounds.top),
                    thumbRatio: tr.width / tr.height,
                    trackHeight: r.height,
                    trackWidth: r.width,
                    type: null,
                    x: ax,
                    x2: ax + tr.width,
                    y: ay,
                    y2: ay + tr.height
                };
            };
            T.render();

            /**
             * Reposition the thumb
             * @param {object(BoundingClientRect)} trackRect The bounding client rect for the track
             * @param {object(BoundingClientRect)} thumbRect The bounding client rect for the thumb
             */
            function reposition(trackRect, thumbRect) {
                var th = T.s.thumb,
                trackheight = Math.round(trackRect.height),
                thumbheight = Math.round(thumbRect.height),
                trackwidth = Math.round(trackRect.width),
                thumbwidth = Math.round(thumbRect.width);
                if (thumbheight > trackheight && T.s.orientation === 'x') {
                    // The thumb is taller than the track
                    th.css({
                        top: -(thumbheight - trackheight) / 2
                    });
                }
                if (thumbwidth > trackwidth && T.s.orientation === 'y') {
                    // The thumb is wider than the track
                    th.css({
                        left: -(thumbwidth - trackwidth) / 2
                    });
                }
                if (T.s.bounds === !1 || T.autobounds) {
                    // If the user has not explicitly set the boundaries, work them out
                    T.autobounds = !0;
                    T.s.bounds = {
                        bottom: trackheight - thumbheight,
                        left: 0,
                        top: 0,
                        right: trackwidth - thumbwidth
                    };
                }
            }

            /**
             * Reposition viewports
             */
            T.posLT = function() {
                var settings = T.s,
                center = settings.centerThumb,
                th = settings.thumb,
                tr = T[0].getBoundingClientRect(),
                thr = th[0].getBoundingClientRect(),
                orient = settings.orientation,
                axpos = !1,
                aypos = !1,
                centl = (settings.width - thr.width) / 2,
                centt = (settings.height - thr.height) / 2;
                if (orient === 'x' || orient === '2d') {
                    if (thr.left >= tr.left) {
                        // We have been pulled to the left edge of the container
                        axpos = 0;
                    } else if (thr.right <= tr.right) {
                        // We have been pulled to the right edge of the container
                        axpos = settings.width - thr.width;
                    }
                    if (axpos !== !1) {
                        th.css({left: center && centl > 0 ? centl : axpos});
                    }
                }
                if (orient === 'y' || orient === '2d') {
                    if (thr.top >= tr.top) {
                        // We've been pulled to the top edge of the container
                        aypos = 0;
                    } else if (thr.bottom <= tr.bottom) {
                        // We've been pulled to the bottom edge of the container
                        aypos = settings.height - thr.height;
                    }
                    if (aypos !== !1) {
                        th.css({top: center && centt > 0 ? centt : aypos});
                    }
                }
            };

            /**
             * The mousemove handler in a seperate function so that it can be unbound later on
             * @param {object(DOMEvent)} e The jQuery event for window.mousemove
             */
            T.wmm = function(e) {
                // Prevent the default dragging behaviour
                e.preventDefault();
                var xpos = e.clientX - T.offsetX,
                ypos = e.clientY - T.offsetY,
                axpos = 0,
                aypos = 0,
                settings = T.s,
                orient = settings.orientation,
                twoD = orient === '2d',
                orientY = orient === 'y',
                orientX = orient === 'x',
                th = settings.thumb,
                sb = settings.bounds,
                bb = sb.bottom,
                bl = sb.left,
                bt = sb.top,
                br = sb.right,
                lastMove = 'normal',
                doround = settings.round;
                if (settings.isViewport) {
                    // We are moving the thumb inside of the track
                    lastMove = 'viewport';
                    axpos = xpos;
                    aypos = ypos;
                    if (orientX || twoD) {
                        th.css({left: axpos});
                    }
                    if (orientY || twoD) {
                        th.css({top: aypos});
                    }
                } else if (T.isresize) {
                    // This is a resize of the thumb
                    lastMove = 'resize';
                    var tr = T.thumbRect,
                    r = T.rect,
                    ar = settings.aspectRatio || tr.width / tr.height,
                    targetid = T.curTarget.id,
                    lresize = (targetid === 'sbtLM' || targetid === 'sbtL' || targetid === 'sbtT'),
                    tresize = (T.curTarget.id === 'sbtTM' || T.curTarget.id === 'sbtT' || T.curTarget.id === 'sbtR');
                    axpos = tr.right - r.left;
                    aypos = tr.bottom - r.top;
                    if (targetid === 'sbtRM' || targetid === 'sbtLM') {
                        // Lock to left/right resize
                        orientX = !0;
                        orientY = twoD = !1;
                    }
                    if (targetid === 'sbtTM' || targetid === 'sbtBM') {
                        // Lock to up/down resize
                        orientY = !0;
                        orientX = twoD = !1;
                    }
                    if (orientX || twoD) {
                        var nw = (axpos + xpos) - (tr.left - r.left),
                        xcss = {};
                        if (lresize) {
                            // If we're on the left hand side
                            var sx = tr.left - r.left,
                            nl = sx + (nw - tr.width);
                            axpos = xcss.left = nl; 
                            xcss.right = tr.right;
                            nw = tr.width - (nw - tr.width);
                            if (nl <= settings.bounds.left) {
                                // We've gone too far to the left
                                axpos = xcss.left = settings.bounds.left;
                                nw = sx + tr.width;
                            } else if (nw <= parseFloat(settings.minResizeWidth)) {
                                axpos = xcss.left = tr.right - settings.minResizeWidth;
                                nw = settings.minResizeWidth;
                            }
                        } else {
                            if (nw + tr.left >= r.right) {
                                nw = r.width - (tr.left - r.left);
                            } else if (nw <= parseFloat(settings.minResizeWidth)) {
                                nw = settings.minResizeWidth;
                            }
                        }
                        if (e.shiftKey && twoD) {
                            if (nw / ar + (tr.top - r.top) > r.height) {
                                // If by doing an aspect ratio scale we become taller than the bounds, reset our width
                                nw = (r.height - (tr.top - r.top)) * ar;
                            }
                        }
                        xcss.width = doround ? Math.round(nw) : nw;
                        th.css(xcss);
                    }
                    if (orientY || twoD) {
                        var nh = (aypos + ypos) - (tr.top - r.top),
                        ycss = {};
                        if (e.shiftKey && twoD) {
                            nh = nw / ar;
                        }
                        if (tresize) {
                            // If we're resizing from the top
                            var sy = tr.top - r.top,
                            nt = sy + (nh - tr.height);
                            aypos = ycss.top = nt; 
                            ycss.bottom = tr.bottom;
                            nh = tr.height - (nh - tr.height);
                            if (nt <= settings.bounds.top) {
                                // We've gone too far to the left
                                aypos = ycss.top = settings.bounds.top;
                                nh = sy + tr.height;
                            } else if (nh <= parseFloat(settings.minResizeHeight)) {
                                aypos = ycss.top = tr.bottom - settings.minResizeHeight;
                                nh = settings.minResizeHeight;
                            }
                        } else {
                            if (nh + tr.top >= r.bottom) {
                                nh = r.height - (tr.top - r.top);
                            } else if (nh <= parseFloat(settings.minResizeHeight)) {
                                nh = settings.minResizeHeight;
                            }
                        }
                        ycss.height = doround ? Math.round(nh) : nh;
                        th.css(ycss);
                    }
                } else {
                    // We're doing a normal move
                    if (orientX || twoD) {
                        if (xpos <= bl) {
                            // Gone too far to the left
                            axpos = bl;
                        } else if (xpos >= br) {
                            // Gone too far to the right
                            axpos = br;
                        } else {
                            axpos = xpos;
                        }
                        xpos = doround ? Math.round(axpos) : axpos;
                        th.css({left: axpos});
                    }
                    if (orientY || twoD) {
                        if (ypos <= bt) {
                            // Gone too high
                            aypos = bt;
                        } else if (ypos >= bb) {
                            // Gone too low
                            aypos = bb;
                        } else {
                            aypos = ypos;
                        }
                        xpos = doround ? Math.round(aypos) : aypos;
                        th.css({top: aypos});
                    }
                }
                
                var nr = th[0].getBoundingClientRect(),
                isr = T.isresize,
                r = T.rect,
                ax = isr ? nr.left - r.left : axpos,
                ay = isr ? nr.top - r.top : aypos,
                nrw = nr.width,
                nrh = nr.height,
                rw = r.width,
                rh = r.height;
                if (doround) {
                    ax = Math.round(ax);
                    ay = Math.round(ay);
                    nrw = Math.round(nrw);
                    nrh = Math.round(nrh);
                    rw = Math.round(rw);
                    rh = Math.round(rh);
                }
                T.positionData = {
                    bounds: T.s.bounds,
                    jqueryEvent: e,
                    originalEvent: e.originalEvent,
                    px: ax / (br - bl),
                    py: ay / (bb - bt),
                    lastMove: lastMove,
                    thumbRatio: nrw / nrh,
                    thumbHeight: nrh,
                    thumbWidth: nrw,
                    trackHeight: rh,
                    trackWidth: rw,
                    x: ax,
                    x2: ax + nrw,
                    y: ay,
                    y2: ay + nrh
                };
                settings.onUpdate.call(T, T.positionData);
            };
            T.mousedown(function(e) {
                // Prevent the default dragging behaviour
                e.preventDefault();
                T.rect = T[0].getBoundingClientRect();
                T.thumbRect = T.s.thumb[0].getBoundingClientRect();
                T.isresize = $(e.target).hasClass('sb_thumbres');
                reposition(T.rect, T.thumbRect);
                T.startDim = {width: T.thumbRect.width, height: T.thumbRect.height};
                var w = $(win);
                if (T.isresize) {
                    T.curTarget = e.target;
                    T.offsetX = e.clientX;
                    T.offsetY = e.clientY;
                } else {
                    var off = getOffset(e, T.rect);
                    T.offsetX = off.x;
                    T.offsetY = off.y;
                }
                w.mousemove(T.wmm);
                w.one('mouseup', function(ev) {
                    // Only allow the mouseup event to fire once
                    w.unbind('mousemove', T.wmm);
                    if (T.s.isViewport) {
                        T.posLT();
                    }
                    T.isresize = !1;
                    T.s.onFinish.call(T, T.positionData);
                });
            });
            cache[T.c] = T;
            return T;
        },
        /**
         * Update the settings
         * @param {object(plain)} opts An object in the form {option: value [,...]}
         * @returns {object(jQuery)} The jQuery object that called this function
         */
        updateOpts: function(opts) {
            var T = this;
            if (opts.bounds) {
                T.autobounds = !1;
            }
            T.s = $.extend($.extend({}, T.s), opts);
            T.render();
            return T;
        },
        /**
         * Reposition the thumb and track
         * @param {object(plain)} opts A plain object in the form {x: float(val), y: float(val)}, which will be used to explicitly 
         *  set the x and y position of the thumb. Both are optional
         * @returns {object(jQuery)} The jQuery object that called this function
         */
        reposition: function (opts) {
            var T = this;
            if (!opts) {
                opts = {};
            }
            T.render(opts.x, opts.y);
            if (T.s.isViewport) {
                T.posLT();
            }
            return T;
        },
        /**
         * Get the position data of the thumb
         * @returns {object(plain)} The object that descibes the position of the thumb
         */
        getPositionData: function () {
            return this.positionData;
        }
    };

    /**
     * Get the offset of the mouse click
     * @param {object(DOMEvent)} e The original mousedown event
     * @param {object(BoundingClientRect)} rect The bounding client rect of the element that was clicked on
     * @returns {object(plain)} An object with the properties x and y
     */
    function getOffset(e, rect) {
        var t = $(e.target),
        off = t.offset();
        return {
            x: e.pageX - Math.round(off.left) + rect.left,
            y: e.pageY - Math.round(off.top) + rect.top
        };
    }

    /**
     * Get this object from the cache
     * @param {object(jQuery)} elem The object to test
     * @returns {object(jQuery)} Either the jQuery object from the cache, or elem if a cache entry does not exist
     */
    function getThis(elem) {
        var id = elem.attr(sbid);
        return id ? cache[id] : elem;
    }

    /**
     * Create a thumb and track, and depending on what parameters are passed, scroll the thumb in the x or y axis, or even both. You
     *  can also create a viewport where you scroll the thumb inside the viewport
     * @syntax $(selector).streamBoundaries({[opt: val [,...]]}) <br/> $(selector).streamBoundaries(methodname [, {opt: value}])
     * @param {string|object(plain)} methodOrOpts Either the name of the method to run, or the options for the main method
     * @returns {object(jQuery)} The jQuery object that called this function
     */
    $.fn.streamBoundaries = function(methodOrOpts) {
        var T = getThis(this);
        if (methods[methodOrOpts]) {
            // The first option passed is a method, therefore call this method
            return methods[methodOrOpts].apply(T, Array.prototype.slice.call(arguments, 1));
        } else if (Object.prototype.toString.call(methodOrOpts) === '[object Object]' || !methodOrOpts) {
            // The default action is to call the init function
            return methods.init.apply(T, arguments);
        } else {
            // The user has passed us something dodgy, throw an error
            $.error(['The method ', methodOrOpts, ' does not exist'].join(''));
        }
    };

})(jQuery, this, 0);