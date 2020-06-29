var LWOD = function(id, player) {
	this.player = player;
	this.data = [];

	var self = this;

	$.get(lwodUrl, {
		id: id
	}, function (data) {
		self.data = data;
		if (data != "") {
			var uniqueGames = new Set();
			$("#skipGameSelect").empty();
			data.forEach(element => {
				uniqueGames.add(element[2]);
			});
			uniqueGames.forEach(element => {
				$('#skipGameSelect').append(`<option value="${element}"> 
                                       ${element} 
                                  </option>`);
			});
			$("#lwod-button").show();
			$("#skip-button").show();
			createLWODTimestamps(data);
		}
	});

	this.LWODSkipper = function() {
		oldtime = 0;
		array = Array.from(document.getElementById("time-container").children);
		self.LWODInterval = window.setInterval(function() {
			currenttime = Math.floor(self.player.getCurrentTime());
			array.forEach(element => {
				split = element.innerHTML.split(" - ")
				if (currenttime > moment.duration(split[0]).asSeconds() && currenttime < moment.duration(split[1]).asSeconds() && currenttime != oldtime) {
					self.player.seek(moment.duration(split[1]).asSeconds());
				}
			});
			oldtime = currenttime;
		}, 1000);
	}

	this.calculateSkips = function(timestamps, input) {
		$(".skip-timestamps").remove();
		var gameSkipTimes = [];
		var other = [];
		var skipperino = [];
		timestamps.forEach(element => {
			string = element[0] + "," + element[1]
			if (element[2] === input && element[3] === "") {
				gameSkipTimes.push(string);
			} else {
				other.push(string);
			}
		});
		gameSkipTimes.forEach(time => {
			i = 0;
			z = 0;
			split = time.split(",");
			split2 = other[i].split(",");
			other.forEach(element => {
				split2 = element.split(",");
				split3 = (i>0) ? other[i-1].split(",") : other[i].split(",");
				string = "";
				if (z == 0) {
					string += split[0];
				}
				if (moment.duration(split2[0]) > moment.duration(split[0]) && moment.duration(split2[0]) < moment.duration(split[1])) {
					if (z > 0) {
						string = split3[1] + "," + split2[0];
					} else {
						string += "," + split2[0];
					}
					skipperino.push(string);
				}
				if (moment.duration(split2[0]) > moment.duration(split[1]) && moment.duration(split3[1]) < moment.duration(split[1])) {
					string = split3[1] + "," + split[1];
					skipperino.push(string);
				}
				if ((moment.duration(split2[0]) > moment.duration(split[0]) && moment.duration(split2[0]) < moment.duration(split[1])) || (moment.duration(split2[0]) > moment.duration(split[1]) && moment.duration(split3[1]) < moment.duration(split[1]))) {
					z += 1
				}
				i += 1;
			});
		});

		
		$("#time-msg").append("<div class='skip-timestamps'>Skipping these times:</div>")
		skipperino.forEach(element => {
			split = element.split(",");
			$("#time-container").append(`<div class='skip-timestamps'>${split[0]} - ${split[1]}</div>`);
		});

		self.LWODSkipper();
	}

	$("body").on("click", ".timestamp-entry", function() {
		timestamp = moment.duration($(this).attr("starttime")).asSeconds();
		player.seek(timestamp);
		$("#lwod").hide();
		$("#player").show();
	});
	
	$("#skipGameButton").click(function() {
		self.calculateSkips(self.data, $("#skipGameSelect").val());
	});

	$("#stopSkipGameButton").click(function() {
		$(".skip-timestamps").remove();
		clearInterval(self.LWODInterval);
	});
}