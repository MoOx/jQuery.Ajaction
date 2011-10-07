var jAction = {
	init: function(context) {
		if (!context) {
			context = 'body';
		}
		$('a.jAction', context).bind('click', jAction.bind.url);
		$('form.jAction', context).ajaxForm({
			success: jAction.bind.form
		});
	},
	bind: {
		url: function() {
			var action = $(this).attr('href');
			if (action) {
				jAction.action(action);
				return false;
			}
			return;
		},
		form: function(responseText, statusText) {
			jAction.reaction(responseText);
		}
	},
	action: function(urlAction) {
		$.ajax({
			 url: urlAction,
			 success: jAction.reaction
		});
	},
	reaction: function (data) {
		data = jsonize(data);
		if (typeof data == 'string') {
			data = $(data);
		}
		Messenger.scanData(data);
		
		//helper :)
		if (data.debugg && Auth.isAdmin()) {
			$.debugg(data);
		}
		
		//FIXME here you can do a lot of thing
		if (data.redirect) {
			window.location.href = data.redirect;
		}
		
		if (data.idContent) {
			$destination = $('#'+data.idContent);
			
			if (!data.action) {
				data.action = 'remove';
			}
			var rebind = true;
			
			switch(data.action) {
			//used for shop
			case 'replace':
				if ($destination.length>0) {
					//$.debugg(data.newContent);
					$newContent = $($(data.newContent).html());
					$destination.children().fadeOut().remove();
					$destination.append($newContent);
					$('p', $destination).effect("highlight", {color: '#D1CAEB'}, 1000);//.effect("shake", { direction: 'right', distance: '5', times: 2 }, 100);
				} else {
					$newContent = $('<div id="'+data.idContent+'">'+data.newContent+'</div>');
					$destination = $('#'+data.idContent, $('#'+data.container).prepend($newContent));
				}
				break;
			case 'add':
				data.action = 'prepend';
			case 'prepend':
			case 'append':
				$newContent = $(data.newContent);
				$destination[data.action]($newContent);
				//rebind
				jAction.init($destination);
				break;
			
			//used for feed
			case 'remove':
				$destination.fadeOut('normal', function() { $destination.remove(); });
				rebind = false;
				break;
			default:
				if (Auth.isAdmin()) {
					$.debugg(data);
				}
			}
			if (data.scrollTo) {
				$newContent.scrollToMe();	
			}
			if (rebind) {
				//rebind
				jAction.init($destination);
			}
			if (data.reInitCallback) {
				eval(data.reInitCallback+'.init()');
			}
		} else {
			if (data.attr('id')=='errorAuth') {
				$('.loginLink', data).bind('click',Auth.toggle);
				Messenger.warn(data);
			}
			
			if (Auth.isAdmin()) {
				$.debugg(data);
			}
		}
	}
};