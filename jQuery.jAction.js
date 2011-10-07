/**
 * jQuery jAction plugin is a simple way to apply "ajax" action on links or forms,
 * without writing specific javascript.
 *
 * Usage *
 *
 * $('.jAction').jAction();
 *
 * Options *
 *
 * Native jquery ajax callbacks can be passed
 * @link http://api.jquery.com/jQuery.ajax/
 *
 * Server side documentation *
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
 * You can also pass multiple reaction at once
 * {
 *  reactions: [
 *      {
 *          //see first example
 *      },
 *      {...}
 *  ]
 * }
 *
 * @todo add tests
 *
 * @version 0.4
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
            element = element || (self.selector);

            var $element = $(element).not('[jAction]');

            // jAction for link
            $element.filter('a').bind('click keyup', function(event)
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
                    throw 'jAction: no href found, jAction cannot bind anything';
                }
            }).attr('jAction', true); // flag as initialized

            // jAction for form (use jquery ajaxForm plugin)
            if ($.fn.ajaxForm)
            {
                // @todo make this better (add more callback ?)
                $element.filter('form').ajaxForm({
                    success: reaction
                }).attr('jAction', true); // flag as initialized;
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

            if (data.redirect)
            {
                window.location.href = data.redirect;
            }

            // transform simple reaction to a array if data does not contain a collection
            if (!data.collection)
            {
                data = {collection: data };
            }
            
            // @todo add a method which add a parser for messages (like a growl messenger like); ?
            //if (data.messages) ;//...

            $.each(data.collection, function(i, reaction)
            {
                console.log('Reaction', reaction);

                if (reaction.selector)
                {
                    var $destination = $(reaction.selector);
                    console.log('$destination', $destination);
                    reaction.action = reaction.action || 'remove';

                    switch(reaction.action)
                    {
                        // action to replace content from the selector with new content
                        case 'replace':
                            if ($destination.length>0)
                            {
                                // check if we have html content
                                if (!$(reaction.content).length)
                                {
                                    // if content "htmlized" is empty but we have already content
                                    // we assume content is just text
                                    $newContent = document.createTextNode(reaction.content);
                                }
                                else
                                {
                                    $newContent = $(reaction.content); // wrapp html content to transform it to an jQuery object
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
                                // @todo test this behavior
                                $newContent = $('<div />').html(reaction.content);
                                var regexGetId = /^#(.*)/;
                                var regexGetIdMatch = regexGetId.exec(reaction.selector)
                                if (console) console.log('regexGetIdMatch', regexGetIdMatch);
                                if (regexGetIdMatch)
                                {
                                    $newContent.attr('id', regexGetIdMatch);
                                }
                                $destination = $('#'+reaction.idContent, $('#'+reaction.container).prepend($newContent));
                            }
                            break;

                        case 'add':
                            reaction.action = 'prepend';

                        case 'prepend':
                        case 'append':
                        case 'after':
                        case 'before':
                            $newContent = $(reaction.content);
                            console.log($destination.lenth);
                            $destination[reaction.action]($newContent);
                            break;

                        //used for feed
                        case 'remove':
                            $destination.hide().remove();
                            break;
                        default:
                            if (console) console.log('No reaction', data);
                    }

                    // if scrollTo jQuery Plugin available
                    if (reaction.scrollTo && $.fn.scrollToMe)
                    {
                        if (reaction.scrollTo === true)
                        {
                            $newContent.scrollToMe();
                        }
                        else
                        {
                            $(reaction.scrollTo).scrollToMe();
                        }
                    }

                    plugin.settings.reaction(data);
                }

                plugin.settings.afterReaction(data);
            });

            bind(); // re bind new content
        };

        //plugin.fooPublicMethod = function() { }

        init();
    }

})(jQuery);
