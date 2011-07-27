(function( $ ) {    
    var radioCheck = /radio|checkbox/i,
        keyBreaker = /[^\[\]]+/g,
        numberMatcher = /^[\-+]?[0-9]*\.?[0-9]+([eE][\-+]?[0-9]+)?$/;

    var isNumber = function( value ) {
        if ( typeof value == 'number' ) {
            return true;
        }

        if ( typeof value != 'string' ) {
            return false;
        }

        return value.match(numberMatcher);
    };

    $.fn.extend({ 
        /**
         * @parent dom
         * @download http://jmvcsite.heroku.com/pluginify?plugins[]=jquery/dom/form_params/form_params.js
         * @plugin jquery/dom/form_params
         * @test jquery/dom/form_params/qunit.html
         * <p>Returns an object of name-value pairs that represents values in a form.  
         * It is able to nest values whose element's name has square brackets. </p>
         * Example html:
         * @codestart html
         * &lt;form>
         *   &lt;input name="foo[bar]" value='2'/>
         *   &lt;input name="foo[ced]" value='4'/>
         * &lt;form/>
         * @codeend
         * Example code:
         * @codestart
         * $('form').formParams() //-> { foo:{bar:2, ced: 4} }
         * @codeend
         * 
         * @demo jquery/dom/form_params/form_params.html
         * 
         * @param {Boolean} [convert] True if strings that look like numbers and booleans should be converted.  Defaults to true.
         * @return {Object} An object of name-value pairs.
         */
        formParams: function( convert ) {
            if ( this[0].nodeName.toLowerCase() == 'form' && this[0].elements ) {

                return jQuery(jQuery.makeArray(this[0].elements)).getParams(convert);
            }
            return jQuery("input[name], textarea[name], select[name]", this[0]).getParams(convert);
        },
        getParams: function( convert ) {
            var data = {},
                current;

            convert = convert === undefined ? true : convert;

            this.each(function() {
                var el = this,
                    type = el.type && el.type.toLowerCase();
                //if we are submit, ignore
                if ((type == 'submit') || !el.name ) {
                    return;
                }

                var key = el.name,
                    value = $.data(el, "value") || $.fn.val.call([el]),
                    isRadioCheck = radioCheck.test(el.type),
                    parts = key.match(keyBreaker),
                    write = !isRadioCheck || !! el.checked,
                    //make an array of values
                    lastPart;

                if ( convert ) {
                    if ( isNumber(value) ) {
                        value = parseFloat(value);
                    } else if ( value === 'true' || value === 'false' ) {
                        value = Boolean(value);
                    }

                }

                // go through and create nested objects
                current = data;
                for ( var i = 0; i < parts.length - 1; i++ ) {
                    if (!current[parts[i]] ) {
                        current[parts[i]] = {};
                    }
                    current = current[parts[i]];
                }
                lastPart = parts[parts.length - 1];

                //now we are on the last part, set the value
                if ( lastPart in current && type === "checkbox" ) {
                    if (!$.isArray(current[lastPart]) ) {
                        current[lastPart] = current[lastPart] === undefined ? [] : [current[lastPart]];
                    }
                    if ( write ) {
                        current[lastPart].push(value);
                    }
                } else if ( write || !current[lastPart] ) {
                    current[lastPart] = write ? value : undefined;
                }

            });
            return data;
        }
    });

}(jQuery));

(function( $ ) {
  $.fn.panel = function(settings) {
    var options = {
        "close":"<span>close</span>",
        "id":"Panel",
        "selector":this.selector,
        "usemodal":true,
        "modalclose":true
    }
    
    var actions = {
        "close":closePanel
    }
    
    // set user options
    $.extend(options,settings);
    
    if($('#'+options.id).length==0){
        var container = $('<div id="'+options.id+'"></div>').appendTo(document.body).css({
            'position':'fixed',
            'left':0,
            'top':0,
            'width':1,
            'height':1,
            'z-index':9999
        })
        
        // embed the modal
        if(options.usemodal){
            var modal = $('<div class="modal">&nbsp;</div>')
                .appendTo(container);
            if(options.modalclose)modal.click(function(){
                closePanel();
            })
        }
            
        // embed panel box
        var box = $('<div class="box"><div class="wrapper"><div class="content"></div></div></div>')
            .appendTo(container)
            .css({
                'position':'fixed',
                'left':($(window).width()*.5),
                'top':($(window).height()*.5)
            })
            .hide();
        
        var wrapper = box.find('.wrapper')
            .css({
                'overflow':'hidden',
                'width':1,
                'height':1
            });
        
        // identify content box
        var content = box.find(".content")
            .css({
                "height":"auto"
            });
    }
    // Setup Closer
    if(options.close.length>0){
        var closer = $('<div class="closer">'+options.close+'</div>')
            .appendTo(box)
            .click(function(){
                closePanel();
            });
    }
    
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Methods ///////////////////////////////////////////////////////////////////////////////////////////
    
    function loadPanel($url,$post){
        if(options.usemodal){
            modal.css({
                'width':$(window).width(),
                'height':$(window).height()
            }).fadeIn();
        }
        
        box
            .addClass('loading')
            .fadeIn();
        
        if($url.search(/\.jpg|\.png|\.gif/)!=-1){
            content.empty();
            var img = $('<img />')
                .css({
                    'max-width':'99999%',
                    "position":"relative"
                })
                .attr({
                    "src":$url,
                    "class":"solo"
                })
                .appendTo(content);
                
                    
            $("<div>").load($url,$post,function(){
                positionPanel();
            });
        }else{
            content.load($url,$post,function(){
                positionPanel()
                content.find(options.selector).click(function(e){
                    e.preventDefault();
                    loadPanel($(this).attr("src"));
                });
                
                content.find('[rel^="action"]').click(function(e){
                    e.preventDefault();
                    panelAction($(this).attr("rel").split(":")[1]);
                });
                
                content.find("form").submit(function(e){
                    e.preventDefault();
                    loadPanel($(this).attr("action"),$(this).formParams());
                });
            });
        }
        content.show();
    }
    
    function setPanel(){
        
    }
    
    function positionPanel(){
        wrapper.css("opacity",0);       
        
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        
        if(options.usemodal)modal.css({
            'width':winWidth,
            'height':winHeight
        });
        
        var width = content[0].scrollWidth;
        var height = content[0].scrollHeight;
        
        wrapper.css('overflow-y',(height > (winHeight*.8)) ? 'scroll' : 'hidden');
        
        //adjust width and height for window size
        width = width   < (winWidth*.8)  ? width  : (winWidth*.8);
        height = height < (winHeight*.8) ? height : (winHeight*.8);
        
        box.css({
                'width':'auto',
                'height':'auto'
            })
            .animate({
                'left': (winWidth*.5)  - (width*.5),
                'top':  (winHeight*.5) - (height*.5),
                'width':width,
                'height':height
            },500,function(){
                wrapper
                    .css({
                        'width':width,
                        'height':height                     
                    })
                    .animate({
                        'opacity':1
                    },500);
                box.css({
                    'width':'auto',
                    'height':'auto'
                })
            });
        
    }
    
    function panelAction(action){
        actions[action].call();
    }
    
    function closePanel(){
        box.fadeOut(750,function(){
            content.empty();
            wrapper.css({
                'width':1,
                'height':1
            });
            box.css({
                'left':($(window).width()*.5)-box.outerWidth(),
                'top':($(window).height()*.5)-box.outerHeight()
            })
            if(options.usemodal){
                modal.fadeOut();
            }
        });
    }
    
    // Make It Happen
    this.click(function(e){
        e.preventDefault();
        loadPanel($(this).attr("href"));
    });
    
    $(window).bind("resize",function(){
        if(box.css('display')=="block")positionPanel();
    });
    
  }
})( jQuery );