<?php

cAjaxStream::processUpload();

class cAjaxStream {
    
    static $settings;
    static $starttime;
    static $cleandir = true;
    
    const MAX_FILENAME_LENGTH = 120;                            // The max length of a file name without the unixtime marker
    const MAX_TIME_IN_UPLOADS = 200;                           // 2 hours in seconds
    
    /**
     * Process an uploaded file
     */
    static function processUpload () {
        self::$starttime = time();
        self::$settings = $settings = json_decode(filter_input(INPUT_POST, 'AJSLegacy'));
        $file = (object) $_FILES['AJSFileLegacy'];
        if ($settings->islegacy) {
            self::handleLegacy($file);
        }
    }
    
    /**
     * Upload a file using legacy methods
     * @param object(StdClass) $file The uploaded file object from the $_FILES super global
     */
    static function handleLegacy($file) {
        self::setDestination();
        if (self::$cleandir) {
            self::cleanDir();
        }
        $filename = self::sanitiseFilename($file->name);
        $destination = self::$settings->uploaddir . self::$starttime . "-{$filename}";
        try {
            $filepath = str_replace(filter_input(INPUT_SERVER, 'DOCUMENT_ROOT'), '', $destination);
            $error = null;
            $moved = move_uploaded_file($file->tmp_name, $destination);
            if (!$moved) {
                $lasterror = error_get_last();
                $error = $lasterror['message'];
            }
            if (preg_match("/image\/*/", $file->type)) {
                $imagedata = getimagesize($destination);
                if ($imagedata) {
                    // Resize etc.
                }
            }
            $result = json_encode(array('location' => $filepath, 'moved' => $moved, 'error' => $error, 'type' => $file->type));
        } catch (Exception $ex) {
            $result = json_encode(array('moved' => false, 'error' => $ex->getMessage()));
        }
        header('Content-Type:text/html; charset=utf-8');
        echo <<<JS
<script type='text/javascript'>
    window.parent.ajaxStreamLegacy.afterUpload($result);
</script>            
JS;
        exit;
    }
    
    /**
     * Set the destination path for the uploaded file
     * @return string The destination path
     */
    private static function setDestination () {
        $uploaddir = self::$settings->uploaddir;
        if (!preg_match("/\/$/", $uploaddir)) {
            // The upload dir requires a '/' at the end
            $uploaddir = self::$settings->uploaddir = "{$uploaddir}/";
        }
        if (substr($uploaddir, 0, 1) === '/') {
            $uploaddir = self::$settings->uploaddir = substr($uploaddir, 0);
        }
        self::$settings->uploaddir = filter_input(INPUT_SERVER, 'DOCUMENT_ROOT') . "/$uploaddir";
    }
    
    /**
     * Clean the upload directory
     */
    private static function cleanDir() {
        $filelist = glob(self::$settings->uploaddir . '[1-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]-*');
        foreach ($filelist as $path) {
            $pathbits = explode('/', $path);
            $filename = end($pathbits);
            $namebits = explode('-', $filename);
            $ut = (int) $namebits[0];
            if ($ut && (self::$starttime - $ut > self::MAX_TIME_IN_UPLOADS)) {
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
        if (empty($fname)) {
            throw new Exception('cFile::sanitiseFilename: file name may not be empty');
        }
        // Strip all unwanted characters from the filename and break it into filename and extension
        $bits = explode('.', preg_replace('/[^a-z0-9\_\.]/', '_', strtolower(self::stripAccents($fname))));
        if (count($bits) > 1) {
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
        if (!function_exists('mb_convert_encoding')) {
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
        $sharpsu = chr(0xe1) . chr(0xba). chr(0x9E);
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
        for ($i = 0; $i < strlen($str); $i++) {
            $c = $str[$i];
            $o = ord($c);
            if ($o > 191 && array_key_exists($o, $transtable)) {
                $c = $transtable[$o];
            }
            $out .= $c;
        }
        return $out;
    }
    
}