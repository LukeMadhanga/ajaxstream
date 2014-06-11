(function($) {

    $.fn.ajaxStream = function(opts) {
        var self = this;
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
            onfilechanging: function() {},
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
//            previewOrientation: root.const['PREVIEW_ORI_GRID'],
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
        
        var s = $.extend(defaults, opts);
        
        
        
    };
    
    $.ajaxStream = {
        author: 'Luke Madhanga',
        version: 0.3
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

})(jQuery);