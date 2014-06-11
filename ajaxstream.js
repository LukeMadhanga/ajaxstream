(function($) {

    var root = this;
    
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
         * Render a table
         * @syntax cHE.getTable({});
         * @param {Null|Object} headers The headers of the table in the form:
         *       {body: array(header1, header2, {value: header3, attributes: {html_attr: value}}),
         *        attributes: {html_attr: value}
         *       }
         * @param {Null|Object} body The body of the table in the same form as the headers
         * @param {String} id The html id of the table
         * @param {String} cssclass The css class of the table
         * @param {Object} moreattrs An object in the form {html_attr: value}
         * @returns {html}
         */
        this.getTable = function(headers, body, id, cssclass, moreattrs) {
            if (!moreattrs) {
                moreattrs = {};
            }
            if (id) {
                moreattrs.id = id;
            }
            if (cssclass) {
                moreattrs.class = cssclass;
            }
            var tbody = '<tbody>';
            if (!empty(headers)) {
                tbody += self.getInnerOuterHtml('tr', 'th', headers, headers.attributes);
            }
            if (!empty(body)) {
                tbody += self.getInnerOuterHtml('tr', 'td', body, body.attributes);
            }
            tbody += '</tbody>';
            return '<table ' + parseAttrsFromObj(moreattrs) + '>' + tbody + '</table>';
        };

        /**
         * Get html that requires inner html, e.g. ul elements and their corresponding li elements
         * @syntax e.g. cHE.getInnerOuterHtml(ul, li, body, {attributes: value [, ...]});
         * @param {type} outertag
         * @param {type} innertag
         * @param {type} body
         * @param {type} outerattrs
         * @returns {String}
         */
        this.getInnerOuterHtml = function(outertag, innertag, body, outerattrs) {
            var outtext = '<' + outertag + ' ' + parseAttrsFromObj(outerattrs) + '>';
            for (var i = 0; i < body.body.length; i++) {
                if (is_object(body.body[i])) {
                    var attrs = parseAttrsFromObj(body.body[i].attributes);
                    outtext += '<' + innertag + ' ' + attrs + '>' + body.body[i].value + '</' + innertag + '>';
                } else {
                    outtext += '<' + innertag + '>' + body.body[i] + '</' + innertag + '>';
                }
            }
            return outtext + '</' + outertag + '>';
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
         * @brief Take an object in the form {attribute_name: value, ...} and convert it to "attribute_name='value' ..."
         * @param {object} attrs An object in the form {html_attribute: value, ...}
         * @returns {string} A string of attributes to go inside a html element
         */
        function parseAttrsFromObj(attrs) {
            if (attrs) {
                var outtext = '';
                for (var x in attrs) {
                    outtext += ' ' + x + (!attrs[x] ? '' : '=\'' + attrs[x] + '\'');
                }
                return outtext;
            }
            return '';
        }

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
// @TODO REWRITE cHE
    cHE = new cHE();
    
    this.const = {
        PACKAGE_FILTERS: '/ajaxstreamfilter.js',
        PACKAGE_VIEWPORT: '/ajaxstreamviewport.js',
        PREVIEW_ORI_VERTICAL: 1,
        PREVIEW_ORI_HORIZONTAL: 2,
        PREVIEW_ORI_GRID: 3,
        PREVIEW_ORI_LIST_V: 4,
        PREVIEW_ORI_LIST_H: 5
    };
    var defaults = {
        allowedTypes: ['*'],
        allowFilters: true,
        fetchRequiredFiles: false,
        maxFileSize: 2097152,
        maxFiles: 1,
        iconPreviewWidth: 200,
        iconPreviewHeight: 200,
        maxHeight: 1024,
        maxWidth: 1024,
        onfilechanging: function () {},
        onfilechanged: function() {},
        onfileselected: function() {},
        onfilesloaded: function() {},
        onfilesloading: function() {},
        oninit: function() {},
        onlegacyuploadfail: function() {},
        onlegacyuploadfinish: function() {},
        onlegacyuploadstart: function() {},
        onsingleuploadfail: function() {},
        onsingleuploadfinish: function() {},
        onsingleuploadstart: function() {},
        onuploadfail: function() {},
        onuploadfinish: function() {},
        onuploadprogress: function() {},
        onuploadstart: function() {},
        previewOrientation: root.const['PREVIEW_ORI_GRID'],
        resize: true,
        showPreviewOnForm: true,
        translateFunction: function(s) {
            for (var i = 1; i < arguments.length; i++) {
                var re = new RegExp('\\{' + (i - 1) + '\\}', 'g');
                s = s.replace(re, arguments[i]);
            }
            return s;
        },
        uploadScript: "upload.php",
        uploadTo: "uploads",
        uploadWithForm: false,
        useViewport: false,
        verbose: false,
        viewportHeight: 240,
        viewportWidth: 240
    };
    var inputs = {};
    var streams = {};

    $.ajaxStreamGlobal = function(opts) {

        // Apply the user defined options to the defaults
        defaults = $.extend(defaults, opts);

    };

    /**
     * @brief Access a global constant of this object
     * @param {string} constant The name of the constant to look for
     * @returns {mixed} The value of the constant
     */
    $.ajaxStreamGlobal.const = function(constant) {
        root.const[constant];
        if (constant in root.const) {
            return root.const[constant];
        } else {
            throw new exception([tx('Unknown'), tx('Constant')].join(''),
                    ["The constant '", constant, "' is not a constant of this object"].join(''));
        }
    };



    function ajaxStream(thisarg, opts) {

        var self = this;
        var fapi;
        var filedata = {};
        var curinput;
        this.id = thisarg.prop('id');
        this.changingindex = false;
        this.toload = 0;
        this.loaded = 0;
        this.cse;
        this.currentupload;
        this.addingmore = false;
        this.currentlength = 0;
        this.opts = opts;
        this.legacysettings;
        this.uploads = [];

        /**
         * @brief Translate a string using the supplied translation function
         * @syntax tx(s [, arg1, arg2, ...])
         * @param {string} s The input string, untranslated
         * @returns {string} The translated string
         */
        function tx(s) {
            return self.opts.translateFunction.apply(null, arguments);
        }

        /**
         * Draw the AjaxStream input area for this instance
         * @syntax draw();
         */
        function draw() {
            // Remove the current input
            // If opts.showPreviewOnForm
            //  Get current images
            //  Build preview section
            // Else 
            //  Draw an upload button
            // 
            // Draw upload section
            var parent = thisarg.parent();
            inputs[self.id] = thisarg.detach();
            if ($('#AJS_' + self.id).exists()) {
                loadExisting();
            } else {
                parent.append(cHE.getInput('AJS_' + self.id, null, null, 'hidden'));
            }
            if (self.opts.showPreviewOnForm) {
                
            } else {
                parent.append(cHE.getSpan(tx('Upload'), 'AJSUploadBtn_' + self.id, 'AJSBtn', {'data-mandatory': true}));
            }
            if (!$('#AJS').exists()) {
                // Only create an ajaxStreamMain if one does not already exist in the DOM
                $('body').append(cHE.getDiv(drawMainDialogue(), 'AJS'));
            }
            if (!fapi) {
                self.drawLegacy();
            }
        }

        /**
         * Draw the legacy elements
         */
        this.drawLegacy = function () {
            self.legacysettings = JSON.stringify({
                maxsize: self.opts.maxFileSize,
                maxheight: self.opts.maxHeight,
                maxwidth: self.opts.maxWidth,
                uploaddir: self.opts.uploadTo,
                islegacy: true,
                id: self.id
            });
            if (!$('#AJSLegacy').exists()) {
                var formsettings = {
                    method: 'post', 
                    action: self.opts.uploadScript, 
                    enctype: 'multipart/form-data',
                    target: 'AJSIFrame'
                };
                $('body').append(
                    cHE.getHtml('form', cHE.getInput('AJSLegacy'), 'AJSLegacyForm', 'AJSHidden', formsettings) + 
                    cHE.getHtml('iframe', null, 'AJSIFrame', 'AJSHidden', {name: 'AJSIFrame'})
                );
            };
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
            var outtext = cHE.getDiv(top, 'AJSMain');
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
            var outtext = drawActionBar() + cHE.getHtml('img', null, 'AJSUploadPreview') + cHE.getDiv(
                cHE.getSpan(null, 'AJSL', 'AJSLR asicons-arrow-left') + 
                cHE.getSpan(null, 'AJSR', 'AJSLR asicons-arrow-right'), 'AJSLRContainer'
            );
            return cHE.getDiv(outtext, 'AJSImagePreview', 'AJSHidden');
        }
        
        /**
         * 
         * @returns {html}
         */
        function drawActionBar() {
            return cHE.getDiv(
                cHE.getDiv(null, 'AJSActionsOverlay') +    
                cHE.getDiv(
                    cHE.getSpan(null, 'AJSAdd', 'asicons-plus', {title: tx('Add another file')}) +
                    cHE.getSpan(null, 'AJSChange', 'asicons-upload', {title: tx('Change file')}) +
                    cHE.getSpan(null, 'AJSEdit', 'asicons-pencil', {title: tx('Edit')}) +
                    cHE.getSpan(null, 'AJSCrop', 'asicons-resize-shrink', {title: tx('Resize image')}) +
                    cHE.getSpan(null, 'AJSRemove', 'asicons-trash', {title: tx('Remove file')}) +
                    cHE.getSpan(null, 'AJSClose', 'asicons-cross', {title: tx('Close window')})), 
            'AJSPreviewActions');
        }
        
        /**
         * Draw the viewport section for the upload
         * @syntax drawViewPort();
         * @returns {html}
         */
        function drawViewPort() {
            var outtext = '';
            if (self.opts.useViewport) {
                // Do stuff
            }
            return outtext;
        }
        
        /**
         * Draw the actual upload section, i.e. the upload button and the 'drop zone'
         * @syntax drawUploader();
         * @returns {string|html}
         */
        function drawUploader() {
            var inputattribs = {
                accept: self.opts.allowedTypes.join(',')
            };
            if (self.opts.maxFiles > 1) {
                inputattribs.multiple = null;
            }
            var choosefile = 
                    cHE.getSpan(tx('Choose file'), 'AJSChooseText', 'AJSBtn') + 
                    cHE.getHtml('img', null, 'AJSLoading', 'AJSHidden', {src: 'files/loader.gif', title: tx('Files are loading')});
            var outtext = cHE.getDiv(
                    cHE.getInput('AJSFile', null, 'AJSHidden', 'file', inputattribs) +
                    cHE.getDiv(choosefile, 'AJSChooseFile'), 'AJSChooseSection');
            outtext += cHE.getDiv(tx('DROP'), 'AJSDropZone', 'AJSHidden');
            return cHE.getDiv(outtext, 'AJSUploadSection');
        }
        
        /**
         * Load the existing uploads for this instance
         * @syntax loadExisting();
         */
        function loadExisting() {
            var val = json_decode($('#AJS_' + self.id).val());
            for (var i = 0, len = val.length; i < len; i++) {
                var curobj = val[i];
                self.uploads[curobj.sequence] = curobj;
            }
        }

        /**
         * Load a named package if it isn't already loaded
         * @syntax loadPackage(packagename);
         * @param {string} package The name of a package that may not yet have been loaded
         */
        function loadPackage(package) {
            if (!package_loaded(package)) {
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = getPackagePath(package);
                $('head').append(script);
            }
        }

        /**
         * Analyse the options for this element and perform certain tasks relating to the options
         * @syntax analyseOptions({option: vale [, ...]});
         * @param {object} opts The options for this ajaxStream
         */
        function analyseOptions(opts) {
            // Load the files required for certain packages
            if (opts.useViewport) {
                loadPackage('viewport');
            }
            if (opts.allowFilters) {
                loadPackage('filters');
            }
        }
        
        /**
         * A short hand alias to document.getElementById
         * @param {string} id The html id of the element to look for
         * @returns {object(DOMElement)}
         */
        function elem (id) {
            return document.getElementById(id);
        }
        
        /**
         * Bind all events in one function
         */
        this.initBinding = function () {
            elem('AJSChooseText').onclick = function () {
                $('#AJSFile').click();
                self.addingmore = true;
            };
                    
            elem('AJSAdd').onclick = function () {
                if ((self.uploads.length + 1) > self.opts.maxFiles) {
                    
                } else {
                    $('#AJSFile').click();
                    self.addingmore = true;
                }
            };
            
            elem('AJSChange').onclick = function () {
                $('#AJSFile').click();
                self.changingindex = self.currentupload;
                self.addingmore = false;
            };
            
            elem('AJSFile').onchange = function (e) {
                var filelist = e.target.files;
                if (filelist.length === 0) {
                    // No file has been selected
                    self.changingindex = false;
                    return false;
                }
                self.loaded = 0;
                self.toload = fapi ? filelist.length : 1;

                if (fapi) {
                    // Event handler
                    self.cse = self.callSelfEvent('onfileselected', undefined, {
                        files: filelist,
                        length: filelist.length,
                        jqueryEvent: e,
                        originalEvent: e.originalEvent
                    });
                    if (self.cse === false) {
                        return;
                    }

                    $('#AJSChooseText').addClass('AJSHidden');
                    $('#AJSLoading').removeClass('AJSHidden');

                    if (self.changingindex === false) {
                        // We are uploading a new file
                        var len = filelist.length;
                        var tlen = len + self.uploads.length;
                        if (tlen > self.opts.maxFiles) {
                            console.warn(tx('You have selected {0} files but are only permitted to upload {1}', tlen, self.opts.maxFiles));
                            len = self.toload = self.opts.maxFiles - self.uploads.length;
                        }
                        for (var i = 0; i < len; i++) {
                            setDataFromFile(filelist[i], i);
                        }
                    } else {
                        // The user has changed one file
                        self.callSelfEvent('onfilechanging', e.target, {
                            old: self.uploads[self.changingindex], 
                            target: e.target, 
                            pseudoTarget: inputs[self.id]
                        });
                        setDataFromFile(filelist[0], self.changingindex, e.target, true);
                    }
                } else {
                    self.legacyUpload(this, self.changingindex);
                }
            };
            
            if (browserCanDo('drag')) {
                // Add drag and drop functionality
//                var body = document.body;
//                body.ondragover = function(e) {
//                    e.stopPropagation();
//                    e.preventDefault();
//                    e.dataTransfer.dropEffect = 'copy';
//                    $('#ajaxStreamChooseSection').hide();
//                    $('#ajaxStreamDropZone').show();
//                };
//                body.ondragleave = function () {
//                    $('#ajaxStreamChooseSection').show();
//                    $('#ajaxStreamDropZone').hide();
//                };
//                body.ondrop = function(e) {
//                    e.stopPropagation();
//                    e.preventDefault();
//                    console.dir(e.dataTransfer);
//                    $('#ajaxStreamChooseSection').show();
//                    $('#ajaxStreamDropZone').hide();
//                };
            }
            
            elem('AJSL').onclick = function (){
                changeFilePreview(true);
            };
            
            elem('AJSR').onclick = function (){
                changeFilePreview();
            };
            
            $('.AJSLR').dblclick(function (e) {
                // If we're clicking left or right quickly, it may be interpreted as a double click. Don't do this
                e.preventDefault();
                return false;
            });
            
            elem('AJSRemove').onclick = function () {
                if (confirm(tx('Are you sure you want to delete this file?'))) {
                    var temp = [];
                    var lrc = $('#AJSLRContainer');
                    for (var i = 0, len = self.uploads.length; i < len; i++) {
                        if (self.uploads[i] && i !== self.currentupload) {
                            temp.push(self.uploads[i]);
                        }
                    }
                    self.uploads = temp;
                    self.currentlength = self.uploads.length;
                    $('#AJS_' + self.id).val(json_encode(self.uploads));
                    $('#AJSUploadSection').addClass('AJSHidden');
                    $('#AJSImagePreview').removeClass('AJSHidden');
                    if (self.uploads.length > 1) {
                        lrc.removeClass('AJSHidden');
                    } else {
                        lrc.addClass('AJSHidden');
                    }
                    displayUpload();
                }
            };
            
            elem('AJSClose').onclick = function () {
                $('#AJS').hide();
            };
            
            $('[id^=AJSUploadBtn_]').unbind('click').click(function () {
                var asid = $(this).prop('id').replace('AJSUploadBtn_', '');
                self = streams[asid];
                var val = $('#AJS_' + self.id).val();
                self.uploads = val.length ? json_decode(val, true) : [];
                self.uploads.length ? displayUpload() : resetToUpload();
                $('#AJS').show();
                if (!self.uploads.length) {
                    $('#AJSFile').click();
                    self.addingmore = true;
                }
            });
        };
        
        /**
         * Perform the legacy upload
         * @param {object(DOMElement)} input The input that has the file being uploaded
         */
        this.legacyUpload = function(input) {
            var i = $(input);
            var parent = i.parent();
            var clone = i.clone();
            var file = input.files[0];
            var index = self.changingindex === false ? self.uploads.length : self.changingindex;
            curinput = input;
            filedata = {
                name: file.name,
                mimetype: file.type,
                size: file.size,
                newupload: true,
                customFields: {},
                index: index,
                islegacy: true
            };
            i.prop({id: 'AJSFileLegacy', name: 'AJSFileLegacy'});
            $('#AJSLegacyForm').append(i);
            parent.append(clone);
            window['ajaxStreamLegacy'] = streams[self.id];
            $('#AJSLegacy').val(self.legacysettings);
            $('#AJSLegacyForm').prop({action: self.opts.uploadScript});
            $('#AJSLegacyForm').submit();
        };

        /**
         * What to after a file has been uploaded
         * @param {object(plain)} results The results from our upload
         */
        this.afterLegacyUpload = function(results) {
            if (results.moved) {
                var self = streams[results.id];
                filedata.src = results.location;
                self.initBinding();
                self.afterFileRead(filedata, self.changingindex !== false, curinput);
            } else {
                alert(results.error);
            }
        };

        /**
         * Read the uploaded file and created and create object describing it
         * @param {object(File)} file The File object taken from a FileList object
         * @param {int} i The index of this file in the upload list
         * @param {object(DOMElement)} target The input:file
         * @param {boolean} changing True if we are changing a file and not uploading a new one
         * @returns {object(plain)} The relevant fields needed for the upload
         */
        function setDataFromFile(file, i, target, changing) {
            self.callSelfEvent('onfilesloading', target, {
                total: self.toload, 
                loaded: self.loaded, 
                target: target, 
                pseudoTarget: inputs[self.id]
            });
            var fr = new FileReader();
            fr.readAsArrayBuffer(file);
            fr.onload = function(e) {
                var blob = new Blob([e.target.result], {type: file.type});
                var URL = window.URL || window.webkitURL;
                var dataURL = URL.createObjectURL(blob);
                var index = changing ? i : self.currentlength;
                filedata =  {
                    name: file.name,
                    src: dataURL,
                    mimetype: file.type,
                    size: file.size,
                    newupload: true,
                    customFields: {},
                    index: index,
                    islegacy: false
                };
                if (!changing) {
                    self.currentlength++;
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
                        self.afterFileRead(filedata, changing, target);
                    };
                    img.src = dataURL;
                } else {
                    // Load normally
                    self.afterFileRead(filedata, changing, target);
                }
            };
        }
        
        /**
         * What to do after a file has been read successfully
         * @param {object(plain)} filedata The object describing the file we just uploaded
         * @param {boolean} changing True if we are not uploading a new image, but rather changing an existing one
         * @param {object(DOMElement)} target The 
         * @returns {undefined}
         */
        this.afterFileRead = function (filedata, changing, target) {
                console.log(self);
            if (changing) {
                // We're changing a file already in the upload list
                self.callSelfEvent('onfilechanged', target, {
                    new : filedata, 
                    old: self.uploads[filedata.index], 
                    target: target, 
                    pseudoTarget: inputs[self.id]
                });
                self.uploads[filedata.index] = filedata;
            } else {
                if (empty(self.uploads[filedata.index])) {
                    // The index is empty, so put the file at this index
                    self.uploads[filedata.index] = filedata;
                } else {
                    self.uploads.push(filedata);
                }
            }
            self.callSelfEvent('onfilesloaded', target, {
                total: self.toload, 
                loaded: self.loaded + 1, 
                target: target, 
                pseudoTarget: inputs[self.id]
            });
            attemptProgression(target);
        };
        
        /**
         * Keep attempting to progress until all files have loaded, at which point it is okay to progress
         * @param {object(DOMElement)} target The original target, i.e. the file input
         */
        function attemptProgression(target) {
            self.loaded++;
            if (self.loaded === self.toload) {
                var ajslrc = $('#AJSLRContainer');
                self.callSelfEvent('onfilesloaded', target, {total: self.toload, loaded: self.loaded + 1, pseudoTarget: inputs[self.id]});
                $('#AJS_' + self.id).val(json_encode(self.uploads));
                $('#AJSUploadSection').addClass('AJSHidden');
                $('#AJSImagePreview').removeClass('AJSHidden');
                if (self.uploads.length > 1) {
                    ajslrc.removeClass('AJSHidden');
                } else {
                    ajslrc.addClass('AJSHidden');
                }
                var gotoend = self.changingindex === false;
                self.changingindex = false;
                displayUpload(null, gotoend);
            }
        }
        
        /**
         * Display a preview of an upload file
         * @param {object(plain)} cur The object that describes the file for which we are seeking a preview
         * @param {boolean} gotoend
         */
        function displayUpload(cur, gotoend) {
            if (self.uploads.length) {
                if (!cur) {
                    cur = getCurrentUpload(gotoend);
                }
                var src = cur.src;
                var ajsc = $('#AJSCrop');
                if (cur.mimetype.match('image/*')) {
                    ajsc.removeClass('AJSHidden');
                } else {
                    src = getIconImagePath(cur.mimetype);
                    ajsc.addClass('AJSHidden');
                }
                var img = elem('AJSUploadPreview');
                img.src = src;
                $('#AJSUploadPreview').removeClass('AJSTransparent');//.addClass('AJSOpaque');
            } else {
                resetToUpload();
            }
        }
        
        /**
         * Reset the main dialogue so that it shows the input form
         */
        function resetToUpload() {
            var lr = $('#AJSLRContainer');
            $('#AJSUploadSection').removeClass('AJSHidden');
            $('#AJSImagePreview').addClass('AJSHidden');
            $('#AJSChooseText').removeClass('AJSHidden');
            $('#AJSLoading').addClass('AJSHidden');
            self.uploads.length ? lr.removeClass('AJSHidden') : lr.addClass('AJSHidden');
        }
        
        /**
         * Show the a preview of the next uploaded file, either to the left or to the right
         * @param {boolean} goingleft True if the left arrow was clicked
         */
        function changeFilePreview(goingleft) {
            var addition = goingleft ? -1 : 1;
            var cur;
            if (self.currentupload + addition < 0) {
                cur = end(self.uploads);
                self.currentupload = self.uploads.length - 1;
            } else if (self.currentupload + addition > (self.uploads.length - 1)) {
                cur = reset(self.uploads);
                self.currentupload = 0;
            } else {
                cur = self.uploads[self.currentupload + addition];
                self.currentupload +=  addition;
            }
            displayUpload(cur);
        }
        
        /**
         * Get the path to the icon image for files that aren't images
         * @param {string} mimetype The mime type of the file
         * @returns {string(path)} The path to the icon file
         */
        function getIconImagePath(mimetype) {
            // NYI
            switch (mimetype) {
                
            }
            return '';
        }
        
        /**
         * Get the object that represent the uploaded file that is currently being worked with
         * @param {boolean} gotoend
         * @returns {object(plain)} The object representing the uploaded file being worked with
         */
        function getCurrentUpload(gotoend) {
            if (gotoend) {
                self.currentupload = self.uploads.length  - 1;
                return end(self.uploads);
            } else {
                if (self.addingmore) {
                    var res = end(self.uploads);
                    self.currentupload = res.index - 1;
                    return res;
                } else {
                    if (self.currentupload || self.currentupload === 0) {
                        return self.uploads[self.currentupload];
                    }
                    self.currentupload = 0;
                    return reset(self.uploads);
                }
            }
        }
        
        /**
         * Call events for this function
         * @param {string} eventname
         * @param {object} thisarg The object to set as 'this' in the called function
         * @returns {unresolved} The result from calling the user function
         */
        this.callSelfEvent = function (eventname, thisarg) {
            return self.opts[eventname].apply(thisarg, Array.prototype.slice.call(arguments, 2));
        };
        
        
        function ajaxStreamLegacy() {

            
        }
        

        /**
         * Construct this object
         */
        var __construct = (function() {
            fapi = browserCanDo('fileapi');
            if (!fapi) {
//                self.legacy = new ajaxStreamLegacy();
//                self.legacy.parent = self;
//                self.legacy.init();
            }
            self.callSelfEvent('oninit');
            draw();
            analyseOptions(self.opts);
            self.initBinding();
        })();
        __construct === __construct;    // Null assignment: Dump NetBeans warning
    }

    /**
     * Add ajaxStream to the list of jQuery functions
     * @syntax $(selector).ajaxStream({option: value [, ...]});
     * @param {object(plain)} opts (optional) Options for this instance of ajaxStream
     */
    $.fn.ajaxStream = function(opts) {
        var t = $(this);
        var myopts = $.extend(clone(defaults), opts);
        streams[t.prop('id')] = new ajaxStream(t, myopts);
    };

    /**
     * Perform a deep clone of an object
     * @syntax clone(object);
     * @param {object} original The object to clone from
     * @returns {object} The cloned object
     */
    function clone(original) {
        var n = {};
        for (var x in original) {
            if (original.hasOwnProperty(x)) {
                if (is_object(original[x])) {
                    n[x] = clone(original[x]);
                } else {
                    n[x] = original[x];
                }
            }
        }
        return n;
    }
    
    /**
     * Merge two objects
     * @param {object} to The object that we are merging in to
     * @param {object} from The object that we are merging from
     * @returns {object} The merged object
     */
    function merge (to, from) {
        for (var x in from) {
            try {
                if (!to[x]) {
                    to[x] = from[x];
                }
            } catch (ex) {
                console.warn(ex);
                continue;
            }
        }
        return to;
    }

    /**
     * Determine whether a passed argument is an object or not
     * @syntax is_object(test);
     * @param {mixed} v Any variable
     * @returns {Boolean} True if the passed argument is an object
     */
    function is_object(v) {
        return typeof v === 'object';
    }

    /**
     * @brief Get the path of a given package
     * @param {string} package The name of a package
     * @returns {string} The path to the package
     */
    function getPackagePath(package) {
        return root.const['PACKAGE_' + package.toUpperCase()];
    }

    /**
     * @brief Determine whether a package defined in the root constants has been loaded
     * @param {string} package The name of the package for which we will test
     * @returns {boolean} True if the package has already been loaded into the DOM
     */
    function package_loaded(package) {
        return $("script[src='" + getPackagePath(package) + "']").exists();
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
     * @brief Translate a string using the supplied translation function
     * @syntax tx(s [, arg1, arg2, ...])
     * @param {string} s The input string, untranslated
     * @returns {string} The translated string
     */
    function tx(s) {
        s === s; // Null assignemnt: Dump NetBeans warning
        return defaults.translateFunction.apply(null, arguments);
    }

    function log(msg, verbosity) {
        switch (verbosity) {
            default:
                console.log(msg);
        }
    }
    
    /**
     * @brief Determine whether a variable is empty, i.e. if it has a value, or if it is an empty array/object
     * @param {Mixed} v Any variable to check
     * @returns {Boolean} True if the variable is 'empty'
     * @notes Function emulates the same behaviour as PHP's empty function
     */
    function empty (v) {
        if (typeof v === undefined || !v || (is_array(v) && v.length === 0) || (is_object(v) && Object.size(v) === 0)) {
            return true;
        }
        return false;
    }
    
    /**
     * Determine whether an object is of a particular type
     * @param {type} obj The object to test
     * @param {type} type The type to check against. NB: Case sensitive
     * @returns {boolean} True if the tested variable is an object of the tested type
     */
    function is_a (obj, type) {
        return Object.prototype.toString.call(obj) === '[object ' + type + ']';
    };
    
    /**
     * Determine whether a variable is a boolean or not
     * @param {mixed} v Any variable
     * @returns {Boolean} True if the variable is a boolean
     */
    function is_boolean(v) {
        return typeof v === 'boolean';
    }

    /**
     * Determine whether a variable is a function
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable refers to a function
     */
    function is_function (variable) {
        return typeof variable === 'function';
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
        return res ? (toarray ? object_to_array(res) : res) : false;
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
            for (var i = 0, len = object.length; i < len; i++) {
                if (!empty(object[i])) {
                    obj[i] = object[i];
                }
            }
        }
        return JSON.stringify(obj);
    }
    
    /**
     * @brief Determine whether a variable is a regular expression
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable is a regular expression
     */
    var is_regex = is_regexp = function (variable) {
        return Object.prototype.toString.call(variable) === '[object RegExp]';
    };

    /**
     * @brief Determine whether a variable is an object
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable is an object
     */
    function is_object (variable) {
        return Object.prototype.toString.call(variable) === '[object Object]';
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
     * @brief Determine whether a variable is an array
     * @param {mixed} variable The variable to test
     * @returns {boolean} True if the variable is an array
     */
    function is_array(variable) {
        return Object.prototype.toString.call(variable) === '[object Array]';
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
     * @brief Return the last element in an array
     * @param {array} arr The array we will take from
     * @returns {unknown} The last element in your array
     */
    function end (arr) {
        return arr.slice(-1)[0];
    };
    
    /**
     * @brief Determine whether a value exists in an array
     * @param {array} arr The array to look in
     * @param {mixed} lookfor The array value to look for
     * @returns {boolean} True if the item being searched for is in the array
     */
    function in_array (arr, lookfor) {
        return arr.indexOf(lookfor) > -1;
    };
    
    function unset (arr, index) {
        arr.splice(index, 1);
    }

    if (!is_function(Object.size)) {
        /**
         * @brief Function returns the size of an object. Not used Object.prototype.length as per warning from the Stackoverflow community
         * @param {Object} obj The object that we will be annalysing
         * @returns {Number} The size of the Object
         */
        Object.size = function(obj) {
            var size = 0;
            for (var okey in obj) {
                if (obj.hasOwnProperty(okey))
                    size++;
            }
            return Number(size);
        };
    }

    /**
     * @brief Determine whether an element exists or not
     * @param {Object(DOMElement)} obj The element to test
     * @returns {Boolean} True if the element exists
     */
    function exists (obj) {
        return obj.length > 0;
    };

    if (!is_function(String.trim)) {
        /**
         * @brief Trim white space from the end of a string
         * @returns {String} The trimmed string
         */
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    /**
     * Emulate PHP's array_unshift function, i.e. push variables to the front of an array
     * @syntax array_unshift(array, arg1 [, arg2, ...])
     * @param {type} arr
     * @returns {unresolved}
     */
    function array_unshift(arr) {
        var temp = Array.prototype.slice.call(arguments, 1);
        return temp.concat(arr);
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
                return Boolean(window.FileReader);
            case 'file':
                return Boolean(window.File);
            case 'filelist':
                return Boolean(window.FileList);
            case 'blob':
                return Boolean(window.Blob);
            case 'fileapi':
                return false;
//                return !Boolean(window.Blob || window.File || window.FileList || window.FileReader);
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
                throw self.exception('AjaxStream Error', ['This function cannot be used to test the feature "', test, '"'].join(''));
        }
    };

    /**
     * @brief Add custom functions to jQuery
     */
    $.fn.extend({
        /**
         * @brief Determine whether a jQuery object of a given selector exists in the DOM
         * @returns {Boolean} True if the element exists in the DOM
         */
        exists: function() {
            return $(this).length > 0;
        }
    });

})(jQuery);

$.ajaxStreamGlobal({
    allowedTypes: ['*/*'],
    showPreviewOnForm: false
});

$(function() {
    $('#file').ajaxStream({maxFiles: 2});
    $('#second').ajaxStream({maxFiles: 2});
});