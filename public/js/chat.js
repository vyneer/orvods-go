var Chat = function(id, player, type, start, end) {
	if (id === "nothing") {
		this.videoId = "";
	} else {
		this.videoId = id;
	}
	this.status = "loading";
	this.skipView = false;
	this.videoPlayer = player;
	this.previousTimeOffset = -1;
	this.playerType = type;
	this.timestampStart = start;
	this.timestampEnd = end;
	this.features = [];

	this.chatStream = $("#chat-stream");
	this.lineLimit = $("#lineLimit");
	this.delay = $("#delay");

	this.actualPreviousTimeOffset = -1;
	this.previousMessage = '';
	this.comboCount = 1;
	this.bottomDetector = true;

	this.chatonlyCounter = 0;

	const randomEmote = cuteEmotes[Math.floor(Math.random() * cuteEmotes.length)];
	const randomMessage = memeMessages[Math.floor(Math.random() * memeMessages.length)];
	const loadingEmote = " <div class='emote " + randomEmote + "' title=" + randomEmote + "/>";

	this.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='chat-line'><span class='username loading-message'>Loading logs!</span></div>"
		+ "<div id='loading-message-2' class='chat-line'><span class='message'>Please wait " + loadingEmote + "</span></div>"
		+ "<div id='loading-message-3' class='chat-line'><span class='message'>" + randomMessage + "</span></div></div>";

	var self = this;

	$.get(servicesUrl[self.playerType] + this.videoId, function(vodData) {
		self.hReplace = new RegExp('([h])', 'gm');
		self.mReplace = new RegExp('([m])', 'gm');
		self.sReplace = new RegExp('([s])', 'gm');
		data = vodData;
		if (self.playerType === "twitch") {
			if (self.timestampStart && self.timestampEnd) {
				self.recordedTime = moment(self.timestampStart).utc();
				self.endTime = moment(self.timestampEnd).utc();
			} else {
				self.recordedTime = moment(data["data"][0]["created_at"]).utc();
				self.durationString = "PT" + data["data"][0]["duration"].replace(self.hReplace, 'H').replace(self.mReplace, 'M').replace(self.sReplace, 'S');
				self.duration = moment.duration(self.durationString).asSeconds();
				self.endTime = moment(self.recordedTime).add(self.duration, 'seconds').utc();
			}
		} else if (self.playerType === "youtube") {
				if (self.timestampStart && self.timestampEnd) {
					self.recordedTime = moment(self.timestampStart).utc();
					self.endTime = moment(self.timestampEnd).utc();
				} else {
					if (data["items"][0]["liveStreamingDetails"]) {
						self.recordedTime = moment(data["items"][0]["liveStreamingDetails"]["actualStartTime"]).utc();
						self.endTime = moment(data["items"][0]["liveStreamingDetails"]["actualEndTime"]).utc();
					} else {
						self.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='chat-line'><span class='username loading-message'>Youtube error!</span></div>"
							+ "<div id='loading-message-2' class='chat-line'><span class='message'>Looks like this video isn't a stream recording</span></div>"
							+ "<div id='loading-message-3' class='chat-line'><span class='message'>Please input start and end timestamps using the button next to url input and try again " + loadingEmote + "</span></div></div>";
					}
				}
		} else if (self.playerType === "chatonly") {
			if (self.timestampStart && self.timestampEnd) {
				self.recordedTime = moment(self.timestampStart).utc();
				self.endTime = moment(self.timestampEnd).utc();
			} else {
				self.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='chat-line'><span class='username loading-message'>Chat error!</span></div>"
					+ "<div id='loading-message-2' class='chat-line'><span class='message'>You shouldn't be here >:(</span></div>"
					+ "<div id='loading-message-3' class='chat-line'><span class='message'>Please input start and end timestamps using the button next to url input and try again " + loadingEmote + "</span></div></div>";
			}
		}
		
		self.chatStream.append(self.loadingMsg);

		self.difference = self.endTime.clone().startOf('day').diff(self.recordedTime.clone().startOf('day'), 'days');

		var overrustleLogsDates = [];

		for (let i = 0; i <= self.difference; i++) {
			if (self.recordedTime.format("MM") === self.recordedTime.clone().add(i, 'days').format("MM")) {
				var overrustleLogsStr = "https://dgg.overrustlelogs.net/Destinygg%20chatlog/" + 
					self.recordedTime.format("MMMM") + "%20" + 
					self.recordedTime.format("YYYY") + "/" + 
					self.recordedTime.format("YYYY") + "-" +
					self.recordedTime.format("MM") + "-" + self.recordedTime.clone().add(i, 'days').format("DD") + ".txt";
			} else {
				var overrustleLogsStr = "https://dgg.overrustlelogs.net/Destinygg%20chatlog/" + 
					self.recordedTime.clone().add(i, 'days').format("MMMM") + "%20" + 
					self.recordedTime.clone().add(i, 'days').format("YYYY") + "/" + 
					self.recordedTime.clone().add(i, 'days').format("YYYY") + "-" +
					self.recordedTime.clone().add(i, 'days').format("MM") + "-" + self.recordedTime.clone().add(i, 'days').format("DD") + ".txt";
			}
			overrustleLogsDates.push(overrustleLogsStr);
		}

		$.get(featuresUrl, {}, function (data) {
			self.features = data;
		});

		$.get("/chat", {
			urls: JSON.stringify(overrustleLogsDates),
			from: self.recordedTime.clone().format("YYYY-MM-DD HH:mm:ss UTC"),
			to: self.endTime.clone().format("YYYY-MM-DD HH:mm:ss UTC")
		}, function(data) {
			self.chat = data;
			self.startChatStream();
			$("#loading-message").remove();
		});
	});

	$.get("/emotes", function(data) {
		self.emotes = data;
		// stolen from ceneza Blesstiny
		self.emoteList = {};
		self.emotes.forEach(v => self.emoteList[v.prefix] = v);
		const emoticons = self.emotes.map(v => v['prefix']).join('|') + "|" + bbdggEmotes["bbdgg"].join('|');
		self.emoteRegexNormal = new RegExp(`(^|\\s)(${emoticons})(?=$|\\s)`, 'gm');
	});

	this.startChatStream = function() {
		this.status = "running";
	};

	this.pauseChatStream = function() {
		this.status = "paused";
	};

	this._parseUserData = function(data) {
		var styleString = "<style>\n";

		Object.keys(data).forEach(function(username) {
			styleString += ".user-" + username + " {\n";
			styleString += "\t color: " + data[username].color + " !important;\n";
			styleString += "}\n"
		});

		styleString += "</style>"

		$("head").append(styleString);
	};

	this._htmlEncode = function(s) {
		return $('<div>').text(s).html();
	};

	this._htmlDecode = function(s) {
		return $('<div>').html(s).text();
	};

	this._formatMessage = function(message) {
		var messageReplaced = this._htmlDecode(message).linkify();

		function replacer(p1) {
			return self._generateDestinyEmoteImage(p1.replace(/ /g,''));
		}

		messageReplaced = messageReplaced.replace(self.emoteRegexNormal, replacer);

		return this._greenTextify(messageReplaced);
	};

	this._renderComboMessage = function(emote, comboCount) {
		return self._generateDestinyEmoteImage(emote) + 
			"<span class='x'> x" + comboCount + " </span>" + 
			"<span class='combo'>C-C-C-COMBO</span>";
	}

	this._renderChatMessage = function(time, username, message) {
		var usernameField = "";
		var featuresField = "";
		var timeFormatted = "";
		var featuresList = "";
		if (time) {
			timeFormatted = "<span class='time'>" + moment(time).utc().format("HH:mm") + "</span><span class='time-seconds'>" + moment(time).utc().format(":ss") + " </span>";
		}
		if (username in self.features) {
			let flairArray = self.features[username].slice(1,-1).split(",");
			let flairList = "";
			flairArray.forEach(function(flair) {
				flair = flair.replace(/\s+/g, '').slice(1, -1);
				featuresList += flair + " ";
				flairList += "<i class='flair " + flair + "'></i>";
			});
			featuresField =  "<span class='features'>" + flairList + "</span>";
		}
		if (username) {
			usernameField = `<span onclick='document._addFocusRule("${username}")' class='user-${username} user ${featuresList}'>${username}</span><span class='message-divider'>:</span> `;
		}

		self.chatStream.append("<div class='chat-line' data-username='" + username + "'>" + 
			timeFormatted + featuresField + usernameField + 
			"<span class='message' onclick='document._removeFocusRule()'>" +
		  	message + "</span></div>");
	}

	this._generateDestinyEmoteImage = function(emote) {
		return " <div class='emote " + emote + "' title=" + emote + "/>";
	};

	this._greenTextify = function(message) {
		if (this._htmlDecode(message)[0] === '>') {
			return "<span class='greentext'>" + message + "</span>";
		} else {
			return message;
		}
	}

	this._formatTimeNumber = function(number) {
		return ("0" + number).slice(-2);
	}

	this._formatTime = function(milliseconds) {
		var secondsTotal = milliseconds / 1000;
		var hours = Math.floor(secondsTotal / 3600)
		var minutes = Math.floor((secondsTotal - hours * 3600) / 60);
		var seconds = secondsTotal % 60;

		return this._formatTimeNumber(hours) + ":" + 
					 this._formatTimeNumber(minutes) + ":" + 
					 this._formatTimeNumber(seconds);
	}

	if (self.playerType == "twitch") {
		self.videoPlayer.addEventListener(Twitch.Player.PLAYING, function() {
			self.actualPreviousTimeOffset = Math.floor(self.videoPlayer.getCurrentTime());
		});
	} else if (self.playerType == "youtube") {
		self.videoPlayer.addEventListener('onStateChange', function(event) {
			if (event.data == YT.PlayerState.PLAYING) {
				self.actualPreviousTimeOffset = Math.floor(self.videoPlayer.getCurrentTime());
			}
		});
	} else if (self.playerType == "chatonly") {
		self.actualPreviousTimeOffset = 0
	}

	/* can't make it work properly right now
	$('#chat-stream').on('scroll', function() { 
		console.log($(this).scrollTop())
		console.log($(this).innerHeight())
		console.log($(this)[0].scrollHeight)
		if ($(this).scrollTop() + $(this).innerHeight() >=  $(this)[0].scrollHeight) { 
			self.bottomDetector = true;
		} else {
			self.bottomDetector = false;
		}
	});
	*/

	$("#pause-controls").click(function() {
		if (self.status === "running") {
			$("#pause-controls").text("Start chat")
			self.status = "paused";
			clearInterval(self.chatInterval)
		} else if (self.status === "paused") {
			$("#pause-controls").text("Stop chat")
			self.status = "running";
			self.chatInterval = window.setInterval(function() {self.chatFunction()}, 500);
		}
	});

	self.chatFunction = function() {
		if (self.status == "running" && self.chat) {
			self.chatonlyCounter += 0.5;
			var currentTimeOffset = (self.playerType === "chatonly") ? Math.floor(self.chatonlyCounter) : Math.floor(self.videoPlayer.getCurrentTime());
			var utcFormat = [];
			var timestamps = [];

			if (currentTimeOffset != self.previousTimeOffset) {

				timeDifference = currentTimeOffset - self.actualPreviousTimeOffset;
				
				timestamps.push(self.recordedTime.clone().add(-(Number(self.delay.val())) + currentTimeOffset, 's').format().replace("+00:00", "Z"));

				if (timeDifference > 1 && timeDifference < 30) {
					for (let i = 1; i < timeDifference; i++) {
						timestamps.push(timestamp = self.recordedTime.clone().add(-(Number(self.delay.val())) + currentTimeOffset - i, 's').format().replace("+00:00", "Z"));
					};
				}

				timestamps.forEach((element) => {
					if (element in self.chat) {
						utcFormat.unshift(element);
					}
				});

				utcFormat.forEach((element) => {
					self.chat[element].forEach(function(chatLine) {
						if (self.previousMessage == chatLine.message && self.emoteList[self.previousMessage]) {
							self.comboCount++;
							$("#chat-stream .chat-line").last().remove();
							var comboMessage = self._renderComboMessage(self.previousMessage, self.comboCount);
							self._renderChatMessage(null, null, comboMessage);
						} else {
							self.comboCount = 1;
							self._renderChatMessage(element, chatLine.username, self._formatMessage(chatLine.message));
						}
	
						self.previousMessage = chatLine.message;
						//if (self.bottomDetector) {
							self.chatStream.animate({
								scrollTop: self.chatStream.prop("scrollHeight")
							}, 0);
						//}
					});
				});

				self.actualPreviousTimeOffset = currentTimeOffset;

				if (self.lineLimit.val() != "0" || self.lineLimit.val() != "") {
					if (self.chatStream.children().length > self.lineLimit.val()) {
						removeLine = "#chat-stream div:lt(" + (self.chatStream.children().length - self.lineLimit.val()) + ")";
						$(removeLine).remove();
					}
				}

			}

			self.previousTimeOffset = currentTimeOffset;

		}
	}

	self.chatInterval = window.setInterval(function() {self.chatFunction()}, 500);
};

// From https://stackoverflow.com/a/3890175
String.prototype.linkify = function() {
	// http://, https://, ftp://
	var urlPattern = /\b(?:https?|ftp):\/\/[a-z0-9-+&@#\/%?=~_|!:,.;]*[a-z0-9-+&@#\/%=~_|]/gim;
	// www. sans http:// or https://
	var pseudoUrlPattern = /(^|[^\/])(www\.[\S]+(\b|$))/gim;

	return this.replace(urlPattern, '<a class="externallink" href="$&">$&</a>')
						 .replace(pseudoUrlPattern, '$1<a class="externallink" href="http://$2">$2</a>');
};
