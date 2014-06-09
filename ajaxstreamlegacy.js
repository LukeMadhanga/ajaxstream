function ajaxStreamLegacy(cHE) {
    
    var self = this;
    
    var __construct = (function () {
        $('body').append(cHE.getHtml('form', null, 'AJSLegacyForm', 'AJSHidden', {
            method: 'post', 
            action: '/7/fileupload', 
            enctype: 'multipart/form-data',
            target: 'AJSIFrame'
        }) + cHE.getHtml('iframe', null, 'AJSIFrame', 'AJSHidden', {name: 'AJSIFrame'}));
    })();
    __construct === __construct;        // Null assignment: Dump NetBeans warning
}