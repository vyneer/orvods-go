var Chat = function(id, player, type, start, end, provider) {
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
	this.logProvider = provider;
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

	this.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='msg-chat'><span class='username loading-message'>Loading logs!</span></div>"
		+ "<div id='loading-message-2' class='msg-chat'><span class='message'>Please wait " + loadingEmote + "</span></div>"
		+ "<div id='loading-message-3' class='msg-chat'><span class='message'>" + randomMessage + "</span></div></div>";

	var self = this;
	if (self.timestampStart && self.timestampEnd && (self.playerType === "youtube" || self.playerType === "m3u8")) {
			self.recordedTime = moment(self.timestampStart).utc();
			self.endTime = moment(self.timestampEnd).utc();
			
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
	
			$.get(chatUrl[self.logProvider], {
				urls: JSON.stringify(overrustleLogsDates),
				from: self.recordedTime.clone().format("YYYY-MM-DD HH:mm:ss UTC"),
				to: self.endTime.clone().format("YYYY-MM-DD HH:mm:ss UTC")
			}, function(data) {
				self.chat = data;
				self.startChatStream();
				$("#loading-message").remove();
			});
	} else {
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
				if (data["items"][0]["liveStreamingDetails"]) {
					self.recordedTime = moment(data["items"][0]["liveStreamingDetails"]["actualStartTime"]).utc();
					self.endTime = moment(data["items"][0]["liveStreamingDetails"]["actualEndTime"]).utc();
				} else {
					self.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='msg-chat'><span class='username loading-message'>Youtube error!</span></div>"
						+ "<div id='loading-message-2' class='msg-chat'><span class='message'>Looks like this video isn't a stream recording</span></div>"
						+ "<div id='loading-message-3' class='msg-chat'><span class='message'>Please input start and end timestamps using the button next to url input and try again " + loadingEmote + "</span></div></div>";
				}	
			} else if (self.playerType === "chatonly" || self.playerType === "m3u8") {
				if (self.timestampStart && self.timestampEnd) {
					self.recordedTime = moment(self.timestampStart).utc();
					self.endTime = moment(self.timestampEnd).utc();
				} else {
					self.loadingMsg = "<div id='loading-message'><div id='loading-message-1' class='msg-chat'><span class='username loading-message'>Chat error!</span></div>"
						+ "<div id='loading-message-2' class='msg-chat'><span class='message'>You shouldn't be here >:(</span></div>"
						+ "<div id='loading-message-3' class='msg-chat'><span class='message'>Please input start and end timestamps using the button next to url input and try again " + loadingEmote + "</span></div></div>";
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
	
			$.get(chatUrl[self.logProvider], {
				urls: JSON.stringify(overrustleLogsDates),
				from: self.recordedTime.clone().format("YYYY-MM-DD HH:mm:ss UTC"),
				to: self.endTime.clone().format("YYYY-MM-DD HH:mm:ss UTC")
			}, function(data) {
				self.chat = data;
				self.startChatStream();
				$("#loading-message").remove();
			});
		});
	}

	$.get("/emotes", function(data) {
		self.emotes = data;
		// stolen from ceneza Blesstiny
		self.emoteList = {};
		self.emotes.forEach(v => self.emoteList[v.prefix] = v);
		const emoticons = self.emotes.map(v => v['prefix']).join('|');
		self.emoteRegexNormal = new RegExp(`(^|\\s)(${emoticons})(?=$|\\s)`, 'gm');
	});

	this.startChatStream = function() {
		this.status = "running";
	};

	this.pauseChatStream = function() {
		this.status = "paused";
	};

	this._htmlEncode = function(s) {
		return $('<div>').text(s).html();
	};

	this._htmlDecode = function(s) {
		return $('<div>').html(s).text();
	};

	this._formatMessage = function(message) {
		let nsfwClass = "";
		if (/\b(?:NSFW|SPOILER)\b/i.test(message)) { nsfwClass = "nsfw-link"; }
		if (/\b(?:NSFL)\b/i.test(message)) { nsfwClass = "nsfl-link"; }
		var messageReplaced = this._htmlDecode(message).linkify({className: `externallink ${nsfwClass}`});

		function replacer(p1) {
			return self._generateDestinyEmoteImage(p1.replace(/ /g,''));
		}

		messageReplaced = messageReplaced.replace(self.emoteRegexNormal, replacer);

		return this._greenTextify(messageReplaced);
	};

	this._renderComboMessage = function(emote, comboCount) {
		return self._generateDestinyEmoteImage(emote) + 
			"<span class='x'> " + comboCount + "x </span>" + 
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
			let flairArray = (self.features[username].slice(1,-1).length === 0) ? [] : self.features[username].slice(1,-1).split(",");
			let flairList = "";
			flairList += (username in customFlairs) ? `<i class='flair ${customFlairs[username]}'></i>` : "";
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

		self.chatStream.append("<div class='msg-chat' data-username='" + username + "'>" + 
			timeFormatted + featuresField + usernameField + 
			"<span class='message' onclick='document._removeFocusRule()'>" +
		  	message + "</span></div>");
	}

	this._generateDestinyEmoteImage = function(emote) {
		return " <div class='emote " + emote + "' title=" + emote + "/>";
	};

	this._greenTextify = function(message) {
		if (this._htmlDecode(message)[0] === '>') {
			return `<span class='greentext'>${message}</span>`;
		} else if (this._htmlDecode(message).substring(0, 3) === '/me') {
			return `<span class='me-text'>${message.slice(3, message.length)}</span>`;
		} else {
			return message;
		}
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
	} else if (self.playerType == "m3u8") {
		self.videoPlayer.addEventListener('progress', function() {
			self.actualPreviousTimeOffset = Math.floor(self.videoPlayer.currentTime);
		});
	}

	$('#chat-stream').on('scroll', function() {
		if (self.chatStream.scrollTop() + self.chatStream.innerHeight() >= self.chatStream[0].scrollHeight - 40) { 
			self.bottomDetector = true;
		} else {
			self.bottomDetector = false;
		}
	});

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
			var currentTimeOffset = (self.playerType === "chatonly") ? Math.floor(self.chatonlyCounter) : (self.playerType === "m3u8") ? Math.floor(self.videoPlayer.currentTime) : Math.floor(self.videoPlayer.getCurrentTime());
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

				// calculate the amount of messages within the timeframe
				let msgAmount = 0;
				for (let i = 0; i < utcFormat.length; i++) {
					msgAmount += self.chat[utcFormat[i]].length;
				};

				var randomTimeouts = Array.from({length: msgAmount}, () => Math.random());
				randomTimeouts.sort();

				i=0;

				utcFormat.forEach((element) => {
					self.chat[element].forEach(function(chatLine) {
						// Add a random delay between chat messages, makes it more readable
						// https://i.imgur.com/OJG6xft.gif
						setTimeout(function(){
							if (self.previousMessage == chatLine.message && self.emoteList[self.previousMessage]) {
								self.comboCount++;
								$("#chat-stream .msg-chat").last().remove();
								var comboMessage = self._renderComboMessage(self.previousMessage, self.comboCount);
								self._renderChatMessage(element, null, comboMessage);
							} else {
								self.comboCount = 1;
								self._renderChatMessage(element, chatLine.username, self._formatMessage(chatLine.message));
							}
					
							self.previousMessage = chatLine.message;
							if (self.bottomDetector) {
								self.chatStream.scrollTop(self.chatStream[0].scrollHeight);
							}
						}, randomTimeouts[i] * 400);
						i++;
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
