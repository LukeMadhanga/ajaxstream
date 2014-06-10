function ajaxStreamLegacy(cHE) {
    
    var self = this;                                    // An alias to this
    var curupload = null;                               // An object that describes the current upload
    var curinput = null;                                // The input that has the file being uploaded
    var changing = false;
    
    this.parent = null;
    
    /**
     * Perform the legacy upload
     * @param {object(DOMElement)} input The input that has the file being uploaded
     * @param {boolean|int} The index of the file that we are changing, or false if we are not changing a file
     */
    this.upload = function (input, changingindex) {
        var i = $(input);
        var parent = i.parent();
        var clone = i.clone();
        var file = input.files[0];
        var index = changingindex === false ? self.parent.uploads.length : changingindex;
        changing =  changingindex !== false;
        curinput = input;
        curupload = {
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
        window['ajaxStreamLegacy'] = self;
        $('#AJSLegacyForm').submit();
    };
    
    /**
     * What to after a file has been uploaded
     * @param {object(plain)} results The results from our upload
     */
    this.afterUpload = function (results) {
        if (results.moved) {
            curupload.src = results.location;
            self.parent.initBinding();
            self.parent.afterFileRead(curupload, changing, curinput);
        } else {
            alert(results.error);
        }
    };
    
    /**
     * Initialise this object
     */
    this.init = function () {
        if ($('#AJSLegacyForm').length === 0) {
            $('body').append(cHE.getHtml('form', cHE.getInput('AJSLegacy', JSON.stringify({
                maxsize: self.parent.opts.maxFileSize,
                maxheight: self.parent.opts.maxHeight,
                maxwidth: self.parent.opts.maxWidth,
                uploaddir: self.parent.opts.uploadTo,
                islegacy: true
            })), 'AJSLegacyForm', 'AJSHidden', {
                method: 'post', 
                action: self.parent.opts.uploadScript, 
                enctype: 'multipart/form-data',
                target: 'AJSIFrame'
            }) + cHE.getHtml('iframe', null, 'AJSIFrame', 'AJSHidden', {name: 'AJSIFrame'}));
        }
    };
}