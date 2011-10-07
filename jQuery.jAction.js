/**
 * jAction is a simple way to apply ajax action on links or forms
 *
 * Usage : $('.jAction').jAction();
 *
 * Options :
 *
 * From the server side, you have to send json data like this
 * {
 *  selector: '#mySelector', // the action will be applied on this selector
 *  action: 'replace', // available action: replace, add (==prepend), prepend, append (to 'selector') or remove (default)
 *  content: 'new (html) content', // can be html content, text, or a selector to content already in the page (eg: hidden message)
 *  parentSelector: '#myParentSelector', // used for replacement only. selector to insert content, if the 'selector' does not exist
 *  scrollToSelector: true, // true to scroll to the main selector, or another selector to scroll to
 *  // not ready yet //message: 'message', // and eventual message you can pass through you messenger interface
 * }
 *
 * or
 *
 * {
 *  redirect: 'url to redirect'
 * }
 *
 * native jquery ajax callback can be passed
 * @link http://api.jquery.com/jQuery.ajax/
 * 
 * @version 0.2
 * @author Maxime Thirouin <maxime.thirouin@gmail.com>
 */
;(function($) {

    $.fn.jAction = function(options)
    {
        var self = this;
        
        var defaults = {
            
            // jquery.ajax callback passed
            beforeSend: function(jqXHR, settings) {},
            complete: function(jqXHR, textStatus) {},
            error: function(jqXHR, textStatus, errorThrown)
            {
                if (console && console.error)
                {
                    console.error(errorThrown, textStatus, jqXHR);
                }
            },

            action: function() {},
            beforeReaction: function() {},
            reaction: function() {},
            afterReaction: function() {}//,
            
            /*
            effects:
            {
                replace:
                {
                    remove: $.fn.fadeOut,
                    append: $.fn.show
                }
            }
            */
        }

        var plugin = this;

        plugin.settings = {}

        var init = function()
        {
            plugin.settings = $.extend({}, defaults, options);
            plugin.self = self;

            bind(self);
        }

        var bind = function(element)
        {
            // jAction for link
            $(element).filter('a').bind('click keyup', function(event)
            {
                var action = $(this).attr('href');
                if (action)
                {
                    $.ajax({
                        url: $(this).attr('href'),
                        beforeSend: plugin.settings.beforeSend,
                        complete: plugin.settings.complete,
                        error: plugin.settings.error,
                        success: reaction
                    });
                    plugin.settings.action();
                    event.preventDefault();
                }
                else
                {
                    throw 'jAction has not found an href';
                }
            });

            // jAction for form (use jquery ajaxForm plugin)
            if ($.fn.ajaxForm)
            {
                // @todo make this better (add more callback ?)
                $(element).filter('form').ajaxForm({
                    success: reaction
                });
            }
        }

        var reaction = function (data, textStatus, jqXHR)
        {
            plugin.settings.beforeReaction(data);

            data = $.parseJSON(data);

            if (typeof data == 'string')
            {
                data = $(data);
            }

            // @todo add a method which add a parser for messages (like a growl messenger like);

            if (data.redirect)
            {
                window.location.href = data.redirect;
            }

            if (data.selector)
            {
                var $destination = $(data.selector);
                data.action = data.action || 'remove';
            
                var rebind = true;

                switch(data.action)
                {
                    // action to replace content from the selector with new content
                    case 'replace':
                        if ($destination.length>0)
                        {
                            // check if we have html content
                            if (!$(data.content).length)
                            {
                                // if content "htmlized" is empty but we have already content
                                // we assume content is just text
                                $newContent = document.createTextNode(data.content);
                            }
                            else
                            {
                                $newContent = $(data.content); // wrapp html content to transform it to an jQuery object
                            }

                            $destination
                                .hide()
                                .before($newContent)
                                .remove();

                            $destination = $newContent;
                            // @todo add effect for display
                        }
                        else
                        {
                            $newContent = $('<div />').html(data.content);
                            var regexGetId = '/^#(.*)/';
                            var regexGetIdMatch = regexGetId.exec(data.selector)
                            console.log('regexGetIdMatch', regexGetIdMatch);
                            if (regexGetIdMatch)
                            {
                                $newContent.attr('id', regexGetIdMatch);
                            }
                            $destination = $('#'+data.idContent, $('#'+data.container).prepend($newContent));
                        }
                        break;

                    case 'add':
                        data.action = 'prepend';

                    case 'prepend':
                    case 'append':
                        $newContent = $(data.content);
                        $destination[data.action]($newContent);
                        break;

                    //used for feed
                    case 'remove':
                        $destination.hide().remove();
                        rebind = false;
                        break;
                    default:
                        if (console) console.log('No reaction', data);
                }

                // if scrollTo jQuery Plugin available
                if (data.scrollTo && $.fn.scrollToMe)
                {
                    if (data.scrollTo === true)
                    {
                        $newContent.scrollToMe();
                    }
                    else
                    {
                        $(data.scrollTo).scrollToMe();
                    }
                }

                plugin.settings.reaction(data);

                if (rebind)
                {
                    bind($destination);
                }
            }

            plugin.settings.afterReaction(data);
        };

        //plugin.fooPublicMethod = function() { }

        init();
    }

})(jQuery);