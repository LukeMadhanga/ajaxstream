function ajaxStreamLegacy(cHE) {
    
    var self = this;                                    // An alias to this
    var curupload = null;                               // An object that describes the current upload
    var curinput = null;                                // The input that has the file being uploaded
    
    /**
     * Perform the legacy upload
     * @param {object(DOMElement)} input The input that has the file being uploaded
     */
    this.upload = function (input) {
        var i = $(input);
        var parent = i.parent();
        var clone = i.clone();
        var file = input.files[0];
        curinput = input;
        curupload = {
            name: file.name,
            mimetype: file.type,
            size: file.size,
            newupload: true,
            customFields: {},
            index: 0,
            islegacy: true
        };
        i.prop({id: 'AJSFileLegacy', name: 'AJSFileLegacy'});
        $('#AJSLegacyForm').append(i);
        parent.append(clone);
        $('#AJSLegacyForm').submit();
    };
    
    /**
     * What to after a file has been uploaded
     * @param {object(plain)} results The results from our upload
     */
    this.afterUpload = function (results) {
        if (results.moved) {
            curupload.src = results.location;
            self.initBinding();
            self.afterFileRead(curupload, false, curinput);
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
                maxsize: self.opts.maxFileSize,
                maxheight: self.opts.maxHeight,
                maxwidth: self.opts.maxWidth,
                uploaddir: self.opts.uploadTo,
                islegacy: true
            })), 'AJSLegacyForm', 'AJSHidden', {
                method: 'post', 
                action: self.opts.uploadScript, 
                enctype: 'multipart/form-data',
                target: 'AJSIFrame'
            }) + cHE.getHtml('iframe', null, 'AJSIFrame', 'AJSHidden', {name: 'AJSIFrame'}));
        }
    };
}