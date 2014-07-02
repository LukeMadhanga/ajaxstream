(function ($, win, count){
    
    // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
    var length = 'length',
    prop = 'prop',
    AJS = 'AJS',
    hAJS = '#AJS',
    dAJS = '.AJS',
    AJSHidden = 'AJSHidden',
    replace = 'replace',
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
        useViewport: !1,
        verbose: !1,
        viewportHeight: 240,
        viewportWidth: 240
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
        }
        var body = $('body'),
        fapi = browserCanDo('fileapi'),
        canv = browserCanDo('canvas'),
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
        changing = 'changing';
        T.c = count;
        T[currentupload] = null;
        T.currentlength = 0;
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
            function tx(s) {
                s === s; // Null assignemnt: Dump NetBeans warning
                return T.s.translateFunction.apply(null, arguments);
            }
        }
        
        T.id = [T.c, '_', id(T)].join('');
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
                name: file.name,
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
            $(hAJS+'LegacyForm').prop({action: T.s.uploadScript});
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
                $(hAJS+'ChooseText')[addclass](AJSHidden);
                $(hAJS+'Loading')[rclass](AJSHidden);
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
         * @param {object(File|plain)} file An item from a FileList object, or a plain object from a paste event
         * @param {int} i The index of this file in the uploads
         * @param {boolean} changing True if we are changing an existing file
         * @param {object(DOMElement)} target The original file input
         * @param {null|object(Blob)} pasteblob A blob object from a paste event
         */
        T.process = function (file, i, changing, target, pasteblob) {
            if (pasteblob) {
                fileready(null, pasteblob);
            } else {
                var fr = new FileReader();
                fr.readAsArrayBuffer(file);
                console.log(fr);
                fr.onload = fileready;
            }
            /**
             * 
             * @note Function had to be split up because we may already have a blob object (i.e. a paste event occurred)
             * @param {object(Event)} e A DOM event for a file reader when it has loaded
             * @param {object(Blob)} blobready A blob object if we already have one from a paste event
             */
            function fileready(e,blobready) {
                var blob = blobready || new Blob([e.target.result], {type: file.type});
                var dataURL = (win.URL || win.webkitURL).createObjectURL(blob);
                var index = changing ? i : T.currentlength;
                var filedata =  {
                    customFields: [],
                    index: index,
                    islegacy: !1,
                    mimetype: file.type,
                    name: file.name,
                    newupload: !0,
                    size: file.size,
                    src: dataURL
                };
                if (!changing) {
                    T.currentlength++;
                }
                if (file.type.match('image/*')) {
                    // If this is an image, then there is some extra information that we can add
                    var img = new Image();
                    img.onload = function () {
                        var image = this;
                        filedata.width = filedata.resizedWidth = image.width;
                        filedata.height = filedata.resizedHeight = image.height;
                        filedata.viewport = {
                            left: undefined,
                            right: undefined,
                            width: undefined,
                            src: undefined
                        };
                        filedata.base64 = null;
                        ZZ.images[AJS+'IMG_' + T.id + index] = this;
                        T.afterFileRead(filedata, changing, target);
                    };
                    img.src = dataURL;
                } else {
                    // Load normally
                    T.afterFileRead(filedata, changing, target);
                }
            };
            if (!pasteblob) {
                fr.readAsArrayBuffer(file);
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
                $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
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
                $(hAJS+'Add')[T.currentlength + 1 > T.s.maxFiles ? addclass : rclass](AJS+'Disabled');
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
            $((docanvas ? 'canvas':'img') + '[id^="AJSIMG_"]')[addclass](AJSHidden);
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
                    T[currentupload] = res.index - 1;
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
         * Display the information for the current file
         */
        T.showInfo = function (){
            var upload = T[uploads][T[currentupload]],
            fields = upload.customFields;
            $(hAJS+'Main > div')[addclass](AJSHidden);
            $(hAJS+'More')[rclass](AJSHidden);
            // Set the title and also make underscores line-breakable
            $(hAJS+'Info > span').html(upload.name[replace](/([\_|\.])/g,'&shy;$1&shy;'));
            $(hAJS+'Info').css({width: T.s.useViewport ? '30%' : '100%'});
            if (fields[length]) {
                for (var i = 0; i < fields[length]; i++) {
                    var obj = fields[i];
                    $('[data-ajsfor="' + obj.field + '"]').val(obj.value);
                }
            }
            if (T.s.useViewport) {
                // Do the viewport stuff
            }
            // Set focus to the first field to indicate that it is editable
            $(dAJS+'CFField:first > input').focus();
        };
        
        /**
         * Save the custom fields information and the viewport data
         */
        T.saveInfo = function () {
            // Save the customFields information
            var upload = T[uploads][T[currentupload]],
            fields = ZZ.customFields,
            output = [];
            if (fields[length]) {
                // We have some custom fields set so save the information
                for (var i = 0; i < fields[length];i++) {
                    var obj = fields[i];
                    output.push({field: obj.name, value: $('[data-ajsfor="' + obj.name + '"]').val()});
                    // Clear the field for later use
                    $('[data-ajsfor="' + obj.name + '"]').val('');
                }
                upload.customFields = output;
            }
            if (T.s.useViewport) {
                // Save the viewport data
            }
            $(hAJS+'Main > div')[addclass](AJSHidden);
            $(hAJS+'ImagePreview')[rclass](AJSHidden);
        };
                
        
        /**
         * Initialise all of the events in one function
         */
        T.initBinding = function (){
            
            // @todo Possibly go vanilla?
            
            var ajsfile = fapi ? $(hAJS+'File') : $(hAJS+'FileLegacy');
            
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
            
            elem(AJS).onpaste = function (e) {
                var items = (e.clipboardData || e.originalEvent.clipboardData).items,
                blob = items[0].getAsFile();
                if (blob && blob.type.match(T.s.accept) && T.currentlength < T.s.maxFiles) {
                    // Only continue if the mimetype is acceptable, and if we haven't ran out of uploads for this input
                    T.toload = 1;
                    T.loaded = 0;
                    // Get the date string and replace spaces with underscores and remove special characters
                    var datestring = (new Date()).toString()[replace](/\ /g,'_')[replace](/(\+|\:|\(|\))/g, '');
                    T.process({
                        // Create a name for this file and set the file extension by stripping off 'master_type/' from 
                        //  'master_type/ext'
                        name: 'AjaxStream-Paste-At-'+datestring+'.'+(blob.type)[replace](/.+\/(.*)/,'$1'),
                        type: blob.type,
                        size: blob.size
                    },T[currentupload] + 1,false, null,items[0].getAsFile());
                }
            };
            
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
            
            $(hAJS+'Edit')[unbind](click)[click](T.showInfo);
            
            $(hAJS+'ISave')[unbind](click)[click](T.saveInfo);
            
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
                    T.currentlength = T[uploads][length];
                    // Update the value for this input
                    $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
                    $(hAJS+'UploadSection')[addclass](AJSHidden);
                    $(hAJS+'ImagePreview')[rclass](AJSHidden);
                    T.toggleLR();
                    T.displayUpload();
                }
            });
            
            $(hAJS+'Close')[unbind](click)[click](function () {
                // Close the upload screen
                $(hAJS).hide();
            });
            
            $('[id^=AJSUploadBtn_]')[unbind](click)[click](function () {
                // Determine what stream we want
                var asid = $(this).prop('id')[replace](AJS+'UploadBtn_', '');
                // Set it as the current object
                T = ZZ.streams[asid];
//                T.initBinding();
                // Get the upload data for this input
                var val = $(hAJS+'_' + T.id).val();
                T[uploads] = val[length] ? json_decode(val, !0) : [];
                T[uploads][length] ? T.displayUpload() : T.resetToUpload();
                $(hAJS+'').show();
                if (!T[uploads][length]) {
                    // If there is nothing in the uploads, open the file select immediately
                    ajsfile[click]();
                    T.addingmore = !0;
                }
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
                T.loadExisting();
            } else {
                parent[append](cHE.getInput(AJS+'_' + T.id, null, null, 'hidden'));
            }
            if (T.s.showPreviewOnForm) {
                
            } else {
                parent[append](cHE.getSpan(tx('Upload'), AJS+'UploadBtn_' + T.id, AJS+'Btn', {'data-mandatory': !0}));
            }
            if (T.s.useViewport && !$('script[src$="ajaxstreamviewport.js"]')[length] && T.s.loadRequiredFiles) {
                // If we're using the viewport script and it is not already loaded and will not be loaded otherwise, load it
                var s = document.createElement('script');
                s.type = 'text/javascript';
                s.src = 'ajaxstreamviewport.js';
                s.onload = function () {
                    
                };
                $('head').append(s);
            }
            if (!exists($(hAJS+''))) {
                // Only create an ajaxStreamMain if one does not already exist in the DOM
                body[append](cHE.getDiv(drawMainDialogue(T.s), AJS));
                if (!fapi) {
                    drawLegacy();
                }
                $(hAJS+'ImagePreview').after(drawInfoBay(T.s.useViewport));
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
        return cHE.getDiv(top, AJS+'Main');
    }

    /**
     * Draw the preview into view
     * @syntax drawImagePreview()
     * @returns {html}
     */
    function drawImagePreview() {
//            var outtext = cHE.getHtml(browserCanDo('canvas') ? 'canvas' : 'img', null, 'ajaxStreamUploadPreview', null);
//            var outtext = drawActionBar() + cHE.getHtml('img', null, null, 'ajaxStreamUploadPreview');
//        var outtext = drawActionBar() + cHE.getHtml('img', null, AJS+'UploadPreview') + cHE.getDiv(
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
     * Draw the information section
     * @param {boolean} hasvp True if current element has a viewport
     * @returns {html}
     */
    function drawInfoBay (hasvp) {
        var inner = '', 
        attrs = {style: 'width:100%;'};
        if (hasvp) {
            inner = inner += cHE.getDiv(null, AJS+'VP');
            attrs['style'] = 'width:30%;';
        }
        inner += cHE.getDiv(cHE.getSpan() + cHE.getDiv(renderCustomFields(), AJS+'CF'), AJS+'Info', null, attrs);
        return cHE.getDiv(inner + cHE.getSpan(tx('Save'), AJS+'ISave'), AJS+'More', AJSHidden);
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
                    cHE.getDiv(cHE.getSpan(obj.name), null, AJS+'CFName') + 
                    cHE.getDiv(cHE.getInput(null, obj.value, null, type, {
                        placeholder: obj.name,
                        'data-ajsfor': obj.name
                    }), null, AJS+'CFField'));
        }
        return outtext;
    }

    /**
     * Draw the actual upload section, i.e. the upload button and the 'drop zone'
     * @syntax drawUploader();
     * @returns {string|html}
     */
    function drawUploader() {
        var choosefile = 
                cHE.getSpan(tx('Choose file'), AJS+'ChooseText', AJS+'Btn') + 
                cHE.getHtml('img', null, AJS+'Loading', AJSHidden, {src: 'files/loader.gif', title: tx('Files are loading')});
        var outtext = cHE.getDiv(
                cHE.getInput(AJS+'File', null, AJSHidden, 'file') +
                cHE.getDiv(choosefile, AJS+'ChooseFile'), AJS+'ChooseSection');
//        outtext += cHE.getDiv(tx('DROP'), AJS+'DropZone', AJSHidden);
        return cHE.getDiv(outtext, AJS+'UploadSection');
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
    function end (arr) {
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
        return Object.prototype.toString.call(variable) === '[object Object]';
    }
    
    /**
     * Determine whether a variable is a boolean or not
     * @param {mixed} v Any variable
     * @returns {Boolean} True if the variable is a boolean
     */
    function is_boolean(v) {
        return typeof v === 'boolean';
    }
    /**
     * @brief AjaxStream exception handler
     * @param {string} exceptiontype The name of the exception to replace xxx in the string "Uncaught AjaxStream::xxx - message"
     * @param {string} message The exception message
     * @returns {sAjaxStream::Exception}
     */
    function exception(exceptiontype, message) {
        return {
            name: 'AjaxStream::' + exceptiontype,
            level: "Cannot continue",
            message: message,
            htmlMessage: message,
            toString: function() {
                return ['Error: AjaxStream::', exceptiontype, ' - ', message].join('');
            }
        };
    }
    
    /**
     * @brief Determine whether a variable is empty, i.e. if it has a value, or if it is an empty array/object
     * @param {Mixed} v Any variable to check
     * @returns {Boolean} True if the variable is 'empty'
     * @notes Function emulates the same behaviour as PHP's empty function
     */
    function empty (v) {
        if (typeof v === undefined || !v || (is_array(v) && v[length] === 0) || (is_object(v) && objsize(v) === 0)) {
            return !0;
        }
        return !1;
    }
    
    /**
     * @brief Determine whether the current browser is capable of doing certain things
     * @param {String} test The feature to look for, e.g. 'canvas', or 'FileReader'
     * @returns {Boolean} True if the current browser is capable of doing what was tested for
     */
    function browserCanDo (test) {
        test = test.toLowerCase();
        switch (test) {
            case 'canvas':
                // Test to see whether we have canvas support (from http://goo.gl/Fh8cCK)
                var canvas = document.createElement('canvas');
                return !!(canvas.getContext && canvas.getContext('2d'));
            case 'fileapi':
                return Boolean(win.Blob || win.File || win.FileList || win.FileReader);
            case 'drag':
                return ('draggable' in document.createElement('span'));
            case 'formdata':
                return (typeof FormData === 'function');
            case 'xhrprogress':
                var xhr = new XMLHttpRequest();
                return !! (xhr && ('upload' in xhr) && ('onprogress' in xhr.upload));
            case 'multiupload':
                return ('multiple' in document.createElement('input'));
            default:
                throw exception('AjaxStream Error', ['This function cannot be used to test the feature "', test, '"'].join(''));
        }
    };

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
        if (is_array(obj)) {
            obj = {};
            for (var i = 0, len = object[length]; i < len; i++) {
                if (!empty(object[i])) {
                    obj[i] = object[i];
                }
            }
        }
        return JSON.stringify(obj);
    }

    /**
     * @brief Determine whether a variable is an array
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable is an array
     */
    function is_array(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
    }
    
    /**
     * Determine the amount of items in an object
     * @param {object} obj The object to test
     * @returns {int} The amount of items in the object
     */
    function objsize (obj) {
       var size = 0;
        for (var okey in obj) {
            if (obj.hasOwnProperty(okey))
                size++;
        }
        return Number(size); 
    }

    /**
     * Determine whether a variable is a function
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable refers to a function
     */
    function is_function (variable) {
        return typeof variable === 'function';
    }
    
    /**
     * Get the id of a jQuery object
     * @param {object(jQuery)} jqelem
     * @returns {string} The id of the element
     */
    function id(jqelem) {
        return jqelem[prop]('id');
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
                        if (is_boolean(val)) {
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
    
})(jQuery, this, 0);