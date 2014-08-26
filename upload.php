<?php

$doupload = filter_input(INPUT_GET, 'newupload');
if ($doupload) {
    cAjaxStream::processUpload();
}
$doexternal = filter_input(INPUT_GET, 'external');
if ($doexternal) {
    cAjaxStream::processExternalUpload();
}

class cAjaxStream {

    static $settings;
    static $starttime;
    static $cleandir = true;

    /**
     * The max length of a file name without the unixtime marker
     */
    const MAX_FILENAME_LENGTH = 120;

    /**
     * Maximum time that a file can live in the upload directory (7200 seconds, 2 hours)
     */
    const MAX_TIME_IN_UPLOADS = 7200;
    // Error constants
    /**
     * There was no error
     */
    const UPLOAD_ERR_OK = 0;

    /**
     * The file uploaded exceeds the PHP ini maximum file size
     */
    const UPLOAD_ERR_INI_SIZE = 1;

    /**
     * The file uploaded exceeds the form max file size
     */
    const UPLOAD_ERR_FORM_SIZE = 2;

    /**
     * The file was only partially uploaded
     */
    const UPLOAD_ERR_PARTIAL = 3;

    /**
     * No file was uploaded
     */
    const UPLOAD_ERR_NO_FILE = 4;

    /**
     * There is no temporary directory to upload to
     */
    const UPLOAD_ERR_NO_TMP_DIR = 6;

    /**
     * Write failed
     */
    const UPLOAD_ERR_CANT_WRITE = 7;

    /**
     * An unknown error caused the upload to fail
     */
    const UPLOAD_ERR_EXTENSION = 8;

    /**
     * Process an uploaded file
     */
    static function processUpload() {
        self::$starttime = time();
        self::$settings = $settings = json_decode(filter_input(INPUT_POST, 'AJSLegacy'));
        $file = (object) $_FILES['AJSFileLegacy'];
        if($settings->islegacy) {
            self::handleLegacy($file);
        }
    }
    
    /**
     * Retrieve a file from another server, save it and pretend that it was an upload from our system
     */
    static function processExternalUpload () {
        $path = filter_input(INPUT_POST, 'filesrc');
        self::$settings = new stdClass();
        self::$settings->uploaddir = filter_input(INPUT_POST, 'uploaddir');
        self::setUploadDir();
        try {
            $pathbits = explode('/', $path);
            $filename = end($pathbits);
            $destination = self::$settings->uploaddir . time() . '_' . $filename;
            $relpath = substr($destination, strlen(filter_input(INPUT_SERVER, 'DOCUMENT_ROOT')));
            self::saveBase64($destination, $path);
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimetype = finfo_file($finfo, $destination);
            $output = array(
                'src' => $relpath,
                'newsrc' => null,
                'name' => $filename,
                'newupload' => true,
                'mimetype' => $mimetype,
                'islegacy' => false,
                'cropdata' => array()
            );
            if (preg_match("/image\/.*/", $mimetype)) {
                // The 'uploaded' file is an image
                $size = getimagesize($destination);
                $output['width'] = $output['croppedWidth'] = $output['resizedWidth'] = $size[0];
                $output['height'] = $output['croppedHeight'] = $output['resizedHeight'] = $size[1];
            }
            self::ajaxExit('OK', $output);
        } catch (Exception $ex) {
            self::ajaxExit('Fail', "Unable to get external file: {$ex->getMessage()}");
        }
    }
    
    /**
     * Send a JSON-encoded response from an Ajax call and exit
     * @param $result string Message to return to the browser, or false to return data only
     * @param $data mixed Any additional data to return
     * @param $status int Value of HTTP status to be sent to the browser
     */
    private static function ajaxExit($result, $data = null, $status = 200) {
        header('Content-Type:text/json; charset=utf-8');
        header("HTTP/1.0 $status");
        $response = array('result' => $result);
        if (!empty($data)) {
            $response['data'] = $data;
        }
        print json_encode($response);
        exit;
    }
    
    /**
     * Get 
     * @param array $postkeys A list of post keys that should have the upload data. If left empty, the function will iterate through
     *  all of the POST variables looking for any that begin with 'AJS_'
     * @return array An array of arrays keyed by each of the post keys
     */
    static function getUploads($postkeys = array()) {
        $values = array();
        $uploads = array();
        if (empty($postkeys)) {
            // The user has not given us any keys to seek. Fill the array up by iterating through all of the post variables
            foreach ($_POST as $key => $p) {
                if (preg_match("/^AJS\_/", $key)) {
                    // The post variable begins with 'AJS_', assume it is one of ours
                    $postkeys[] = $key;
                    $values[$key] = $p;
                }
            }
        }
        
        foreach ($postkeys as $key) {
            if (empty($values[$key])) {
                $value = filter_input(INPUT_POST, $key);
            } else {
                $value = $values[$key];
            }
            $data = json_decode($value);
            foreach ($data as $u) {
                $u->previousfname = null;
                $u->inputName = substr($key, 4);
                $uploads[$key][] = $u;
            }
        }
        return $uploads;
    }
    
    /**
     * Save a base64 encoded string as a file
     * @param string $destination The destination of the upload
     * @param string $base64 The base64 representation of the uploaded file
     * @return int The number of bytes written, or false on failure 
     * @throws Exception 
     */
    static function saveBase64($destination, $base64) {
        set_error_handler("cAjaxStream::FSE");
        $ans = file_put_contents($destination, self::getFileBinary($base64));
        restore_error_handler();
        if (!(fileperms($destination) & 0020)) {
            if (!chmod($destination, 0777)) {
                throw new Exception('Failed to change permissions on ' . $destination);
            }
        }
        return $ans;
    }
    
    /**
     * Get a binary string from a file
     * @param string(base64|path) $src The source of the file: either a relative path to the file on this server, or a base64 string
     *  with the leading 'data:major/minor;base64,'
     * @return string(binary)
     */
    static function getFileBinary($src) {
        if (preg_match("/^data\:/", $src)) {
            // Remove the first part of the string to exlude everything upto ';base64,'
            // Can't use a regex because PHP5.3 doesn't support it
            // @todo why doesn't base64_decode(preg_replace("/^data\:(:?.*)?base64\,(.*)/", "$2", $src)) work in PHP5.3
            $pos = strpos($src, 'base64,');
 	    $strlen = 7; // Length of the string 'base64,'
            $binary = base64_decode(substr($src, $pos + $strlen));
        } else {
            $pos = strpos($src, '?cachekill=');
            $src = substr($src, 0, $pos);
            $binary = file_get_contents($src);
        }
        return $binary;
    }
    
    /**
     * File System Error handler
     * @throws Exception
     */
    static function FSE () {
        restore_error_handler();
        throw new Exception('Error attempting to write file');
    }
    
    /**
     * Stringify an array into something that JavaScript understands. Typing 'function:' before a string causes that string to not
     *  be encased in quotes, meaning that JS can understand that it is a function
     * @param array $input The array to turn into a JS object
     * @return string A JSON-like string
     */
    static function json_stringify($input) {
        $outtext = '';
        $opening = '{';
        $closing = '}';
        $inner = array();
        $numericarray = array_keys($input) === range(0, count($input) - 1);
        if ($numericarray) {
            // This is a numerically sequential array
            $opening = '[';
            $closing = ']';
        } 
        foreach ($input as $key => $val) {
            if (is_string($val) && preg_match("/^function\:/", $val)) {
                // The value is a string and begins with 'function:'. Do not encase it in quotes
                $val = substr($val, 9);
            } else if (is_int($val)) {
                // The value is an integer
                $val = (int) $val;
            } else if (is_float($val)) {
                // The value is a float
                $val = (float) $val;
            } else if (!is_bool($val)) {
                // Keep booleans as they are, and for everything else, come here
                $val = is_array($val) ? self::json_stringify($val) : "\"$val\"";
            }
            $inner[] = ($numericarray ? '' : "\"$key\":") . $val;
        }
        $outtext .= implode(',',$inner);
        return "$opening$outtext$closing";
    }

    /**
     * Upload a file using legacy methods
     * @param object(StdClass) $file The uploaded file object from the $_FILES super global
     */
    static function handleLegacy($file) {
        if($file->error) {
            // The error code is non-zero, i.e. there has been error
            $result = json_encode(array('moved' => false, 'error' => self::getErrorMessage($file->error)));
        } else {
            self::setDestination();
            if(self::$cleandir) {
                self::cleanDir();
            }
            $filename = self::sanitiseFilename($file->name);
            $destination = self::$settings->uploaddir . self::$starttime . "-{$filename}";
            try {
                $filepath = str_replace(filter_input(INPUT_SERVER, 'DOCUMENT_ROOT'), '', $destination);
                $error = null;
                $moved = move_uploaded_file($file->tmp_name, $destination);
                if(!$moved) {
                    $lasterror = error_get_last();
                    $error = $lasterror['message'];
                }
                if(preg_match("/image\/*/", $file->type)) {
                    $imagedata = getimagesize($destination);
                    if($imagedata) {
                        $dimensions = new stdClass;
                        $width = $imagedata[0];
                        $height = $imagedata[1];
                        $maxWidth = self::$settings->maxwidth;
                        $maxHeight = self::$settings->maxheight;
                        if($width > $height) {
                            if($width > $maxWidth) {
                                $height = round($height * $maxWidth / $width);
                                $width = $maxWidth;
                            }
                        } else {
                            if($height > $maxHeight) {
                                $width = round($width * $maxHeight / $height);
                                $height = $maxHeight;
                            }
                        }
                        $dimensions->width = $width;
                        $dimensions->height = $height;
                        self::imageScaleAndSave($destination, $destination, $maxWidth, $maxHeight);
                    } else {
                        $lasterror = error_get_last();
                        throw new Exception($lasterror['message']);
                    }
                }
                $resultsarray = array(
                    'error' => $error,
                    'id' => self::$settings->id,
                    'location' => $filepath,
                    'mimetype' => $file->type,
                    'moved' => $moved,
                    'name' => $file->name,
                    'size' => $file->size
                );
                if($dimensions) {
                    // Add the image data to output
                    $resultsarray['height'] = $dimensions->height;
                    $resultsarray['width'] = $dimensions->width;
                }
                $result = json_encode($resultsarray);
            } catch(Exception $ex) {
                $result = json_encode(array('moved' => false, 'error' => $ex->getMessage()));
            }
        }
        header('Content-Type:text/html; charset=utf-8');
        echo <<<JS
<script type='text/javascript'>
    window.parent.AJSLegacy.afterLegacyUpload($result);
</script>            
JS;
        exit;
    }

    /**
     * Determine the error message to send back
     * @param int $e The incident code
     * @return string The error message
     */
    private static function getErrorMessage($e) {
        switch($e) {
            case self::UPLOAD_ERR_INI_SIZE:
                return 'The uploaded file exceeds the maximum set';
            case self::UPLOAD_ERR_FORM_SIZE:
                return 'The uploaded file exceeds the maximum set on the input form';
            case self::UPLOAD_ERR_PARTIAL:
                return 'The selected file was only partially uploaded';
            case self::UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case self::UPLOAD_ERR_NO_TMP_DIR:
                return 'Server Error: Quote upload error 6';
            case self::UPLOAD_ERR_CANT_WRITE:
                return 'Server Error: Quote upload error 7';
            case self::UPLOAD_ERR_EXTENSION:
                return 'Server Error: Quote upload error 8';
        }
    }

    /**
     * Set the destination path for the uploaded file
     * @return string The destination path
     */
    private static function setDestination() {
        $uploaddir = self::$settings->uploaddir;
        if(!preg_match("/\/$/", $uploaddir)) {
            // The upload dir requires a '/' at the end
            $uploaddir = self::$settings->uploaddir = "{$uploaddir}/";
        }
        if(substr($uploaddir, 0, 1) === '/') {
            $uploaddir = self::$settings->uploaddir = substr($uploaddir, 0);
        }
        self::$settings->uploaddir = filter_input(INPUT_SERVER, 'DOCUMENT_ROOT') . "/$uploaddir";
    }

    /**
     * Clean the upload directory
     */
    private static function cleanDir() {
        $filelist = glob(self::$settings->uploaddir . '[1-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-*');
        foreach($filelist as $path) {
            $pathbits = explode('/', $path);
            $filename = end($pathbits);
            $namebits = explode('-', $filename);
            $ut = (int) $namebits[0];
            if($ut && (self::$starttime - $ut > self::MAX_TIME_IN_UPLOADS)) {
                // If we should delete this file
                unlink($path);
            }
        }
    }

    /**
     * @brief Sanitise a file name ready for storing in our database.
     *
     * We will allow only lower case letters, digits fulls stops and underscores.
     * The base of the file name may be no more than a set limit long.
     * @param string $fname The filename that was uploaded
     * @return string The filename we will use
     * @throws Exception
     */
    static function sanitiseFilename($fname) {
        if(empty($fname)) {
            throw new Exception('cFile::sanitiseFilename: file name may not be empty');
        }
        // Strip all unwanted characters from the filename and break it into filename and extension
        $bits = explode('.', preg_replace('/[^a-z0-9\_\.]/', '_', strtolower(self::stripAccents($fname))));
        if(count($bits) > 1) {
            $ext = array_pop($bits);
        } else {
            $ext = false;
        }
        return substr(implode('.', $bits), 0, self::MAX_FILENAME_LENGTH) . ($ext ? ".$ext" : '');
    }

    /**
     * @brief Strip the accents from a UTF-8 string
     * @param $str string The text to be processed
     * @return The stripped string
     */
    public static function stripAccents($str) {
        if(!function_exists('mb_convert_encoding')) {
            return $str;
        }
        // First, deal with HTML entities.
        $s = html_entity_decode($str, ENT_NOQUOTES, 'UTF-8');
        // First deal with the r caron (e.g. in Dvorak) and other characters not found in ISO-8859-1. At the same time,
        // put back any non-breaking spaces, which get messed up by html_entity_decode
        $rcaronu = chr(0xc5) . chr(0x98);
        $rcaron = chr(0xc5) . chr(0x99);
        $ecaronu = chr(0xc4) . chr(0x9a);
        $ecaron = chr(0xc4) . chr(0x9b);
        $ccaronu = chr(0xc4) . chr(0x8c);
        $ccaron = chr(0xc4) . chr(0x8d);
        $scaronu = chr(0xc5) . chr(0xa0);
        $scaron = chr(0xc5) . chr(0xa1);
        $imacronu = chr(0xc4) . chr(0xaa);
        $imacron = chr(0xc4) . chr(0xab);
        $sharpsu = chr(0xe1) . chr(0xba) . chr(0x9E);
        $sharps = chr(0xc3) . chr(0x9f);
        $str = str_replace(array($rcaronu, $rcaron, $ecaronu, $ecaron, $scaronu, $scaron, $ccaronu, $ccaron, $imacronu, $imacron,
            $sharpsu, $sharps, chr(0xa0)), array('R', 'r', 'E', 'e', 'S', 's', 'C', 'c', 'I', 'i', 'SS', 'ss', '&nbsp;'), $s);

        $transtable = array(
            192 => "A", 193 => "A", 194 => "A", 195 => "A", 196 => "A", 197 => "A", 198 => "AE", 199 => "C",
            200 => "E", 201 => "E", 202 => "E", 203 => "E", 204 => "I", 205 => "I", 206 => "I", 207 => "I",
            208 => "D", 209 => "N", 210 => "O", 211 => "O", 212 => "O", 213 => "O", 214 => "O",
            216 => "O", 217 => "U", 218 => "U", 219 => "U", 220 => "U", 221 => "Y",
            224 => "a", 225 => "a", 226 => "a", 227 => "a", 228 => "a", 229 => "a", 230 => "ae", 231 => "c",
            232 => "e", 233 => "e", 234 => "e", 235 => "e", 236 => "i", 237 => "i", 238 => "i", 239 => "i",
            241 => "n", 242 => "o", 243 => "o", 244 => "o", 245 => "o", 246 => "o",
            248 => "o", 249 => "u", 250 => "u", 251 => "u", 252 => "u", 255 => "y"
        );
        $str = mb_convert_encoding($str, "iso-8859-1", "utf-8");
        $out = "";
        for($i = 0; $i < strlen($str); $i++) {
            $c = $str[$i];
            $o = ord($c);
            if($o > 191 && array_key_exists($o, $transtable)) {
                $c = $transtable[$o];
            }
            $out .= $c;
        }
        return $out;
    }

    /**
     * @brief Take an image in a file, scale/crop it, and save it to an output path (which may be the same as the input)
     * @param $fnamefrom string Pathname of the input file
     * @param $fnameto string Pathname of the output file
     * @param $maxwidth int Max width of the output image in pixels
     * @param $maxheight int Max height of the output image in pixels
     * @param $square boolean True to crop the image to square
     * @throws Exception
     */
    static function imageScaleAndSave($fnamefrom, $fnameto, $maxwidth, $maxheight, $square = false) {
        $size = @getimagesize($fnamefrom);
        if(!$size) {
            throw new Exception('Unable to get image: ' . $fnamefrom);
        }
        $width = $size[0];
        $height = $size[1];
        $imagetype = $size[2];
        // If we don't need to do any scaling, just copy the file. This means that an animated gif of the correct size
        // will pass through unscathed.
        if($width <= $maxwidth && $height <= $maxheight) {
            if(!$square || ($square && $width == $height)) {
                $data = @file_get_contents($fnamefrom);
                if($data === false) {
                    $error = error_get_last();
                    throw new Exception("imageScaleAndSave: failed to read $fnamefrom: " . $error['message']);
                }
                if(!@file_put_contents($fnameto, $data)) {
                    $error = error_get_last();
                    throw new Exception("imageScaleAndSave: failed to write $fnameto: " . $error['message']);
                }
            }
            return;
        }
        switch($imagetype) {
            case IMAGETYPE_PNG:
                $image = imagecreatefrompng($fnamefrom);
                $target = self::imageScale($image, $maxwidth, $maxheight, $square);
                if(!imagepng($target, $fnameto)) {
                    throw new Exception('Failed to write image file: ' . $fnameto);
                }
                break;
            case IMAGETYPE_JPEG:
                $image = imagecreatefromjpeg($fnamefrom);
                if(!$image) {
                    throw new Exception('Failed to read image file: ' . $fnamefrom);
                }
                $target = self::imageScale($image, $maxwidth, $maxheight, $square);
                if(!$target) {
                    return false;
                }
                if(!imagejpeg($target, $fnameto, 100)) {
                    throw new Exception('Failed to write image file: ' . $fnameto);
                }
                break;
            case IMAGETYPE_GIF:
                $image = imagecreatefromgif($fnamefrom);
                $target = self::imageScale($image, $maxwidth, $maxheight, $square);
                if(!$target) {
                    return false;
                }
                if(!imagegif($target, $fnameto)) {
                    throw new Exception('Failed to write image file: ' . $fnameto);
                }
                break;
            default:
                throw new Exception('Unsupported image type: ' . $fnamefrom);
        }
        if($image != $target) {
            imagedestroy($target);
        }
        imagedestroy($image);
    }

    /**
     * @brief Make a copy of an image, scaling it to fit inside a given target size, and optionally cropping it to square
     * If the image already fits, just copy it.
     * @param $img resource image to be scaled
     * @param $maxwidth int max width in pixels
     * @param $maxheight int max height in pixels
     * @param $square boolean Crop the image to square
     * @return Resource The scaled image
     * @throws Exception
     */
    static function imageScale($img, $maxwidth, $maxheight, $square = false) {
        global $imgtrace;
        $width = imagesx($img);
        $height = imagesy($img);
        $src_x = 0;
        $src_y = 0;
        $needcrop = false;
        if($square) {
            // We may need to crop the image. Let's see.
            if($width > $height) {
                // Image is too wide, need to crop horizontally
                $src_x = ($width - $height) / 2; // Offset so the the cropped region is centred
                $width = $height;
                $needcrop = true;
            } else if($height > $width) {
                // Image is too narrow, need to crop verticaly
                $src_y = ($height - $width) / 2;
                $height = $width;
                $needcrop = true;
            }
        }
        $xscale = false; // Haven't set it yet
        if($needcrop) {
            // If the cropped image is no bigger than its target, force the scale to 1
            if($width <= $maxwidth && $height <= $maxheight) {
                $xscale = 1;
                $yscale = 1;
                $targetwidth = $width;
                $targetheight = $height;
            }
        } else {
            // If the image is no bigger than its target and isn't being cropped, simply copy it to the answer
            if($width <= $maxwidth && $height <= $maxheight) {
                return $img;
            }
        }
        if($xscale === false) {
            // Work out the scaling needed to make the image fit
            $xscale = $maxwidth / $width;
            $yscale = $maxheight / $height;
            if($xscale < $yscale) {
                // The xscale is smaller - i.e. we will be scaling the width to the target
                $targetwidth = $maxwidth;
                $targetheight = intval($height * $xscale);
            } else {
                // The yscale is smaller (or the same) i.e. we will be scaling the height to the target
                $targetheight = $maxheight;
                $targetwidth = intval($width * $yscale);
            }
        }
        $imgtrace = "($width,$height)=>($targetwidth,$targetheight) $xscale $yscale";
        // Now do the scaling
        $answer = @imagecreatetruecolor($targetwidth, $targetheight);
        if(!$answer) {
            throw new Exception("Failed to create image with width $targetwidth height $targetheight");
        }
        if(!@imagecopyresampled($answer, $img, 0, 0, $src_x, $src_y, $targetwidth, $targetheight, $width, $height)) {
            throw new Exception('Failed to scale image');
        }
        return $answer;
    }

}