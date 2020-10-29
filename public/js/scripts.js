var globals = {};

$(document).ready(function() {
    var id = getUrlParameter("id");
    var v = getUrlParameter("v");
    var chatonly = getUrlParameter("chatonly");
    var time = (getUrlParameter("t")) ? getUrlParameter("t") : 0;
    var start = getUrlParameter("start");
    var end = getUrlParameter("end");
    var provider = (getUrlParameter("provider")) ? getUrlParameter("provider") : "orl";
    var page = 1;
    var playerActive = 0;
    var changelogActive = 0;
    var lwodActive = 0;
    var chatSide = localStorage.getItem('chatSide');
    var playerType = (id) ? "twitch" : (v) ? "youtube" : (chatonly) ? "chatonly" : null;
    const twitchButton = document.getElementById("twitch-button");
    const youtubeButton = document.getElementById("youtube-button");
    globals.sizes = localStorage.getItem('split-sizes');

    if (!chatSide) { 
        chatSide = 'right'
        localStorage.setItem('chatSide', chatSide); 
    }

    if (chatSide === 'right') {
        document.getElementById("player").style["flex-direction"] = "row";
    } else if (chatSide === 'left') {
        document.getElementById("player").style["flex-direction"] = "row-reverse";
    }

    if (globals.sizes) {
        globals.sizes = JSON.parse(globals.sizes);
    } else {
        globals.sizes = [80, 20];
    }

    if (id || v || chatonly) {
        var vidId = (playerType === "twitch") ? id : (playerType === "youtube") ? v : (playerType === "chatonly") ? "nothing" : null;
        loadPlayer(vidId, time, playerType, start, end, provider);
        $("#browse").hide();
        $("#player").show();
        $("#changelog").hide();
        $("#lwod").hide();
        playerActive = 1;
    } else {
        loadVODs("twitch").then(result => {
            allVODs = result;
            console.log(allVODs)
            console.log(result)
            return result.slice(0, 9);
        }).then(nineEntries => {
            createVodEntries(nineEntries, "twitch");
        });
        loadVODs("youtube").then(result => {
            allVids = result;
        });
        $("#player").hide();
        $("#browse").show();
        $("#changelog").hide();
        $("#lwod").hide();
        playerActive = 0;
    }

    globals.splitInstance = Split(['#video-player', '#chat-container'], {
        sizes: globals.sizes,
        gutterSize: 8,
        minSize: 200,
        cursor: 'col-resize',
        onDragEnd: function(sizes) {
            localStorage.setItem('split-sizes', JSON.stringify(sizes));
        }
    });

    $("#changelog-button").click(function() {
        if (changelogActive === 0) {
            $("#changelog").show();
            $("#player").hide();
            $("#browse").hide();
            $("#lwod").hide();
            changelogActive = 1
        } else {
            $("#changelog").hide();
            changelogActive = 0
            if (playerActive === 1) {
                $("#player").show();
                $("#browse").hide();
                $("#lwod").hide();
            } else {
                $("#player").hide();
                $("#browse").show();
                $("#lwod").hide();
            }
        }
    });

    $("#lwod-button").click(function() {
        if (lwodActive === 0) {
            $("#lwod").show();
            $("#changelog").hide();
            $("#player").hide();
            $("#browse").hide();
            lwodActive = 1
        } else {
            $("#lwod").hide();
            lwodActive = 0
            if (playerActive === 1) {
                $("#player").show();
                $("#browse").hide();
                $("#changelog").hide();
            } else {
                $("#player").hide();
                $("#browse").show();
                $("#changelog").hide();
            }
        }
    });

    $("#close-changelog-button").click(function() {
        $("#changelog").hide();
        if (playerActive === 1) {
            $("#player").show();
            $("#browse").hide();
            $("#lwod").hide();
        } else {
            $("#player").hide();
            $("#browse").show();
            $("#lwod").hide();
        }
    });

    $("#close-lwod-button").click(function() {
        $("#lwod").hide();
        if (playerActive === 1) {
            $("#player").show();
            $("#browse").hide();
            $("#changelog").hide();
        } else {
            $("#player").hide();
            $("#browse").show();
            $("#changelog").hide();
        }
    });

    $("#twitch-button").click(function() {
        if (!twitchButton.classList.contains("active")) {
            twitchButton.classList.add("active");
            youtubeButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVODs.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, "twitch");
        }
    })

    $("#youtube-button").click(function() {
        if (!youtubeButton.classList.contains("active")) {
            youtubeButton.classList.add("active");
            twitchButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVids.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, "youtube");
        }
    })

    $("#next-page-button").click(function() {
        vodinfo = twitchButton.classList.contains("active") ? allVODs : allVids;
        type = twitchButton.classList.contains("active") ? "twitch" : "youtube";
        if (page != Math.ceil(vodinfo.length/9)) {
            page += 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, type);
        }

        if (page === Math.ceil(vodinfo.length/9)) {
            $("#next-page-button").addClass("disabled");
        } else {
            $("#next-page-button").removeClass("disabled");
        }
        
        if (page === 1) {
            $("#previous-page-button").addClass("disabled");
        } else {
            $("#previous-page-button").removeClass("disabled");
        }
    });

    $("#previous-page-button").click(function() {
        vodinfo = twitchButton.classList.contains("active") ? allVODs : allVids;
        type = twitchButton.classList.contains("active") ? "twitch" : "youtube";
        if (page > 1) { 
            page -= 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, type);
        }

        if (page === Math.ceil(vodinfo.length/9)) {
            $("#next-page-button").addClass("disabled");
        } else {
            $("#next-page-button").removeClass("disabled");
        }

        if (page === 1) {
            $("#previous-page-button").addClass("disabled");
        } else {
            $("#previous-page-button").removeClass("disabled");
        }
    });

    $("#dec-delay-button").click(function() {
        delay = Number($("#delay").val()) - 1;
        $("#delay").val(delay);
    });

    $("#inc-delay-button").click(function() {
        delay = Number($("#delay").val()) + 1;
        $("#delay").val(delay);
    });

    $("#switch-sides-button").click(function() {
        if (document.getElementById("player").style["flex-direction"] === "row") {
            localStorage.setItem('chatSide', 'left');
            document.getElementById("player").style["flex-direction"] = "row-reverse";
            globals.splitInstance.destroy();
            globals.splitInstance = Split(['#video-player', '#chat-container'], {
                sizes: globals.sizes,
                gutterSize: 8,
                minSize: 200,
                cursor: 'col-resize',
                onDragEnd: function(sizes) {
                    globals.sizes = sizes;
                    localStorage.setItem('split-sizes', JSON.stringify(sizes));
                }
            });
            return true;
        }
        if (document.getElementById("player").style["flex-direction"] === "row-reverse") {
            localStorage.setItem('chatSide', 'right');
            document.getElementById("player").style["flex-direction"] = "row";
            globals.splitInstance.destroy();
            globals.splitInstance = Split(['#video-player', '#chat-container'], {
                sizes: globals.sizes,
                gutterSize: 8,
                minSize: 200,
                cursor: 'col-resize',
                onDragEnd: function(sizes) {
                    globals.sizes = sizes;
                    localStorage.setItem('split-sizes', JSON.stringify(sizes));
                }
            });
            return true;
        }
    });

    $("#log-fallback-button").click(function () {
        window.location.href += "&provider=vyneer";
    });

    // Check if Destiny is online every 5 minutes
    setInterval(loadDestinyStatus(), 300000);

    $("#header-title").click(function() {
        window.location = "/";
    });

    $("body").on("click", ".vod-entry", function() {
        window.location.href += "?id=" + $(this).attr("id"); 
    });

    $("body").on("click", ".vid-entry", function() {
        window.location.href += "?v=" + $(this).attr("id") + "&start=" + $(this).attr("starttime") + "&end=" + $(this).attr("endtime"); 
    });
});

var allVODs = [];
var allVids = [];

async function loadVODs(type) {
    let vodArray = [];
    if (type === "twitch") {
        var destinyVODsURL = "/vodinfo?user_id=" + destinyUserID + "&first=100&type=archive";
        let response = await fetch(destinyVODsURL);
        let data = await response.json();
        pageCursor = data.pagination.cursor;
        vodArray.push(...data.data);
        // if there are more than 100 vods, check next page and add everything there to the array; repeat until done
        while (data.data.length === 100 && pageCursor != ("" || null)) {
            destinyVODsURL = "/vodinfo?user_id=" + destinyUserID + "&first=100&type=archive&after=" + pageCursor;
            response = await fetch(destinyVODsURL);
            data = await response.json();
            pageCursor = data.pagination.cursor;
            vodArray.push(...data.data);
        };
        return vodArray;
    } else if (type === "youtube") {
        var destinyVidsURL = "https://vyneer.me/tools/ytvods";
        let response = await fetch(destinyVidsURL);
        let data = await response.json();
        vodArray.push(...data);
        return vodArray;
    }
};

var destinyUserID = 18074328;

var pageCursor = 0;

var loadDestinyStatus = function() {
    var destinyStatusUrl = "/userinfo?user_login=destiny";

    $.get(destinyStatusUrl, function(userdata) {
        data = userdata
        if (data.data === null || data.data.length === 0) {
            $("#destiny-status").text("Destiny is offline.");
            $("#destiny-status").css("color", "#a70000");
        } else {
            $("#destiny-status").text("Destiny is LIVE!");
            $("#destiny-status").css("color", "#01f335");            
        }
    })
}

var loadPlayer = function(id, time, type, start, end, provider) {
    $("#player").css("display", "flex");

    if (type === "twitch") {
        var player = new Twitch.Player("video-player", { video: id , time: time });
        var chat = new Chat(id, player, type, start, end, provider);
        var lwod = new LWOD(id, type, player);
        player.addEventListener(Twitch.Player.PLAYING, function() {
            chat.startChatStream();
        });
    
        player.addEventListener(Twitch.Player.PAUSE, function() {
            chat.pauseChatStream();
        });
    } else if (type === "youtube") {
        var player;
        var chat;
        var lwod;
        // creating a div to be replaced by yt's iframe
        replacedDiv = document.createElement('div');
        replacedDiv.id = "yt-player";
        document.querySelector("#video-player").appendChild(replacedDiv);
        window.onYouTubeIframeAPIReady = function() {
            player = new YT.Player("yt-player", { videoId: id , playerVars: {"start": time, "autoplay": 1, "playsinline": 1}});
            chat = new Chat(id, player, type, start, end, provider);
            lwod = new LWOD(id, type, player);
            player.addEventListener("onStateChange", function(event) {
                if (event.data == YT.PlayerState.PLAYING) {
                    chat.startChatStream();
                } else {
                    chat.pauseChatStream();
                }
            });
        }
        // add yt embed api after creating the function so it calls it after loading
        var tag = document.createElement('script');

        tag.src = "https://www.youtube.com/iframe_api";
        var firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else if (type === "chatonly") {
        var chat = new Chat(id, player, type, start, end, provider);
        chat.startChatStream();
    }

    $("body").css("overflow", "hidden");
}

var createVodEntries = function(vodData, type) {
    if (type === "twitch") {
        vodData.forEach(function(vod) {
            createVodEntry({
                id: vod.id, 
                title: vod.title, 
                image: vod.thumbnail_url.replace(/%([\s\S]*)(?=\.)/, "320x180"), 
                views: vod.view_count, 
                date: formatDate(vod.created_at), 
                length: vod.duration
            });
        })
    } else {
        vodData.forEach(function(vod) {
            createVidEntry({
                id: vod[0], 
                title: vod[1], 
                image: vod[4], 
                date: formatDate(vod[2]),
                starttime: vod[2],
                endtime: vod[3]
            });
        })
    }

};

var createVodEntry = function(vod) {
    $("#vod-tmpl").tmpl(vod).appendTo("#vod-list");
};

var createVidEntry = function(vod) {
    $("#vid-tmpl").tmpl(vod).appendTo("#vod-list");
};

var createLWODTimestamps = function(data, type) {
    if (type === "twitch") {
        data.forEach(function(timestamp) {
            createLWODEntry({
                starttime: timestamp[0], 
                endtime: timestamp[1], 
                game: timestamp[2], 
                subject: timestamp[3], 
                topic: timestamp[4]
            });
        })
    } else {
        data.forEach(function(timestamp) {
            var fullSec = timestamp[0];
            var hoursFloat = fullSec/(60*60);
            var hoursInt = Math.floor(hoursFloat);
            var minutesFloat = (hoursFloat - hoursInt)*60;
            var minutesInt = Math.floor(minutesFloat);
            var secInt = fullSec - (minutesInt*60 + hoursInt*60*60);
            createLWODEntry({
                starttime: `${hoursInt.toString().padStart(2, "0")}:${minutesInt.toString().padStart(2, "0")}:${secInt.toString().padStart(2, "0")}`, 
                endtime: "", 
                game: timestamp[1], 
                subject: timestamp[2], 
                topic: timestamp[3]
            });
        })
    }

};

var createLWODEntry = function(timestamp) {
    $("#timestamp-tmpl").tmpl(timestamp).appendTo(".lwod-insert");
};

