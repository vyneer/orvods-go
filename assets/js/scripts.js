var globals = {};

$(document).ready(function() {
    const timeregex = new RegExp('\d+s', 'gm');

    var id = getUrlParameter("id");
    var v = getUrlParameter("v");
    var hash = getUrlParameter("hash");
    var vodstinyTwitch = getUrlParameter("at");
    var vodstinyYoutube = getUrlParameter("ay");
    var odysee = getUrlParameter("od");
    var chatonly = getUrlParameter("chatonly");
    var cdn = getUrlParameter("cdn");
    var time = (getUrlParameter("t")) ? ((timeregex.test(getUrlParameter("t"))) ? getUrlParameter("t").substring(0, getUrlParameter("t").length - 1) : getUrlParameter("t")) : 0;
    var start = getUrlParameter("start");
    var end = getUrlParameter("end");
    var provider = (getUrlParameter("provider")) ? getUrlParameter("provider") : "orl";
    var page = 1;
    var playerActive = 0;
    var lwodActive = 0;
    var chatSide = localStorage.getItem('chatSide');
    var playerType = (id) ? "twitch" : (v) ? "youtube" : (hash) ? "m3u8" : (chatonly) ? "chatonly" : (vodstinyTwitch || vodstinyYoutube) ? "vodstiny" : (odysee) ? "odysee" : null;
    var tabType = "youtube";
    const twitchButton = document.getElementById("twitch-button");
    const youtubeButton = document.getElementById("youtube-button");
    const vodstinyButton = document.getElementById("vodstiny-button");
    var splits;
    globals.sizes = localStorage.getItem('split-sizes');

    vodModules.forEach((el) => {
        switch (el) {
            case "twitch":
                twitchButton.classList.toggle("visible")
                break;
            case "youtube":
                youtubeButton.classList.toggle("visible")
                break;
            case "vodstiny":
                vodstinyButton.classList.toggle("visible")
                break;
        }
    })

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
        switch (globals.sizes.length) {
            case 2:
                globals.dgg = false;
                break;
            case 3:
                globals.dgg = true;
                break;
        }
    } else {
        globals.sizes = [80, 20];
    }

    if (globals.dgg) {
        document.querySelector("#dgg-controls").innerText = "Hide live d.gg";
        let dggframe = document.createElement("iframe");
        dggframe.src = "https://destiny.gg/embed/chat";
        dggframe.id = "live-chat-container";
        dggframe.setAttribute("seamless", "seamless");
        document.querySelector("#player").prepend(dggframe);
        splits = ['#live-chat-container', '#video-player', '#chat-container'];
    } else {
        document.querySelector("#dgg-controls").innerText = "Show live d.gg";
        splits = ['#video-player', '#chat-container'];
    }

    if (id || v || hash || vodstinyYoutube || vodstinyTwitch || odysee || chatonly) {
        var vidId;
        switch (playerType) {
            case "twitch":
                vidId = id;
                break;
            case "youtube":
                vidId = v;
                document.querySelector("#delay").value = -4
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
            case "odysee":
                vidId = odysee;
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
        if (vodModules.includes("twitch")) {
            loadVODs("twitch").then(result => {
                allVODs = result;
            });
        }
        if (vodModules.includes("youtube")) {
            loadVODs("youtube").then(result => {
                allVids = result;
                return result.slice(0, 9);
            }).then(nineEntries => {
                createVodEntries(nineEntries, "youtube");
            });
        }
        $("#player").hide();
        $("#browse").show();
        $("#lwod").hide();
        $(".polecat-credit").hide();
        $("#copy-button").hide();
        playerActive = 0;
    }

    globals.splitInstance = Split(splits, {
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
            globals.splitInstance = Split(splits, {
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
            globals.splitInstance = Split(splits, {
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

    $("#dgg-controls").click(function () {
        if (globals.dgg) {
            splits = ['#video-player', '#chat-container'];
            let percent = globals.sizes[0];
            globals.sizes.shift();
            globals.sizes[0] = globals.sizes[0] + percent;
            globals.splitInstance.destroy();
            globals.splitInstance = Split(splits, {
                sizes: globals.sizes,
                gutterSize: 8,
                minSize: 200,
                cursor: 'col-resize',
                onDragEnd: function(sizes) {
                    globals.sizes = sizes;
                    localStorage.setItem('split-sizes', JSON.stringify(sizes));
                }
            });
            globals.dgg = false;
            localStorage.setItem('split-sizes', `[${globals.sizes}]`);
            document.querySelector("#live-chat-container").remove();
            document.querySelector("#dgg-controls").innerText = "Show live d.gg";
        } else {
            let dggframe = document.createElement("iframe");
            dggframe.src = "https://destiny.gg/embed/chat";
            dggframe.id = "live-chat-container";
            dggframe.setAttribute("seamless", "seamless");
            document.querySelector("#player").prepend(dggframe);
            splits = ['#live-chat-container', '#video-player', '#chat-container'];
            let percent;
            if (globals.sizes[0] > globals.sizes[1]) {
                percent = globals.sizes[0]/5;
                globals.sizes[0] = globals.sizes[0] - percent;
            } else {
                percent = globals.sizes[1]/5;
                globals.sizes[1] = globals.sizes[1] - percent;
            }
            globals.sizes.unshift(percent);
            globals.splitInstance.destroy();
            globals.splitInstance = Split(splits, {
                sizes: globals.sizes,
                gutterSize: 8,
                minSize: 200,
                cursor: 'col-resize',
                onDragEnd: function(sizes) {
                    globals.sizes = sizes;
                    localStorage.setItem('split-sizes', JSON.stringify(sizes));
                }
            });
            globals.dgg = true;
            localStorage.setItem('split-sizes', `[${globals.sizes}]`);
            document.querySelector("#dgg-controls").innerText = "Hide live d.gg";
        }
    });

    $("body").on("click", ".copy-orig", function(ev) {
        navigator.clipboard.writeText($(this).attr("copy"));
        ev.preventDefault();
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
                    element.originalID = element.id;
                    element.id = element.file.split('-')[0] + element.date.getTime();
                    vodArray.push(element);
                    vodMap[element.id] = element;
                }
            });
            data.twitch.forEach((element) => {
                if (!element.recording) {
                    element.service = 'twitch';
                    element.date = new Date(element.date);
                    element.originalID = element.id;
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

var pageCursor = 0;

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
            var videoSrc = `https://dgg.sfo3.digitaloceanspaces.com/vods/${map[id].file}`;
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
        case "odysee":
            var replacedVideo = document.createElement('video');
            replacedVideo.controls = true;
            replacedVideo.autoplay = true;
            replacedVideo.muted = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            document.querySelector("#video-player").appendChild(replacedVideo);
            replacedVideo.src = `https://player.odycdn.com/api/v4/streams/free/${decodeURI(id)}/1`;
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
                id: vod.id, 
                title: vod.title, 
                image: vod.thumbnail, 
                date: formatDate(vod.starttime),
                starttime: vod.starttime,
                endtime: vod.endtime
            });
        })
    } else if (type === "vodstiny") {
        vodData.forEach(function(vod) {
            let thumbnail;
            let og_vod;
            switch (vod.service) {
                case "youtube":
                    og_vod = allVids.find(o => o.id === vod.originalID);
                    if (og_vod !== undefined || null) {
                        thumbnail = og_vod.thumbnail
                    } else {
                        thumbnail = "css/vodstiny/yt-logo.png"
                    }
                    break;
                case "twitch":
                    og_vod = allVODs.find(o => o.id === vod.originalID);
                    if (og_vod !== undefined || null) {
                        thumbnail = og_vod.thumbnail_url.replace(/%([\s\S]*)(?=\.)/, "320x180")
                    } else {
                        thumbnail = "css/vodstiny/twitch-logo.png"
                    }
                    break;
                default:
                    thumbnail = "";
                    break;
            }
            createArchEntry({
                id: vod.id,
                type: (vod.service == "youtube") ? "ay" : "at",
                title: vod.title,
                image: thumbnail,
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
                starttime: timestamp.starttime, 
                endtime: timestamp.endtime, 
                game: timestamp.game, 
                subject: timestamp.subject, 
                topic: timestamp.topic
            }, type);
        })
    } else {
        data.forEach(function(timestamp) {
            $("th.end").remove();
            var fullSec = timestamp.time;
            var hoursFloat = fullSec/(60*60);
            var hoursInt = Math.floor(hoursFloat);
            var minutesFloat = (hoursFloat - hoursInt)*60;
            var minutesInt = Math.floor(minutesFloat);
            var secInt = fullSec - (minutesInt*60 + hoursInt*60*60);
            createLWODEntry({
                starttime: `${hoursInt.toString().padStart(2, "0")}:${minutesInt.toString().padStart(2, "0")}:${secInt.toString().padStart(2, "0")}`, 
                game: timestamp.game, 
                subject: timestamp.subject, 
                topic: timestamp.topic
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

