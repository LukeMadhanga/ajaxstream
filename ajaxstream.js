(function($, window, count, document, Math) {
    
    var AJSHidden = 'AJSHidden',
    ef = function() {},
    pastable = 'onpaste' in document,
    draggable = 'draggable' in document.createElement('span'),
    fapi = !!(window.Blob || window.File || window.FileList || window.FileReader),
    canvtest = document.createElement('canvas'),
    canv = !!(canvtest.getContext && canvtest.getContext('2d')),
    uselocalstorage = ('localStorage' in window) && (function () {
        var ans = 0;
        for(var x in window.localStorage) {
            ans += (window.localStorage[x].length * 2).toFixed(2);
        }
        return ans < 4194304;
    }()),
    constants = {
        VP_MAX_HEIGHT: 420
    },
    // Please read README.md to get an explanation of what these properties do
    defaults = {
        accept: ['.*'],
        allowFilters: !0,
        chunkSize: 1e6,
        maxFileSize: 2097152,
        maxFiles: 1,
        iconPreviewHeight: 200,
        iconPreviewWidth: 200,
        maxHeight: 1024,
        maxWidth: 1024,
        onbeforeopen: ef,
        onbeforestreamupload: ef,
        onclose: ef,
        onfilechanged: ef,
        onfilechanging: ef,
        onfileselected: ef,
        onfilesloaded: ef,
        onfilesloading: ef,
        ongetuploadkey: ef,
        oninit: ef,
        onlegacyuploadfail: ef,
        onlegacyuploadfinish: ef,
        onlegacyuploadstart: ef,
        onopen: ef,
        onsetuploaddata: ef,
        onsingleuploadfail: ef,
        onsingleuploadfinish: ef,
        onsingleuploadstart: ef,
        onuploadfail: ef,
        onuploadfinish: ef,
        onuploadprogress: ef,
        onuploadstart: ef,
        pathPrefix: '',
        quality: 1,
        readonly: !1,
        scale9Grid: !0,
        stream: !1,
        showPreviewOnForm: !1,
        translateFunction: function(s) {
            for (var i = 1; i < arguments.length; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
                s = s.replace(re, arguments[i]);
            }
            return s;
        },
        uploadScript: "/upload.php",
        uploadTo: "uploads"
    },
    methods = {
        init: function (opts) {
            var T = this;
            if (T.length > 1) {
                // If the length is more than one, apply this function to all objects
                T.each(function() {
                    $(this).ajaxStream(opts);
                });
                return T;
            } else if (!T.length || T.data('ajs.ajaxstreamdata')) {
                // There is either no object, or this object has already been initialized
                return T;
            }
            var data = {
                addingmore: !1,
                c: ++count,
                changing: !1,
                currentlength: 0,
                currentupload: null,
                filedata: {},
                id: [count, '_', T[0].id].join(''),
                loaded: 0,
                s: $.extend($.extend({}, defaults), opts),
                toload: 0,
                uploads: [],
                uploadBuffer: []
            },
            body = $('body');

            /**
             * @brief Translate a string using the supplied translation function
             * @syntax tx(s [, arg1, arg2, ...])
             * @param {string} s The input string, untranslated
             * @returns {string} The translated string
             */
            if (typeof tx !== 'function') {
                // NB: This code was designed for a system that has a function tx that translates strings into another language
                function tx(s) {
                    s === s; // Null assignemnt: Dump NetBeans warning
                    return data.s.translateFunction.apply(null, arguments);
                }
            }

            /**
             * Call one of the function events
             * @syntax dataevent(eventname, thisarg [, arg1 [, arg2 [,...]]])
             * @param {string} eventname The name of the event to call, with the preceding 'on'. E.g. 'init'
             * @param {mixed} thisarg The argument to be used as 'this' when the function is called
             */
            data.event = function(eventname, thisarg) {
                return data.s['on' + eventname].apply(thisarg, Array.prototype.slice.call(arguments, 2));
            };

            /**
             * Perform the legacy upload
             * @param {object(DOMElement)} input The input that has the file being uploaded
             */
            data.legacyUpload = function(input) {
                var index = data.changing === !1 ? data.uploads.length : data.changing;
                data.filedata = {
                    aspectRatioLocked: !1,
                    base64: null,
                    canvasWidth: null,
                    canvasHeight: null,
                    canvasZoom: null,
                    croppedWidth: null,
                    croppedHeight: null,
                    index: index,
                    islegacy: !0,
                    mimetype: null,
                    name: null,
                    newupload: !0,
                    resizedWidth: null,
                    resizedHeight: null,
                    size: null
                };
                T.data('ajs.ajaxstreamdata', data);
                // Make a global reference to 'T' so that we can call it from our iFrame
                window['AJSLegacy'] = ZZ.streams[data.id];
                $('#AJSLegacy').val(JSON.stringify({
                    maxsize: data.s.maxFileSize,
                    maxheight: data.s.maxHeight,
                    maxwidth: data.s.maxWidth,
                    uploaddir: data.s.uploadTo,
                    islegacy: !0,
                    id: data.id
                }));
                var leg = $('#AJSFileLegacy'),
                orig = leg.clone();
                orig.insertAfter(leg);
                leg[0].id = null;
                $('#AJSLegacyForm').prop({action: data.s.uploadScript + '?newupload=true'}).append(leg);
                orig.unbind('change.ajsfilechanged').bind('change.ajsfilechanged', data.filechanged);
                data.event('legacyuploadstart', input, {original: T[0], stream: T, uploads: data.uploads});
                elem('AJSLegacyForm').submit();
                $('#AJSLoading').removeClass(AJSHidden);
            };

            /**
             * What to after a file has been uploaded
             * @param {object(plain)} results The results from our upload
             */
            data.afterLegacyUpload = function(results) {
                $('input[name=AJSFileLegacy]', '#AJSLegacyForm').remove();
                $('#AJSLoading').addClass(AJSHidden);
                if (results.moved) {
                    // The file was successfully uploaded, so we can continue
                    if (results.mimetype.match('image/*')) {
                        data.filedata.croppedWidth = data.filedata.resizedWidth = data.filedata.width = results.width;
                        data.filedata.croppedHeight = data.filedata.resizedHeight = data.filedata.height = results.height;
                    }
                    data.currentlength++;
                    data.filedata.newsrc = results.location;
                    data.filedata.src = results.location;
                    data.filedata.name = results.name;
                    data.filedata.size = results.size;
                    data.filedata.mimetype = results.mimetype;
                    data.filedata.src = results.location;
                    data.event('legacyuploadfinish', T, {original: T[0], results: results, uploads: data.uploads});
                    data.afterFileRead(data.filedata, data.changing !== !1);
                    window['AJSLegacy'] = null;
                    T.data('ajs.ajaxstreamdata', data);
                } else {
                    // There was an error so alert the user
                    data.event('legacyuploadfail', null, {original: T[0], error: results.error, results: results, uploads: data.uploads,
                        stream: T});
                    streamConfirm(tx('Error'), {Close: ef}, results.error, {nocancel: !0});
                }
            };

            /**
             * The processing function for when the file input has registered a change event
             * @param {object(DOMEvent)} e
             */
            data.filechanged = function(e) {
                var filelist = e.target.files;
                if (!filelist && e.target.value.match(/^.\:\\/)) {
                    // This is an old version of IE. Value starts in the form C:\
                    data.legacyUpload(this);
                    data.toload = 1;
                    T.data('ajs.ajaxstreamdata', data);
                    return;
                } else if (!filelist.length) {
                    data.changing = !1;
                    T.data('ajs.ajaxstreamdata', data);
                    return;
                }
                var len = data.toload = filelist.length;
                data.event('fileselected', this, {originalEvent: e.originalEvent, files: filelist, toload: data.toload, original: T[0], 
                    stream: T, jQueryEvent: e, uploads: data.uploads});
                if (fapi) {
                    for (var i = 0; i < len; i++) {
                        if (!filelist[i]) {
                            data.toload--;
                        }
                    }
                    if (data.toload <= 0) {
                        streamConfirm(tx('Error'), {Close: ef}, tx('There was an error during the upload: the file list is empty'), 
                                {nocancel: !0});
                    }
                    T.data('ajs.ajaxstreamdata', data);
                    // We support the file api
                    if (data.changing === !1) {
                        // This is a new file
                        len = data.toload;
                        var tlen = len + data.uploads.length;
                        if (tlen > data.s.maxFiles) {
                            streamConfirm(tx('Maximum files exceeded'), {Close: ef},
                            tx('You have selected {0} files but are only permitted to upload {1}', tlen, data.s.maxFiles),
                                    {nocancel: !0});
                            len = data.toload = data.s.maxFiles - data.uploads.length;
                        }
                        for (var i = 0; i < len; i++) {
                            // Process each file on its own
                            if (!filelist[i]) {
                                continue;
                            }
                            data.process(filelist[i], i);
                        }
                    } else {
                        data.event('filechanging', this, {
                            originalEvent: e.originalEvent, file: filelist[0], current: data.uploads[data.changing], original: T[0], 
                                    jQueryEvent: e, stream: T, uploads: data.uploads});
                        data.process(filelist[0], data.changing, !0, this);
                    }
                } else {
                    // We don't support the file api, so upload this file the old way
                    data.legacyUpload(this);
                }
            };

            /**
             * Process the uploaded file
             * @param {object(File)} file An item from a FileList object
             * @param {int} changeid The index of this file in the uploads
             * @param {boolean} changing True if we are changing an existing file
             * @param {object(DOMElement)} target The original file input
             */
            data.process = function(file, changeid, changing, target) {
                $('#AJSLoading').removeClass(AJSHidden);
                if (is_a('blob', file) || is_a('file', file)) {
                    if (data.s.stream) {
                        data.beginStreamUpload(file, changeid, changing, target);
                        return;
                    }
                    var fr = new FileReader(),
                    processasimg = file.type.match('image/*') && file.type !== 'image/gif';
                    fr.onload = function(e) {
                        var blob = new Blob([e.target.result], {type: file.type}),
                        dataURL = (window.URL || window.webkitURL).createObjectURL(blob),
                        index = changing ? changeid : null,
                        filedata = {
                            aspectRatioLocked: !1,
                            edited: !1,
                            index: index,
                            islegacy: !1,
                            mimetype: file.type,
                            name: file.name,
                            newupload: !0,
                            size: file.size,
                            src: dataURL
                        };
                        if (!changing) {
                            data.currentlength++;
                            T.data('ajs.ajaxstreamdata', data);
                        }
                        if (processasimg) {
                            // If this is an image, then there is some extra information that we can add
                            var img = new Image(),
                            canvas = document.createElement('canvas'),
                            ctx = canvas.getContext('2d');
                            img.onload = function() {
                                var image = this,
                                calculated = calcWidthHeight(img.width, img.height, data.s.maxWidth, data.s.maxHeight);
                                image.imageloaded = !0;
                                canvas.width = filedata.width = filedata.resizedWidth = filedata.croppedWidth = calculated.width;
                                canvas.height = filedata.height = filedata.resizedHeight = filedata.croppedHeight = calculated.height;
                                filedata.canvasWidth = filedata.canvasHeight = filedata.canvasZoom = null;
                                filedata.cropdata = {};
                                filedata.image = image;
                                // Now get the base64 representation of the image
                                data.multipass(canvas, ctx, img);
                                filedata.newsrc = canvas.toDataURL(filedata.mimetype, 1);
                                data.afterFileRead(filedata, changing, target);
                            };
                            img.onerror = function () {
                                filedata.src = null;
                                data.afterFileRead(filedata, changing, target);
                            };
                            img.src = dataURL;
                        } else {
                            // Load normally
                            filedata.newsrc = e.target.result;
                            data.afterFileRead(filedata, changing, target);
                        }
                    };
                    fr.onerror = fileReaderError;
                    // To get the base64 of a non-image, we need to use readAsDataURL
                    processasimg ? fr.readAsArrayBuffer(file) : fr.readAsDataURL(file);
                } else {
                    // We were given something dodgy
                    streamConfirm(tx('Error'), {Close: ef}, tx('The selection is not a file'), {nocancel: !0});
                }
            };
            
            data.beginStreamUpload = function (file, changeid, changing, target) {
                var fr = new FileReader();
                fr.onload = function(e) {
                    // Get upload key
                    data.uploadBuffer.push(new Uint8Array(e.target.result));
                    var bufferkey = data.uploadBuffer.length - 1,
                    uploadkey = data.getUploadKey(file);
                    filedata = {
                        aspectRatioLocked: !1,
                        edited: !1,
                        index: changing ? changeid : null,
                        islegacy: !1,
                        mimetype: file.type,
                        name: file.name,
                        newupload: !0,
                        size: file.size,
                        src: null
                    };
                    var bsu = {original: T[0], stream: T, uploads: data.uploads, file: file, uploadkey: uploadkey, bufferkey: bufferkey,
                        filedata: filedata, changing: changing, target: target};
                    if (data.event('beforestreamupload', this, bsu) === false) {
                        return false;
                    }
                    data.streamUpload(bufferkey, 0, uploadkey, file.name);
                    data.afterFileRead(filedata, changing, target);
                };
                fr.onerror = fileReaderError;
                fr.readAsArrayBuffer(file);
            };
            
            /**
             * Get an upload key for this file
             * @param {File} file The file being uploaded
             * @returns {mixed} Either a sha1 string, or the result from a user specified key
             */
            data.getUploadKey = function (file) {
                var userkey = data.event('getuploadkey', this, {original: T[0], stream: T, uploads: data.uploads, file: file});
                if (userkey !== undefined && userkey !== null && userkey !== false && userkey !== true && userkey !== '') {
                    // The designer has supplied what looks like a valid key
                    return userkey;
                }
                return window.Sha1.hash(file.name + file.size + file.type + file.lastModified + new Date().getTime());
            };
            
            /**
             * Stream the upload
             * @param {int} bufferkey The index of the upload being streamed in the buffer
             * @param {int} startpoint  The point at which to start the buffer
             * @param {string} uploadkey The upload key used to identify the stream
             * @param {string} filename The name of the file being uploaded
             */
            data.streamUpload = function(bufferkey, startpoint, uploadkey, filename) {
                var blob = new Blob([data.uploadBuffer[bufferkey].subarray(startpoint, startpoint + data.s.chunkSize)]),
                fd = new FormData();
                fd.append('stream', blob, filename);
                fd.append('key', uploadkey);
                fd.append('uploadto', data.s.uploadTo);
                fd.append('bytesdone', startpoint + blob.size);
                $.ajax({
                    url: data.s.uploadScript + '?stream=1',
                    type: 'post',
                    contentType: false,
                    processData: false,
                    data: fd
                }).done(function (e) {
                    if (e.result === 'OK') {
                        if (startpoint + data.s.chunkSize < data.uploadBuffer[bufferkey].length) {
                            // The upload is not completed yet
                            data.streamUpload(bufferkey, startpoint + data.s.chunkSize, uploadkey, filename);
                        }
                    } else {
                        streamConfirm(tx('Oops!'), function () {}, tx('There was a problem streaming your file'));
                        console.error(e.result);
                    }
                }).fail(function (e) {
                    streamConfirm(tx('Oops!'), function () {}, tx('There was a problem streaming your file'));
                    console.error(e.responseText);
                });
            };
            
            /**
             * File reader error handler
             * @param {Event} e
             */
            function fileReaderError(e) {
                var error = e.currentTarget.error;
                $('#AJSLoading').addClass(AJSHidden);
                streamConfirm(tx('Error'), {Close: ef}, tx('There was an error processing the selected file.\n\
                Make sure what you selected was indeed a file. Full details') + ': ' + error.message, {nocancel: !0});
                console.error(error.name + ': ' + error.message);
            }

            /**
             * What to do after the selected file has been read
             * @param {object(plain)} filedata
             * @param {boolean} changing
             * @param {object(DOMElement)} target
             */
            data.afterFileRead = function(filedata, changing, target) {
                var current = null,
                index;
                if (changing) {
                    index = filedata.index;
                    current = data.uploads[index];
                    data.uploads[index] = filedata;
                } else {
                    index = data.uploads.length;
                    filedata.index = index;
                    data.uploads[index] = filedata;
                }
                ZZ.images['AJSIMG_' + data.id + index] = filedata.image;
                delete filedata.image;
                data.attemptProgression(target, filedata.index, current);
            };

            /**
             * Attempt to progress. If files loaded equals files selected, progress, otherwise do nothing
             * @param {object(DOMElement)} target The file input
             * @param {int} index The index of the file changed in the upload array
             * @param {object(plain)} old The old upload before it got changed
             */
            data.attemptProgression = function(target, index, old) {
                data.loaded++;
                data.event('filesloading', target, {original: T[0], toload: data.toload, loaded: data.loaded, uploads: data.uploads, 
                    stream: T});
                if (data.loaded === data.toload) {
                    $('#AJSFile,#AJSFileLegacy').val(null);
                    $('#AJSLoading').addClass(AJSHidden);
                    $('#AJSUploadSection').addClass(AJSHidden);
                    $('#AJSImagePreview').removeClass(AJSHidden);
                    data.toggleLR();
                    var gotoend = data.changing === !1;
                    if (data.changing === !1) {
                        // Call the filechanged event
                        data.event('filechanged', target, {original: T[0], newfile: data.uploads[index], oldfile: old, 
                                                                                            uploads: data.uploads, stream: T});
                    }
                    data.event('filesloaded', target, {loaded: data.loaded, original: T[0], uploads: data.uploads, stream: T});
                    data.changing = !1;
                    data.toload = data.loaded = 0;
                    data.displayUpload(null, gotoend);
                }
                T.data('ajs.ajaxstreamdata', data);
            };

            /**
             * Determine whether or not we should show the navigation arrows
             */
            data.toggleLR = function() {
                if (data.uploads.length > 1) {
                    $('#AJSLRContainer').removeClass(AJSHidden);
                } else {
                    $('#AJSLRContainer').addClass(AJSHidden);
                }
            };

            /**
             * Display a preview of an upload file
             * @param {object(plain)} cur The object that describes the file for which we are seeking a preview
             * @param {boolean} gotoend
             */
            data.displayUpload = function(cur, gotoend) {
                if (data.uploads.length) {
                    // If we have uploaded files, show them
                    if (!cur) {
                        cur = data.getCurr(gotoend);
                    }
                    // Determine whether the add button should be disabled
                    $('#AJSAdd')[data.currentlength + 1 > data.s.maxFiles ? 'addClass' : 'removeClass'](AJSHidden);
                    var isimg = cur.mimetype.match('image/*'),
                    src = isimg ? (cur.mimetype === 'image/gif' ? cur.newsrc : cur.src) : null;
                    data.toggleLR();
                    if (src || (!isimg && !src)) {
                        // If this is an image and has a src, or this is not an image
                        data.drawImage(cur, src);
                        data.currentupload = cur.index;
                        T.data('ajs.ajaxstreamdata', data);
                    } else {
                        streamConfirm(tx('Corrupt upload'), {'ok': data.deleteUpload}, 
                                tx('There is no source for this upload meaning that you cannot continue. Click \'ok\' to delete'), 
                            {nocancel: !0});
                    }
                } else {
                    data.resetToUpload();
                }
            };

            /**
             * Draw the uploaded image onto a canvas (or display it using an &lt;img/&gt; element if the file api is not supported)
             * @param {object(plain)} cur The object that represents the current file that we are working with
             * @param {string(path)} src The alternate src attribute if we are displaying the icon for a file (i.e. it is not an image)
             */
            data.drawImage = function(cur, src) {
                var hid = 'AJSIMG_' + data.id + cur.index,
                mastermime = cur.mimetype.replace(/\/.*$/, ''),
                isimg = mastermime === 'image',
                docanvas = fapi && canv && isimg && cur.mimetype !== 'image/gif',
                canvas = $('#' + hid),
                eicon = $('#AJSEdit');
                eicon.addClass(AJSHidden);
                if (canvas.length) {
                    // We may have changed from a non image to an image, vice versa. Get the correct element
                    canvas = getCorrectElement(canvas, hid, isimg, docanvas);
                } else {
                    // A canvas doesn't exist for this upload so create one
                    var inner = '';
                    if (docanvas) {
                        inner = '<canvas id="' + hid + '"></canvas>';
                    } else {
                        if (cur.mimetype.match('image/*')) {
                            inner = '<img id="' + hid + '"/>';
                        } else {
                            inner = '<span id="' + hid + '"><span></span></span>';
                        }
                    }
                    $('#AJSLRContainer').before(inner);
                    canvas = $('#' + hid);
                }

                // Now set the src
                if (docanvas) {
                    eicon.removeClass(AJSHidden);
                    imageToCanvas(canvas[0], cur, ZZ.images[hid]);
                } else {
                    if (mastermime === 'image') {
                        canvas[0].src = src;
                        if (!cur.width || !cur.height) {
                            // The width and height have not yet been set for this image in the upload. This may be because the uploaded
                            //  file is a gif
                            canvas[0].onload = function () {
                                cur.width = this.width;
                                cur.height = this.height;
                                cur.canvasWidth = cur.canvasHeight = null;
                            };
                        }
                    } else {
                        canvas.attr({'class': 'AJSMIMEIcons ' + getIconClass(mastermime, cur.mimetype)});
                        canvas.find('span').html(cur.name);
                    }
                }
                // Hide the others but make this one visible
                $('[id^="AJSIMG_"]').addClass(AJSHidden);
                var h = canvas[0].tagName === 'CANVAS' ? canvas[0].height : canvas.height();
                if (!h) {
                    h = cur.croppedHeight;
                }
                canvas.removeClass(AJSHidden).css({top:  h > 500 ? 0 : ((500 - h) / 2)});
                $('#AJSLoading').addClass(AJSHidden);
                winResize();
            };

            /**
             * A user may swicth from a non-image to an image. Get the correct element that will allow us to display the uploaded file
             * @param {object(jQuery)} elem The element to test and possibly change
             * @param {string} htmlid
             * @param {boolean} isimg True if the uploaded file is an image
             * @param {boolean} docanvas True if we should use the canvas element
             * @returns {object(jQuery)}
             */
            function getCorrectElement(elem, htmlid, isimg, docanvas) {
                var n;
                if (in_array(['CANVAS', 'IMG'], elem[0].tagName) && !isimg) {
                    // Redraw the canvas and make it into a span
                    n = '<span id="' + htmlid + '"><span></span></span>';
                } else if (elem[0].tagName === 'SPAN' && isimg) {
                    // Redraw the span and make it into either a <canvas> or an <img> depending on support
                    n = document.createElement(docanvas ? 'canvas' : 'img');
                    n.id = htmlid;
                } else if (elem[0].tagName === 'IMG' && docanvas) {
                    // Redraw the img as a canvas element
                    n = document.createElement('canvas');
                    n.id = htmlid;
                } else if (elem[0].tagName === 'CANVAS' && !docanvas) {
                    // Redraw the canvas as an img element
                    n = document.createElement('img');
                    n.id = htmlid;
                } else {
                    return elem;
                }
                elem.after(n);
                elem.remove();
                return $('#' + htmlid);
            }

            /**
             * Render the image onto a canvas element
             * @param {jqelem} canvas The canvas element
             * @param {object(plain)} cur The object that describes the uploaded file we're working with
             * @param {object(DOMElement)} img The img object for this uploaded file
             */
            function imageToCanvas(canvas, cur, img) {
                if (cur.newsrc) {
                    // We have been cropped. Display this image instead
                    img = new Image();
                    img.src = cur.newsrc;
                }
                if (!img.width && !img.height) {
                    img.onload = function () {
                        imageToCanvasContinue(canvas, cur, img);
                        winResize();
                    };
                } else {
                    imageToCanvasContinue(canvas, cur, img);
                }
            }
            
            /**
             * Continue rendering the image onto a canvas element
             * @param {jqelem} canvas The canvas element
             * @param {object(plain)} cur The object that describes the uploaded file we're working with
             * @param {object(DOMElement)} img The img object for this uploaded file
             */
            function imageToCanvasContinue(canvas, cur, img) {
                var calculated = calcWidthHeight(img.width, img.height, data.s.maxWidth, data.s.maxHeight),
                ctx = canvas.getContext("2d");
                cur.croppedWidth = cur.resizedWidth = canvas.width = calculated.width;
                cur.croppedHeight = cur.resizedHeight = canvas.height = calculated.height;
                data.multipass(canvas, ctx, img);
                if (cur.newupload || data.edited) {
                    // Only recalculate the base64 if something has happened to the file
                    cur.newsrc = canvas.toDataURL(cur.mimetype, data.s.quality);
                }
            }

            /**
             * Crop the image, get its base64 data and then set the newsrc of the upload object
             * @param {object(HTMLCanvasElement)} canvas The destination canvas
             * @param {object(plain)} cur The object that describes the current upload
             * @param {object(HTMLImageElement)} img The original image that was uploaded
             * @param {object(plain)} cropdata The object that describes the coordinates of the crop rectangle
             * @param {boolean} saving True if we are saving all of our edits
             */
            data.setCropped64 = function(canvas, cur, img, cropdata, saving) {
                if (canv) {
                    // The browser supports the canvas api
                    var ctx = canvas.getContext('2d'),
                    ri = $('#AJSResImg'),
                    riv = ri.is(':visible'),
                    riw = riv ? ri.width() : ri.data('width'),
                    rih = riv ? ri.height() : ri.data('height'),
                    w = cropdata.x2 - cropdata.x,
                    h = cropdata.y2 - cropdata.y,
                    ow = cur.width,
                    oh = cur.height;
                    w *= (ow / riw);
                    h *= (oh / rih);
                    var calculated = calcWidthHeight(w, h, data.s.maxWidth, data.s.maxHeight),
                    cw = calculated.width,
                    ch = calculated.height,
                    sx = cw / w,
                    sy = ch / h,
                    x = -cropdata.x * (ow / riw) * sx,
                    y = -cropdata.y * (oh / rih) * sy,
                    outwidth = ow * sx,
                    outheight = oh * sy;
                    cur.croppedWidth = canvas.width = cw;
                    cur.croppedHeight = canvas.height = ch;
                    if (img.imageloaded) {
                        cropImageAndDrawCanvas(canvas, ctx, img, cur, {x: x, y: y, 
                            outwidth: outwidth, outheight: outheight}, saving);
                    } else {
                        $('#AJSLoading').removeClass(AJSHidden);
                        img.onload = function () {
                            img.imageloaded = !0;
                            cropImageAndDrawCanvas(canvas, ctx, img, cur, {x: x, y: y, 
                                outwidth: outwidth, outheight: outheight}, saving);
                            $('#AJSLoading').addClass(AJSHidden);
                        };
                    }
                    T.data('ajs.ajaxstreamdata', data);
                }
            };

            /**
             * Perform a multipass render to improve antialiasing
             * @param {object(HTMLCanvasElement)} canvas
             * @param {object(CanvasRenderingContext2D)} ctx The context onto which we will draw the image
             * @param {object(HTMLImageElement)} img
             * @param {int} x [optional] A number to use as the x value. Defaults to 0
             * @param {int} y [optional] A number to use as the y value. Defaults to 0
             * @param {int} canvaswidth [optional] A number to use as the canvas width. Defaults to the width of the image
             * @param {int} canvasheight [optionsl] A number to use as the canvas height. Defaults to the height of the image
             */
            data.multipass = function (canvas, ctx, img, x, y, canvaswidth, canvasheight) {
                var ew = canvaswidth ? canvaswidth : canvas.width,
                eh = canvasheight? canvasheight : canvas.height,
                ux = x === undefined ? 0 : Math.floor(x),
                uy = y === undefined ? 0 : Math.floor(y);
                if (img.width / ew > 2 || img.height / ew > 2) {
                    var oc = document.createElement('canvas'),
                    occtx = oc.getContext('2d');
                    oc.width = img.width * .5;
                    oc.height = img.height * .5;
                    occtx.drawImage(img, ux, uy, oc.width, oc.height);
                    // Another pass
                    occtx.drawImage(oc, 0 , 0, oc.width * .5, oc.height * .5);
                    ctx.drawImage(oc, 0, 0, oc.width * .5, oc.height * .5, ux * .75, uy * .75, ew, eh);
                } else {
                    // Multipassing on a small image causes blurriness
                    ctx.drawImage(img, ux, uy, ew, eh);
                }
            };
            
            /**
             * Crop the edited image and draw the result onto the preview canvas
             * @param {object(HTMLCanvasElement)} canvas The canvas we are drawing on to
             * @param {object(CanvasRenderingContext2D)} ctx The context of the canvas we are drawing on to
             * @param {object(HTMLImageElement)} img The image from which we are drawing to the canvas
             * @param {object(plain)} cur The object describing the uploaded file that we are working on
             * @param {object(plain)} dimensions An object with the properties 
             *  {
             *      x: x coordinate to begin clipping,
             *      y: y coordinate to begin clipping,
             *      outwidth: The desired output width,
             *      outheight: The desired output height
             *  }
             *  @param {boolean} saving True if we are saving the cropped image
             */
            function cropImageAndDrawCanvas(canvas, ctx, img, cur, dimensions, saving) {
                $('#AJSLoading').removeClass(AJSHidden);
                if (saving && cur.canvasZoom) {
                    // We have resized this image using the canvas editor
                    var cz = cur.canvasZoom,
                    oc = document.createElement('canvas'),
                    occtx = oc.getContext('2d');
                    oc.width = cur.croppedWidth;
                    oc.height = cur.croppedHeight;
                    occtx.drawImage(img, dimensions.x, dimensions.y, dimensions.outwidth, dimensions.outheight);
//                    data.multipass(oc, occtx, img, dimensions.x, dimensions.y, dimensions.outwidth, dimensions.outheight);
                    canvas.width = cur.canvasWidth;
                    canvas.height = cur.canvasHeight;
                    ctx.drawImage(oc, cz.x, cz.y, cz.width, cz.height);
//                    data.multipass(canvas, ctx, oc, cz.x, cz.y, cz.width, cz.height);
                } else {
                    ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.outwidth, dimensions.outheight);
                }
                cur.newsrc = canvas.toDataURL(cur.mimetype, data.s.quality);
                $('#AJSLoading').addClass(AJSHidden);
            }

            /**
             * Get the icon image
             * @param {string} mime The first part of the mimetype, e.g. video
             * @param {string} fullmime The full mimetype, e.g. application/javascript
             * @returns {string} The name of the class to put
             */
            function getIconClass(mime, fullmime) {
                switch (fullmime) {
                    case 'application/zip':
                    case 'application/gzip':
                        return 'asicons-file-zip';
                    case 'text/css':
                        return 'asicons-file-css';
                    case 'text/javascript':
                    case 'application/javascript':
                    case 'text/php':
                    case 'text/x-php':
                    case 'application/php':
                    case 'application/x-php':
                    case 'text/xml':
                    case 'text/html':
                        return 'asicons-code';
                    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
                    case 'application/vnd.ms-powerpoint':
                        return 'asicons-file-powerpoint';
                    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
                    case 'application/msword':
                        return 'asicons-file-word';
                    case 'application/vnd.ms-excel':
                    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                        return 'asicons-file-excel';
                    case 'application/pdf':
                    case 'application/x-pdf':
                    case 'application/vnd.pdf':
                        return 'asicons-file-pdf';
                    case 'application/vnd.oasis.opendocument.spreadsheet':
                    case 'application/vnd.oasis.opendocument.presentation':
                    case 'application/vnd.oasis.opendocument.text':
                        return 'asicons-file-openoffice';
                }
                switch (mime) {
                    case 'application':
                    case 'application-x':
                        return 'asicons-desktop';
                    case 'audio':
                        return 'asicons-microphone';
                    case 'model':
                        return 'asicons-tools';
                    case 'pdf':
                        return 'asicons-file-pdf';
                    case 'text':
                        return 'asicons-file-text-o';
                    case 'video':
                        return 'asicons-video';
                    default:
                        return 'asicons-help';
                }
            }

            /**
             * Reset the main dialogue so that it shows the input form
             */
            data.resetToUpload = function() {
                var lr = $('#AJSRContainer');
                $('#AJSUploadSection').removeClass(AJSHidden);
                $('#AJSImagePreview').addClass(AJSHidden);
                $('#AJSChooseText').removeClass(AJSHidden);
                $('#AJSLoading').addClass(AJSHidden);
                data.uploads.length ? lr.removeClass(AJSHidden) : lr.addClass(AJSHidden);
            };

            /**
             * Get the object that represent the uploaded file that is currently being worked with
             * @param {boolean} gotoend
             * @returns {object(plain)} The object representing the uploaded file being worked with
             */
            data.getCurr = function(gotoend) {
                if (gotoend) {
                    data.currentupload = data.uploads.length - 1;
                    return data.uploads[data.currentupload];
                } else {
                    if (data.addingmore) {
                        var res = end(data.uploads);
                        data.currentupload = res.index;
                        return res;
                    } else {
                        if (data.currentupload || data.currentupload === 0) {
                            return data.uploads[data.currentupload];
                        }
                        data.currentupload = 0;
                        return reset(data.uploads);
                    }
                }
            };

            /**
             * Preview the next (to the left or right) uploaded file
             * @param {boolean} goingleft True if the left button was clicked
             */
            data.changePrev = function(goingleft) {
                var addition = goingleft ? -1 : 1;
                var cur;
                if (data.currentupload + addition < 0) {
                    cur = end(data.uploads);
                    data.currentupload = data.uploads.length - 1;
                } else if (data.currentupload + addition > (data.uploads.length - 1)) {
                    cur = reset(data.uploads);
                    data.currentupload = 0;
                } else {
                    cur = data.uploads[data.currentupload + addition];
                    data.currentupload += addition;
                }
                data.displayUpload(cur);
            };

            /**
             * The click handler for when one of the edit icons is clicked
             */
            data.iconClick = function() {
                var t = $(this),
                eia = $('.EIconActive'),
                data = T.data('ajs.ajaxstreamdata');
                if (eia.data('for') === t.data('for')) {
                    // We have clicked the same icon as before
                    return !1;
                }
                $('#AJSLoading').removeClass(AJSHidden);
                var ajsri = $('#AJSRInner'),
                ajsrc = $('#AJSRC');
                $('.AJSEDivs').addClass(AJSHidden);
                $('#' + t.data('for')).removeClass(AJSHidden);
                switch (t.data('for')) {
                    case 'AJSRCan':
                        var pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                        upload = data.uploads[data.currentupload],
                        cz = upload.canvasZoom,
                        scalePercent = cz ? cz.scalePercent : !1,
                        canvaswidth = upload.canvasWidth,
                        canvasheight = upload.canvasHeight,
                        ri = $('#AJSResImg'),
                        riw = ri.width(),
                        rih = ri.height(),
                        zoompossiblyreset = canvaswidth && canvasheight && cz === null,
                        w = pd.x2 - pd.x,
                        h = pd.y2 - pd.y,
                        ow = upload.width,
                        oh = upload.height;
                        w *= (ow / riw);
                        h *= (oh / rih);
                        // Get the scaled width and height
                        var calculated = calcWidthHeight(w, h, data.s.maxWidth, data.s.maxHeight),
                        vpdims = getViewportDimensions(upload, calculated);
                        ri.attr({'data-width': riw, 'data-height': rih});
                        // Set the base64 of the cropped image to the upload object 
                        data.setCropped64(document.createElement('canvas'), upload, ZZ.images['AJSIMG_' + data.id + data.currentupload], pd);
                        ajsri.addClass(AJSHidden);
                        ajsrc.removeClass(AJSHidden);
                        elem('AJSRCImg').src = upload.newsrc;
                        elem('AJSCW').value = canvaswidth ? canvaswidth : upload.croppedWidth;
                        elem('AJSCH').value = canvasheight ? canvasheight : upload.croppedHeight;
                        // Reposition the viewport
                        $('#AJSRCVp').streamBoundaries('updateOpts', {
                            height: vpdims.height,
                            thumbHeight: vpdims.thumbHeight,
                            thumbWidth: vpdims.thumbWidth,
                            width: vpdims.width
                        });
                        if ((scalePercent || scalePercent === 0) || zoompossiblyreset) {
                            // We have scaled the zoom or
                            // We have a canvas height and width, but no zoom data. Assume that we have reset the zoom data. Zero
                            //  the position of the viewport
                            scalePercent = zoompossiblyreset ? 1 : scalePercent;
                            var ajscz = $('#AJSCZ').streamBoundaries('reposition', {x: (scalePercent * 100) + '%'});
                            updateCanvasZoom.call(ajscz, ajscz.positionData);
                        }
                        centerCanvasResizer(canvasheight ? canvasheight : calculated.height);
                        break;
                    case 'AJSWHAR':
                        ajsrc.addClass(AJSHidden);
                        ajsri.removeClass(AJSHidden);
                }
                eia.removeClass('EIconActive');
                t.addClass('EIconActive');
                $('#AJSLoading').addClass(AJSHidden);
            };

            /**
             * Get the viewport dimensions, scaled down to fit in the edit window
             * @param {object(plain)} upload The object that describes the file that we are working on
             * @param {object(plain)} calculated The calculated dimensions of the image, scaled down to not exceed the maximum 
             *  width and height
             * @returns {object(plain)} An object in the form
             *  {
             *      height: int - The height of the viewport,
             *      scale: int - How much we have scaled down
             *      thumbHeight: int- The height of the item in the viewport,
             *      thumbWidth: int- The width of the item in the viewport,
             *      width: int - The width of the viewport
             *  }
             */
            function getViewportDimensions(upload, calculated) {
                var canvaswidth = upload.canvasWidth,
                canvasheight = upload.canvasHeight,
                h = canvasheight ? canvasheight : calculated.height,
                w = canvaswidth ? canvaswidth : calculated.width,
                th = calculated.height,
                tw = calculated.width,
                scale = 1;
                if (h > constants.VP_MAX_HEIGHT) {
                    // We need to scale the viewport down so that it fits into the edit window
                    scale = h / constants.VP_MAX_HEIGHT;
                    h = constants.VP_MAX_HEIGHT;
                    w /= scale;
                    th /= scale;
                    tw /= scale;
                }
                return {height: h, thumbHeight: th, thumbWidth: tw, width: w, scale: scale};
            }

            /**
             * Fill the edit values in the edit screen
             * @param {object(plain)} upload The object that describes the uploaded file that is being edited
             * @param {object(plain)} positionData The object that describes the position data of the crop handle
             */
            data.fillEditValues = function(upload, positionData) {
                if (positionData) {
                    // We have been given positionData
                    var d = data.getScaledDimensions(positionData, upload);
                    elem('AJSSAR').value = getLowestFraction(d.aspectRatio);
                    elem('AJSSW').value = d.width;
                    elem('AJSSH').value = d.height;
                }
            };
            
            /**
             * Get the scaled dimensions of the output image from the crop screen
             * @param {object(plain)} positionData The position data returned from $.streamBoundaries
             * @param {object(plain)} upload The object that describes the image being edited
             * @returns {object(plain)} An object with the properties width, height and aspect ratio
             */
            data.getScaledDimensions = function (positionData, upload) {
                var r = positionData.rect,
                w = r.width,
                h = r.height,
                ow = round((positionData.x2 - positionData.x) * (upload.width / w)),
                oh = round((positionData.y2 - positionData.y) * (upload.height / h)),
                maxwidth = data.s.maxWidth,
                maxheight = data.s.maxHeight;
                var calculated = calcWidthHeight(ow, oh, maxwidth, maxheight);
                ow = calculated.width;
                oh = calculated.height;
                return {width: ow, height: oh, aspectRatio: (ow / oh)};
            };

            /**
             * Display the information for the current file
             */
            data.showInfo = function() {
                $('.AJSEIcon:first').click();
                $('#AJSLoading').removeClass(AJSHidden);
                var upload = data.uploads[data.currentupload],
                cd = upload.cropdata,
                ri = $('#AJSResImg'),
                ajsri = $('#AJSRInner'),
                ajsritrack = $('#AJSRITrack'),
                zzimg = ZZ.images['AJSIMG_' + data.id + data.currentupload],
                newimg = cHE.getHtml('img', null, 'AJSResImg', null, {
                    src: zzimg.src,
                    'data-top': ri.attr('data-top'),
                    'data-bottom': ri.attr('data-bottom'),
                    'data-width': ri.attr('data-width'),
                    'data-height': ri.attr('data-height'),
                    'style': ri.attr('style')
                }),
                arlock = $('#AJSLockAR');
                $('#AJSMain > div').addClass(AJSHidden);
                $('#AJSMore').removeClass(AJSHidden);
                // We need to recreate the resizing image so that we can be sure that we need to run the onload function. This is
                //  to circumvent browser inconsistencies and the problem that occurs in chrome when using onload when the image
                //  is already in the cache
                ri.remove();
                ajsri.prepend(newimg);
                ri = $('#AJSResImg');
                ajsri.hide();
                ri[0].onload = function () {
                    $('#AJSLoading').addClass(AJSHidden);
                    ajsri.show();
                    // Reset the widths so that the element can grow
                    ri.css({maxWidth: parseFloat($(window).width()) - 20});
                    ajsri.css({width: 'auto'});
                    var r = ri[0].getBoundingClientRect(),
                    w = r.width,
                    h = r.height,
                    tw = cd.x !== undefined ? cd.x2 - cd.x : w,
                    th = cd.y !== undefined ? cd.y2 - cd.y : h;
                    ajsritrack.streamBoundaries('updateOpts', {
                        width: w,
                        height: h,
                        thumbWidth: tw,
                        thumbHeight: th,
                        onFinish: function(e) {
                            e.rect = r;
                            data.fillEditValues(upload, e);
                            positionRBG(e);
                            // If we have moved the cropper, we need to reset the zoom data
                            data.uploads[data.currentupload].canvasZoom = null;
                        }
                    });
                    ajsri.width(w);
                    var pd = ajsritrack.streamBoundaries('reposition', {
                        x: cd.x || cd.x === 0 ? cd.x : 0,
                        y: cd.y || cd.y === 0 ? cd.y : 0
                    }).positionData;
                    positionRBG(pd);
                    pd.rect = r;
                    data.fillEditValues(upload, pd);

                    // Adjust the aspect ratio lock if required
                    if (upload.aspectRatioLocked) {
                        arlock.removeClass('asicons-lock-open2').addClass('asicons-lock2');
                    } else {
                        arlock.removeClass('asicons-lock2').addClass('asicons-lock-open2');
                    }

                    $('.AJSEIcon').removeClass('EIconActive').first().click();

                    var ajs = $('#AJS'),
                            mt = (parseFloat(ajsri.height()) - h) / 2;
                    $('#AJSRBG').css({top: -h, height: h});
                    ajs.css({minWidth: w > 340 ? w : 340, marginLeft: -(ajs.width() / 2)});
                    ri.css({marginTop: mt}).attr({'data-top': mt, 'data-bottom': mt + h});
                    ajsritrack.css({marginTop: mt});
                    winResize();
                    if (draggable) {
                        // If we have drag and drop support, remove
                        document.body.ondragover = null;
                        document.body.ondrop = null;
                    }
                    toggleDragPaste();
                };
                ri[0].src = zzimg.src;
            };

            /**
             * Save the custom fields information
             */
            data.saveInfo = function() {
                var upload = data.uploads[data.currentupload],
                boundarydata = $('#AJSRITrack').streamBoundaries('getPositionData'),
                imgkey = 'AJSIMG_' + data.id + data.currentupload,
                t = $('#' + imgkey);
                if (!ZZ.images[imgkey]) {
                    // ZZ.images doesn't yet exist for this upload. Create it
                    var img = new Image();
                    img.onload = function () {
                        this.imageloaded = !0;
                    };
                    img.src = upload.src + '?cachekill=' + (new Date().getTime());
                    ZZ.images[imgkey] = img;
                    
                }
                data.setCropped64(elem(imgkey), upload, ZZ.images[imgkey], boundarydata, !0);
                var ncropdata = {x: boundarydata.x, x2: boundarydata.x2, y: boundarydata.y, y2: boundarydata.y2};
                if (upload.cropdata !== ncropdata) {
                    upload.edited = !0;
                    data.edited = !0;
                }
                upload.cropdata = ncropdata;
                $('#AJSMain > div').addClass(AJSHidden);
                $('#AJSImagePreview').removeClass(AJSHidden);
                $('#AJS').css({minWidth: 'initial'});
                t.css({top: (500 - t.height()) / 2});
                winResize();
                toggleDragPaste(!0);
                $.streamBoundaries.unsetMouseMove();
                T.data('ajs.ajaxstreamdata', data);
            };

            /**
             * The click handler for the upload buttons
             */
            function uploadBtnClick() {
                // Get the id of this stream
                var t = $(this),
                asid = t[0].id.replace('AJSUploadBtn_', '');
                data.event('beforeopen', this, {
                    elemid: asid.replace(/^\d+_(.*)$/, '$1'),
                    index: asid.replace(/^(\d+)_.*/, '$1'),
                    uploads: data.uploads
                });
                // Set it as the current object
                T = ZZ.streams[asid];
                ZZ.currentstream = T;
//                data.initBinding();
                var $ajs = $('#AJS');
                $ajs.show();
                $ajs.css({marginTop: -($ajs.height() / 2), marginLeft: -($ajs.width() / 2)});
                data.uploads.length ? data.displayUpload() : data.resetToUpload();
                // Call the 'onopen' handler
                data.event('open', T, {original: T[0], uploads: data.uploads, length: data.uploads.length});
                toggleReadOnly(data.s.readonly);
                if (t.hasClass('AJSFPBtn')) {
                    // If this is the addmore button, open the window to select a file
                    $('#AJSFile').click();
                }
            }

            /**
             * The click handler for the form preview icons/images
             */
            function ajsfpClick() {
                // Determine what stream we want
                var id = $(this)[0].id,
                index = id.replace(/.*\_(\d+)$/, '$1');
                id = id.replace(/\_\d+$/, '');
                var asid = id.replace('AJSFP_', '');
                data.event('beforeopen', this, {
                    elemid: asid.replace(/^\d+_(.*)$/, '$1'),
                    index: asid.replace(/^(\d+)_.*/, '$1'),
                    uploads: data.uploads
                });
                // Set it as the current object
                T = ZZ.streams[asid];
                ZZ.currentstream = T;
                data.currentupload = index;
                var $ajs = $('#AJS');
                $ajs.show();
                $ajs.css({marginTop: -($ajs.height() / 2), marginLeft: -($ajs.width() / 2)});
                data.displayUpload(data.uploads[index]);
                $('#AJSMain > div').addClass(AJSHidden);
                $('#AJSImagePreview').removeClass(AJSHidden);
                data.event('open', T, {original: T[0], uploads: data.uploads, length: data.uploads.length});
                toggleReadOnly(data.s.readonly);
            }
            
            /**
             * Show or hide the edit functions on the header of the AJS window
             * @param {boolean} make True to hide the edit functions on the AJS window
             */
            function toggleReadOnly(make) {
                var action = make ? 'addClass' : 'removeClass',
                cur = data.uploads[data.currentupload];
                $('#AJSChange,#AJSRemove,#AJSEdit')[action](AJSHidden);
                if (!make && cur) {
                    if (cur.mimetype.match('image/*') && cur.mimetype !== 'image/gif' && canv) {
                        // Show the edit icon as we have an image that we can edit
                        $('#AJSEdit').removeClass(AJSHidden);
                    } else {
                        $('#AJSEdit').addClass(AJSHidden);
                    }
                }
            }
            
            /**
             * Delete an upload from our list
             */
            data.deleteUpload = function () {
                // Remove the file by re-indexing the uploads array
                var temp = [],
                todelete = !1,
                curupload = !1;
                for (var i = 0, len = data.uploads.length; i < len; i++) {
                    if (data.uploads[i] && i !== data.currentupload) {
                        // We also need to reindex the uploaded file before saving
                        var upload = data.uploads[i];
                        upload.index = temp.length;
                        temp.push(upload);
                        if (curupload !== !1 && todelete !== !1) {
                            // Set the new currrentupload
                            curupload = i;
                        }
                    } else {
                        todelete = i;
                    }
                }
                // Remove the image for this upload
                $('#AJSIMG_' + data.id + data.currentupload).remove();
                data.uploads = temp;
                data.currentlength = data.uploads.length;
                data.currentupload = curupload !== !1 ? curupload : 0;
                // Update the value for this input
                $('#AJS_' + T[0].id).val(json_encode(data.uploads));
                $('#AJSUploadSection').addClass(AJSHidden);
                $('#AJSImagePreview').removeClass(AJSHidden);
                data.toggleLR();
                data.displayUpload();
                T.data('ajs.ajaxstreamdata', data);
            };

            /**
             * Initialise all of the events in one function
             */
            data.initBinding = function() {

                // @todo Possibly go vanilla?

                var ajsfile = fapi ? $('#AJSFile') : $('#AJSFileLegacy');

                ajsfile.unbind('click').click(function() {
                    var accept = data.s.accept;
                    if (accept === '.*' || is_array(accept) && in_array(accept, '.*')) {
                        accept = '*';
                    }
                    var fa = {accept: accept};
                    if (data.s.maxFiles > 1) {
                        // Allow us to have multiple files
                        fa['multiple'] = !0;
                    }
                    $(this).attr(fa);
                });

                if (fapi) {
                    // IE doesn't support simulated clicks on input:files
                    $('#AJSChooseText').unbind('click').click(function() {
                        data.addingmore = !0;
                        data.changing = !1;
                        ajsfile.click();
                    });
                }

                toggleDragPaste(!0);

                ajsfile.unbind('change').change(data.filechanged);

                $('#AJSImagePreview').unbind('dbclick').dblclick(function() {
                    // Remove accidental double click highlighting on the image preview that may have occurred when cycling
                    //  through the uploaded files
                    if (window.getSelection) {
                        window.getSelection().removeAllRanges();
                    } else if (document.selection) {
                        document.selection.empty();
                    }
                });

                $('#AJSAdd').unbind('click').click(function() {
                    // What to do when the add button is clicked
                    if ((data.uploads.length + 1) <= data.s.maxFiles) {
                        ajsfile.click();
                        data.addingmore = !0;
                    }
                });

                $('#AJSChange').unbind('click').click(function() {
                    // What to do when the 'change this file' button is clicked
                    data.changing = data.currentupload;
                    data.addingmore = !1;
                    ajsfile.click();
                });

                $('#AJSL').unbind('click').click(function() {
                    // Go left
                    data.changePrev(!0);
                });

                $('#AJSR').unbind('click').click(function() {
                    // Go right
                    data.changePrev();
                });

                var ajsicancel = elem('AJSICancel'),
                ajsisave = elem('AJSISave'),
                ajscw = elem('AJSCW'),
                ajsch = elem('AJSCH'),
                ajssar = elem('AJSSAR'),
                ajsedit = elem('AJSEdit');

                if (ajsedit) {
                    ajsedit.onclick = data.showInfo;
                }

                if (ajsicancel) {
                    ajsicancel.onclick = function() {
                        $('#AJSMain > div').addClass(AJSHidden);
                        $('#AJSImagePreview').removeClass(AJSHidden);
                        var t = $('#' + 'AJSIMG_' + data.id + data.currentupload);
                        $('#AJS').css({minWidth: 'initial'});
                        t.css({top: (500 - t.height()) / 2});
                        winResize();
                        toggleDragPaste();
                    };
                }

                if (ajsisave) {
                    ajsisave.onclick = data.saveInfo;
                }

                $('#AJSRemove').unbind('click').click(function() {
                    streamConfirm(tx('Are you sure you want to remove this file?'), data.deleteUpload, 
                            tx('This removes the file from the list of files to be uploaded, and not from your computer'));
                });

                $('#AJSClose,#AJSCloseText').unbind('click').click(function() {
                    // Close the upload screen
                    if (!data.s.readonly) {
                        // Only save the form if we're not readonly. This is a trap in case someone attempts to get smart
                        $('#AJS_' + T[0].id).val(json_encode(data.uploads));
                    }
                    $('#AJS').hide();
                    if (data.s.showPreviewOnForm) {
                        $('#AJSFormPrev_' + data.id).html(drawFormPreview());
                        $('[id^=AJSUploadBtn_]').unbind('click', uploadBtnClick).click(uploadBtnClick);
                        $('.AJSFP').unbind('click', ajsfpClick).click(ajsfpClick);
                    }
                    // Call the onclose event handler
                    data.event('close', T, {original: T[0], uploads: data.uploads, length: data.uploads.length});
                    T.data('ajs.ajaxstreamdata', data);
                });

                $('[id^=AJSUploadBtn_]').unbind('click', uploadBtnClick).click(uploadBtnClick);

                $('.AJSFP').unbind('click', ajsfpClick).click(ajsfpClick);

                if (ajssar) {
                    ajssar.onchange = function() {
                        $('#AJSLockAR').removeClass('asicons-lock-open2').addClass('asicons-lock2');
                        var ar,
                        v = this.value,
                        pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                        upload = data.uploads[data.currentupload];
                        upload.aspectRatioLocked = !0;
                        if (v && v.match(/^(:?\s+)?\d+(:?\.\d+)?(:?\/|\:)\d+(:?\.\d+)?$/)) {
                            // We've been given an aspect ratio in the form xx/yy or xx:yy
                            var input = v.split(/[\/|\:]/);
                            ar = input[0] / input[1];
                        } else if (v && v.match(/^(:?\s+)?(:?\d+|\d+\.\d+)$/)) {
                            // The aspect ratio is in the form of x or x.yyy
                            ar = v * 1;
                        } else {
                            // We've been given something dodgy
                            return;
                        }
                        var r = elem('AJSResImg').getBoundingClientRect(),
                        scaleX = upload.width / r.width,
                        scaleY = upload.height / r.height,
                        w = pd.x2 - pd.x,
                        nh = round(w / ar),
                        x = !1,
                        y = !1;
                        if (nh + pd.y > r.height) {
                            // What we've made overflows the window,
                            y = r.height - nh;
                            if (nh > r.height) {
                                nh = r.height;
                                w = round(nh * ar);
                                y = 0;
                                if (w + pd.x > r.width) {
                                    // We're too far to the right
                                    x = r.width - w;
                                }
                            }
                        }
                        var npd = $('#AJSRITrack').streamBoundaries('updateOpts', {
                            thumbWidth: w,
                            thumbHeight: nh,
                            x: x,
                            y: y
                        }).positionData;
                        elem('AJSSW').value = round(w * scaleX);
                        elem('AJSSH').value = round(nh * scaleY);
                        // Now that we have resized, reposition the translucent background
                        positionRBG(npd);
                    };
                }

                if (ajscw) {
                    ajscw.onchange = function() {
                        var v = this.value * 1,
                        w = v > data.maxWidth ? data.maxWidth : v,
                        he = elem('AJSCH'),
                        h = he.value * 1,
                        upload = data.uploads[data.currentupload],
                        calculated = calcWidthHeight(w, h, data.s.maxWidth, data.s.maxHeight, upload);
                        this.value = upload.canvasWidth = calculated.width;
                        he.value = upload.canvasHeight = calculated.height;
                        var vpdims = getViewportDimensions(upload, calculated),
                        ajscz = $('#AJSCZ').streamBoundaries();
                        $('#AJSRCVp').streamBoundaries('updateOpts', {height: vpdims.height, thumbHeight: vpdims.thumbHeight,
                            thumbWidth: vpdims.thumbWidth, width: vpdims.width});
                        centerCanvasResizer(calculated.height);
                        $('#AJSRCVp').streamBoundaries('reposition');
                        updateCanvasZoom.call(ajscz, ajscz.positionData);
                    };
                }

                if (ajsch) {
                    ajsch.onchange = function() {
                        var v = this.value * 1,
                        h = v > data.s.maxHeight ? data.s.maxHeight : v,
                        we = elem('AJSCW'),
                        w = we.value * 1,
                        upload = data.uploads[data.currentupload],
                        calculated = calcWidthHeight(w, h, data.s.maxWidth, data.s.maxHeight, upload);
                        this.value = upload.canvasHeight = calculated.height;
                        we.value = upload.canvasWidth = calculated.width;
                        var vpdims = getViewportDimensions(upload, calculated),
                        ajscz = $('#AJSCZ').streamBoundaries();
                        $('#AJSRCVp').streamBoundaries('updateOpts', {height: vpdims.height, thumbHeight: vpdims.thumbHeight,
                            thumbWidth: vpdims.thumbWidth, width: vpdims.width});
                        centerCanvasResizer(calculated.height);
                        $('#AJSRCVp').streamBoundaries('reposition');
                        updateCanvasZoom.call(ajscz, ajscz.positionData);
                    };
                }
                
                $('#AJSLockAR').click(function () {
                    var t = $(this),
                    locking = t.hasClass('asicons-lock-open2');
                    if (locking) {
                        t.removeClass('asicons-lock-open2').addClass('asicons-lock2');
                        } else {
                        t.removeClass('asicons-lock2').addClass('asicons-lock-open2');
                        }
                    data.uploads[data.currentupload].aspectRatioLocked = locking;
                });

                $('.AJSEIcon').unbind('click', data.iconClick).click(data.iconClick);

                $(window).unbind('resize', winResize).resize(winResize);

            };
            
            /**
             * Center the canvas resizer preview
             * @param {int} vpheight The height of the viewport
             */
            function centerCanvasResizer(vpheight) {
                var vpmaxheight = constants.VP_MAX_HEIGHT,
                wh = vpheight > vpmaxheight ? vpmaxheight : vpheight;
                $('#AJSRCVp').css({top: (vpmaxheight - wh) / 2});
            }
            
            /**
             * Update the canvas zoom
             * @param {object(plain)} e The object describing the position of the scale
             */
            function updateCanvasZoom(e) {
                if (!e.lastMove) {
                    // e.lastMove is null meaning this event was simulated. Reposition the zoom thumb
                    $('#AJSCZ').streamBoundaries('reposition');
                }
                var diffs = getZoomDiff(),
                upload = data.uploads[data.currentupload],
                px = e.px || e.px === 0 ? e.px * 1 : 1,
                nw = diffs.minWidth + (diffs.width * px),
                nh = diffs.minHeight + (diffs.height * px),
                pd = $('#AJSRCVp').streamBoundaries('updateOpts', {
                    thumbHeight: nh,
                    thumbWidth: nw
                }).streamBoundaries('reposition').positionData;
                upload.edited = !0;
                upload.canvasZoom = {height: nh * diffs.scale, width: nw * diffs.scale, scalePercent: px, 
                    x: pd.x * diffs.scale, y: pd.y * diffs.scale};
            }
            
            /**
             * Update the x and y coordinates of the canvas zoom
             */
            function updateCanvasZoomCoords() {
                var pd = $('#AJSRCVp').streamBoundaries('getPositionData'),
                upload = data.uploads[data.currentupload],
                diffs = getZoomDiff();
                if (!upload.canvasZoom) {
                    upload.canvasZoom = {
                        width: upload.canvasWidth ? upload.canvasWidth : upload.croppedWidth,
                        height: upload.canvasHeight ? upload.canvasHeight : upload.croppedHeight,
                        scalePercent: 1
                    };
                }
                upload.canvasZoom.x = pd.x * diffs.scale;
                upload.canvasZoom.y = pd.y * diffs.scale;
            }

            /**
             * Get the size difference between canvas and the cropped image
             * @returns {object(plain)} An object with the properties width, height, minWidth and minHeight and scale
             */
            function getZoomDiff() {
                var upload = data.uploads[data.currentupload],
                croppedw = upload.croppedWidth,
                croppedh = upload.croppedHeight,
                cw = upload.canvasWidth ? upload.canvasWidth : croppedw,
                ch = upload.canvasHeight ? upload.canvasHeight : croppedh,
                ar = croppedw / croppedh,
                mw,
                mh,
                scale = 1;
                if (croppedw > croppedh) {
                    // Landscape image
                    mh = ch;
                    mw = ch * ar;
                    if (mw < cw) {
                        // The canvas has been set larger than the image
                        mw = cw;
                        mh = cw / ar;
                    }
                } else {
                    // Portrait or square image
                    mw = cw;
                    mh = cw / ar;
                    if (mh < ch) {
                        // The canvas has been set larger than the image
                        mh = ch;
                        mw = ch * ar;
                    }
                }
                
                // We now need to make sure that the image is scaled down if the canvas is too tall
                if (ch > constants.VP_MAX_HEIGHT) {
                    var pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                    ri = $('#AJSResImg'),
                    rivisible = ri.is(':visible'),
                    riw = rivisible ? ri.width() : ri.data('width'),
                    rih = rivisible ? ri.height() : ri.data('height'),
                    w = pd.x2 - pd.x,
                    h = pd.y2 - pd.y,
                    ow = upload.width,
                    oh = upload.height;
                    w *= (ow / riw);
                    h *= (oh / rih);
                    // Get the scaled width and height
                    var calculated = calcWidthHeight(w, h, data.s.maxWidth, data.s.maxHeight),
                    vpdims = getViewportDimensions(upload, calculated),
                    scaledown = mh / constants.VP_MAX_HEIGHT;
                    mh = constants.VP_MAX_HEIGHT;
                    mw /= scaledown;
                    croppedh = vpdims.thumbHeight;
                    croppedw = vpdims.thumbWidth;
                    if (croppedh < mh) {
                        croppedh = calculated.height;
                        croppedw = calculated.width;
                    }
                    if (mw < cw) {
                        // The minimum width is too small
                        mw = cw / scaledown;
                        mh = mw / ar;
                    }
                    if (mh < ch) {
                        // The minimum height is too small
                        mh = ch / scaledown;
                        mw = mh * ar;
                    }
                    scale = vpdims.scale;
                }
                return {width: croppedw - mw, height: croppedh - mh, minWidth: mw, minHeight: mh, scale: scale};
            }

            /**
             * Redraw the upload button section
             */
            data.redraw = function () {
                $('#AJSFormPrev_' + data.id).html(drawFormPreview());
                // Rebind the events
                $('[id^=AJSUploadBtn_]').unbind('click', uploadBtnClick).click(uploadBtnClick);
                $('.AJSFP').unbind('click', ajsfpClick).click(ajsfpClick);
            };
            
            /**
             * Add or remove drag/drop functionality
             * @param {boolean} add True to enable drag/drop functionality
             */
            function toggleDragPaste(add) {
                if (data.s.readonly) {
                    // Make sure that we do not allow any way for a user to add files. The files won't be saved regardless, but it 
                    //  will look like a bug
                    add = !1;
                }
                if (draggable) {
                    if (add) {
                        // Add drag/drop functionality
                        document.body.ondragover = dragOver;
                        document.body.ondrop = dragDrop;
                    } else {
                        // Remove it
                        document.body.ondragover =  null;
                        document.body.ondrop = null;
                    }
                }
                if (pastable) {
                    var ajs = elem('AJS');
                    if (add) {
                        ajs.onpaste = paste;
                    } else {
                        ajs.onpaste = null;
                    }
                }
            }
            
            /**
             * Drag over event handler
             * @param {object(MouseEvent)} e
             */
            function dragOver (e) {
                var dt = e.dataTransfer;
                if (!in_array(dt.types, 'Files') && !in_array(dt.types, 'text/uri-list')) {
                    // The thing we are hovering with IS NOT a file, return.
                    return;
                };
                if ($(e.target).closest('.AJSBtn,.AJSInlineDrop').parent().length) {
                    $('.AJSInlineDrop').removeClass(AJSHidden);
                    $('.AJSBtn').addClass(AJSHidden);
                } else {
                    $('.AJSInlineDrop').addClass(AJSHidden);
                    $('.AJSBtn').removeClass(AJSHidden);
                }
                if (e.target.id === 'AJSMainOverlay') {
                    // Show that the place being hovered over is not the drop zone
                    $('#AJSDropZone').addClass(AJSHidden);
                } else {
                    // If the file is above the drop zone, prepare to accept it
                    e.stopPropagation();
                    e.preventDefault();
                    dt.dropEffect = 'copy';
                    $('#AJSDropZone').removeClass(AJSHidden);
                }
            }
            
            /**
             * Drop event handler
             * @param {object(MouseEvent)} e
             */
            function dragDrop (e) {
                // Prevent an accidental drop outside the drop zone
                e.stopPropagation();
                e.preventDefault();
                $('.AJSInlineDrop').css({display: 'none'});
                var et = $(e.target);
                if (et.closest('#AJS,.AJSInlineDrop').length) {
                    // Only accept drops inside the drop zones
                    $('#AJSLoading').removeClass(AJSHidden);
                    if (et.closest('.AJSInlineDrop').length) {
                        var btn = et.parent().find('.AJSBtn');
                        btn.click().removeClass(AJSHidden);
                    }
                    var dt = e.dataTransfer,
                    files = dt.files;
                    for (var i = 0; i < files.length; i++) {
                        if (!files[i].type.match(data.s.accept)) {
                            files[i] = null;
                        }
                    }
                    if (!files.length && canv) {
                        // We may have a uri-list
                        var nlen = data.uploads.length + 1;
                        if (nlen > data.s.maxFiles) {
                            // We have uploaded more files than we can handle
                            streamConfirm(tx('Maximum files exceeded'), {Close: ef},
                                tx('You have selected {0} files but are only permitted to upload {1}', nlen, data.s.maxFiles),
                                        {nocancel: true});
                            $('#AJSDropZone').addClass(AJSHidden);
                            $('#AJSLoading').addClass(AJSHidden);
                            return;
                        }
                        toggleDragPaste();
                        var filesrc = dt.getData('url');
                        if (!filesrc) {
                            filesrc = dt.getData('text/plain');
                            if (!filesrc) {
                                filesrc = dt.getData('text/uri-list');
                                if (!filesrc) {
                                    // We have tried all that we can to get this url but we can't. Abort mission
                                    $('#AJSLoading').addClass(AJSHidden);
                                    return;
                                }
                            }
                        }
                        data.event('filesloading', null, {original: T[0], toload: data.toload, loaded: data.loaded, uploads: data.uploads, 
                            stream: T});
                        getExternalFile(filesrc, tx('There was an error processing the external file you dropped'));
                        $('#AJSDropZone').addClass(AJSHidden);
                        return;
                    }
                    $('#AJSDropZone').addClass(AJSHidden);
                    data.addingmore = true;
                    data.filechanged.call(null, {eventType: 'drop', originalEvent: e, target: {files: files}});
                }
            }
            
            /**
             * Upload an external file
             * @param {string} filesrc The path to the external file
             * @param {string} errormsg The message to show if there are any errors during the process. WARNING: No value suppresses the 
             *  error
             */
            function getExternalFile(filesrc, errormsg) {
                var tdp = function () {toggleDragPaste(true);};
                $.ajax({
                    url: data.s.uploadScript + '?external=true',
                    type: 'post',
                    dataType: 'json',
                    data: {filesrc: filesrc, uploaddir: data.s.uploadTo}
                }).done(function (e) {
                    if (e.result === 'OK') {
                        // The file has been successfully 'uploaded' to the server, add it to the upload list
                        tdp();
                        var len = data.uploads.length;
                        e.data.index = len;
                        data.uploads[len] = e.data;
                        data.currentlength++;
                        $('#AJSFile,#AJSFileLegacy').val(null);
                        $('#AJSUploadSection').addClass(AJSHidden);
                        $('#AJSImagePreview').removeClass(AJSHidden);
                        data.toggleLR();
                        data.event('filesloaded', null, {loaded: data.loaded, original: T[0], uploads: data.uploads, stream: T});
                        data.changing = false;
                        data.toload = data.loaded = 0;
                        if (e.data.mimetype.match('image/*')) {
                            var img = new Image();
                            img.onload = function () {
                                this.imageloaded = true;
                                ZZ.images['AJSIMG_' + data.id + len] = img;
                                data.displayUpload(null, true);
                            };
                            img.onerror = function () {
                                // The upload is corrupt, remove from the array
                                data.uploads.splice(len, 1);
                                if (errormsg) {
                                    streamConfirm(tx('Error'), {Close: tdp}, errormsg, {nocancel: true});
                                }
                            };
                            img.src = e.data.src + '?cachekill=' + (new Date().getTime());
                        } else {
                            data.displayUpload(null, true);
                        }
                    } else {
                        if (errormsg) {
                            streamConfirm(tx('Error'), {Close: tdp}, errormsg, {nocancel: true});
                        }
                    }
                }).fail(function () {
                    $('#AJSLoading').addClass(AJSHidden);
                    if (errormsg) {
                        streamConfirm(tx('Error'), {Close: tdp}, errormsg, {nocancel: true});
                    }
                });
            }
            
            /**
             * Paste event handler
             * @param {object(Event)} e
             */
            function paste (e) {
                var clipboarditems = e.clipboardData.items,
                len = clipboarditems.length,
                filesrc = null,
                error = false;
                for (var i = 0; i < clipboarditems.length; i++) {
                    var ci = clipboarditems[i];
                    if (!ci.type.match(data.s.accept)) {
                        // This item is not valid for this upload
                        if (ci.type.match(/^text\/html/) && ('getAsString' in ci)) {
                            // The getAsString function exists in the ClipboardItem object and the data received is html
                            ci.getAsString(function (s) {
                                // Instead of trying to manually parse the HTML, let jQuery do it. There will be two elements created,
                                //  the first being a meta tag and the latter being an image tag
                                filesrc = $(s)[1].src;
                                if (error && filesrc && filesrc.match(/^http(:?s)?\:\/\//)) {
                                    // If the script encountered a problem later on but we have a valid looking filesrc, attempt an 
                                    //  external upload
                                    getExternalFile(filesrc);
                                }
                            });
                        }
                        clipboarditems[i] = null;
                        len--;
                    }
                }
                if (!len) {
                    error = true;
                    return;
                }
                data.toload = len;
                data.loaded = 0;
                var tlen = len + data.uploads.length;
                if (tlen > data.s.maxFiles) {
                    streamConfirm(tx('Maximum files exceeded'), {Close: ef},
                    tx('You have selected {0} files but are only permitted to upload {1}', tlen, data.s.maxFiles),
                            {nocancel: true});
                    len = data.toload = data.s.maxFiles - data.uploads.length;
                }
                for (var i = 0; i < len; i++) {
                    var ci = clipboarditems[i];
                    if (!ci) {
                        // We have removed this file from the list. Continue without it
                        continue;
                    }
                    var file = ci.getAsFile();
                    if (file && file.size) {
                        data.addingmore = true;
                        data.process(file, i);
                    } else {
                        error = true;
                        // The error message is weird because the system attempts to perform an external grab of a dropped file on failure
                        // Getting the path of a dropped file is done using a callback, so by this point it cannot be guaranteed that
                        //  the path will have been determined
                        if (error && filesrc && filesrc.match(/^http(:?s)?\:\/\//)) {
                            // The filesrc has been determined by this point
                            error = false;
                            getExternalFile(filesrc, tx('There was an error processing the file that you pasted'));
                        } else {
                            streamConfirm(tx('Error'), {Close: ef},
                                tx("There was an error processing the pasted file. The system will try to get the file another way"), 
                                {nocancel: true});
                        }
                    }
                }
            }

            /**
             * The window resize handler
             */
            function winResize() {
                var id = 'AJSIMG_' + data.id + data.currentupload,
                        t = $('#' + id);
                if (t.is(':visible')) {
                    t.css({top: (500 - t.height()) / 2});
                }
                var ajs = $('#AJS');
                ajs.css({marginLeft: -(ajs.width() / 2), marginTop: -(ajs.height() / 2)});
            }

            /**
             * If the user wants to see a preview of the uploaded files on the form, build it here
             * @returns {html}
             */
            function drawFormPreview() {
                var outtext = '',
                u = data.uploads,
                iconHeight = parseFloat(data.s.iconPreviewHeight),
                iconWidth = parseFloat(data.s.iconPreviewWidth),
                leng = 0;
                for (var x in u) {
                    var curobj = u[x],
                    mastermime = curobj.mimetype.replace(/\/.*$/, ''),
                    isimg = mastermime === 'image',
                    inner;
                    if (isimg) {
                        var style,
                        w = curobj.canvasWidth ? curobj.canvasWidth : curobj.croppedWidth,
                        h = curobj.canvasHeight ? curobj.canvasHeight : curobj.croppedHeight;
                        if (w < h) {
                            style = 'height: 100%;width: auto;';
                        } else {
                            var ar = w / h,
                            h = iconWidth / ar;
                            style = 'width: 100%;height: auto;margin-top:' + ((iconHeight - h) / 2) + 'px;';
                        }
                        inner = cHE.getHtml('img', null, null, null, {
                            src: curobj.newsrc,
                            'style': style
                        });
                    } else {
                        inner = cHE.getSpan(null, null, getIconClass(mastermime, curobj.mimetype), {
                            style: 'line-height:' + iconHeight + 'px;font-size:' + (iconWidth - 20) + 'px;'
                        });
                    }
                    inner += cHE.getDiv(curobj.name, null, 'AJSFPName');
                    outtext += cHE.getDiv(inner, 'AJSFP_' + data.id + '_' + curobj.index, 'AJSFP', {
                        style: 'width:' + iconWidth + 'px;height:' + iconHeight + 'px;',
                        tabindex: 0
                    });
                    leng++;
                }
                if (data.s.maxFiles && u.length + 1 <= data.s.maxFiles && data.uploads.length && fapi) {
                    // @todo For v2, Allow non fapi browsers to add more than one file
                    // Only show the plus if we can add more
                    outtext += cHE.getSpan(null, 'AJSUploadBtn_' + data.id, 'asicons-plus AJSBtn AJSFPBtn', {'data-ajaxstreamid': data.c,
                        tabindex: 0});
                }
                if (!leng) {
                    outtext += cHE.getSpan(tx('Upload'), 'AJSUploadBtn_' + data.id, 'AJSBtn', {
                        'data-mandatory': !0, 
                        'data-ajaxstreamid': data.c,
                        tabindex: 0
                    }) + cHE.getSpan(tx('Drop'), 'AJSDropZone_' + data.id, 'AJSInlineDrop ' + AJSHidden);
                }
                return outtext;
            }

            /**
             * Draw the ajax main window
             */
            data.draw = function() {
                // Auto executing
                T.addClass(AJSHidden);
                T.attr({'data-ajaxstreamid': data.c});
                var warned = false;
                if (exists($('#AJS_' + T[0].id))) {
                    var val = $('#AJS_' + T[0].id).val();
                    data.uploads = val.length ? json_decode(val, !0) : [];
                    data.currentlength = data.uploads.length;
                    for (var i = 0; i < data.currentlength; i++) {
                        var u = data.uploads[i];
                        if (!u.cropdata) {
                            // If we haven't got crop data, create an object in its place
                            u.cropdata = {};
                        }
                        if (!u.src) {
                            var blob = base64ToBlob(u.newsrc, u.mimetype);
                            if (blob) {
                                u.src = URL.createObjectURL(blob);
                            } else {
                                // This is a malformed upload
                                data.uploads.splice(i, 1);
                                console.warn('Removed file: ' + u.name);
                                if (!warned) {
                                    streamConfirm(tx('There are bad files'));
                                    warned = true;
                                }
                            }
                        }
                        if (!u.mimetype) {
                            // No mimetype was supplied
                            u.mimetype = 'application/octet-stream';
                        } else if (u.mimetype.match('image/*')) {
                            // Add images to the images cache
                            var img = new Image();
                            img.onload = function () {
                                this.imageloaded = !0;
                            };
                            img.ajsindex = i;
                            img.ajsname = u.name;
                            img.onerror = function () {
                                // As there was an error with the image, there is no way to continue safely. Remove the item from the 
                                //  uploads array, and all references to it
                                data.uploads = data.uploads.splice(this.ajsindex, 1);
                                console.warn('Removed file: ' + this.ajsname);
                                if (!warned) {
                                    streamConfirm(tx('There are bad files'));
                                    warned = true;
                                }
                                $('#ajaxstream_' + T[0].id).val(JSON.stringify(data.uploads));
                                $('#AJSFP_' + data.id + '_' + this.ajsindex).remove();
                                data.currentlength = data.uploads.length;
                                delete ZZ.images['AJSIMG_' + data.id + this.ajsindex];
                            };
                            img.src = u.src.match(/^http(:?s)?\:/) ? u.src + '?cachekill=' + (new Date().getTime()) : u.src;
                            ZZ.images['AJSIMG_' + data.id + i] = img;
                        }
                    }
                } else {
                    T.after(cHE.getInput('AJS_' + T[0].id, null, null, 'hidden'));
                }
                if (data.s.showPreviewOnForm) {
                    // The user wants to see a preivew on the form
                    T.after(cHE.getDiv(drawFormPreview(), 'AJSFormPrev_' + data.id, 'AJSFormPrev', {
                        style: 'height:' + data.s.iconPreviewHeight
                    }));
                } else {
                    T.after(cHE.getSpan(tx('Upload'), 'AJSUploadBtn_' + data.id, 'AJSBtn', {
                        'data-mandatory': !0, 
                        'data-ajaxstreamid': data.c
                    }));
                }
                if (!exists($('#AJS'))) {
                    // Only create an ajaxStreamMain if one does not already exist in the DOM
                    body.append(cHE.getDiv(drawMainDialogue(data.s.pathPrefix), 'AJS'));
                    if (fapi) {
                        $('#AJSImagePreview').after(drawInfoBay());
                    } else {
                        drawLegacy();
                    }
                    $('#AJSRITrack').streamBoundaries({
                        width: '100%',
                        height: '100%',
                        orientation: '2d',
                        resizable: !0,
                        bg: 'none',
                        thumbBg: 'none',
                        round: !1,
                        scale9Grid: data.s.scale9Grid,
                        onBeforeUpdate: function () {
                            T = ZZ.currentstream;
                            this.s.lockAspectRatio = data.uploads[data.currentupload].aspectRatioLocked;
                        },
                        onUpdate: function(e) {
                            positionRBG(e);
                        }
                    });
                    $('#AJSRCVp').streamBoundaries({
                        crosshair: !1,
                        height: '100%',
                        isViewport: !0,
                        orientation: '2d',
                        onFinish: updateCanvasZoomCoords,
                        thumbBorder: 'none',
                        width: '100%'
                    });
                    $('#AJSCZ').streamBoundaries({
                        bg: '#999',
                        crosshair: !1,
                        height: 8,
                        onFinish: updateCanvasZoom,
                        onUpdate: updateCanvasZoom,
                        thumbBg: '#444',
                        thumbBorder: 'none',
                        thumbBorderRadius: 3,
                        thumbHeight: 8,
                        thumbWidth: '15%',
                        trackBorderRadius: 3,
                        width: '100%',
                        x: '85%'
                    });
                }
                data.initBinding();
                data.event('init', T, {original: T[0], uploads: data.uploads});
            }();

            // Cache this object for later use
            ZZ.streams[data.id] = T;
            T.data('ajs.ajaxstreamdata', data);
            return T;
            
        },
        setUploadData: function (uploaddata, redraw) {
            var T = this,
            data = T.data('ajs.ajaxstreamdata'),
            warned = false;
            if (is_a('string', uploaddata)) {
                // The user has passed us a string, assume it is JSON data
                uploaddata = json_decode(uploaddata);
            }
            data.uploads = uploaddata ? object_to_array(uploaddata) : [];
            // Go through each of the uploads, making sure we have a cached an image for this upload
            for (var i = 0; i < data.uploads.length; i++) {
                if (data.uploads[i].mimetype.match('image/*')) {
                    // This upload is indeed an image
                    var img = new Image(),
                    u = data.uploads[i],
                    src = u.src;
                    img.onload = function () {
                        this.imageloaded = !0;
                    };
                    img.ajsindex = i;
                    img.ajsname = u.name;
                    img.onerror = function () {
                        // As there was an error with the image, there is no way to continue safely. Remove the item from the 
                        //  uploads array, and all references to it
                        data.uploads = data.uploads.splice(this.ajsindex, 1);
                        console.warn('Removed file: ' + this.ajsname);
                        if (!warned) {
                            streamConfirm(tx('There are bad files'));
                            warned = true;
                        }
                        $('#AJS_' + data[0].id).val(JSON.stringify(data.uploads));
                        $('#AJSFP_' + data.id + '_' + this.ajsindex).remove();
                        data.currentlength = data.uploads.length;
                        delete ZZ.images['AJSIMG_' + data.id + this.ajsindex];
                    };
                    img.src = src.match(/^http(:?s)?\:/) ? src + '?cachekill=' + (new Date().getTime()) : src;
                    ZZ.images['AJSIMG_' + data.id + i] = img;
                }
            }
            data.currentlength = data.uploads.length;
            data.toload = data.loaded = data.currentupload = 0;
            if (redraw) {
                data.redraw();
            }
            data.event('setuploaddata', T, {original: T[0], uploads: data.uploads});
            T.data('ajs.ajaxstreamdata', data);
        }
    };
    
    function log(key, value) {
        if (uselocalstorage) {
            localStorage.setItem(key, value);
        } else {
            // @todo Use cookies
        }
    }
    
    function getLogValue(key) {
        if (uselocalstorage) {
            window.localStorage.getItem(key);
        } else {
            // @todo Use cookies
        }
    }
    
    function removeFromLog(key) {
        if (uselocalstorage) {
            window.localStorage.setItem(key);
        } else {
            // @todo Use cookies
        }
    }
    
    /**
     * Calculate a new width and height for the uploaded file is one of the axis exceeds the maximum allowed
     * @param {float} width The current width of the image
     * @param {float} height The current height of the image
     * @param {float} maxWidth The maximum width allowed
     * @param {float} maxHeight The maximum height allowed
     * @param {object(plain)} upload [optional] The object that describes the file being worked with
     * @returns {object(plain)} An object in the form {width: float(width), height: float(height)}
     */
    function calcWidthHeight(width, height, maxWidth, maxHeight, upload) {
        var w = width * 1,
        h = height * 1;
        if (upload) {
            // As we have been given an upload object, make sure that maxHeight and maxWidth do not exceed the size of the image
            maxWidth = maxWidth > upload.width ? upload.width : maxWidth;
            maxHeight = maxHeight > upload.height ? upload.height : maxHeight;
        }
        if (w > h) {
            if (w > maxWidth) {
                h = round(h *= maxWidth / w);
                w = maxWidth;
            }
        } else {
            if (h > maxHeight) {
                w = round(w *= maxHeight / h);
                h = maxHeight;
            }
        }
        return {width: Math.round(w), height: Math.round(h)};
    }
    
    /**
     * A wrapper for Math.round
     * @param {float} val The number to round
     * @returns {Number} The rounded number
     */
    function round(val) {
        return Math.round(val);
    }

    /**
     * Position the four divs that surround crop grid so that it looks like everything outside the middle of the grid is blacked out
     * @param {object(plain)} positionData The object that describes the position of the crop grid
     */
    function positionRBG(positionData) {
        var xw = positionData.x2 - positionData.x;
        $('#AJSCropT').css({width: xw, height: positionData.y, left: positionData.x, top: 0});
        $('#AJSCropR').css({width: positionData.trackWidth - positionData.x2, height: positionData.trackHeight, right: 0, top: 0});
        $('#AJSCropB').css({width: xw, height: positionData.trackHeight - positionData.y2, left: positionData.x, bottom: 0});
        $('#AJSCropL').css({width: positionData.x, height: positionData.trackHeight, left: 0, top: 0});
    }
    
    /**
     * Make a blob from a base64 string
     * @see http://goo.gl/r7c8IJ
     * @param {string} base64 The base64 data
     * @param {string} mimetype The mimetype of the data
     * @param {int} slicesize The size of a chunk [defaults to 512]
     * @returns {Blob} A blob or null if atob or Uint8Array is not a supported function
     */
    function base64ToBlob(base64, mimetype, slicesize) {
        if (!window.atob || !window.Uint8Array) {
            // The current browser doesn't have the atob function. Cannot continue
            return null;
        }
        mimetype = mimetype || '';
        slicesize = slicesize || 512;
        var bytechars = atob(base64.replace(/^data:[a-z09\/-]+;base64,/, '')),
        bytearrays = [];
        for (var offset = 0; offset < bytechars.length; offset += slicesize) {
            var slice = bytechars.slice(offset, offset + slicesize),
            bytenums = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                bytenums[i] = slice.charCodeAt(i);
            }
            var bytearray = new Uint8Array(bytenums);
            bytearrays[bytearrays.length] = bytearray;
        }
        return new Blob(bytearrays, {type: mimetype});
    }

    /**
     * Draw the legacy elements
     */
    function drawLegacy() {
        if (!exists($('#AJSLegacy'))) {
            var formsettings = {
                method: 'post',
                enctype: 'multipart/form-data',
                target: 'AJSIFrame',
                name: 'AJSLegacyForm',
                'action': '/upload.php'
            };
            $('body').append(
                    cHE.getHtml('form',
                            cHE.getInput('AJSLegacy', null, null, 'hidden') +
                            cHE.getInput(null, 'submit', null, 'submit'), 'AJSLegacyForm', AJSHidden, formsettings) +
                    cHE.getHtml('iframe', null, 'AJSIFrame', AJSHidden, {name: 'AJSIFrame'})
                    );
        }
    }

    /**
     * Get the lowest possible fraction from a floating point number
     * @src http://goo.gl/SqQTTf
     * @param {float} x0 The decimal from which we will get a fraction
     * @returns {string}
     */
    function getLowestFraction(x0) {
        var eps = 1.0E-15, h, h1, h2, k, k1, k2, a, x = x0;
        a = Math.floor(x);
        h1 = 1;
        k1 = 0;
        h = a;
        k = 1;
        while (x - a > eps * k * k) {
            x = 1 / (x - a);
            a = Math.floor(x);
            h2 = h1;
            h1 = h;
            k2 = k1;
            k1 = k;
            h = h2 + a * h1;
            k = k2 + a * k1;
        }
        return h + ":" + k;
    }

    /**
     * Draw the main AjaxStream dialogue
     * @syntax drawMainDialogue();
     * @param {string} pathprefix The path prefix to the ajaxstream files directory without the trailing slash
     * @returns {html}
     */
    function drawMainDialogue(pathprefix) {
        var top = drawImagePreview() +
                drawUploader();
        return cHE.getDiv(null, 'AJSMainOverlay') + cHE.getDiv(top + cHE.getHtml('img', null, 'AJSLoading', AJSHidden, {
            src: pathprefix + '/files/loader.gif',
            title: tx('Files are loading')
        }), 'AJSMain');
    }

    /**
     * Draw the preview into view
     * @syntax drawImagePreview()
     * @returns {html}
     */
    function drawImagePreview() {
        var outtext = drawActionBar() + cHE.getDiv(
                cHE.getSpan(null, 'AJSL', 'AJSLR asicons-arrow-left') +
                cHE.getSpan(null, 'AJSR', 'AJSLR asicons-arrow-right'), 'AJSLRContainer'
                );
        return cHE.getDiv(outtext, 'AJSImagePreview', AJSHidden);
    }

    /**
     * Draw the top bar of the uploader where the action buttons will be stored
     * @returns {html}
     */
    function drawActionBar() {
        return cHE.getDiv(
                cHE.getDiv(null, 'AJSActionsOverlay') +
                cHE.getDiv(
                        (fapi ? cHE.getSpan(null, 'AJSAdd', 'asicons-plus', {title: tx('Add another file')}) : '') +
                        (fapi ? cHE.getSpan(null, 'AJSChange', 'asicons-docs', {title: tx('Change file')}) : '') +
                        (canv ? cHE.getSpan(null, 'AJSEdit', 'asicons-pencil', {title: tx('Edit')}) : '') +
                        cHE.getSpan(null, 'AJSRemove', 'asicons-trash', {title: tx('Remove file')}) +
                        cHE.getSpan(null, 'AJSClose', 'asicons-checkmark', {title: tx('Close window')})),
                'AJSPreviewActions');
    }

    /**
     * Draw the information section (Custom fields)
     * @returns {html}
     */
    function drawInfoBay() {
        var inner = '';
        inner += cHE.getDiv(
                        cHE.getDiv(
                    cHE.getDiv(
                        cHE.getHtml('img', null, 'AJSResImg') +
                        cHE.getDiv(
                                cHE.getDiv(null, 'AJSCropT') +
                                cHE.getDiv(null, 'AJSCropR') +
                                cHE.getDiv(null, 'AJSCropB') +
                            cHE.getDiv(null, 'AJSCropL'), 
                        'AJSRBG') + 
                        cHE.getDiv(cHE.getDiv(), 'AJSRITrack'),
                    'AJSRInner') + 
                    cHE.getDiv(
                        cHE.getDiv(
                            cHE.getDiv(cHE.getHtml('img', null, 'AJSRCImg')),
                        'AJSRCVp'),
                    'AJSRC', AJSHidden) +
                    cHE.getDiv(drawEditIcons() + renderEditables(),'AJSScaleInfo'), 
                'AJSRIHolder'), 
            'AJSInfo');
        return cHE.getDiv(inner +
                cHE.getDiv(
                        cHE.getSpan(null, 'AJSISave', 'asicons-checkmark') +
                        cHE.getSpan(null, 'AJSICancel', 'asicons-cross'), 'AJSIBtns'), 'AJSMore', AJSHidden);
    }

    /**
     * Draw the icons that are visible when in edit mode
     * @returns {html}
     */
    function drawEditIcons() {
         return cHE.getDiv(
         cHE.getSpan(null, null, 'AJSEIcon asicons-transform', {'data-for': 'AJSWHAR', 'title': tx('Crop Image')}) +
         cHE.getSpan(null, null, 'AJSEIcon asicons-flip-to-front', {'data-for': 'AJSRCan', 'title': tx('Resize canvas')}),
         'AJSEditIcons');
    }

    function renderEditables() {
        return drawScaleInfo() + drawCanvasResize();
    }

    /**
     * Draw the canvas resize screen
     * @returns {html}
     */
    function drawCanvasResize() {
        return cHE.getDiv(
                cHE.getDiv(
                    cHE.getSpan(tx('CANVAS WIDTH')) + cHE.getInput('AJSCW'), 
                null, 'AJSSInfo') +
                cHE.getDiv(
                    cHE.getSpan(tx('CANVAS HEIGHT')) + cHE.getInput('AJSCH'), 
                null, 'AJSSInfo') +
                cHE.getDiv(
                    cHE.getSpan(tx('ZOOM')) + cHE.getDiv(cHE.getDiv(), 'AJSCZ'),
                null, 'AJSSInfo'), 
            'AJSRCan', 'AJSEDivs AJSHidden');
    }

    /**
     * Draw the scale info section
     * @returns {html}
     */
    function drawScaleInfo() {
        return cHE.getDiv(
                cHE.getDiv(
                    cHE.getSpan(tx('WIDTH')) + 
                    cHE.getInput('AJSSW', null, null, 'text', {readonly: ''}), 
                null, 'AJSSInfo') +
                cHE.getDiv(
                    cHE.getSpan(tx('HEIGHT')) + 
                    cHE.getInput('AJSSH', null, null, 'text', {readonly: ''}), 
                null, 'AJSSInfo') +
                cHE.getDiv(
                    cHE.getSpan(tx('ASPECT RATIO')) + 
                    cHE.getInput('AJSSAR') + 
                    cHE.getSpan(null, 'AJSLockAR', 'AJSLock asicons-lock-open2'), 
                null, 'AJSSInfo'), 
        'AJSWHAR', 'AJSEDivs');
    }

    /**
     * Draw the actual upload section, i.e. the upload button and the 'drop zone'
     * @syntax drawUploader();
     * @returns {html}
     */
    function drawUploader() {
        var ptext = (pastable ? '<strong>' + getPasteText() + '</strong>' : ''),
        dtext = (draggable ? (ptext ? ' ' + tx('or') + ' ' : '') + '<strong>' + tx('drop') + '</strong>' : ''),
        choosefile =
                cHE.getSpan(tx('Choose file') + (fapi ? '' : ' ' +
                        cHE.getInput('AJSFileLegacy', null, null, 'file')), 'AJSChooseText', 'AJSBtnD') +
                cHE.getSpan(null, 'AJSCloseText', 'AJSBtnD asicons-cross') + 
                (ptext || dtext ? cHE.getDiv(tx('You can also') + ' ' + ptext + dtext + ' ' + tx('the file'), 'AJSUMore') : '');
        var outtext = cHE.getDiv(
                cHE.getInput('AJSFile', null, AJSHidden, 'file') +
                cHE.getDiv(choosefile, 'AJSChooseFile'), 'AJSChooseSection');
        return cHE.getDiv(outtext, 'AJSUploadSection') +
                (draggable ? cHE.getDiv(cHE.getHtml('a', tx('DROP')), 'AJSDropZone', AJSHidden) : '');
    }
    
    /**
     * Get the text to show on the paste button
     * @returns {string} The paste text depending on the user's OS
     */
    function getPasteText() {
        var modifier = '(ctrl + v)';
        if (navigator.platform.match(/Mac/i)) {
            modifier = '(cmd + v)';
        }
        return tx('paste') + ' ' + modifier;
    }

    /**
     * @brief Translate a string using the supplied translation function
     * @syntax tx(s [, arg1, arg2, ...])
     * @param {string} s The input string, untranslated
     * @returns {string} The translated string
     */
    if (typeof tx !== 'function') {
        function tx(s) {
            return s;
        }
    }

    /**
     * @brief Return the last element in an array
     * @param {array} arr The array we will take from
     * @returns {unknown} The last element in your array
     */
    function end(arr) {
        return arr.slice(-1)[0];
    }

    /**
     * @brief Return the first element in an array
     * @param {array} arr The array that we will take from
     * @returns {unknown} The first element in your array
     */
    function reset(arr) {
        if (arr[0]) {
            return arr[0];
        } else {
            for (var x in arr) {
                if (arr.hasOwnProperty(x)) {
                    // Return the first one
                    return arr[x];
                }
            }
        }
    }
    
    /**
     * Determine whether a value exists in an array
     * @param {array} arr The array to look in
     * @param {mixed} key The item to search for
     * @returns {boolean} True if 'key' is in the array
     */
    function in_array(arr, key) {
        for (var i = 0;i < arr.length; i++) {
            if (arr[i] === key) {
                return !0;
            }
        }
        return !1;
    }

    /**
     * A short hand alias to document.getElementById
     * @param {string} id The html id of the element to look for
     * @returns {object(DOMElement)}
     */
    function elem(id) {
        return document.getElementById(id);
    }

    /**
     * @brief Determine whether a variable is an object
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable is an object
     */
    function is_object(variable) {
        return is_a('Object', variable);
    }
    
    /**
     * Determine whether a variable is an array
     * @param {Mixed} variable The variable to test
     * @returns {Boolean} True if the variable is an array
     */
    function is_array(variable) {
        return is_a('Array', variable);
    }

    /**
     * Determine whether parameter two is an object of type parameter one
     * @param {string} type The expected type
     * @param {mixed} variable The object to test
     * @returns {boolean} True if parameter two is an object of type paremeter one
     */
    function is_a(type, variable) {
        if (variable === undefined) {
            // Undefined is an object in IE8
            return !1;
        }
        var otype = type.substr(0, 1).toUpperCase() + type.substr(1).toLowerCase();
        return Object.prototype.toString.call(variable) === '[object ' + otype + ']';
    }

    /**
     * @brief Determine whether an element exists or not
     * @param {Object(DOMElement)} obj The element to test
     * @returns {Boolean} True if the element exists
     */
    function exists(obj) {
        return obj.length > 0;
    }

    /**
     * @brief Convert an object into an array
     * @param {object} obj The object to convert
     * @returns {array} The array as an object
     */
    function object_to_array(obj) {
        var output = [];
        for (var x in obj) {
            if (obj.hasOwnProperty(x)) {
                output.push(obj[x]);
            }
        }
        return output;
    }

    /**
     * Decode a JSON string
     * @syntax var obj = json_decode(jsonstring);<br/>var obj2 = json_decode(jsonstring, true);
     * @param {string} str The json string to decode
     * @param {boolea} toarray (optional) True to return the result as an array
     * @returns {array|Array|Object}
     */
    function json_decode(str, toarray) {
        var res;
        if (!str) {
            return !1;
        }
        try {
            res = JSON.parse(str);
        } catch (e) {
            res = JSON.parse("'" + str + "'");
        }
        return res ? (toarray ? object_to_array(res) : res) : !1;
    }

    /**
     * @brief Encode an object or an array into a JSON string
     * @param {mixed} object The object or an array to turn into a JSON string
     * @returns {string} A JSON string
     */
    function json_encode(object) {
        var obj = object;
        if (is_a('Array', obj)) {
            obj = {};
            for (var i = 0, len = object.length; i < len; i++) {
                if (object[i]) {
                    obj[i] = object[i];
                }
            }
        }
        return JSON.stringify(obj);
    }
    
    /**
     * The global ajaxStream object
     */
    window.ZZ = $.ajaxStream = {
        author: 'Luke Madhanga',
        currentstream: null,
        images: {},
        license: 'MIT',
        streams: {},
        /**
         * Set the defaults for all ajaxStream objects
         * @param {object(plain)} opts The options that you want to set
         */
        setDefaults: function(opts) {
            defaults = $.extend(defaults, opts);
        },
        version: '3.0.0'
    };

    function cHE() {

        var self = this;                ///< An alias to this

        /**
         * Generate an 'a' tag link
         * @syntax cHE.getLink(body, domain.tld, htmlid, cssclass, false | true, {attribute: value});
         * @param {string} body The body of the link
         * @param {string} href The destination of the link
         * @param {string} id The htmlid of the link
         * @param {string} cssclass The class of the link
         * @param {boolean} nofollow True to prevent search engines from following this link
         * @param {object} moreattrs An object in the form {html_attribute: value, ...}
         * @returns {html}
         */
        this.getLink = function(body, href, id, cssclass, nofollow, moreattrs) {
            if (!is_object(moreattrs)) {
                moreattrs = {};
            }
            if (nofollow) {
                moreattrs.rel = 'nofollow';
            }
            moreattrs.href = href;
            return self.getHtml('a', body, id, cssclass, moreattrs);
        };

        /**
         * Generate a xhtml element, e.g. a div element
         * @syntax cHE.getHtml(tagname, body, htmlid, cssclass, {attribute: value});
         * @param {string} tagname The type of element to generate
         * @param {string} body The body to go with 
         * @param {string} id The id of this element
         * @param {string} cssclass The css class of this element
         * @param {object} moreattrs An object in the form {html_attribute: value, ...}
         * @returns {html} The relevant html as interpreted by the browser
         */
        this.getHtml = function(tagname, body, id, cssclass, moreattrs) {
            var html = document.createElement(tagname);
            if (body) {
                html.innerHTML = body;
            }
            if (id) {
                html.id = id;
            }
            if (cssclass) {
                html.className = cssclass;
            }
            setAttributes(html, moreattrs);
            return html.outerHTML;
        };

        /**
         * Genereate an input element
         * @param {string} id The id of the input. If not manually set, this will also become the name of the input
         * @param {string} value The value of the input
         * @param {string} cssclass The cssclass of the input
         * @param {string} type The type of the input, e.g. text, hidden, email, etc.
         * @param {object(plain)} moreattrs More attributes to apply to the input
         * @returns {html}
         */
        this.getInput = function(id, value, cssclass, type, moreattrs) {
            if (!is_object(moreattrs)) {
                moreattrs = {};
            }
            if (value || value === 0) {
                moreattrs.value = value;
            }
            if (id && !moreattrs.name) {
                // Do not overwrite the name attribute if it has been specified manually
                moreattrs.name = id;
            }
            moreattrs.type = type ? type : 'text';
            return self.getHtml('input', null, id, cssclass, moreattrs);
        };

        /**
         * Generate a span element
         * @param {string} body The body of the span
         * @param {string} id The id of this element
         * @param {string} cssclass The css class of this element
         * @param {object} moreattrs An object in the form {html_attribute: value, ...}
         * @returns {html}
         */
        this.getSpan = function(body, id, cssclass, moreattrs) {
            return self.getHtml('span', body, id, cssclass, moreattrs);
        };

        /**
         * Generate a div element
         * @syntax cHE.getDiv(body, htmlid, cssclass, {attribute: value [,...]});
         * @param {string} body The body to go with 
         * @param {string} id The id of this element
         * @param {string} cssclass The css class of this element
         * @param {object} moreattrs An object in the form {html_attribute: value [,...]}
         * @returns {html}
         */
        this.getDiv = function(body, id, cssclass, moreattrs) {
            return self.getHtml('div', body, id, cssclass, moreattrs);
        };

        /**
         * Set the custom attributes
         * @param {object(DOMElement)} obj
         * @param {object(plain)} attrs
         * @returns {object(DOMElement)}
         */
        function setAttributes(obj, attrs) {
            if (is_object(attrs)) {
                for (var x in attrs) {
                    if (attrs.hasOwnProperty(x)) {
                        var val = attrs[x];
                        if (typeof val === 'boolean') {
                            // Convert booleans to their integer representations
                            val = val ? 1 : 0;
                        }
                        obj.setAttribute(x, val);
                    }
                }
            }
        }

    }
    cHE = new cHE();
    
    $.fn.ajaxStream = function(methodOrOpts) {
        if (methods[methodOrOpts]) {
            // The first option passed is a method, therefore call this method
            return methods[methodOrOpts].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (Object.prototype.toString.call(methodOrOpts) === '[object Object]' || !methodOrOpts) {
            // The default action is to call the init function
            return methods.init.apply(this, arguments);
        } else {
            // The user has passed us something dodgy, throw an error
            $.error(['The method ', methodOrOpts, ' does not exist'].join(''));
        }
    };
    
})(jQuery, this, 0, document, Math);