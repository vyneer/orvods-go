$(document).ready(function() {

		//stolen from dgg chat Blesstiny
		this.focused = "";
		$("head").append("<style id='focusStyle'></style>");
		var self = this;
		
		this._addFocusRule = function(username) {
			self._removeFocusRule();
			let rule = `.msg-chat[data-username="${username}"]{opacity:1 !important;}`;
			document.getElementById("focusStyle").sheet.insertRule(rule);
			self.focused = username;
			self._redraw();
		}

		this._removeFocusRule = function() {
			if (self.focused) {
				document.getElementById("focusStyle").sheet.deleteRule(0);
				self.focused = "";
				self._redraw();
			}
		}

		this._redraw = function () {
			$("#chat-stream").toggleClass('hide-on-focus', this.focused.length > 0);
		}
	}
)