(function ($, win, count){
    
    // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
    var length = 'length',
    prop = 'prop',
    AJS = 'AJS',
    hAJS = '#AJS',
    dAJS = '.AJS';
    
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
        var ef = function () {},
        body = $('body'),
        fapi = browserCanDo('fileapi'),
        // Access object methods using [] instead of '.', meaning that the following methods names can be compressed, saving space
        par = 'parent',
        addclass = 'addClass',
        rclass = 'removeClass',
        append = 'append',
        click = 'click',
        unbind = 'unbind',
        change = 'change',
        attr = 'attr',
        uploads = 'uploads';
        T.c = count;
        T.currentupload = null;
        T.currentlength = 0;
        T.changing = !1;
        T.toload = 0;
        T.loaded = 0;
        T[uploads] = [];
        T.addingmore = !1;
        T.s = $.extend({
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
            resize: !0,
            showPreviewOnForm: !1,
            translateFunction: function(s) {
                for (var i = 1; i < arguments[length]; i++) {
                    var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
                    s = s.replace(re, arguments[i]);
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
        }, opts);

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
         * Perform the legacy upload
         * @param {object(DOMElement)} input The input that has the file being uploaded
         */
        T.legacyUpload = function(input) {
            var i = $(input),
            parent = i.parent(),
            clone = i.clone(),
            file = input.files[0],
            index = T.changingindex === false ? T[uploads][length] : T.changingindex;
            T.filedata = {
                name: file.name,
                mimetype: file.type,
                size: file.size,
                newupload: true,
                customFields: {},
                index: index,
                islegacy: true
            };
            i.prop({id: AJS+'FileLegacy', name: AJS+'FileLegacy'});
            $(hAJS+'LegacyForm').append(i);
            parent.append(clone);
            win['AJSLegacy'] = $.ajaxStream.streams[T.id];
            $(hAJS+'Legacy').val(JSON.stringify({
                maxsize: T.s.maxFileSize,
                maxheight: T.s.maxHeight,
                maxwidth: T.s.maxWidth,
                uploaddir: T.s.uploadTo,
                islegacy: !0,
                id: T.id
            }));
            $(hAJS+'LegacyForm').prop({action: T.s.uploadScript});
            $(hAJS+'LegacyForm').submit();
        };

        /**
         * What to after a file has been uploaded
         * @param {object(plain)} results The results from our upload
         */
        T.afterLegacyUpload = function(results) {
            if (results.moved) {
//                var T = $.ajaxStream.streams[results.id];
                T.filedata.src = results.location;
//                T.initBinding();
                T.afterFileRead(T.filedata, T.changingindex !== false);
            } else {
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
                T.changing = !1;
                return;
            }
            T.toload = filelist[length];
            if (fapi) {
                $(hAJS+'ChooseText')[addclass](AJS+'Hidden');
                $(hAJS+'Loading')[rclass](AJS+'Hidden');
                if (T.changing === !1) {
                    // This is a new file
                    var len = filelist[length];
                    var tlen = len + T[uploads][length];
                    if (tlen > T.s.maxFiles) {
                        console.warn(tx('You have selected {0} files but are only permitted to upload {1}', tlen, T.s.maxFiles));
                        len = T.toload = T.s.maxFiles - T[uploads][length];
                    }
                    for (var i = 0; i < len; i++) {
                        T.process(filelist[i], i);
                    }
                } else {
                    T.process(filelist[0], T.changing, true);
                }
            } else {
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
            var fr = new FileReader();
            fr.readAsArrayBuffer(file);
            fr.onload = function(e) {
                var blob = new Blob([e.target.result], {type: file.type});
                var dataURL = (win.URL || win.webkitURL).createObjectURL(blob);
                var index = changing ? i : T.currentlength;
                var filedata =  {
                    name: file.name,
                    src: dataURL,
                    mimetype: file.type,
                    size: file.size,
                    newupload: !0,
                    customFields: {},
                    index: index,
                    islegacy: !1
                };
                if (!changing) {
                    T.currentlength++;
                }
                if (file.type.match('image/*')) {
                    // If this is an image, then there is some extra information that we can add
                    var img = new Image();
                    img.onload = function () {
                        var image = this;
                        filedata.width = image.width;
                        filedata.height = image.height;
                        filedata.viewport = {
                            left: undefined,
                            right: undefined,
                            width: undefined,
                            src: undefined
                        };
                        T.afterFileRead(filedata, changing, target);
                    };
                    img.src = dataURL;
                } else {
                    // Load normally
                    T.afterFileRead(filedata, changing, target);
                }
            };
        };
        
        /**
         * What to do after the selected file has been read
         * @param {object(plain)} filedata
         * @param {boolean} changing
         * @param {object(DOMElement)} target
         */
        T.afterFileRead = function (filedata, changing, target) {
            if (changing) {
                // We're changing a file already in the upload list
//                T.callSelfEvent('onfilechanged', target, {
//                    new : filedata, 
//                    old: T[uploads][filedata.index], 
//                    target: target, 
//                    pseudoTarget: inputs[T.id]
//                });
                T[uploads][filedata.index] = filedata;
            } else {
                T[uploads][filedata.index] ? T[uploads][filedata.index] = filedata : T[uploads].push(filedata);
            }
//            T.callSelfEvent('onfilesloaded', target, {
//                total: T.toload, 
//                loaded: T.loaded + 1, 
//                target: target, 
//                pseudoTarget: inputs[T.id]
//            });
            T.attemptProgression(target);
        };
        
        /**
         * Attempt to progress. If files loaded equals files selected, progress, otherwise do nothing
         */
        T.attemptProgression = function () {
            T.loaded++;
            if (T.loaded === T.toload) {
                var ajslrc = $(hAJS+'LRContainer');
//                T.callSelfEvent('onfilesloaded', target, {total: T.toload, loaded: T.loaded + 1, pseudoTarget: inputs[T.id]});
                $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
                $(hAJS+'UploadSection')[addclass](AJS+'Hidden');
                $(hAJS+'ImagePreview')[rclass](AJS+'Hidden');
                if (T[uploads][length] > 1) {
                    ajslrc[rclass](AJS+'Hidden');
                } else {
                    ajslrc[addclass](AJS+'Hidden');
                }
                var gotoend = T.changing === !1;
                T.changing = !1;
                T.toload = T.loaded = 0;
                T.displayUpload(null, gotoend);
            }
        };
        
        /**
         * Display a preview of an upload file
         * @param {object(plain)} cur The object that describes the file for which we are seeking a preview
         * @param {boolean} gotoend
         */
        T.displayUpload = function (cur, gotoend) {
            if (T[uploads][length]) {
                if (!cur) {
                    cur = T.getCurr(gotoend);
                }
                var src = cur.src;
                var ajsc = $(hAJS+'Crop');
                if (cur.mimetype.match('image/*')) {
                    ajsc[rclass](AJS+'Hidden');
                } else {
                    src = T.getIconPath(cur.mimetype);
                    ajsc[addclass](AJS+'Hidden');
                }
                var img = elem(AJS+'UploadPreview');
                img.src = src;
                $(hAJS+'UploadPreview')[rclass](AJS+'Transparent');//.addClass(AJS+'Opaque');
            } else {
                T.resetToUpload();
            }
        };
        
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
            $(hAJS+'UploadSection')[rclass](AJS+'Hidden');
            $(hAJS+'ImagePreview')[addclass](AJS+'Hidden');
            $(hAJS+'ChooseText')[rclass](AJS+'Hidden');
            $(hAJS+'Loading')[addclass](AJS+'Hidden');
            T[uploads][length] ? lr[rclass](AJS+'Hidden') : lr[addclass](AJS+'Hidden');
        };
        
        /**
         * Get the object that represent the uploaded file that is currently being worked with
         * @param {boolean} gotoend
         * @returns {object(plain)} The object representing the uploaded file being worked with
         */
         T.getCurr = function(gotoend) {
            if (gotoend) {
                T.currentupload = T[uploads][length]  - 1;
                return end(T[uploads]);
            } else {
                if (T.addingmore) {
                    var res = end(T[uploads]);
                    T.currentupload = res.index - 1;
                    return res;
                } else {
                    if (T.currentupload || T.currentupload === 0) {
                        return T[uploads][T.currentupload];
                    }
                    T.currentupload = 0;
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
            if (T.currentupload + addition < 0) {
                cur = end(T.uploads);
                T.currentupload = T[uploads][length] - 1;
            } else if (T.currentupload + addition > (T[uploads][length] - 1)) {
                cur = reset(T[uploads]);
                T.currentupload = 0;
            } else {
                cur = T[uploads][T.currentupload + addition];
                T.currentupload +=  addition;
            }
            T.displayUpload(cur);
        };
                
        
        /**
         * Initialise all of the events in one function
         */
        T.initBinding = function (){
            
            // @todo Possibly go vanilla?
            
            var ajsfile = $(hAJS+'File');
            
            $(hAJS+'ChooseText')[unbind](click)[click](function (){
                var fa = {accept:T.s.accept};
                T.addingmore = !0;
                if (T.s.maxFiles > 1) {
                    // Allow us to have multiple files
                    fa['multiple'] = !0;
                }
                ajsfile[attr](fa)[click]();
            });
            
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
                T.changing = T.currentupload;
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
            
            $(hAJS+'Remove')[unbind](click)[click](function () {
                if (confirm(tx('Are you sure you want to delete this file?'))) {
                    // Remove the file by re-indexing the uploads array
                    var temp = [],
                    lrc = $(hAJS+'LRContainer');
                    for (var i = 0, len = T[uploads][length]; i < len; i++) {
                        if (T[uploads][i] && i !== T.currentupload) {
                            temp.push(T[uploads][i]);
                        }
                    }
                    T[uploads] = temp;
                    T.currentlength = T[uploads][length];
                    // Update the value for this input
                    $(hAJS+'_' + T.id).val(json_encode(T[uploads]));
                    $(hAJS+'UploadSection')[addclass](AJS+'Hidden');
                    $(hAJS+'ImagePreview')[rclass](AJS+'Hidden');
                    if (T[uploads][length] > 1) {
                        lrc[rclass](AJS+'Hidden');
                    } else {
                        lrc[addclass](AJS+'Hidden');
                    }
                    T.displayUpload();
                }
            });
            
            $(hAJS+'Close')[unbind](click)[click](function () {
                // Close the upload screen
                $(hAJS+'').hide();
            });
            
            $('[id^=AJSUploadBtn_]')[unbind](click)[click](function () {
                // Determine what stream we want
                var asid = $(this).prop('id').replace(AJS+'UploadBtn_', '');
                // Set it as the current object
                T = $.ajaxStream.streams[asid];
//                T.initBinding();
                // Get the upload data for this input
                var val = $(hAJS+'_' + T.id).val();
                T[uploads] = val[length] ? json_decode(val, !0) : [];
                T[uploads][length] ? T.displayUpload() : T.resetToUpload();
                $(hAJS+'').show();
                if (!T[uploads][length]) {
                    // If there is nothing in the uploads, open the file select immediately
                    $(hAJS+'File')[click]();
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
            T[addclass](AJS+'Hidden');
            if (exists($(hAJS+'_' + T.id))) {
                T.loadExisting();
            } else {
                parent[append](cHE.getInput(AJS+'_' + T.id, null, null, 'hidden'));
            }
            if (T.s.showPreviewOnForm) {
                
            } else {
                parent[append](cHE.getSpan(tx('Upload'), AJS+'UploadBtn_' + T.id, AJS+'Btn', {'data-mandatory': !0}));
            }
            if (!exists($(hAJS+''))) {
                // Only create an ajaxStreamMain if one does not already exist in the DOM
                body[append](cHE.getDiv(drawMainDialogue(), AJS));
                if (!fapi) {
                    drawLegacy();
                }
            }
            T.initBinding();
        }();
        
        // Cache this object for later use
        $.ajaxStream.streams[T.id] = T;
        count++;
        return T;
    };
    
    /**
     * Get the index of a particular element in the DOM
     * @param {object(jQuery)} jqelem The object to index
     * @returns {int} The index of the element
     */
    function index(jqelem) {
        var tagname = jqelem[prop]('tagName');
        return $(tagname).index(jqelem);
    }    
    
    /**
     * Draw the legacy elements
     */
     function drawLegacy() {
        if (!exists($(hAJS+'Legacy'))) {
            var formsettings = {
                method: 'post',
//                action: self.opts.uploadScript,
                enctype: 'multipart/form-data',
                target: AJS+'IFrame'
            };
            $('body').append(
                    cHE.getHtml('form', cHE.getInput(AJS+'Legacy', null, null, 'hidden'), AJS+'LegacyForm', AJS+'Hidden', formsettings) +
                    cHE.getHtml('iframe', null, AJS+'IFrame', AJS+'Hidden', {name: AJS+'IFrame'})
            );
        }
    };

    /**
     * Draw the main AjaxStream dialogue
     * @syntax drawMainDialogue();
     * @returns {html}
     */
    function drawMainDialogue() {
        var top = drawImagePreview();
        top += drawViewPort();
        top += drawUploader();
        var outtext = cHE.getDiv(top, AJS+'Main');
        return outtext;
    }

    /**
     * Draw the preview into view
     * @syntax drawImagePreview()
     * @returns {html}
     */
    function drawImagePreview() {
//            var outtext = cHE.getHtml(browserCanDo('canvas') ? 'canvas' : 'img', null, 'ajaxStreamUploadPreview', null);
//            var outtext = drawActionBar() + cHE.getHtml('img', null, null, 'ajaxStreamUploadPreview');
        var outtext = drawActionBar() + cHE.getHtml('img', null, AJS+'UploadPreview') + cHE.getDiv(
            cHE.getSpan(null, AJS+'L', AJS+'LR asicons-arrow-left') + 
            cHE.getSpan(null, AJS+'R', AJS+'LR asicons-arrow-right'), AJS+'LRContainer'
        );
        return cHE.getDiv(outtext, AJS+'ImagePreview', AJS+'Hidden');
    }

    /**
     * 
     * @returns {html}
     */
    function drawActionBar() {
        return cHE.getDiv(
            cHE.getDiv(null, AJS+'ActionsOverlay') +    
            cHE.getDiv(
                cHE.getSpan(null, AJS+'Add', 'asicons-plus', {title: tx('Add another file')}) +
                cHE.getSpan(null, AJS+'Change', 'asicons-upload', {title: tx('Change file')}) +
                cHE.getSpan(null, AJS+'Edit', 'asicons-pencil', {title: tx('Edit')}) +
                cHE.getSpan(null, AJS+'Crop', 'asicons-resize-shrink', {title: tx('Resize image')}) +
                cHE.getSpan(null, AJS+'Remove', 'asicons-trash', {title: tx('Remove file')}) +
                cHE.getSpan(null, AJS+'Close', 'asicons-cross', {title: tx('Close window')})), 
        AJS+'PreviewActions');
    }

    /**
     * Draw the viewport section for the upload
     * @syntax drawViewPort();
     * @returns {html}
     */
    function drawViewPort() {
        var outtext = '';
        // Do stuff
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
                cHE.getHtml('img', null, AJS+'Loading', AJS+'Hidden', {src: 'files/loader.gif', title: tx('Files are loading')});
        var outtext = cHE.getDiv(
                cHE.getInput(AJS+'File', null, AJS+'Hidden', 'file') +
                cHE.getDiv(choosefile, AJS+'ChooseFile'), AJS+'ChooseSection');
        outtext += cHE.getDiv(tx('DROP'), AJS+'DropZone', AJS+'Hidden');
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
            case 'filereader':
                return Boolean(win.FileReader);
            case 'file':
                return Boolean(win.File);
            case 'filelist':
                return Boolean(win.FileList);
            case 'blob':
                return Boolean(win.Blob);
            case 'fileapi':
                return !Boolean(win.Blob || win.File || win.FileList || win.FileReader);
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
                throw T.exception('AjaxStream Error', ['This function cannot be used to test the feature "', test, '"'].join(''));
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
    
    $.ajaxStream = {
        author: 'Luke Madhanga',
        license: 'MIT',
        streams: {},
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