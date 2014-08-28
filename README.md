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
$("#myfile").ajaxStream();
```
If you have more than one AjaxStream on any one page you can use the function $.ajaxStream.setDefaults(); to set defaults for all of the AjaxStreams on the page. You can override the defaults for a single AjaxStream by simply supplying options in the plugin declaration.
```javascript
$.ajaxStream.setDefaults({
    opt: value
});
$("#myfile").ajaxStream({opt2: value2});
```

*<b>NB</b> Defaults MUST be set before the first plugin declaration*


**All available options**


<table dir="ltr"><tbody>
<tr>
<td><b>Property</b> </td> <td><b>Type</b> </td> <td><b>Default</b> </td> <td><b>Legacy  support</b></td> <td> </td> </tr>
<tr>
<td>accept </td> <td>array </td> <td>[‘*’] </td> <td>  ×  </td> <td>  The MIME types of the files that we will  allow to be upload, e.g. ‘image/*’      NB Currently, browsers only support one  MIME type at a time   </td> </tr>
<tr>
<td>allowFilters </td> <td>boolean </td> <td>true </td> <td>  ×  </td> <td> Not yet implemented.    Allow users to use the filters library  </td> </tr>
<tr>
<td>  defaultCropHeightPer  </td> <td>float  </td> <td>.8 </td> <td>  ×  </td> <td> If the user is cropping an image, what  percentage of the full height should the  crop square be? ‘1’ means 100%, ‘.8’  means 80%  </td> </tr>
<tr>
<td>  defaultCropHeightPer  </td> <td>float </td> <td>.8 </td> <td>  ×  </td> <td> If the user is cropping an image, what  percentage of the full width should the  crop square be? ‘1’ means 100%, ‘.8’  means 80%  </td> </tr>
<tr>
<td>maxFileSize </td> <td>int (bytes) </td> <td>2097152 </td> <td>  ✓  </td> <td> The maximum file size of any one file.  This value is listened to if the upload is  being performed using the legacy script  </td> </tr>
<tr>
<td>maxFiles </td> <td>int </td> <td>1 </td> <td>  ✓  </td> <td> Maximum number of files allowed to be  uploaded with the current input  </td> </tr>
<tr>
<td>  iconPreviewHeight  </td> <td>int (px) </td> <td>200 </td> <td>  ✓  </td> <td>   If the setting showPreviewOnForm is   set to true, a preview on the main  upload form will be shown. What height  should this preview be?  </td> </tr>
<tr>
<td>  iconPreviewWidth  </td> <td>int (px) </td> <td>200 </td> <td>  ✓  </td> <td>   If the setting showPreviewOnForm is   set to true, a preview on the main  upload form will be shown. What width  should this preview be?  </td> </tr>
<tr>
<td>readonly </td> <td>boolean </td> <td>false </td> <td>  ✓  </td> <td> True if you do not want the user user editing the uploaded file  </td> </tr>
<tr>
<td>scale9Grid </td> <td>boolean </td> <td>true </td> <td>  ×  </td> <td> True to display a scale-9-grid when cropping an image  </td> </tr>
</tbody></table>



<table dir="ltr" class="level-zero"><tbody class="level-one">
<tr>
<td><b>Method</b> </td> <td> </td> </tr>
<tr>
<td>onbeforeopen</td> <td>  The function to run when the user clicks on upload button that is in place of the original  input:file. One could possibly use this to fake the upload data, thus using one AjaxStream  whilst looking like a new file input     <br/><br/><b>This argument</b><br/>  object(jQuery)    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>    <br/><em>elemid</em> The id of the original element   <br/><em>index</em> The index of this element in the selector used to declare AjaxStream  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>onclose</td> <td> The function to run when the user closes the AjaxStream window    <br/><br/><b>This argument</b><br/>  object(jQuery)    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>length</em> The number of files uploaded  </td> </tr>
<tr>
<td></td> <td> <br/><em>original</em> The original file input  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>onfilechanged</td> <td>  The function to run when an uploaded file has been changed. This function can never be  called if the upload was legacy.     <br/><br/><b>This argument</b><br/>  object(DOMElement) The original file element    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>newfile</em> The object that describes the new upload  <br/><em>oldfile</em> The object that describes the previous upload before it got changed  <br/><em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  onfilechanging  </td> <td>  The function to run when an uploaded file is in the process of being changed. This function  can never be called if the upload was legacy.     <br/><br/><b>This argument</b><br/>  object(DOMElement) The input:file that was ‘clicked’    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>current</em> The object that describes the current upload as it is before we change it  <br/><em>file</em> The browser generated File object that describes the uploaded file    <br/><em>jQueryEvent</em> The jQuery event object   <br/><em>originalEvent</em> The original event object   <br/><em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>onfileselected</td> <td> The function to run after a file(s) has been selected    <br/><br/><b>This argument</b><br/>  object(DOMElement) The input:file that was ‘clicked’    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>files</em> The browser generated FileList object that describes the uploaded files    <br/><em>jQueryEvent</em> The jQuery event object   <br/><em>originalEvent</em> The original event object   <br/><em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data    <br/><em>toload</em> The amount of files that we are preparing to load   <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  <b>Param1</b><br/>ed  </td> <td>The function to run when the user closes the AjaxStream window <br/><br/><b>This argument</b><br/>  object(DOMElement) The input:file that was ‘clicked’    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/><em>loaded</em> The amount of files that were loaded  <br/><em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  onfilesloading  </td> <td> The function to run when the user closes the AjaxStream window    <br/><br/><b>This argument</b><br/>  object(DOMElement) The input:file that was ‘clicked’    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/><em>loaded</em> The amount of files that have been loaded  <br/><em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data    <br/><em>toload</em> The amount of files to be loaded   <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>oninit </td> <td> The function to run when AjaxStream is applied to a file input    <br/><br/><b>This argument</b><br/>  object(jQuery)    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>original</em> The original file input  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  onlegacyuploadfail  </td> <td> The function to run when an upload has failed during a legacy upload    <br/><br/><b>This argument</b><br/>  null    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/><em>error</em> The error message detailing why the upload failed  <br/><em>original</em> The original file input  <br/><em>results</em> The object that was generated server side describing the upload  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  onlegacyuploadfinish  </td> <td> The function to run when an upload has completed using the legacy script    <br/><br/><b>This argument</b><br/>  object(jQuery)    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>original</em> The original file input  <br/><em>results</em> The object that was generated server side describing the upload  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>  onlegacyuploadstart  </td> <td> The function to run when a legacy upload is beginning    <br/><br/><b>This argument</b><br/>  object(DOMElement) The input:file that was ‘clicked’    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/>  <em>original</em> The original file input  <br/><em>stream</em> The jQuery object for this file input that holds all of the AjaxStream data  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<tr>
<td>onopen </td> <td> The function to run after the Ajaxstream window opens    <br/><br/><b>This argument</b><br/>  object(jQuery)    <br/><br/><b>Parameters</b><br/><em>param1</em> object(Plain)     <br/><br/><b>Param1</b><br/><em>length</em> The number of files uploaded  <br/><em>original</em> The original file input  <br/><em>uploads</em> The array of objects that describe the files that have been uploaded  </td> </tr>
<td>onuploadstart</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>translateFunction</td> <td>The function that will be used to translate text on the page <br/><br/><b>This argument</b><br/>  null    <br/><br/><b>Parameters</b><br/><em>param1</em> string [, param2 … [, …]]    <br/><br/><b>Param1</b><br/>   The string that will be translated. ‘{n}’ will be used in the string that is passed as placeholder for  variables that will occupy that space.<br/><br/>E.g. ‘You have uploaded {0} files but are only allowed to upload {1}’.<br/><br/>‘{0}’ will be replaced by the first argument after param1, and ‘{1}’ will be replaced by the second  argument after param1 to possibly give the result<br/><br/>‘You have selected 2 files but are only allowed to upload 1’ <br/><br/><b>Param2</b><br/>  The string or number to replace {0} with <br/><br/><b>ParamN</b><br/>  The string or number to replace {n-1} with  </td> </tr>
<tr>
<td>onsingleuploadfail</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>onsingleuploadfinish</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>onsingleuploadstart</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>onuploadfail</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>onuploadfinish</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
<td>onuploadprogress</td> <td>Feature to support this has not yet been implemented </td> </tr>
<tr>
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

Your file input will become hidden, and will be replace by a span with the word 'upload'
```html
<input type=’file’ id=’myfile’ name=’myfile’ class=’AJSHidden’/>
<input type=’hidden’ id=’AJS_myfile’ name=’AJS_myfile’ value=’[]’/>
<span id="AJSUploadBtn_0_myfile" class="AJSBtn" 
                         data-mandatory="1" data-ajaxstreamid="0">Upload</span>
```

If the setting showPreviewOnForm was set to true, then that container would look more like
```html
<form id=’myform’ method=’post’ action=’myprocessingfile.php’>
    <input type=’file’ id=’myfile’ name=’myfile’ class=’AJSHidden’/>
    <input type=’hidden’ id=’AJS_myfile’ name=’AJS_myfile’ value=’[]’/>
    <div id="AJSFormPrev_0_myfile" class="AJSFormPrev" style="height:nnn">
        <span id="AJSUploadBtn_0_myfile" class="AJSBtn" 
                         data-mandatory="1" data-ajaxstreamid="0">Upload</span>
    </div>
</form>
```
