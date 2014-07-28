<?php

echo <<<'HTML'
<html>
    <head>
        <title>Ajax Stream v0.02</title>
        <script type='text/javascript' src='//code.jquery.com/jquery-latest.min.js'></script>
        <script type='text/javascript' src='//g.co/streamconfirm/streamconfirm.js'></script>
        <script type='text/javascript' src='ajaxstream.js'></script>
        <script type='text/javascript' src='//g.co/streamboundaries/streamboundaries.js'></script>
        <link rel='stylesheet' type='text/css' href='/ajaxstream.css'/>
        <style>
            body {margin: 0;font-family: sans-serif;}
            #holder {margin: auto;}
            #holder > h2 {font-size: 50;margin-bottom: 10px;text-align: center;}
            #file {margin: 25px 70px;}
        </style>
        <script type='text/javascript'>
            $.ajaxStream.setDefaults({useViewport:true,loadRequiredFiles:true,showPreviewOnForm: !0});
            $.ajaxStream.customFields = [
                {name: 'Caption', type:$.ajaxStream.const['CF_TEXT'], value: null},
                {name: 'Credit', type:$.ajaxStream.const['CF_TEXT'], value: null}
            ];
            $(function (){$('#file').ajaxStream({maxFiles:2});$('#second').ajaxStream({maxFiles:2,accept:['image/*']});});
        </script>
    </head>
    <body>
        <div id='holder'>
        <h2>Ajax Stream v0.02</h2>
        <input type="file" id="file">
        </div>
    </body>
</html>
HTML;
