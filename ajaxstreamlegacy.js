function ajaxStreamLegacy(cHE) {
    
    var self = this;
    
    this.upload = function (input) {
        var clone = $(input).clone();
        clone.prop({id: 'AJSFileLegacy', name: 'AJSFileLegacy'});
        $('#AJSLegacyForm').append(clone);
        $('#AJSLegacyForm').submit();
    };
    
    var __construct = (function () {
        if ($('#AJSLegacyForm').length === 0) {
            $('body').append(cHE.getHtml('form', cHE.getInput('AJSLegacy', true), 'AJSLegacyForm', 'AJSHidden', {
                method: 'post', 
                action: 'handleUpload.php', 
                enctype: 'multipart/form-data',
                target: 'AJSIFrame'
            }) + cHE.getHtml('iframe', null, 'AJSIFrame', 'AJSHidden', {name: 'AJSIFrame'}));
        }
    })();
    __construct === __construct;        // Null assignment: Dump NetBeans warning
}