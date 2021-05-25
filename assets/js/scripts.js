var globals = {};

$(document).ready(function() {
    var id = getUrlParameter("id");
    var v = getUrlParameter("v");
    var hash = getUrlParameter("hash");
    var vodstinyTwitch = getUrlParameter("at");
    var vodstinyYoutube = getUrlParameter("ay");
    var chatonly = getUrlParameter("chatonly");
    var cdn = getUrlParameter("cdn");
    var time = (getUrlParameter("t")) ? ((getUrlParameter("t").slice(-1) == "s") ? getUrlParameter("t").substring(0, getUrlParameter("t").length - 1) : getUrlParameter("t")) : 0;
    var start = getUrlParameter("start");
    var end = getUrlParameter("end");
    var provider = (getUrlParameter("provider")) ? getUrlParameter("provider") : "orl";
    var page = 1;
    var playerActive = 0;
    var lwodActive = 0;
    var chatSide = localStorage.getItem('chatSide');
    var playerType = (id) ? "twitch" : (v) ? "youtube" : (hash) ? "m3u8" : (chatonly) ? "chatonly" : (vodstinyTwitch || vodstinyYoutube) ? "vodstiny" : null;
    var tabType = "youtube";
    const twitchButton = document.getElementById("twitch-button");
    const youtubeButton = document.getElementById("youtube-button");
    const vodstinyButton = document.getElementById("vodstiny-button");
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

    if (id || v || hash || vodstinyYoutube || vodstinyTwitch || chatonly) {
        var vidId;
        switch (playerType) {
            case "twitch":
                vidId = id;
                break;
            case "youtube":
                vidId = v;
                break;
            case "m3u8":
                vidId = hash;
                break;
            case "vodstiny":
                if (vodstinyYoutube) {
                    vidId = vodstinyYoutube;
                } else {
                    vidId = vodstinyTwitch;
                }
                break;
            case "chatonly":
                vidId = "nothing";
                break;
            default:
                break;
        }
        if (vodstinyYoutube || vodstinyTwitch) {
            loadVODs("vodstiny").then(result => {
                return result[1];
            }).then((map) => {
                loadPlayer(vidId, time, playerType, cdn, start, end, provider, map);
            });
        } else {
            loadPlayer(vidId, time, playerType, cdn, start, end, provider);
        }
        $("#browse").hide();
        $("#player").show();
        $("#lwod").hide();
        playerActive = 1;
    } else {
        loadVODs("twitch").then(result => {
            allVODs = result;
        });
        loadVODs("youtube").then(result => {
            allVids = result;
            return result.slice(0, 9);
        }).then(nineEntries => {
            createVodEntries(nineEntries, "youtube");
        });
        $("#player").hide();
        $("#browse").show();
        $("#lwod").hide();
        $(".polecat-credit").hide();
        $("#copy-button").hide();
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

    $("#lwod-button").click(function() {
        if (lwodActive === 0) {
            $("#lwod").show();
            $("#player").hide();
            $("#browse").hide();
            lwodActive = 1
        } else {
            $("#lwod").hide();
            lwodActive = 0
            if (playerActive === 1) {
                $("#player").show();
                $("#browse").hide();
            } else {
                $("#player").hide();
                $("#browse").show();
            }
        }
    });

    $("#close-lwod-button").click(function() {
        $("#lwod").hide();
        if (playerActive === 1) {
            $("#player").show();
            $("#browse").hide();
        } else {
            $("#player").hide();
            $("#browse").show();
        }
    });

    $("#twitch-button").click(function() {
        if (!twitchButton.classList.contains("active")) {
            $(".polecat-credit").hide();
            twitchButton.classList.add("active");
            tabType = "twitch";
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVODs.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, tabType);
        }
    })

    $("#youtube-button").click(function() {
        if (!youtubeButton.classList.contains("active")) {
            $(".polecat-credit").hide();
            youtubeButton.classList.add("active");
            tabType = "youtube";
            twitchButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVids.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, tabType);
        }
    })

    $("#vodstiny-button").click(function() {
        if (!vodstinyButton.classList.contains("active")) {
            $(".polecat-credit").show();
            vodstinyButton.classList.add("active");
            tabType = "vodstiny";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allArch.length == 0) {
                loadVODs("vodstiny").then(result => {
                    allArch = result[0];
                    return result[0];
                }).then((arr) => {
                    return arr.slice((page-1)*9,page*9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allArch.slice((page-1)*9,page*9);
                createVodEntries(nineEntries, tabType);
            }
        }
    })

    $("#next-page-button").click(function() {
        let vodinfo;
        switch (tabType) {
            case "twitch":
                vodinfo = allVODs;
                break;
            case "youtube":
                vodinfo = allVids;
                break;
            case "vodstiny":
                vodinfo = allArch;
                break;
        }
        if (page != Math.ceil(vodinfo.length/9)) {
            page += 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, tabType);
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
        let vodinfo;
        switch (tabType) {
            case "twitch":
                vodinfo = allVODs;
                break;
            case "youtube":
                vodinfo = allVids;
                break;
            case "vodstiny":
                vodinfo = allArch;
                break;
        }
        if (page > 1) { 
            page -= 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page-1)*9,page*9);
            createVodEntries(nineEntries, tabType);
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
        window.location = window.location.origin + window.location.pathname;
    });

    $("body").on("click", ".vod-entry", function() {
        window.location.href += "?id=" + $(this).attr("id"); 
    });

    $("body").on("click", ".vid-entry", function() {
        window.location.href += "?v=" + $(this).attr("id") + "&start=" + $(this).attr("starttime") + "&end=" + $(this).attr("endtime"); 
    });

    $("body").on("click", ".arch-entry", function() {
        window.location.href += `?${$(this).attr("type")}=` + $(this).attr("id") + "&start=" + $(this).attr("starttime") + "&end=" + $(this).attr("endtime"); 
    });

    $("body").on("click", ".copy-link", function(ev) {
        navigator.clipboard.writeText(window.location.origin + window.location.pathname + $(this).attr("copy"));
        ev.stopPropagation();
    });

    $("body").on("click", ".copy-orig", function(ev) {
        navigator.clipboard.writeText($(this).attr("copy"));
        ev.stopPropagation();
    });
});

var allVODs = [];
var allVids = [];
var allArch = [];

async function loadVODs(type) {
    let vodArray = [];
    let vodMap = new Map();
    switch (type) {
        case "twitch": {
            var destinyVODsURL = "vodinfo?user_id=" + destinyUserID + "&first=100&type=archive";
            let response = await fetch(destinyVODsURL);
            let data = await response.json();
            pageCursor = data.pagination.cursor;
            vodArray.push(...data.data);
            // if there are more than 100 vods, check next page and add everything there to the array; repeat until done
            while (data.data.length === 100 && pageCursor != ("" || null)) {
                destinyVODsURL = "vodinfo?user_id=" + destinyUserID + "&first=100&type=archive&after=" + pageCursor;
                response = await fetch(destinyVODsURL);
                data = await response.json();
                pageCursor = data.pagination.cursor;
                vodArray.push(...data.data);
            };
            return vodArray;
        }
        case "youtube": {
            var destinyVidsURL = ytvodUrl;
            let response = await fetch(destinyVidsURL);
            let data = await response.json();
            vodArray.push(...data);
            return vodArray;
        }
        case "vodstiny": {
            let response = await fetch(vodstinyUrl);
            let data = await response.json();
            data.youtube.forEach((element) => {
                if (!element.recording) {
                    element.service = 'youtube';
                    element.date = new Date(element.date);
                    element.id = element.file.split('-')[0] + element.date.getTime();
                    vodArray.push(element);
                    vodMap[element.id] = element;
                }
            });
            data.twitch.forEach((element) => {
                if (!element.recording) {
                    element.service = 'twitch';
                    element.date = new Date(element.date);
                    element.id = element.title.split('-')[0] + element.date.getTime();
                    vodArray.push(element);
                    vodMap[element.id] = element;
                }
            });
            vodArray = vodArray.sort((a, b) => b.date - a.date);
            return [vodArray, vodMap];
        }
    }
};

var destinyUserID = 18074328;

var pageCursor = 0;

var loadDestinyStatus = function() {
    var destinyStatusUrl = "userinfo?user_login=destiny";

    $.get(destinyStatusUrl, function(userdata) {
        data = userdata
        if (data.data === undefined || data.data.length === 0) {
            $("#destiny-status").text("Destiny is offline.");
            $("#destiny-status").css("color", "#a70000");
        } else {
            $("#destiny-status").text("Destiny is LIVE!");
            $("#destiny-status").css("color", "#01f335");            
        }
    })
}

var loadPlayer = function(id, time, type, cdn, start, end, provider, map) {
    $("#player").css("display", "flex");

    switch (type) {
        case "twitch":
            var player = new Twitch.Player("video-player", { video: id , time: time });

            $("#copy-button").show();
            $("#copy-button").click(function () {
                let params = new URLSearchParams(window.location.href);
                params.set("t", `${Math.round(player.getCurrentTime())}s`);
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });

            var chat = new Chat(id, player, type, start, end, provider);
            var lwod = new LWOD(id, type, player);
            player.addEventListener(Twitch.Player.PLAYING, function() {
                chat.startChatStream();
            });
        
            player.addEventListener(Twitch.Player.PAUSE, function() {
                chat.pauseChatStream();
            });
            break;
        case "youtube":
            var player;
            var chat;
            // creating a div to be replaced by yt's iframe
            replacedDiv = document.createElement('div');
            replacedDiv.id = "yt-player";
            document.querySelector("#video-player").appendChild(replacedDiv);
            window.onYouTubeIframeAPIReady = function() {
                player = new YT.Player("yt-player", { videoId: id , playerVars: {"start": time, "autoplay": 1, "playsinline": 1}});
    
                $("#copy-button").show();
                $("#copy-button").click(function () {
                    let params = new URLSearchParams(window.location.href);
                    params.set("t", `${Math.round(player.getCurrentTime())}`);
                    navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
                });
    
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
            break;
        case "chatonly":
            var chat = new Chat(id, player, type, start, end, provider);
            chat.startChatStream();
            break;
        case "m3u8":
            var replacedVideo = document.createElement('video');
            replacedVideo.controls = true;
            replacedVideo.autoplay = true;
            replacedVideo.muted = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            document.querySelector("#video-player").appendChild(replacedVideo);
            var videoSrc = `https://immense-bayou-94249.herokuapp.com/https://${cdnUrl[cdn]}/${id}/chunked/index-dvr.m3u8`;
            if (Hls.isSupported()) {
                var hls = new Hls();
                hls.loadSource(videoSrc);
                hls.attachMedia(replacedVideo);
            }
            else if (replacedVideo.canPlayType('application/vnd.apple.mpegurl')) {
                replacedVideo.src = videoSrc;
            }
            replacedVideo.currentTime = time;
    
            var chat = new Chat(id, replacedVideo, type, start, end, provider);
            replacedVideo.addEventListener("play", function () {
                chat.startChatStream();
            })
        
            replacedVideo.addEventListener("pause", function() {
                chat.pauseChatStream();
            });
    
            $("#copy-button").show();
            $("#copy-button").click(function () {
                let params = new URLSearchParams(window.location.href);
                params.set("t", `${Math.round(replacedVideo.currentTime)}`);
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });
            break;
        case "vodstiny":
            var replacedVideo = document.createElement('video');
            replacedVideo.controls = true;
            replacedVideo.autoplay = true;
            replacedVideo.muted = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            document.querySelector("#video-player").appendChild(replacedVideo);
            var videoSrc = `https://polecat.me/video/vods/${map[id].service}/${map[id].file}`;
            replacedVideo.src = videoSrc;
            replacedVideo.currentTime = time;
    
            var chat = new Chat(id, replacedVideo, type, start, end, provider);
            replacedVideo.addEventListener("play", function () {
                chat.startChatStream();
            })
        
            replacedVideo.addEventListener("pause", function() {
                chat.pauseChatStream();
            });
    
            $("#copy-button").show();
            $("#copy-button").click(function () {
                let params = new URLSearchParams(window.location.href);
                params.set("t", `${Math.round(replacedVideo.currentTime)}`);
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });
            break;
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
    } else if (type === "youtube") {
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
    } else if (type === "vodstiny") {
        vodData.forEach(function(vod) {
            createArchEntry({
                id: vod.id,
                type: (vod.service == "youtube") ? "ay" : "at",
                title: vod.title,
                image: (vod.service == "youtube") ? "https://polecat.me/img/yt-logo.png" : "https://polecat.me/img/twitch-logo.png",
                date: formatDate(vod.date),
                starttime: moment.utc(vod.date).toISOString(),
                endtime: moment.utc(vod.date).add(12, 'hours').toISOString()
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

var createArchEntry = function(vod) {
    $("#arch-tmpl").tmpl(vod).appendTo("#vod-list");
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
            }, type);
        })
    } else {
        data.forEach(function(timestamp) {
            $("th.end").remove();
            var fullSec = timestamp[0];
            var hoursFloat = fullSec/(60*60);
            var hoursInt = Math.floor(hoursFloat);
            var minutesFloat = (hoursFloat - hoursInt)*60;
            var minutesInt = Math.floor(minutesFloat);
            var secInt = fullSec - (minutesInt*60 + hoursInt*60*60);
            createLWODEntry({
                starttime: `${hoursInt.toString().padStart(2, "0")}:${minutesInt.toString().padStart(2, "0")}:${secInt.toString().padStart(2, "0")}`, 
                game: timestamp[1], 
                subject: timestamp[2], 
                topic: timestamp[3]
            }, type);
        })
    }

};

var createLWODEntry = function(timestamp, type) {
    if (type === "twitch") {
        $("#timestamp-tmpl").tmpl(timestamp).appendTo(".lwod-insert");
    } else {
        $("#timestamp-tmpl-yt").tmpl(timestamp).appendTo(".lwod-insert");
    }
};

