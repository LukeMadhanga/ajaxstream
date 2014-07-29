/**
 * Show an alternative confirm dialogue
 * @param {string} message The message to display
 * @param {function|object} callback The callback function to run when the user clicks okay, or an object in the form
 *  {
 *      'Button Name': function_to_run_on_click,
 *      'Another button name': function_to_run_on_click [, ...]
 *  }
 * @param {string} moreinfo [optional] A short message to display to the user below the main question
 * @param {object(plain)} opts [optional] More options to construct this function
 */
var streamConfirm = function (message, callback, moreinfo, opts) {
    
    return new stream_confirm(message, callback, moreinfo, opts);
    
};

/**
 * Show an alternative confirm dialogue
 * @param {string} message The message to display
 * @param {function|object} callback The callback function to run when the user clicks okay, or an object in the form
 *  {
 *      'Button Name': function_to_run_on_click,
 *      'Another button name': function_to_run_on_click [, ...]
 *  }
 * @param {string} moreinfo [optional] A short message to display to the user below the main question
 * @param {object(plain)} opts [optional] More options to construct this function
 */
function stream_confirm(message, callback, moreinfo, opts) {
    
    /**
     * An alias to 'this'
     * @type stream_confirm
     */
    var self = this;
    /**
     * The default functions
     */
    self.functions = {
        cancel: function () {
            return 'cancel';
        },
        confirm: function () {
            callback();
            return 'confirm';
        }
    };
    
    if (!opts) {
        opts = {};
    }
    
    /**
     * Build the dialogue
     */
    function build() {
        moreinfo = moreinfo === undefined ? '' : moreinfo;
        if (!$('style[id="strcon"]').length) {
            $('head').append(
'<style id="strcon">' + 
'#streamconfirm {position: fixed;top: 0;left:0;width: 100%;height: 100%;font-family: inherit;z-index:3000;}' +
'#streamconfirmover {top: 0;left: 0;width: 100%;height: 100%;z-index: 1000;position: fixed;}'+
'#streamconfirmmain {top: 50%;background: #FFF;max-width: 500px;width: 80%;z-index: 1001;padding: 20px 20px 10px;' +
'box-sizing: border-box;box-shadow: 0px 0px 1px #000;position: relative;margin: -60px auto;}' +
'#streamconfirmmore {font-size: 12px;padding: 10px 0;}' +
'#streamconfirmquest {font-weight: bold;font-size: 20px;}' +
'#streamconfirmbtns {border-top: solid thin #DFDFDF;padding: 10px 0 0;text-align: right;}' +
'#streamconfirmbtns > span {padding: 5px 15px;background: #7CCBFF;margin: 0 0 0 10px;border-radius: 3px;color: #FFF;' +
'text-shadow: 0px 0px 1px #008FFF;box-shadow: 0px -1px 0px #8EA9FF;cursor: pointer;position: relative;display: inline-block;' +
'cursor: pointer;}' +
'[data-caconfirmfunc="cancel"] {background: #990000 !important;box-shadow: 0px -1px 0px #bb0000 !important;' +
'text-shadow: 0px 0px 1px #cc0000 !important;}' + 
'</style>'
);
        }
        $('body').append(
            '<div id="streamconfirm">' + 
                '<div id="streamconfirmover"></div>' + 
                '<div id="streamconfirmmain">' + 
                    '<div id="streamconfirmquest">' + message + '</div>' + 
                    '<div id="streamconfirmmore">' + moreinfo + '</div>' + 
                    '<div id="streamconfirmbtns">' + 
                        getBtns() + 
                    '</div>' + 
                '</div>' + 
            '</div>');
        var scm = $('#streamconfirmmain');
        scm.css({marginTop: - scm.height() / 2});
        $('#streamconfirmbtns > span').unbind('click').click(function () {
            var func = $(this).data('caconfirmfunc');
            if (self.functions[func]) {
                $('#streamconfirm').remove();
                return self.functions[func]();
            } else {
                console.error('You have not defined the function "' + func + '"');
            }
        });
         
    };
    
    /**
     * Render the buttons for this confirm dialogue
     * @returns {html}
     */
    function getBtns() {
        var outtext = '';
        if (typeof callback === 'function') {
            self.functions.confirm = callback;
            outtext += '<span data-caconfirmfunc="confirm">Okay</span>';
        } else if (Object.prototype.toString.call(callback) === '[object Object]') {
            // We've been given a list of buttons and functions to run when they're clicked
            for (var x in callback) {
                self.functions[x] = callback[x];
                outtext += '<span data-caconfirmfunc="' + x + '">' + x + '</span>';
            }
            self.functions = callback;
        }
        if (!opts.nocancel) {
            // Only add the 'cancel' button if the user permits
            outtext += '<span data-caconfirmfunc="cancel">Cancel</span>';
        }
        return outtext;
    }
    
    build();
    
}