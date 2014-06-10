<?php

cAjaxStream::processUpload();

class cAjaxStream {
    
    static function processUpload () {
        $islegacy = filter_input(INPUT_POST, 'AJSLegacy');
    } 
    
}