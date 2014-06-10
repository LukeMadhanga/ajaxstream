function ajaxStreamLegacy(cHE) {
    
    var self = this;
    
    this.upload = function (input) {
        var i = $(input);
        var parent = i.parent();
        var clone = i.clone();
        i.prop({id: 'AJSFileLegacy', name: 'AJSFileLegacy'});
        $('#AJSLegacyForm').append(i);
        parent.append(clone);
        $('#AJSLegacyForm').submit();
    };
    
    this.afterUpload = function (location) {
        console.log(location);
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