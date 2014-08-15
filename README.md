#AjaxStream
#####v1.1

**About**<br/>
A HTML5 upload system with a trimmed HTML4 fallback that allows you to upload multiple files at once. Files uploaded that aren’t images are shown as an icons, whereas uploaded images are shown as scaled preview with a crop feature that allows a user to crop images non-destructively. <b>Ajax</b>Stream aims to remove the need for an image editing programme just to perform simple uploads - like to simply upload a screenshot taken from a windows machine. 

**HTML**<br/>
Before AjaxStream does anything, your HTML could look like this
```HTML
<form id=’myform’ method=’post’ action=’myprocessingfile.php’>
    <input type=’file’ id=’myfile’ name=’myfile’/>
    <input type=’submit’ value=’Submit’/>
</form>
```

If you want AjaxStream to populate a form for you, you should have a hidden element that has the same id and name as your file input, but prefixed with ‘AJS_’. 
```HTML
<form id=’myform’ method=’post’ action=’myprocessingfile.php’>
    <input type=’file’ id=’myfile’ name=’myfile’/>
    <input type=’hidden’ id=’AJS_myfile’ name=’AJS_myfile’ value=’[]’/>
    <input type=’submit’ value=’Submit’/>
</form>
```

**JavaScript**<br/>
To initialise AjaxStream with all of the defaults
```javascript
$(‘#myfile’).ajaxStream();
```
If you have more than one AjaxStream on any one page you can use the function $.ajaxStream.setDefaults(); to set defaults for all of the AjaxStreams on the page. You can override the defaults for a single AjaxStream by simply supplying options in the plugin declaration.
```javascript
$.ajaxStream.setDefaults({
    opt: value
});
$(‘#myfile’).ajaxStream({opt2: value2});
```

*<b>NB</b> Defaults MUST be set before the first plugin declaration*


**All available options**


<table dir="ltr"><tbody>
<tr>
<td>Property&nbsp;</td> <td>Type&nbsp;</td> <td>Default&nbsp;</td> <td> Legacy&nbsp; support&nbsp; </td> <td>&nbsp;</td> </tr>
<tr>
<td>accept&nbsp;</td> <td>array&nbsp;</td> <td>[‘*’]&nbsp;</td> <td>  ×&nbsp; </td> <td>  The&nbsp;MIME&nbsp;types&nbsp;of&nbsp;the&nbsp;files&nbsp;that&nbsp;we&nbsp;will&nbsp; allow&nbsp;to&nbsp;be&nbsp;upload,&nbsp;e.g.&nbsp;‘image/*’&nbsp;  &nbsp;  NB&nbsp;Currently,&nbsp;browsers&nbsp;only&nbsp;support&nbsp;one&nbsp; MIME&nbsp;type&nbsp;at&nbsp;a&nbsp;time&nbsp;  </td> </tr>
<tr>
<td>allowFilters&nbsp;</td> <td>boolean&nbsp;</td> <td>true&nbsp;</td> <td>  ×&nbsp; </td> <td> Not&nbsp;yet&nbsp;implemented.&nbsp; &nbsp; Allow&nbsp;users&nbsp;to&nbsp;use&nbsp;the&nbsp;filters&nbsp;library&nbsp; </td> </tr>
<tr>
<td>  defaultCropHeightPer&nbsp; </td> <td>float&nbsp;&nbsp;</td> <td>.8&nbsp;</td> <td>  ×&nbsp; </td> <td> If&nbsp;the&nbsp;user&nbsp;is&nbsp;cropping&nbsp;an&nbsp;image,&nbsp;what&nbsp; percentage&nbsp;of&nbsp;the&nbsp;full&nbsp;height&nbsp;should&nbsp;the&nbsp; crop&nbsp;square&nbsp;be?&nbsp;‘1’&nbsp;means&nbsp;100%,&nbsp;‘.8’&nbsp; means&nbsp;80%&nbsp; </td> </tr>
<tr>
<td>  defaultCropHeightPer&nbsp; </td> <td>float&nbsp;</td> <td>.8&nbsp;</td> <td>  ×&nbsp; </td> <td> If&nbsp;the&nbsp;user&nbsp;is&nbsp;cropping&nbsp;an&nbsp;image,&nbsp;what&nbsp; percentage&nbsp;of&nbsp;the&nbsp;full&nbsp;width&nbsp;should&nbsp;the&nbsp; crop&nbsp;square&nbsp;be?&nbsp;‘1’&nbsp;means&nbsp;100%,&nbsp;‘.8’&nbsp; means&nbsp;80%&nbsp; </td> </tr>
<tr>
<td>maxFileSize&nbsp;</td> <td>int&nbsp;(bytes)&nbsp;</td> <td>2097152&nbsp;</td> <td>  ✓&nbsp; </td> <td> The&nbsp;maximum&nbsp;file&nbsp;size&nbsp;of&nbsp;any&nbsp;one&nbsp;file.&nbsp; This&nbsp;value&nbsp;is&nbsp;listened&nbsp;to&nbsp;if&nbsp;the&nbsp;upload&nbsp;is&nbsp; being&nbsp;performed&nbsp;using&nbsp;the&nbsp;legacy&nbsp;script&nbsp; </td> </tr>
<tr>
<td>maxFiles&nbsp;</td> <td>int&nbsp;</td> <td>1&nbsp;</td> <td>  ✓&nbsp; </td> <td> Maximum&nbsp;number&nbsp;of&nbsp;files&nbsp;allowed&nbsp;to&nbsp;be&nbsp; uploaded&nbsp;with&nbsp;the&nbsp;current&nbsp;input&nbsp; </td> </tr>
<tr>
<td>  iconPreviewHeight&nbsp; </td> <td>int&nbsp;(px)&nbsp;</td> <td>200&nbsp;</td> <td>  ✓&nbsp; </td> <td>   If&nbsp;the&nbsp;setting&nbsp;showPreviewOnForm&nbsp;is&nbsp;  set&nbsp;to&nbsp;true,&nbsp;a&nbsp;preview&nbsp;on&nbsp;the&nbsp;main&nbsp; upload&nbsp;form&nbsp;will&nbsp;be&nbsp;shown.&nbsp;What&nbsp;height&nbsp; should&nbsp;this&nbsp;preview&nbsp;be?&nbsp; </td> </tr>
<tr>
<td>  iconPreviewWidth&nbsp; </td> <td>int&nbsp;(px)&nbsp;</td> <td>200&nbsp;</td> <td>  ✓&nbsp; </td> <td>   If&nbsp;the&nbsp;setting&nbsp;showPreviewOnForm&nbsp;is&nbsp;  set&nbsp;to&nbsp;true,&nbsp;a&nbsp;preview&nbsp;on&nbsp;the&nbsp;main&nbsp; upload&nbsp;form&nbsp;will&nbsp;be&nbsp;shown.&nbsp;What&nbsp;width&nbsp; should&nbsp;this&nbsp;preview&nbsp;be?&nbsp; </td> </tr>
</tbody></table>



<table dir="ltr" class="level-zero"><tbody class="level-one">
<tr>
<td>Method&nbsp;</td> <td>&nbsp;</td> </tr>
<tr>
<td>  onbeforeopen&nbsp; </td> <td>  The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;the&nbsp;user&nbsp;clicks&nbsp;on&nbsp;upload&nbsp;button&nbsp;that&nbsp;is&nbsp;in&nbsp;place&nbsp;of&nbsp;the&nbsp;original&nbsp; input:file.&nbsp;One&nbsp;could&nbsp;possibly&nbsp;use&nbsp;this&nbsp;to&nbsp;fake&nbsp;the&nbsp;upload&nbsp;data,&nbsp;thus&nbsp;using&nbsp;one&nbsp;AjaxStream&nbsp; whilst&nbsp;looking&nbsp;like&nbsp;a&nbsp;new&nbsp;file&nbsp;input&nbsp;  &nbsp; This&nbsp;Argument&nbsp; object(jQuery)&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp;   elemid&nbsp;The&nbsp;id&nbsp;of&nbsp;the&nbsp;original&nbsp;element&nbsp;  index&nbsp;The&nbsp;index&nbsp;of&nbsp;this&nbsp;element&nbsp;in&nbsp;the&nbsp;selector&nbsp;used&nbsp;to&nbsp;declare&nbsp;AjaxStream&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>onclose&nbsp;</td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;the&nbsp;user&nbsp;closes&nbsp;the&nbsp;AjaxStream&nbsp;window&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(jQuery)&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; length&nbsp;The&nbsp;number&nbsp;of&nbsp;files&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td></td> <td> original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onfilechanged&nbsp; </td> <td>  The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;an&nbsp;uploaded&nbsp;file&nbsp;has&nbsp;been&nbsp;changed.&nbsp;This&nbsp;function&nbsp;can&nbsp;never&nbsp;be&nbsp; called&nbsp;if&nbsp;the&nbsp;upload&nbsp;was&nbsp;legacy.&nbsp;  &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;original&nbsp;file&nbsp;element&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; newfile&nbsp;The&nbsp;object&nbsp;that&nbsp;describes&nbsp;the&nbsp;new&nbsp;upload&nbsp; oldfile&nbsp;The&nbsp;object&nbsp;that&nbsp;describes&nbsp;the&nbsp;previous&nbsp;upload&nbsp;before&nbsp;it&nbsp;got&nbsp;changed&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onfilechanging&nbsp; </td> <td>  The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;an&nbsp;uploaded&nbsp;file&nbsp;is&nbsp;in&nbsp;the&nbsp;process&nbsp;of&nbsp;being&nbsp;changed.&nbsp;This&nbsp;function&nbsp; can&nbsp;never&nbsp;be&nbsp;called&nbsp;if&nbsp;the&nbsp;upload&nbsp;was&nbsp;legacy.&nbsp;  &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;input:file&nbsp;that&nbsp;was&nbsp;‘clicked’&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; current&nbsp;The&nbsp;object&nbsp;that&nbsp;describes&nbsp;the&nbsp;current&nbsp;upload&nbsp;as&nbsp;it&nbsp;is&nbsp;before&nbsp;we&nbsp;change&nbsp;it&nbsp; file&nbsp;The&nbsp;browser&nbsp;generated&nbsp;File&nbsp;object&nbsp;that&nbsp;describes&nbsp;the&nbsp;uploaded&nbsp;file&nbsp;   jQueryEvent&nbsp;The&nbsp;jQuery&nbsp;event&nbsp;object&nbsp;  originalEvent&nbsp;The&nbsp;original&nbsp;event&nbsp;object&nbsp;&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>onfileselected&nbsp;</td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;after&nbsp;a&nbsp;file(s)&nbsp;has&nbsp;been&nbsp;selected&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;input:file&nbsp;that&nbsp;was&nbsp;‘clicked’&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; files&nbsp;The&nbsp;browser&nbsp;generated&nbsp;FileList&nbsp;object&nbsp;that&nbsp;describes&nbsp;the&nbsp;uploaded&nbsp;files&nbsp;   jQueryEvent&nbsp;The&nbsp;jQuery&nbsp;event&nbsp;object&nbsp;  originalEvent&nbsp;The&nbsp;original&nbsp;event&nbsp;object&nbsp;&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp;   toload&nbsp;The&nbsp;amount&nbsp;of&nbsp;files&nbsp;that&nbsp;we&nbsp;are&nbsp;preparing&nbsp;to&nbsp;load&nbsp;  uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onfilesloaded&nbsp; </td> <td>The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;the&nbsp;user&nbsp;closes&nbsp;the&nbsp;AjaxStream&nbsp;window&nbsp;</td> </tr>
<tr>
<td></td> <td> &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;input:file&nbsp;that&nbsp;was&nbsp;‘clicked’&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; loaded&nbsp;The&nbsp;amount&nbsp;of&nbsp;files&nbsp;that&nbsp;were&nbsp;loaded&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onfilesloading&nbsp; </td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;the&nbsp;user&nbsp;closes&nbsp;the&nbsp;AjaxStream&nbsp;window&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;input:file&nbsp;that&nbsp;was&nbsp;‘clicked’&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; loaded&nbsp;The&nbsp;amount&nbsp;of&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;loaded&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp;   toload&nbsp;The&nbsp;amount&nbsp;of&nbsp;files&nbsp;to&nbsp;be&nbsp;loaded&nbsp;  uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>oninit&nbsp;</td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;AjaxStream&nbsp;is&nbsp;applied&nbsp;to&nbsp;a&nbsp;file&nbsp;input&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(jQuery)&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onlegacyuploadfail&nbsp; </td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;an&nbsp;upload&nbsp;has&nbsp;failed&nbsp;during&nbsp;a&nbsp;legacy&nbsp;upload&nbsp; &nbsp; This&nbsp;Argument&nbsp; null&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; error&nbsp;The&nbsp;error&nbsp;message&nbsp;detailing&nbsp;why&nbsp;the&nbsp;upload&nbsp;failed&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; results&nbsp;The&nbsp;object&nbsp;that&nbsp;was&nbsp;generated&nbsp;server&nbsp;side&nbsp;describing&nbsp;the&nbsp;upload&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onlegacyuploadfinish&nbsp; </td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;an&nbsp;upload&nbsp;has&nbsp;completed&nbsp;using&nbsp;the&nbsp;legacy&nbsp;script&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(jQuery)&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; results&nbsp;The&nbsp;object&nbsp;that&nbsp;was&nbsp;generated&nbsp;server&nbsp;side&nbsp;describing&nbsp;the&nbsp;upload&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onlegacyuploadstart&nbsp; </td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;when&nbsp;a&nbsp;legacy&nbsp;upload&nbsp;is&nbsp;beginning&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(DOMElement)&nbsp;The&nbsp;input:file&nbsp;that&nbsp;was&nbsp;‘clicked’&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; stream&nbsp;The&nbsp;jQuery&nbsp;object&nbsp;for&nbsp;this&nbsp;file&nbsp;input&nbsp;that&nbsp;holds&nbsp;all&nbsp;of&nbsp;the&nbsp;AjaxStream&nbsp;data&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>onopen&nbsp;</td> <td> The&nbsp;function&nbsp;to&nbsp;run&nbsp;after&nbsp;the&nbsp;Ajaxstream&nbsp;window&nbsp;opens&nbsp; &nbsp; This&nbsp;Argument&nbsp; object(jQuery)&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;object(Plain)&nbsp;&nbsp; &nbsp; Param1&nbsp; length&nbsp;The&nbsp;number&nbsp;of&nbsp;files&nbsp;uploaded&nbsp; original&nbsp;The&nbsp;original&nbsp;file&nbsp;input&nbsp; uploads&nbsp;The&nbsp;array&nbsp;of&nbsp;objects&nbsp;that&nbsp;describe&nbsp;the&nbsp;files&nbsp;that&nbsp;have&nbsp;been&nbsp;uploaded&nbsp; </td> </tr>
<tr>
<td>  onsingleuploadfail&nbsp; </td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>  onsingleuploadfinish&nbsp; </td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>  onsingleuploadstart&nbsp; </td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>  onuploadfail&nbsp; </td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>  onuploadfinish&nbsp; </td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>onuploadprogress&nbsp;</td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>onuploadstart&nbsp;</td> <td>Feature&nbsp;to&nbsp;support&nbsp;this&nbsp;has&nbsp;not&nbsp;yet&nbsp;been&nbsp;implemented&nbsp;</td> </tr>
<tr>
<td>  translateFunction&nbsp; </td> <td>The&nbsp;function&nbsp;that&nbsp;will&nbsp;be&nbsp;used&nbsp;to&nbsp;translate&nbsp;text&nbsp;on&nbsp;the&nbsp;page&nbsp;</td> </tr>
<tr>
<td></td> <td> &nbsp; This&nbsp;Argument&nbsp; null&nbsp; &nbsp; Parameters&nbsp; param1&nbsp;string&nbsp;[,&nbsp;param2&nbsp;…&nbsp;[,&nbsp;…]]&nbsp; &nbsp; Param1&nbsp;  The&nbsp;string&nbsp;that&nbsp;will&nbsp;be&nbsp;translated.&nbsp;‘{n}’&nbsp;will&nbsp;be&nbsp;used&nbsp;in&nbsp;the&nbsp;string&nbsp;that&nbsp;is&nbsp;passed&nbsp;as&nbsp;placeholder&nbsp;for&nbsp; variables&nbsp;that&nbsp;will&nbsp;occupy&nbsp;that&nbsp;space.&nbsp;  &nbsp; &nbsp;E.g.&nbsp;‘You&nbsp;have&nbsp;uploaded&nbsp;{0}&nbsp;files&nbsp;but&nbsp;are&nbsp;only&nbsp;allowed&nbsp;to&nbsp;upload&nbsp;{1}’.&nbsp; &nbsp;  ‘{0}’&nbsp;will&nbsp;be&nbsp;replaced&nbsp;by&nbsp;the&nbsp;first&nbsp;argument&nbsp;after&nbsp;param1,&nbsp;and&nbsp;‘{1}’&nbsp;will&nbsp;be&nbsp;replaced&nbsp;by&nbsp;the&nbsp;second&nbsp; argument&nbsp;after&nbsp;param1&nbsp;to&nbsp;possibly&nbsp;give&nbsp;the&nbsp;result&nbsp;  &nbsp; ‘You&nbsp;have&nbsp;selected&nbsp;2&nbsp;files&nbsp;but&nbsp;are&nbsp;only&nbsp;allowed&nbsp;to&nbsp;upload&nbsp;1’&nbsp; &nbsp; Param2&nbsp; The&nbsp;string&nbsp;or&nbsp;number&nbsp;to&nbsp;replace&nbsp;{0}&nbsp;with&nbsp; &nbsp; ParamN&nbsp; The&nbsp;string&nbsp;or&nbsp;number&nbsp;to&nbsp;replace&nbsp;{n-1}&nbsp;with&nbsp; </td> </tr>
</tbody></table>

**PHP**<br/>
To populate the form server side using PHP
```php
$filename = ‘myfile.jpg’;
$pathtofile = ‘/path/to/myfile.jpg’;
$mimetype = ‘image/jpeg’;
$ajsoutput = array(array(
    ‘name’ => $filename,
    ‘newupload’ => false,
    ‘src’ => $pathtofil,
    ‘index’ => 0,
    ‘mimetype’ => $mimetype,
    ‘cropdata’ => array(),
) [, …]
);
$value = json_encode($ajsoutput);
echo <<<HTML
    <form id=’myform’ method=’post’ action=’myprocessingfile.php’>
        <input type=’file’ id=’myfile’ name=’myfile’/>
        <input type=’hidden’ id=’AJS_myfile’ name=’AJS_myfile’ value=$value/>
        <input type=’submit’ value=’Submit’/>
    </form>
HTML;
```

To actually capture the post
```php
require_once ‘path/to/upload.php’;
$uploads = cAjaxStream::getUploads();
// $uploads = cAjaxStream::getUploads(array(‘AJS_myfile’ [, …]));
foreach ($uploads as $postname => $data) {
    foreach ($data as $upload) {
        cAjaxStream::saveBase64("uploads/{$upload->name}", $upload->base64);
        $upload->src = "uploads/{$upload->name}";
    }
}
// $upload = $uploads[‘AJS_myfile’][0];
```

**FYI**<br/>
What will happen when AjaxStream has initialised?

If the attribute data-ajaxstreamid was 1, the id of the span would have looked like
```html
<span id="AJSUploadBtn_1_myfile" class="AJSBtn" data-mandatory="1" data-ajaxstreamid="1">Upload</span>
```

If the setting showPreviewOnForm was set to true, then that container would look more like
```html
<form id=’myform’ method=’post’ action=’myprocessingfile.php’>
    <input type=’file’ id=’myfile’ name=’myfile’ class=’AJSHidden’/>
    <input type=’hidden’ id=’AJS_myfile’ name=’AJS_myfile’ value=’[]’/>
    <div id="AJSFormPrev_0_myfile" class="AJSFormPrev" style="height:nnn">
        <span id="AJSUploadBtn_0_myfile" class="AJSBtn" data-mandatory="1" data-ajaxstreamid="0">Upload</span>
    </div>
</form>
```
