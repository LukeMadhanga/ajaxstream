(function ($, win, count, document){
    
    // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
    var length = 'length',
    prop = 'prop',
    AJS = 'AJS',
    hAJS = '#AJS',
    AJSHidden = 'AJSHidden',
    replace = 'replace',
    name = 'name',
    ef = function () {},
    pastable = 'onpaste' in document,
    draggable = 'draggable' in document.createElement('span'),
    fapi = !!(win.Blob || win.File || win.FileList || win.FileReader),
    canvtest = document.createElement('canvas'),
    canv = !!(canvtest.getContext && canvtest.getContext('2d')),
    defaults = {
        accept: ['*'],
        allowFilters: !0,
        fetchRequiredFiles: !1,
        maxFileSize: 2097152,
        maxFiles: 1,
        iconPreviewWidth: 200,
        iconPreviewHeight: 200,
        maxHeight: 1024,
        maxWidth: 1024,
        onfilechanging: ef,
        onfilechanged: ef,
        onfileselected: ef,
        onfilesloaded: ef,
        onfilesloading: ef,
        oninit: ef,
        onlegacyuploadfail: ef,
        onlegacyuploadfinish: ef,
        onlegacyuploadstart: ef,
        onsingleuploadfail: ef,
        onsingleuploadfinish: ef,
        onsingleuploadstart: ef,
        onuploadfail: ef,
        onuploadfinish: ef,
        onuploadprogress: ef,
        onuploadstart: ef,
//            previewOrientation: root.const['PREVIEW_ORI_GRID'],
        quality: 1,
        resize: !0,
        showPreviewOnForm: !1,
        translateFunction: function(s) {
            for (var i = 1; i < arguments[length]; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
                s = s[replace](re, arguments[i]);
            }
            return s;
        },
        uploadScript: "upload.php",
        uploadTo: "uploads",
        uploadWithForm: !1,
        verbose: !1
    };
    
    $.fn.ajaxStream = function (opts){
        /**
         * An alias to this object
         * @type @this;
         */
        var T = this;
        if (T[length] > 1) {
            // If the length is more than one, apply this function to all objects
            T.each(function (){
                $(this).ajaxStream(opts);
            });
            return T;
        } else if (!T[length]) {
            // We have no objects return
            return T;
        }
        var body = $('body'),
        // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
        change = 'change',
        attr = 'attr',
        uploads = 'uploads',
        currentupload = 'currentupload',
        changing = 'changing',
        currentlength = 'currentlength';
        T.c = count;
        T[currentupload] = null;
        T[currentlength] = 0;
        T[changing] = !1;
        T.toload = 0;
        T.loaded = 0;
        T[uploads] = [];
        T.addingmore = !1;
        T.s = $.extend($.extend({}, defaults), opts);

        /**
         * @brief Translate a string using the supplied translation function
         * @syntax tx(s [, arg1, arg2, ...])
         * @param {string} s The input string, untranslated
         * @returns {string} The translated string
         */
        if (typeof tx !== 'undefined') {
            // NB: This code was designed for a system that has a function tx that translates strings into another language
            function tx(s) {
                s === s; // Null assignemnt: Dump NetBeans warning
                return T.s.translateFunction.apply(null, arguments);
            }
        }
        
        T.id = [T.c, '_', T[prop]('id')].join('');
        T.filedata = {};
        
        /**
         * Call one of the function events
         * @syntax T.event(eventname, thisarg [, arg1 [, arg2 [,...]]])
         * @param {string} eventname The name of the event to call, with the preceding 'on'. E.g. 'init'
         * @param {mixed} thisarg The argument to be used as 'this' when the function is called
         */
        T.event = function (eventname, thisarg) {
            return T.s['on'+eventname].apply(thisarg, Array.prototype.slice.call(arguments, 2));
        };
        
        /**
         * Perform the legacy upload
         * @param {object(DOMElement)} input The input that has the file being uploaded
         */
        T.legacyUpload = function(input) {
            var file = input.files[0],
            index = T[changing] === !1 ? T[uploads][length] : T[changing];
            T.filedata = {
                base64 :null,
                croppedWidth: null,
                croppedHeight: null,
                index: index,
                islegacy: !0,
                mimetype: file.type,
                name: file[name],
                newupload: !0,
                resizedWidth: null,
                resizedHeight: null,
                size: file.size
            };
            // Make a global reference to 'T' so that we can call it from our iFrame
            win['AJSLegacy'] = ZZ.streams[T.id];
            $('#AJSLegacy').val(JSON.stringify({
                maxsize: T.s.maxFileSize,
                maxheight: T.s.maxHeight,
                maxwidth: T.s.maxWidth,
                uploaddir: T.s.uploadTo,
                islegacy: !0,
                id: T.id
            }));
            $('#AJSLegacyForm')[prop]({action: T.s.uploadScript});
            T.event('legacyuploadstart', input, {original: T, file:file});
            $('#AJSLegacyForm').submit();
            $('#AJSLoading').removeClass(AJSHidden);
        };

        /**
         * What to after a file has been uploaded
         * @param {object(plain)} results The results from our upload
         */
        T.afterLegacyUpload = function(results) {
            $('#AJSLoading').addClass(AJSHidden);
            if (results.moved) {
                // The file was successfully uploaded, so we can continue
                if (results.mimetype.match('image/*')) {
                    T.filedata.croppedWidth = T.filedata.resizedWidth = results.width;
                    T.filedata.croppedHeight = T.filedata.resizedHeight = results.height;
                }
                T.currentlength++;
                T.filedata.base64 = results.location;
                T.filedata.src = results.location;
                T.event('legacyuploadfinish', null, {original: T, results:results});
                T.afterFileRead(T.filedata, T[changing] !== !1);
                win['AJSLegacy'] = null;
            } else {
                // There was an error so alert the user
                T.event('legacyuploadfail', null, {original: T, error:results.error, results: results});
                streamConfirm(tx('Error'), {Close: ef}, results.error, {nocancel: !0});
            }
        };
        
        /**
         * The processing function for when the file input has registered a change event
         * @param {object(DOMEvent)} e
         */
        T.filechanged = function (e) {
            var filelist = e.target.files;
            if (!filelist[length]) {
                T[changing] = !1;
                return;
            }
            T.toload = filelist[length];
            T.event('fileselected', this, {originalEvent: e, files: filelist, toload: T.toload, original: T});
            if (fapi) {
                // We support the file api
                if (T[changing] === !1) {
                    // This is a new file
                    var len = filelist[length];
                    var tlen = len + T[uploads][length];
                    if (tlen > T.s.maxFiles) {
                        streamConfirm(tx('Maximum files exceeded'), {Close: ef},
                            tx('You have selected {0} files but are only permitted to upload {1}', tlen, T.s.maxFiles), 
                            {nocancel: !0});
                        len = T.toload = T.s.maxFiles - T[uploads][length];
                    }
                    for (var i = 0; i < len; i++) {
                        // Process each file on its own
                        T.process(filelist[i], i);
                    }
                } else {
                    T.event('filechanging', this, {originalEvent: e, file:filelist[0], current:T[uploads][T[changing]], original:T});
                    T.process(filelist[0], T[changing], !0, this);
                }
            } else {
                // We don't support the file api, so upload this file the old way
                T.legacyUpload(this);
            }
        };
        
        /**
         * Process the uploaded file
         * @param {object(File)} file An item from a FileList object
         * @param {int} i The index of this file in the uploads
         * @param {boolean} changing True if we are changing an existing file
         * @param {object(DOMElement)} target The original file input
         */
        T.process = function (file, i, changing, target) {
            $('#AJSLoading').removeClass(AJSHidden);
            if (is_a('blob', file) || is_a('file', file)) {
                var fr = new FileReader(),
                isimg = file.type.match('image/*');
                fr.onload = function(e) {
                    var blob = new Blob([e.target.result], {type: file.type}),
                    dataURL = (win.URL || win.webkitURL).createObjectURL(blob),
                    index = changing ? i : T[currentlength],
                    filedata = {
                        customFields: [],
                        index: index,
                        islegacy: !1,
                        mimetype: file.type,
                        name: file[name],
                        newupload: !0,
                        size: file.size,
                        src: dataURL
                    };
                    if (!changing) {
                        T[currentlength]++;
                    }
                    if (isimg) {
                        // If this is an image, then there is some extra information that we can add
                        var img = new Image();
                        img.onload = function() {
                            var image = this;
                            filedata.width = filedata.resizedWidth = filedata.croppedWidth = image.width;
                            filedata.height = filedata.resizedHeight = filedata.croppedHeight = image.height;
                            filedata.base64 = null;
                            filedata.cropdata = {};
                            ZZ.images[AJS + 'IMG_' + T.id + index] = this;
                            T.afterFileRead(filedata, changing, target);
                        };
                        img.src = dataURL;
                    } else {
                        // Load normally
                        filedata.base64 = e.target.result;
                        T.afterFileRead(filedata, changing, target);
                    }
                };
                fr.onerror = function (e) {
                    var error = e.currentTarget.error;
                    $('#AJSLoading').addClass(AJSHidden);
                    streamConfirm(tx('Error'), {Close: ef}, tx('There was an error processing the selected file.\n\
                        Make sure what you selected was indeed a file. Full details') + ': ' + error.message, {nocancel: !0});
                    console.error(error.name + ': ' + error.message);
                };
                // To get the base64 of a non-image, we need to use readAsDataURL
                isimg ? fr.readAsArrayBuffer(file) : fr.readAsDataURL(file);
            } else {
                // We were given something dodgy
                streamConfirm(tx('Error'), {Close: ef}, tx('The selection is not a file'), {nocancel: !0});
            }
        };
        
        /**
         * What to do after the selected file has been read
         * @param {object(plain)} filedata
         * @param {boolean} changing
         * @param {object(DOMElement)} target
         */
        T.afterFileRead = function (filedata, changing, target) {
            var current = null;
            if (changing) {
                current = T[uploads][filedata.index];
                T[uploads][filedata.index] = filedata;
            } else {
                T[uploads][filedata.index] ? T[uploads][filedata.index] = filedata : T[uploads].push(filedata);
            }
            T.attemptProgression(target, filedata.index, current);
        };
        
        /**
         * Attempt to progress. If files loaded equals files selected, progress, otherwise do nothing
         * @param {object(DOMElement)} target The file input
         * @param {int} index The index of the file changed in the upload array
         * @param {object(plain)} old The old upload before it got changed
         */
        T.attemptProgression = function (target, index, old) {
            T.loaded++;
            T.event('filesloading', target, {original: T, toload: T.toload, loaded: T.loaded});
            if (T.loaded === T.toload) {
                $('#AJSLoading').addClass(AJSHidden);
                $('#AJSUploadSection').addClass(AJSHidden);
                $('#AJSImagePreview').removeClass(AJSHidden);
                T.toggleLR();
                var gotoend = T[changing] === !1;
                if (T[changing] === !1) {
                    // Call the filechanged event
                    T.event('filechanged', target, {original:T, new: T[uploads][index], old: old});
                }
                T.event('filesloaded', target, {loaded: T.loaded, original: T, uploads: T[uploads]});
                T[changing] = !1;
                T.toload = T.loaded = 0;
                T.displayUpload(null, gotoend);
            }
        };
        
        /**
         * Determine whether or not we should show the navigation arrows
         */
        T.toggleLR = function() {
            if (T[uploads][length] > 1) {
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
        T.displayUpload = function (cur, gotoend) {
            if (T[uploads][length]) {
                // If we have uploaded files, show them
                if (!cur) {
                    cur = T.getCurr(gotoend);
                }
                // Determine whether the add button should be disabled
                $('#AJSAdd')[T.currentlength + 1 > T.s.maxFiles ? 'addClass' : 'removeClass'](AJSHidden);
                var src = cur.mimetype.match('image/*') ? cur.src : null;
                T.toggleLR();
                T.drawImage(cur, src);
                T.currentupload = cur.index;
            } else {
                T.resetToUpload();
            }
        };
        
        /**
         * Draw the uploaded image onto a canvas (or display it using an &lt;img/&gt; tag if the file api is not supported)
         * @param {object(plain)} cur The object that represents the current file that we are working with
         * @param {string(path)} src The alternate src attribute if we are displaying the icon for a file (i.e. it is not an image)
         */
        T.drawImage = function (cur, src) {
            var hid = 'AJSIMG_' + T.id + cur.index,
            mastermime = cur.mimetype.replace(/\/.*$/, ''),
            isimg = mastermime === 'image',
            docanvas = fapi && canv && isimg,
            canvas = $('#'+hid),
            eicon = $('#AJSEdit');
            if (canvas[length]) {
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
                    eicon.removeClass(AJSHidden);
                    canvas[0].src = src;
                } else {
                    eicon.addClass(AJSHidden);
                    canvas.attr({class: 'AJSMIMEIcons ' + getIconClass(mastermime, cur.mimetype)});
                    canvas.find('span').html(cur.name);
                }
            }
            // Hide the others but make this one visible
            $('[id^="AJSIMG_"]').addClass(AJSHidden);
            canvas.removeClass(AJSHidden).css({top: (500 - canvas.height())/2});
            if (!fapi && isimg) {
                // This is an image and we therefore have to wait for the image to actually load
                canvas[0].onload = function () {
                    canvas.css({top: (500 - canvas.height())/2});
                };
            }
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
            if (elem[0].tagName === 'CANVAS' && !isimg) {
                // Redraw the canvas and make it into a span
                n = '<span id="' + htmlid + '"><span></span></span>';
            } else if (elem[0].tagName === 'SPAN' && isimg) {
                // Redraw the span and make it into either a <canvas> or an <img> depending on support
                n = document.createElement(docanvas ? 'canvas' : 'img');
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
            if (cur.base64) {
                // We have been cropped. Display this image instead
                img = new Image();
                img.src = cur.base64;
            }
            var width = img.width,
            height = img.height,
            calculated = calcWidthHeight(width, height, T.s.maxWidth, T.s.maxHeight);
            width = calculated.width;
            height = calculated.height;
            cur.resizedWidth = canvas.width = width;
            cur.resizedHeight = canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            cur.base64 = canvas.toDataURL("image/jpeg", T.s.quality);
        }
        
        
        
        /**
         * Get the base64 image from the cropped file
         * @param {object(DOMElement)} canvas The destination canvas
         * @param {object(plain)} cur The object that describes the current upload
         * @param {object(DOMElement)} img The original image that was uploaded
         * @param {object(plain)} data The object that describes the coordinates of the crop rectangle
         */
        T.getCropped64 = function (canvas, cur, img, data) {
            if (canv) {
                // The browser supports the canvas api
                var ctx = canvas.getContext('2d'),
                ri = $('#AJSResImg'),
                w = data.x2 - data.x,
                h = data.y2 - data.y,
                ow = cur.width,
                oh = cur.height;
                w *= (ow / ri.width());
                h *= (oh / ri.height());
                var calculated = calcWidthHeight(w, h, T.s.maxWidth, T.s.maxHeight),
                cw = calculated.width,
                ch = calculated.height;
                var sx = cw / w,
                sy = ch / h;
                cur.croppedWidth = canvas.width = cw;
                cur.croppedHeight = canvas.height = ch;
                var x = -data.x * (ow / ri.width()) * sx;
                var y = -data.y * (oh / ri.height()) * sy;
                ctx.drawImage(img, x, y, ow * sx, oh * sy);
                cur.base64 = canvas.toDataURL('image/jpeg', T.s.quality);
            }
        };
        
        /**
         * Get the icon image
         * @param {string} mime The first part of the mimetype, e.g. video
         * @param {string} fullmime The full mimetype, e.g. application/javascript
         * @returns {string} The name of the class to put
         */
        function getIconClass (mime, fullmime) {
            switch(fullmime) {
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
        };
        
        /**
         * Reset the main dialogue so that it shows the input form
         */
        T.resetToUpload = function () {
            var lr = $('#AJSRContainer');
            $('#AJSUploadSection').removeClass(AJSHidden);
            $('#AJSImagePreview').addClass(AJSHidden);
            $('#AJSChooseText').removeClass(AJSHidden);
            $('#AJSLoading').addClass(AJSHidden);
            T[uploads][length] ? lr.removeClass(AJSHidden) : lr.addClass(AJSHidden);
        };
        
        /**
         * Get the object that represent the uploaded file that is currently being worked with
         * @param {boolean} gotoend
         * @returns {object(plain)} The object representing the uploaded file being worked with
         */
         T.getCurr = function(gotoend) {
            if (gotoend) {
                T[currentupload] = T[uploads][length]  - 1;
                return end(T[uploads]);
            } else {
                if (T.addingmore) {
                    var res = end(T[uploads]);
                    T[currentupload] = res.index;
                    return res;
                } else {
                    if (T[currentupload] || T[currentupload] === 0) {
                        return T[uploads][T[currentupload]];
                    }
                    T[currentupload] = 0;
                    return reset(T[uploads]);
                }
            }
        };
        
        /**
         * Preview the next (to the left or right) uploaded file
         * @param {boolean} goingleft True if the left button was clicked
         */
        T.changePrev = function (goingleft) {
            var addition = goingleft ? -1 : 1;
            var cur;
            if (T[currentupload] + addition < 0) {
                cur = end(T.uploads);
                T[currentupload] = T[uploads][length] - 1;
            } else if (T[currentupload] + addition > (T[uploads][length] - 1)) {
                cur = reset(T[uploads]);
                T[currentupload] = 0;
            } else {
                cur = T[uploads][T[currentupload] + addition];
                T[currentupload] +=  addition;
            }
            T.displayUpload(cur);
        };
        
        /**
         * The click handler for when one of the edit icons is clicked
         */
        T.iconClick = function () {
            return;
//            Skip for version 1
//            var t = $(this);
//            if ($('.EIconActive').data('for') === 'AJSWHAR' && t.data('for') !== 'AJSWHAR') {
//                // If we haven't clicked ourself and we're moving from the crop screen
//                var pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
//                upload = T[uploads][T[currentupload]];
//                T.getCropped64(document.createElement('canvas'), upload, ZZ.images['AJSIMG_' + T.id + T[currentupload]], pd);
//                elem('AJSResImg').src = upload.base64;
//                $('#AJSRITrack,[id^=AJSCrop]').addClass(AJSHidden);
//            }
//            $('.AJSEDivs').addClass(AJSHidden);
//            $('#' + t.data('for')).removeClass(AJSHidden);
//            $('.EIconActive').removeClass('EIconActive');
//            t.addClass('EIconActive');
        }; 

        /**
         * The click handler for when the 'resize canvas' icon is clicked
         */
        T.resizeIconClick = function () {
            elem('AJSResImg').src = T[uploads][T[currentupload]].src;
            $('#AJSRITrack,[id^=AJSCrop]').removeClass(AJSHidden);
        };
        
        /**
         * Fill the edit values in the edit screen
         * @param {object(plain)} upload The object that describes the uploaded file that is being edited
         * @param {object(plain)} positionData The object that describes the position data of the crop handle
         * @param {object(plain)} canvasData The object that describes the size of the canvas
         */
        T.fillEditValues = function (upload, positionData, canvasData) {
            if (positionData) {
                // We have been given positionData
                var r = positionData.rect,
                w = r.width,
                h = r.height,
                ow = Math.round((positionData.x2 - positionData.x) * (upload.width / w).toFixed(20)),
                oh = Math.round((positionData.y2 - positionData.y) * (upload.height / h).toFixed(20));
                var calculated = calcWidthHeight(ow, oh, T.s.maxWidth, T.s.maxHeight);
                ow = calculated.width;
                oh = calculated.height;
                elem('AJSSAR').value = getLowestFraction(ow/oh);
                elem('AJSSW').value = ow;
                elem('AJSSH').value = oh;
            }
            
            /*
             * Skip for version 1
            if (canvasData) {
                // We have been given canvasData
                elem('AJSCW').value = canvasData.width;
                elem('AJSCH').value = canvasData.height;
            }*/
        };
        
        /**
         * Display the information for the current file
         */
        T.showInfo = function (){
            var upload = T[uploads][T[currentupload]],
            cd = upload.cropdata,
            ri = elem('AJSResImg'),
            ajsri = $('#AJSRInner'),
            ajsritrack = $('#AJSRITrack');
            $('#AJSMain > div').addClass(AJSHidden);
            $('#AJSMore').removeClass(AJSHidden);
            // Reposition the thumb to fit
            ri.src = upload.src;
            // Reset the widths so that the element can grow
            var $ri = $(ri);
            $ri.css({maxWidth: parseFloat($(win).width())-20});
            ajsri.css({width: 'auto'});
            var r = ri.getBoundingClientRect(),
            w = r.width,
            h = r.height;
            var tw = cd.x !== undefined ? cd.x2 - cd.x : w*.8,
            th = cd.y !== undefined ? cd.y2 - cd.y : h*.8;
            ajsritrack.streamBoundaries('updateOpts', {
                width: w, 
                height: h, 
                thumbWidth: tw, 
                thumbHeight: th,
                onFinish: function (e) {
                    e.rect = r;
                    T.fillEditValues(upload, e);
                }
            });
            var pd = ajsritrack.streamBoundaries('reposition', {
                x: cd.x || cd.x === 0 ? cd.x : '10%', 
                y: cd.y || cd.y === 0 ? cd.y : '10%'
            }).positionData;
            positionRBG(pd);
            pd.rect = r;
            T.fillEditValues(upload, pd, {width: upload.width, height: upload.height});
            ajsri.width(w);
            if (!$('.EIconActive').length) {
                // We don't have an active edit icon yet, set it to the first one
                $('.AJSEIcon:first').addClass('EIconActive');
            }
            // Simulate the first button being clicked
            $('.EIconActive').click();
            // Override the minimum width
            var $ajs = $('#AJS'),
            mt = (parseFloat(ajsri.height()) - h) / 2;
            $('#AJSRBG').css({top: -h, height: h});
            $ajs.css({minWidth: w > 340 ? w : 340, marginLeft:-($ajs.width()/2)});
            $ri.css({marginTop: mt}).attr({'data-top': mt, 'data-bottom': mt + h});
            ajsritrack.css({marginTop: mt});
            winResize();
        };
        
        /**
         * Save the custom fields information
         */
        T.saveInfo = function () {
            // Save the customFields information
            var upload = T[uploads][T[currentupload]],
            data = $('#AJSRITrack').streamBoundaries('getPositionData'),
            key = 'AJSIMG_' + T.id + T[currentupload],
            t = $('#' + key);
            T.getCropped64(elem(key), upload, ZZ.images[key], data);
            upload.cropdata = {x: data.x, x2: data.x2, y: data.y, y2: data.y2};
            $('#AJSMain > div').addClass(AJSHidden);
            $('#AJSImagePreview').removeClass(AJSHidden);
            $('#AJS').css({minWidth: 'initial'});
            t.css({top: (500 - t.height())/2});
            winResize();
        };
               
        /**
         * The click handler for the upload buttons
         */
        function uploadBtnClick() {
            // Determine what stream we want
            var asid = $(this)[0].id.replace('AJSUploadBtn_', '');
            // Set it as the current object
            T = ZZ.streams[asid];
//                T.initBinding();
            var $ajs = $('#AJS');
            $ajs.show();
            $ajs.css({marginTop: -($ajs.height()/2), marginLeft: -($ajs.width()/2)});
            T[uploads][length] ? T.displayUpload() : T.resetToUpload();
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
            // Set it as the current object
            T = ZZ.streams[asid];
            T[currentupload] = index;
            var $ajs = $('#AJS');
            $ajs.show();
            $ajs.css({marginTop: -($ajs.height()/2), marginLeft: -($ajs.width()/2)});
            T.displayUpload(T.uploads[index]);
            $('#AJSMain > div').addClass(AJSHidden);
            $('#AJSImagePreview').removeClass(AJSHidden);
        }
        
        /**
         * Initialise all of the events in one function
         */
        T.initBinding = function (){
            
            // @todo Possibly go vanilla?
            
            var ajsfile = fapi ? $('#AJSFile') : $('#AJSFileLegacy'),
            ajs = elem(AJS);
            
            ajsfile.unbind('click').click(function () {
                var fa = {accept:T.s.accept};
                if (T.s.maxFiles > 1) {
                    // Allow us to have multiple files
                    fa['multiple'] = !0;
                }
                $(this)[attr](fa);
            });
            
            $('#AJSChooseText').unbind('click').click(function (){
                T.addingmore = !0;
                T.changing = !1;
                ajsfile.click();
            });
            
            if (pastable) {
                // We support paste functionality
                ajs.onpaste = function (e) {
                    var clipboarditems = e.clipboardData.items,
                    len = clipboarditems[length];
                    T.toload = len;
                    T.loaded = 0;
                    var tlen = len + T[uploads][length];
                    if (tlen > T.s.maxFiles) {
                        streamConfirm(tx('Maximum files exceeded'), {Close: ef},
                            tx('You have selected {0} files but are only permitted to upload {1}', tlen, T.s.maxFiles), 
                            {nocancel: !0});
                        len = T.toload = T.s.maxFiles - T[uploads][length];
                    }
                    for (var i = 0; i < len; i++) {
                        var file = clipboarditems[i].getAsFile();
                        if (file && file.size) {
                            T.addingmore = !0;
                            T.process(file, i);
                        } else {
                            streamConfirm(tx('Error'), {Close: ef}, 
                                tx('There was an error processing the file you pasted'), {nocancel: !0});
                        }
                    }
                };
            }
            
            if (draggable) {
                // If we have drag and drop support, add the functionality
                document.body.ondragover = function(e) {
                    if (e.target.id === 'AJSMainOverlay') {
                        // Show that the place being hovered over is not the drop zone
                        $('#AJSDropZone').addClass(AJSHidden);
                    } else {
                        // If the file is above the drop zone, prepare to accept it
                        e.stopPropagation();
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        $('#AJSDropZone').removeClass(AJSHidden);
                    }
                };
                document.body.ondrop = function(e) {
                    // Prevent an accidental drop outside the drop zone
                    e.stopPropagation();
                    e.preventDefault();
                    if ($(e.target).closest('#AJS')[length]) {
                        // Only accept drops inside the drop zone
                        $('#AJSDropZone').addClass(AJSHidden);
                        T.addingmore = !0;
                        T.filechanged.call(null, {eventType: 'drop', originalEvent: e, target: {files: e.dataTransfer.files}});
                    }
                };
            }
            
            ajsfile.unbind(change)[change](T.filechanged);
            
            $('#AJS').unbind('dbclick').dblclick(function () {
                // Remove accidental double click highlighting
                if (win.getSelection) {
                    win.getSelection().removeAllRanges();
                } else if (document.selection) {
                    document.selection.empty();
                }
            });
                    
            $('#AJSAdd').unbind('click').click(function () {
                // What to do when the add button is clicked
                if ((T[uploads][length] + 1) > T.s.maxFiles) {
                    
                } else {
                    ajsfile.click();
                    T.addingmore = !0;
                }
            });
            
            $('#AJSChange').unbind('click').click(function () {
                // What to do when the 'change this file' button is clicked
                T[changing] = T[currentupload];
                T.addingmore = !1;
                ajsfile.click();
            });
            
            $('#AJSL').unbind('click').click(function (){
                // Go left
                T.changePrev(!0);
            });
            
            $('#AJSR').unbind('click').click(function (){
                // Go right
                T.changePrev();
            });
            
            var ajsicancel = elem('AJSICancel'),
            ajsisave = elem('AJSISave'),
            ajssw = elem('AJSSW'),
            ajssh = elem('AJSSH'),
            ajssar = elem('AJSSAR'),
            ajsedit = elem('AJSEdit');
            
            if (ajsedit) {
                ajsedit.onclick = T.showInfo;
            }
            
            if (ajsicancel) {
                ajsicancel.onclick = function () {
                    $('#AJSMain > div').addClass(AJSHidden);
                    $('#AJSImagePreview').removeClass(AJSHidden);
                    var t = $('#' + 'AJSIMG_' + T.id + T[currentupload]);
                    $('#AJS').css({minWidth: 'initial'});
                    t.css({top: (500 - t.height())/2});
                    winResize();
                };
            }
            
            if (ajsisave) {
                ajsisave.onclick = T.saveInfo;
            }
            
            $('#AJSRemove').unbind('click').click(function () {
                streamConfirm(tx('Are you sure you want to remove this file?'), function () {
                    // Remove the file by re-indexing the uploads array
                    var temp = [],
                    todelete = !1,
                    curupload = !1;
                    for (var i = 0, len = T[uploads][length]; i < len; i++) {
                        if (T[uploads][i] && i !== T[currentupload]) {
                            // We also need to reindex the uploaded file before saving
                            var upload = T.uploads[i];
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
                    $('#AJSIMG_' + T.id + T[currentupload]).remove();
                    T.uploads = temp;
                    T.currentlength = T.uploads.length;
                    T.currentupload = curupload !== false ? curupload : 0;
                    // Update the value for this input
                    $('#AJS_' + T[0].id).val(json_encode(T.uploads));
                    $('#AJSUploadSection').addClass(AJSHidden);
                    $('#AJSImagePreview').removeClass(AJSHidden);
                    T.toggleLR();
                    T.displayUpload();
                }, tx('This simply removes the file from the list of files to be uploaded, and nowhere else'));
            });
            
            $('#AJSClose,#AJSCloseText').unbind('click').click(function () {
                // Close the upload screen
                $('#AJS_' + T[0].id).val(json_encode(T[uploads]));
                $(hAJS).hide();
                if (T.s.showPreviewOnForm) {
                    $('#AJSFormPrev_' + T.id).html(drawFormPreview());
                    $('[id^=AJSUploadBtn_]').unbind('click', uploadBtnClick).click(uploadBtnClick);
                    $('.AJSFP').unbind('click', ajsfpClick).click(ajsfpClick);
                }
            });
            
            $('[id^=AJSUploadBtn_]').unbind('click', uploadBtnClick).click(uploadBtnClick);
            
            $('.AJSFP').unbind('click', ajsfpClick).click(ajsfpClick);
            
            if (ajssar) {
                ajssar.onchange = function () {
                    var ar,
                    v = this.value,
                    pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                    upload = T[uploads][T[currentupload]];
                    if (v && v.match(/^\d+(:?\.\d+)?(:?\/|\:)\d+(:?\.\d+)?$/)) {
                        // We've been given an aspect ratio in the form xx/yy or xx:yy
                        var input = v.split(/[\/|\:]/);
                        ar = input[0] / input[1];
                    } else if (v && v.match(/^(:?\d+|\d+\.\d+)$/)) {
                        // The aspect ratio is in the form of x or x.yyy
                        ar = Number(v);
                    } else {
                        // We've been given something dodgy
                        return;
                    }
                    var r = elem('AJSResImg').getBoundingClientRect(),
                    scaleX = upload.width / r.width,
                    scaleY = upload.height / r.height,
                    w = pd.x2 - pd.x,
                    nh = Math.round(w / ar),
                    x = false,
                    y = false;
                    if (nh + pd.y > r.height) {
                        // What we've made overflows the window,
                        y = r.height - nh;
                        if (nh > r.height) {
                            nh = r.height;
                            w = Math.round(nh * ar);
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
                    elem('AJSSW').value = Math.round(w * scaleX);
                    elem('AJSSH').value = Math.round(nh * scaleY);
                    // Now that we have resized, reposition the translucent background
                    positionRBG(npd);
                };
            }
            
            if (ajssw) {
                ajssw.onchange = function () {
                    var v = this.value,
                    r = elem('AJSResImg').getBoundingClientRect(),
                    pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                    upload = T[uploads][T[currentupload]],
                    x = false;
                    if (v && v.match(/\%/)) {
                        v = r.width * (v.replace('%','')/100);
                    } else {
                        v = Number(v);
                    }
                    if (!v) {
                        // We were given something dodgy. Return
                        return;
                    }
                    var scale = upload.width / r.width,
                    w = Math.round(v / scale),
                    h = pd.y2 - pd.y;
                    if (w + pd.x > r.width) {
                        x = r.width - w;
                    } 
                    if (w > r.width) {
                        // The value that we have been given is wider than the image
                        w = r.width;
                        x = 0;
                        this.value = upload.width;
                    } 
                    var npd = $('#AJSRITrack').streamBoundaries('updateOpts', {
                        thumbWidth: w,
                        thumbHeight: h,
                        x: x
                    }).positionData;
                    // Now that we have resized, reposition the translucent background
                    positionRBG(npd);
                    elem('AJSSAR').value = getLowestFraction(w/h);
                };
            }
            
            if (ajssh) {
                ajssh.onchange = function () {
                    var v = this.value,
                    r = elem('AJSResImg').getBoundingClientRect(),
                    pd = $('#AJSRITrack').streamBoundaries('getPositionData'),
                    upload = T[uploads][T[currentupload]],
                    y = false;
                    if (v && v.match(/\%/)) {
                        v = r.height * (v.replace('%','')/100);
                    } else {
                        v = Number(v);
                    }
                    if (!v) {
                        // We were given something dodgy, return.
                        return;
                    }
                    var scale = upload.resizedHeight / r.height,
                    h = Math.round(v / scale),
                    w = pd.x2 - pd.x;
                    if (h + pd.y > r.height) {
                        h = r.height - h;
                    } 
                    if (h > r.height) {
                        // The value that we have been given is wider than the image
                        h = r.height;
                        y = 0;
                        this.value = upload.resizedHeight;
                    } 
                    var npd = $('#AJSRITrack').streamBoundaries('updateOpts', {
                        thumbWidth: w,
                        thumbHeight: h,
                        y: y
                    }).positionData;
                    // Now that we have resized, reposition the translucent background
                    positionRBG(npd);
                    elem('AJSSAR').value = getLowestFraction(w/h);
                };
            }
            
            $('.AJSEIcon').unbind('click', T.iconClick).click(T.iconClick);
            
            $('.AJSEIcon[data-for=AJSWHAR]').unbind('click', T.resizeIconClick).click(T.resizeIconClick);
            
            $(window).unbind('resize', winResize).resize(winResize);
                        
        };
        
        /**
         * The window resize handler
         */
        function winResize () {
            var id = 'AJSIMG_' + T.id + T[currentupload],
            t = $('#'+id);
            if (t.is(':visible')) {
                t.css({top: (500 - t.height())/2});
            }
            var $ajs = $('#AJS');
            $ajs.css({marginLeft: -($ajs.width()/2), marginTop: -($ajs.height()/2)});
        }
        
        /**
         * If the user wants to see a preview of the uploaded files on the form, build it here
         * @returns {html}
         */
        function drawFormPreview() {
            var outtext = '',
            u = T.uploads,
            iconHeight = parseFloat(T.s.iconPreviewHeight),
            iconWidth = parseFloat(T.s.iconPreviewWidth);
            for (var x in u) {
                var curobj = u[x],
                mastermime = curobj.mimetype.replace(/\/.*$/, ''),
                isimg = mastermime === 'image',
                inner;
                if (isimg) {
                    var style;
                    if (curobj.croppedWidth < curobj.croppedHeight) {
                        style = 'height: 100%;';
                    } else {
                        var ar = curobj.croppedWidth / curobj.croppedHeight,
                        h = iconWidth / ar;
                        style = 'width:100%;margin-top:' + ((iconHeight - h) / 2) + ';';
                    }
                    inner = cHE.getHtml('img', null, null, null, {
                        src: curobj.base64, 
                        'style':  style
                    });
                } else {
                    inner = cHE.getSpan(null, null, getIconClass(mastermime, curobj.mimetype), {
                        style: 'line-height:' + iconHeight + 'px;font-size:' + (iconWidth - 20) + 'px;'
                    });
                }
                inner += cHE.getDiv(curobj.name, null, 'AJSFPName');
                outtext += cHE.getDiv(inner, 'AJSFP_' + T.id + '_' + curobj.index, 'AJSFP', {
                    style: 'width:' + iconWidth + 'px;height:' + iconHeight + 'px;'
                });
            }
            if (T.s.maxFiles && u.length + 1 <= T.s.maxFiles) {
                // Only show the plus if we can add more
                outtext += cHE.getSpan(null, 'AJSUploadBtn_' + T.id, 'asicons-plus AJSBtn AJSFPBtn', {
                    style: 'height:' + iconHeight + 'px;line-height:' + iconHeight + 'px;'
                });
            }
            return outtext;
        }
        
        /**
         * Draw the ajax main window
         */
        T.draw = function (){
            // Auto executing
            var parent = T.parent();
            T.addClass(AJSHidden);
            if (exists($('#AJS_' + T[0].id))) {
                var val = $('#AJS_' + T[0].id).val();
                T.uploads = val.length ? json_decode(val, !0) : [];
                T.currentlength = T.uploads.length;
            } else {
                parent.append(cHE.getInput('AJS_' + T[0].id, null, null, 'hidden'));
            }
            
            if (T.s.showPreviewOnForm) {
                // The user wants to see a preivew on the form
                parent.append(cHE.getDiv(drawFormPreview(), 'AJSFormPrev_' + T.id, 'AJSFormPrev', {
                    style: 'height:' + T.s.iconPreviewHeight
                }));
            } else {
                parent.append(cHE.getSpan(tx('Upload'), 'AJSUploadBtn_' + T.id, 'AJSBtn', {'data-mandatory': !0}));
            }
            if (!exists($(hAJS))) {
                // Only create an ajaxStreamMain if one does not already exist in the DOM
                body.append(cHE.getDiv(drawMainDialogue(T.s), AJS));
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
                    onUpdate: function (e) {
                        positionRBG(e);
                    }
                });
            }
            T.initBinding();
            T.event('init', T, {original: T[0]});
        }();
        
        // Cache this object for later use
        ZZ.streams[T.id] = T;
        count++;
        return T;
    };  
    
    /**
     * Calculate a new width and height for the uploaded file is one of the axis exceeds the maximum allowed
     * @param {float} width The current width of the image
     * @param {float} height The current height of the image
     * @param {float} maxWidth The maximum width allowed
     * @param {float} maxHeight The maximum height allowed
     * @returns {object(plain)} An object in the form {width: float(width), height: float(height)}
     */
    function calcWidthHeight(width, height, maxWidth, maxHeight) {
        if (width > height) {
            if (width > maxWidth) {
                //height *= max_width / width;
                height = Math.round(height *= maxWidth / width);
                width = maxWidth;
            }
        } else {
            if (height > maxHeight) {
                //width *= max_height / height;
                width = Math.round(width *= maxHeight / height);
                height = maxHeight;
            }
        }
        return {width: width, height: height};
    }
    
    /**
     * Position the four divs that surround crop grid so that it looks like everything outside the middle of the grid is blacked out
     * @param {object(plain)} positionData The object that describes the position of the crop grid
     */
    function positionRBG (positionData) {
        var xw = positionData.x2 - positionData.x;
        $('#AJSCropT').css({width: xw, height: positionData.y, left: positionData.x, top: 0});
        $('#AJSCropR').css({width: positionData.trackWidth - positionData.x2, height: positionData.trackHeight, right: 0, top: 0});
        $('#AJSCropB').css({width: xw, height: positionData.trackHeight - positionData.y2, left: positionData.x, bottom: 0});
        $('#AJSCropL').css({width: positionData.x, height: positionData.trackHeight, left: 0, top: 0});
    }
    
    /**
     * Draw the legacy elements
     */
     function drawLegacy() {
        if (!exists($('#AJSLegacy'))) {
            var formsettings = {
                method: 'post',
                enctype: 'multipart/form-data',
                target: 'AJSIFrame'
            };
            $('body').append(
                    cHE.getHtml('form', 
                        cHE.getInput('AJSLegacy', null, null, 'hidden') + 
                        cHE.getInput('AJSFileLegacy', null, null, 'file'), 'AJSLegacyForm', AJSHidden, formsettings) +
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
        var eps = 1.0E-15,h, h1, h2, k, k1, k2, a, x = x0;
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
//        return h + ":" + k;
         return (h > 21 ? (h / Math.pow(10, (''+h+'').length-1)).toPrecision(2) : h) + 
            ":" + 
            (k > 21 ? (k / Math.pow(10, (''+k+'').length-1)).toPrecision(2) : k);
    }

    /**
     * Draw the main AjaxStream dialogue
     * @syntax drawMainDialogue();
     * @returns {html}
     */
    function drawMainDialogue() {
        var top = drawImagePreview() +
        drawUploader();
        return cHE.getDiv(null, 'AJSMainOverlay') + cHE.getDiv(top + cHE.getHtml('img', null, 'AJSLoading', AJSHidden, {
            src: 'files/loader.gif', 
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
                cHE.getSpan(null, 'AJSAdd', 'asicons-plus', {title: tx('Add another file')}) +
                cHE.getSpan(null, 'AJSChange', 'asicons-docs', {title: tx('Change file')}) +
                (canv ? cHE.getSpan(null, 'AJSEdit', 'asicons-pencil', {title: tx('Edit')}) : '') +
                cHE.getSpan(null, 'AJSRemove', 'asicons-trash', {title: tx('Remove file')}) +
                cHE.getSpan(null, 'AJSClose', 'asicons-cross', {title: tx('Close window')})), 
        'AJSPreviewActions');
    }
    
    /**
     * Draw the information section (Custom fields)
     * @returns {html}
     */
    function drawInfoBay () {
        var inner = '';
        inner += cHE.getDiv(
                    cHE.getDiv(cHE.getDiv(cHE.getHtml('img', null, 'AJSResImg') +
                    cHE.getDiv(
                        cHE.getDiv(null, 'AJSCropT') + 
                        cHE.getDiv(null, 'AJSCropR') + 
                        cHE.getDiv(null, 'AJSCropB') + 
                        cHE.getDiv(null, 'AJSCropL'), 'AJSRBG') + cHE.getDiv(cHE.getDiv(), 'AJSRITrack'), 
                        'AJSRInner') + cHE.getDiv(drawEditIcons() + renderEditables(), 
                                'AJSScaleInfo'), 'AJSRIHolder'), 'AJSInfo');
        return cHE.getDiv(inner + 
                cHE.getDiv(
                    cHE.getSpan(null, 'AJSISave', 'AJSBtnD asicons-checkmark')+ 
                    cHE.getSpan(null, 'AJSICancel', 'AJSBtnD asicons-cross'), 'AJSIBtns'), 'AJSMore', AJSHidden);
    }
    
    /**
     * Draw the icons that are visible when in edit mode
     * @returns {html}
     */
    function drawEditIcons () {
        return '';
        /*
         * Skip for version 1
        return cHE.getDiv(
            cHE.getSpan(null, null, 'AJSEIcon asicons-resize-enlarge', {'data-for': 'AJSWHAR', 'title': tx('Scale Image')}) +
            cHE.getSpan(null, null, 'AJSEIcon asicons-external-link', {'data-for': 'AJSRCan', 'title': tx('Resize canvas')}),
        'AJSEditIcons');*/
    }
    
    function renderEditables () {
        return drawScaleInfo();// Skip for version 1 / + drawCanvasResize();
    }
    
    /**
     * Draw the canvas resize screen
     * @returns {html}
     */
    function drawCanvasResize() {
        return cHE.getDiv(cHE.getDiv(cHE.getSpan(tx('CANVAS WIDTH')) + cHE.getInput('AJSCW'), null, 'AJSSInfo') + 
            cHE.getDiv(cHE.getSpan(tx('CANVAS HEIGHT')) + cHE.getInput('AJSCH'), null, 'AJSSInfo'), 'AJSRCan', 'AJSEdivs AJSHidden');
    }
    
    /**
     * Draw the scale info section
     * @returns {html}
     */
    function drawScaleInfo() {
        return cHE.getDiv(cHE.getDiv(cHE.getSpan(tx('WIDTH')) + cHE.getInput('AJSSW'), null, 'AJSSInfo') + 
            cHE.getDiv(cHE.getSpan(tx('HEIGHT')) + cHE.getInput('AJSSH'), null, 'AJSSInfo') + 
            cHE.getDiv(cHE.getSpan(tx('ASPECT RATIO')) + cHE.getInput('AJSSAR'), null, 'AJSSInfo'), 'AJSWHAR', 'AJSEdivs');
    }

    /**
     * Draw the actual upload section, i.e. the upload button and the 'drop zone'
     * @syntax drawUploader();
     * @returns {html}
     */
    function drawUploader() {
        var choosefile = 
                cHE.getSpan(tx('Choose file'), 'AJSChooseText', 'AJSBtnD') + 
                (pastable ? cHE.getSpan(getPasteText(), 'AJSPasteText', 'AJSBtnD AJSBtnDU') : '') + 
                (draggable ? cHE.getSpan(tx('Drop'), 'AJSDropText', 'AJSBtnD AJSBtnDU') : '') + 
                cHE.getSpan(null, 'AJSCloseText', 'AJSBtnD asicons-cross');
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
        var text = tx('Paste (ctrl + v)');
        if (navigator.platform.match(/Mac/i)) {
            text = tx('Paste (cmd + v)');
        }
        return text;
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
    };
    
    /**
     * @brief Return the first element in an array
     * @param {array} arr The array that we will take from
     * @returns {unknown} The first element in your array
     */
    function reset (arr) {
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
    };

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
    function is_object (variable) {
        return is_a('Object', variable);
    }
    
    /**
     * Determine whether parameter two is an object of type parameter one
     * @param {string} type The expected type
     * @param {mixed} variable The object to test
     * @returns {boolean} True if parameter two is an object of type paremeter one
     */
    function is_a(type, variable) {
        var otype = type.substr(0,1).toUpperCase() + type.substr(1).toLowerCase();
        return Object.prototype.toString.call(variable) === '[object ' + otype + ']';
    }

    /**
     * @brief Determine whether an element exists or not
     * @param {Object(DOMElement)} obj The element to test
     * @returns {Boolean} True if the element exists
     */
    function exists (obj) {
        return obj[length] > 0;
    };
    
    /**
     * @brief Convert an object into an array
     * @param {object} obj The object to convert
     * @returns {array} The array as an object
     */
    function object_to_array (obj) {
        var output = [];
        for (var x in obj) {
            if (obj.hasOwnProperty(x)) {
                output.push(obj[x]);
            }
        }
        return output;
    };
    
    /**
     * Decode a JSON string
     * @syntax var obj = json_decode(jsonstring);<br/>var obj2 = json_decode(jsonstring, true);
     * @param {string} str The json string to decode
     * @param {boolea} toarray (optional) True to return the result as an array
     * @returns {array|Array|Object}
     */
    function json_decode(str, toarray) {
        var res = JSON.parse(str);
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
            for (var i = 0, len = object[length]; i < len; i++) {
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
        const: {
            CF_TEXT: 1
        },
        customFields: [],
        images: {},
        license: 'MIT',
        streams: {},
        /**
         * Set the defaults for all ajaxStream objects
         * @param {object(plain)} opts The options that you want to set
         */
        setDefaults: function (opts) {
            defaults = $.extend(defaults, opts);
        },
        submit: function () {
            // Iterate through each stream, and save them as base64
        },
        version: 0.02
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
            return setAttributes(html, moreattrs).outerHTML;
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
            if (value||value===0) {
                moreattrs.value = value;
            }
            if (id && !moreattrs[name]) {
                // Do not overwrite the name attribute if it has been specified manually
                moreattrs[name] = id;
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
            return obj;
        }

    }
    cHE = new cHE();
    
})(jQuery, this, 0, document);