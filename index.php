<?php

$action = filter_input(INPUT_GET, 'q');
$data = '[]';
switch ($action) {
    case 'upload':
        require_once 'upload.php';
        $uploads = cAjaxStream::getUploads();
        foreach ($uploads as $data) {
            foreach ($data as $upload) {
                cAjaxStream::saveBase64("uploads/{$upload->name}", $upload->base64);
                $upload->src = "uploads/{$upload->name}";
            }
        }
        $data = json_encode($uploads['AJS_file']);
    default:
        echo <<<HTML
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html>
    <head>
        <title>Ajax Stream v1</title>
        <script type='text/javascript' src='//code.jquery.com/jquery-latest.min.js'></script>
        <script type='text/javascript' src='ajaxstream.min.js'></script>
        <script type='text/javascript' src='streamconfirm.min.js'></script>
        <script type='text/javascript' src='streamboundaries.min.js'></script>
        <link rel='stylesheet' type='text/css' href='/ajaxstream.css'/>
        <link href='http://fonts.googleapis.com/css?family=Josefin+Sans:100,300,400|Open+Sans:400,300' rel='stylesheet' type='text/css'>
        <style>
            body {margin: 0;font-family: 'Open Sans', sans-serif;font-size: 12px;}
            #title {font-size: 18px;font-family: 'Josefin Sans', sans-serif;}
            #titlecontainer {padding: 20px;width: 100%; height: 100%;border-bottom: solid 4px #9797E4;}
            input[type=submit] {border: none;outline: none;}
        </style>
        <script type='text/javascript'>
            $.ajaxStream.setDefaults({showPreviewOnForm: !0});
            $(function () {
                $('#file').ajaxStream();
            });
        </script>
    </head>
    <body>
        <div id='holder'>
        <div id='titlecontainer'>
            <a id='title'><strong>Ajax</strong>Stream v1.1.1</a>
        </div>
        <form action='/?q=upload' method='post'>
            <input type="file" id="file">
            <input type="hidden" id="AJS_file" name="AJS_file" value=$data>
            <input type='submit' value='save' class='AJSBtn'/>
        </form>
        </div>
    </body>
</html>
HTML;
}
