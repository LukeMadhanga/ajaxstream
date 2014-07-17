(function ($, win, count, document){
    
    // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
    var length = 'length',
    prop = 'prop',
    AJS = 'AJS',
    hAJS = '#AJS',
    dAJS = '.AJS',
    AJSHidden = 'AJSHidden',
    replace = 'replace',
    getDiv = 'getDiv',
    getSpan = 'getSpan',
    getHtml = 'getHtml',
    name = 'name',
    ef = function () {},
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
        fapi = !!(win.Blob || win.File || win.FileList || win.FileReader),
        canvtest = document.createElement('canvas'),
        canv = !!(canvtest.getContext && canvtest.getContext('2d')),
        // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
        par = 'parent',
        addclass = 'addClass',
        rclass = 'removeClass',
        append = 'append',
        click = 'click',
        unbind = 'unbind',
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
                customFields:[],
                name: file[name],
                mimetype: file.type,
                size: file.size,
                newupload: !0,
                index: index,
                islegacy: !0
            };
            // Make a global reference to 'T' so that we can call it from our iFrame
            win['AJSLegacy'] = ZZ.streams[T.id];
            $(hAJS+'Legacy').val(JSON.stringify({
                maxsize: T.s.maxFileSize,
                maxheight: T.s.maxHeight,
                maxwidth: T.s.maxWidth,
                uploaddir: T.s.uploadTo,
                islegacy: !0,
                id: T.id
            }));
            $(hAJS+'LegacyForm')[prop]({action: T.s.uploadScript});
            T.event('legacyuploadstart', input, {original: T, file:file});
            $(hAJS+'LegacyForm').submit();
        };

        /**
         * What to after a file has been uploaded
         * @param {object(plain)} results The results from our upload
         */
        T.afterLegacyUpload = function(results) {
            if (results.moved) {
                // The file was successfully uploaded, so we can continue
                T.filedata.src = results.location;
                T.event('legacyuploadfinish', null, {original: T, results:results});
                T.afterFileRead(T.filedata, T[changing] !== !1);
                win['AJSLegacy'] = null;
            } else {
                // There was an error so alert the user
                T.event('legacyuploadfail', null, {original: T, error:results.error, results: results});
                alert(results.error);
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
                        console.warn(tx('You have selected {0} files but are only permitted to upload {1}', tlen, T.s.maxFiles));
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
            $(hAJS+'Loading')[rclass](AJSHidden);
            if (is_a('blob', file) || is_a('file', file)) {
                var fr = new FileReader();
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
                    if (file.type.match('image/*')) {
                        // If this is an image, then there is some extra information that we can add
                        var img = new Image();
                        img.onload = function() {
                            var image = this;
                            filedata.width = filedata.resizedWidth = image.width;
                            filedata.height = filedata.resizedHeight = image.height;
                            filedata.base64 = null;
                            ZZ.images[AJS + 'IMG_' + T.id + index] = this;
                            T.afterFileRead(filedata, changing, target);
                        };
                        img.src = dataURL;
                    } else {
                        // Load normally
                        T.afterFileRead(filedata, changing, target);
                    }
                };
                fr.readAsArrayBuffer(file);
            } else {
                console.warn(tx('The selection is not a file'));
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
                $(hAJS+'Loading')[addclass](AJSHidden);
                $(hAJS+'UploadSection')[addclass](AJSHidden);
                $(hAJS+'ImagePreview')[rclass](AJSHidden);
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
                $(hAJS+'LRContainer')[rclass](AJSHidden);
            } else {
                $(hAJS+'LRContainer')[addclass](AJSHidden);
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
                $(hAJS+'Add')[T[currentlength] + 1 > T.s.maxFiles ? addclass : rclass](AJSHidden);
                var src = cur.mimetype.match('image/*') ? cur.src : T.getIconPath(cur.mimetype);
                T.toggleLR();
                T.drawImage(cur, src);
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
            var hid = AJS+'IMG_' + T.id + cur.index,
            docanvas = fapi && canv && cur.mimetype.match('image/*'),
            canvas = $('#'+hid);
            if (!canvas[length]) {
                // A canvas doesn't exist for this upload so create one
                $(hAJS+'LRContainer').before((docanvas ? '<canvas id="?"></canvas>' : '<img id="?" />')[replace](/\?/, hid));
                canvas = $('#' + hid);
            }
            
            // Now set the src
            if (docanvas) {
                imageToCanvas(canvas[0], cur, ZZ.images[hid]);
            } else {
                canvas[attr]({src: src});
            }
            // Hide the others but make this one visible
            $('[id^="AJSIMG_"]')[addclass](AJSHidden);
            canvas[rclass](AJSHidden);
        };
        
        /**
         * Render the image onto a canvas element
         * @param {jqelem} canvas The canvas element
         * @param {object(plain)} cur The object that describes the uploaded file we're working with
         * @param {object(DOMElement)} img The img object for this uploaded file
         */
        function imageToCanvas(canvas, cur, img) {
            var width = img.width,
            height = img.height;
            // calculate the width and height, constraining the proportions
            if (width > height) {
                if (width > T.s.maxWidth) {
                    //height *= max_width / width;
                    height = Math.round(height *= T.s.maxWidth / width);
                    width = T.s.maxWidth;
                }
            } else {
                if (height > T.s.maxHeight) {
                    //width *= max_height / height;
                    width = Math.round(width *= T.s.maxHeight / height);
                    height = T.s.maxHeight;
                }
            }
            cur.resizedWidth = canvas.width = width;
            cur.resizedHeight = canvas.height = height;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            cur.base64 = canvas.toDataURL("image/jpeg", T.s.quality);
        }
        
        /**
         * Get the icon image
         * @param {type} mime
         * @returns {String}
         */
        T.getIconPath = function (mime) {
            switch (mime) {
                default:
                    return '';
            }
        };
        
        /**
         * Reset the main dialogue so that it shows the input form
         */
        T.resetToUpload = function () {
            var lr = $(hAJS+'RContainer');
            $(hAJS+'UploadSection')[rclass](AJSHidden);
            $(hAJS+'ImagePreview')[addclass](AJSHidden);
            $(hAJS+'ChooseText')[rclass](AJSHidden);
            $(hAJS+'Loading')[addclass](AJSHidden);
            T[uploads][length] ? lr[rclass](AJSHidden) : lr[addclass](AJSHidden);
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
        
        T.getCropped64 = function (canvas, cur, img, data) {
            if (canv) {
                // The browser supports the canvas api
                var ctx = canvas.getContext('2d'),
                ri = $(hAJS+'ResImg'),
                ow = cur.resizedWidth,
                oh = cur.resizedHeight,
                w = data.x2 - data.x,
                h = data.y2 - data.y,
                scaleX = ow/ri.width(),
                scaleY = oh/ri.height();
                w *= scaleX;
                h *= scaleY;
                console.log(data, w, h);
                canvas.width = w;
                canvas.height = h;
                ctx.drawImage(img, -(data.x*scaleX), -(data.y*scaleY), ow, oh);
                cur.base64 = canvas.toDataURL('image/jpeg', T.s.quality);
            }
            return false;
        };
        
        /**
         * Display the information for the current file
         */
        T.showInfo = function (){
            var upload = T[uploads][T[currentupload]],
            ri = $(hAJS+'ResImg');
            $(hAJS+'Main > div')[addclass](AJSHidden);
            $(hAJS+'More')[rclass](AJSHidden);
            // Set the title and also make underscores line-breakable
//            $(hAJS+'Info > span').html(upload[name][replace](/([\_|\.])/g,'&shy;$1&shy;'));
//            if (fields[length]) {
//                for (var i = 0; i < fields[length]; i++) {
//                    var obj = fields[i];
//                    $('[data-ajsfor="' + obj.field + '"]').val(obj.value);
//                }
//            }
//             // Set focus to the first field to indicate that it is editable
//            $(dAJS+'CFField:first > input').focus();
            
            ri[0].src = upload.src;
            var w = Math.floor(ri.width()),
            h = Math.floor(ri.height());
            $(hAJS+'RITrack').streamBoundaries('updateOpts', {width: w, height: h, thumbWidth: w*.8, thumbHeight: h*.8});
        };
        
        /**
         * Save the custom fields information
         */
        T.saveInfo = function () {
            // Save the customFields information
            var upload = T[uploads][T[currentupload]];
//            fields = ZZ.customFields,
//            output = [];
//            if (fields[length]) {
//                // We have some custom fields set so save the information
//                for (var i = 0; i < fields[length];i++) {
//                    var obj = fields[i];
//                    output.push({field: obj[name], value: $('[data-ajsfor="' + obj[name] + '"]').val()});
//                    // Clear the field for later use
//                    $('[data-ajsfor="' + obj[name] + '"]').val('');
//                }
//                upload.customFields = output;
//            }
            var data = $(hAJS+'RITrack').streamBoundaries('getPositionData'),
            key = 'AJSIMG_' + T.id + T[currentupload];
            T.getCropped64(elem(key), upload, ZZ.images[key], data);
            $(hAJS+'Main > div')[addclass](AJSHidden);
            $(hAJS+'ImagePreview')[rclass](AJSHidden);
        };
                
        
        /**
         * Initialise all of the events in one function
         */
        T.initBinding = function (){
            
            // @todo Possibly go vanilla?
            
            var ajsfile = fapi ? $(hAJS+'File') : $(hAJS+'FileLegacy');
            var ajs = elem(AJS);
            
            ajsfile[unbind](click)[click](function () {
                var fa = {accept:T.s.accept};
                if (T.s.maxFiles > 1) {
                    // Allow us to have multiple files
                    fa['multiple'] = !0;
                }
                $(this)[attr](fa);
            });
            
            $(hAJS+'ChooseText')[unbind](click)[click](function (){
                T.addingmore = !0;
                T[changing] = !1;
                ajsfile[click]();
            });
            
            if ('onpaste' in ajs) {
                // We support paste functionality
                var ael = !!typeof addEventListener;
                ajs[ael ? 'removeEventListener' :'detachEvent']((ael ? '' : 'on') + 'paste', ajspaste);
                ajs[ael ? 'addEventListener' : 'attachEvent']((ael ? '' : 'on') + 'paste', ajspaste);
                        
                function ajspaste (e) {
                    var clipboarditems = e.clipboardData.items,
                    len = clipboarditems[length];
                    T.toload = len;
                    T.loaded = 0;
                    for (var i = 0; i < len; i++) {
                        var file = clipboarditems[i].getAsFile();
                        if (file.size) {
                            T.process(file, i);
                        } else {
                            console.warn(tx('There was an error processing the file you pasted'));
                        }
                    }
                };
            }
            
            if ('draggable' in document.createElement('span')) {
                // If we have drag and drop support, add the functionality
                document.body.ondragover = function(e) {
                    if ($(e.target).closest('#AJS')[length]) {
                        // If the file is above the drop zone, prepare to accept it
                        e.stopPropagation();
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'copy';
                        $(hAJS+'DropZone')[rclass](AJSHidden);
                    } else {
                        // Else show that the place being hovered over is not the drop zone
                        $(hAJS+'DropZone')[addclass](AJSHidden);
                    }
                };
                document.body.ondrop = function(e) {
                    // Prevent an accidental drop outside the drop zone
                    e.stopPropagation();
                    e.preventDefault();
                    if ($(e.target).closest('#AJS')[length]) {
                        // Only accept drops inside the drop zone
                        $(hAJS+'DropZone')[addclass](AJSHidden);
                        T.filechanged.call(null, {eventType: 'drop', originalEvent: e, target: {files: e.dataTransfer.files}});
                    }
                };
            }
            
            ajsfile[unbind](change)[change](T.filechanged);
            
            $(hAJS+'')[unbind]('dbclick').dblclick(function () {
                // Remove accidental double click highlighting
                if (win.getSelection) {
                    win.getSelection().removeAllRanges();
                } else if (document.selection) {
                    document.selection.empty();
                }
            });
                    
            $(hAJS+'Add')[unbind](click)[click](function () {
                // What to do when the add button is clicked
                if ((T[uploads][length] + 1) > T.s.maxFiles) {
                    
                } else {
                    ajsfile[click]();
                    T.addingmore = !0;
                }
            });
            
            $(hAJS+'Change')[unbind](click)[click](function () {
                // What to do when the 'change this file' button is clicked
                T[changing] = T[currentupload];
                T.addingmore = !1;
                ajsfile[click]();
            });
            
            $(hAJS+'L')[unbind](click)[click](function (){
                // Go left
                T.changePrev(!0);
            });
            
            $(hAJS+'R')[unbind](click)[click](function (){
                // Go right
                T.changePrev();
            });
            
            elem(AJS+'Edit').onclick = T.showInfo;
            
            elem(AJS+'ICancel').onclick = function () {
                $(hAJS+'Main > div')[addclass](AJSHidden);
                $(hAJS+'ImagePreview')[rclass](AJSHidden);
            };
            
            elem(AJS+'ISave').onclick = T.saveInfo;
            
            $(hAJS+'Remove')[unbind](click)[click](function () {
                if (confirm(tx('Are you sure you want to delete this file?'))) {
                    // Remove the file by re-indexing the uploads array
                    var temp = [];
                    for (var i = 0, len = T[uploads][length]; i < len; i++) {
                        if (T[uploads][i] && i !== T[currentupload]) {
                            temp.push(T[uploads][i]);
                        }
                    }
                    // Remove the image for this upload
                    $('#AJSIMG_' + T.id + T[currentupload]).remove();
                    T[uploads] = temp;
                    T[currentlength] = T[uploads][length];
                    // Update the value for this input
                    $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
                    $(hAJS+'UploadSection')[addclass](AJSHidden);
                    $(hAJS+'ImagePreview')[rclass](AJSHidden);
                    T.toggleLR();
                    T.displayUpload();
                }
            });
            
            $('#AJSClose,#AJSCloseText')[unbind](click)[click](function () {
                // Close the upload screen
                $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
                $(hAJS).hide();
            });
            
            $('[id^=AJSUploadBtn_]')[unbind](click)[click](function () {
                // Determine what stream we want
                var asid = $(this)[prop]('id')[replace](AJS+'UploadBtn_', '');
                // Set it as the current object
                T = ZZ.streams[asid];
//                T.initBinding();
                T[uploads][length] ? T.displayUpload() : T.resetToUpload();
                $(hAJS+'').show();
            });
            
        };
        
        /**
         * Draw the ajax main window
         */
        T.draw = function (){
            // Auto executing
            var parent = T[par]();
            T[addclass](AJSHidden);
            if (exists($(hAJS+'_' + T.id))) {
                var val = $(hAJS+'_' + T.id).val();
                T[uploads] = val[length] ? json_decode(val, !0) : [];
//                T.loadExisting();
            } else {
                parent[append](cHE.getInput(AJS+'_' + T.id, null, null, 'hidden'));
            }
            if (T.s.showPreviewOnForm) {
                
            } else {
                parent[append](cHE.getSpan(tx('Upload'), AJS+'UploadBtn_' + T.id, AJS+'Btn', {'data-mandatory': !0}));
            }
            if (!exists($(hAJS))) {
                // Only create an ajaxStreamMain if one does not already exist in the DOM
                body[append](cHE.getDiv(drawMainDialogue(T.s), AJS));
                if (!fapi) {
                    drawLegacy();
                }
                $(hAJS+'ImagePreview').after(drawInfoBay());
                $(hAJS+'RITrack').streamBoundaries({
                    width: '100%',
                    height: '100%',
                    orientation: '2d',
                    resizable: !0,
                    bg: 'none',
                    thumbBg: 'none'
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
     * Draw the legacy elements
     */
     function drawLegacy() {
        if (!exists($(hAJS+'Legacy'))) {
            var formsettings = {
                method: 'post',
                enctype: 'multipart/form-data',
                target: AJS+'IFrame'
            };
            $('body').append(
                    cHE.getHtml('form', 
                        cHE.getInput(AJS+'Legacy', null, null, 'hidden') + 
                        cHE.getInput(AJS+'FileLegacy', null, null, 'file'), AJS+'LegacyForm', AJSHidden, formsettings) +
                    cHE.getHtml('iframe', null, AJS+'IFrame', AJSHidden, {name: AJS+'IFrame'})
            );
        }
    }

    /**
     * Draw the main AjaxStream dialogue
     * @syntax drawMainDialogue();
     * @returns {html}
     */
    function drawMainDialogue() {
        var top = drawImagePreview() +
        drawUploader();
        return cHE.getDiv(top + cHE.getHtml('img', null, AJS+'Loading', AJSHidden, {
            src: 'files/loader.gif', 
            title: tx('Files are loading')
        }), AJS+'Main');
    }

    /**
     * Draw the preview into view
     * @syntax drawImagePreview()
     * @returns {html}
     */
    function drawImagePreview() {
        var outtext = drawActionBar() + cHE.getDiv(
            cHE.getSpan(null, AJS+'L', AJS+'LR asicons-arrow-left') + 
            cHE.getSpan(null, AJS+'R', AJS+'LR asicons-arrow-right'), AJS+'LRContainer'
        );
        return cHE.getDiv(outtext, AJS+'ImagePreview', AJSHidden);
    }

    /**
     * Draw the top bar of the uploader where the action buttons will be stored
     * @returns {html}
     */
    function drawActionBar() {
        return cHE.getDiv(
            cHE.getDiv(null, AJS+'ActionsOverlay') +    
            cHE.getDiv(
                cHE.getSpan(null, AJS+'Add', 'asicons-plus', {title: tx('Add another file')}) +
                cHE.getSpan(null, AJS+'Change', 'asicons-upload', {title: tx('Change file')}) +
                cHE.getSpan(null, AJS+'Edit', 'asicons-pencil', {title: tx('Edit')}) +
                cHE.getSpan(null, AJS+'Remove', 'asicons-trash', {title: tx('Remove file')}) +
                cHE.getSpan(null, AJS+'Close', 'asicons-cross', {title: tx('Close window')})), 
        AJS+'PreviewActions');
    }
    
    /**
     * Draw the information section (Custom fields)
     * @returns {html}
     */
    function drawInfoBay () {
        var inner = '';
        inner += cHE.getDiv(
                    cHE.getDiv(cHE.getDiv(cHE.getHtml('img', null, AJS+'ResImg') + cHE.getDiv(cHE.getDiv(), AJS+'RITrack'), 
                        AJS+'RInner'), AJS+'RIHolder'), AJS+'Info');
        return cHE.getDiv(inner + 
                cHE.getDiv(
                    cHE.getSpan(tx('Save'), AJS+'ISave', AJS+'BtnD')+ 
                    cHE.getSpan(tx('Cancel'), AJS+'ICancel', AJS+'BtnD'), AJS+'IBtns'), AJS+'More', AJSHidden);
    }
    
    /**
     * Render the custom fields defined by the user
     * @returns {html}
     */
    function renderCustomFields() {
        var outtext = '',
        cf = ZZ.customFields,
        consts = ZZ.const;
        for (var i = 0; i < cf[length]; i++) {
            var obj = cf[i],
            type;
            switch (obj.type) {
                // @todo Implement more
                case consts['CF_TEXT']:
                default:
                    type = 'text';
            }
            outtext += cHE.getDiv(
                    cHE.getDiv(cHE.getSpan(obj[name]), null, AJS+'CFName') + 
                    cHE.getDiv(cHE.getInput(null, obj.value, null, type, {
                        placeholder: obj[name],
                        'data-ajsfor': obj[name]
                    }), null, AJS+'CFField'));
        }
        return outtext;
    }

    /**
     * Draw the actual upload section, i.e. the upload button and the 'drop zone'
     * @syntax drawUploader();
     * @returns {html}
     */
    function drawUploader() {
        var choosefile = 
                cHE.getSpan(tx('Choose file'), AJS+'ChooseText', AJS+'BtnD') + 
                cHE.getSpan(tx('Paste'), AJS+'PasteText', 'AJSBtnD AJSBtnDU') + 
                cHE.getSpan(tx('Drop'), AJS+'DropText', 'AJSBtnD AJSBtnDU') + 
                cHE.getSpan('x', AJS+'CloseText', AJS+'BtnD');
        var outtext = cHE.getDiv(
                cHE.getInput(AJS+'File', null, AJSHidden, 'file') +
                cHE.getDiv(choosefile, AJS+'ChooseFile'), AJS+'ChooseSection');
        return cHE.getDiv(outtext, AJS+'UploadSection') + cHE.getDiv(cHE.getHtml('a', tx('DROP')), AJS+'DropZone', AJSHidden);
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
            if (value !== null && value !== '') {
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