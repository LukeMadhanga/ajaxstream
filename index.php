<?php

echo <<<'HTML'
<html>
    <head>
        <title>Ajax Stream v0.02</title>
        <script type='text/javascript' src='//code.jquery.com/jquery-latest.min.js'></script>
        <script type='text/javascript' src='ajaxstream.js'></script>
        <link rel='stylesheet' type='text/css' href='/ajaxstream.css'/>
        <style>
            /*body {background: url(/files/bg.jpg)}*/
            #holder {margin: auto;width: 300px;}
            #holder > h2 {font-family: sans-serif;font-size: 50;margin-bottom: 10px;text-align: center;}
            #file {margin: 25px 70px;}
        </style>
        <script type='text/javascript'>
            $.ajaxStream.setDefaults({useViewport:true,loadRequiredFiles:true});
            $(function (){$('#file').ajaxStream();$('#second').ajaxStream({maxFiles:2,allowedTypes:['image/*']});});
        </script>
    </head>
    <body>
        <div id='holder'>
        <h2>Ajax Stream v0.02</h2>
        <input type="file" id="file">
        <input type="file" id="second">
        </div>
    </body>
</html>
HTML;
