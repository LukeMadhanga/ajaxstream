function ajaxStreamLegacy(cHE) {
    
    var self = this;
    
    var curupload = null;
    var curinput = null;
    
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
            index: 0
        };
        i.prop({id: 'AJSFileLegacy', name: 'AJSFileLegacy'});
        $('#AJSLegacyForm').append(i);
        parent.append(clone);
        $('#AJSLegacyForm').submit();
    };
    
    this.afterUpload = function (results) {
        if (results.moved) {
            curupload.src = results.location;
            self.initBinding();
            self.afterFileRead();
        } else {
            alert(results.error);
        }
    };
    
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