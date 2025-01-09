var globals = {};

$(document).ready(function() {
    shaka.polyfill.installAll();
    var urlParams = new URLSearchParams(window.location.search);
    var id = (platforms.includes("twitch")) ? urlParams.get("id") : "";
    var v = (platforms.includes("youtube")) ? urlParams.get("v") : "";
    var hash = (platforms.includes("m3u8")) ? urlParams.get("hash") : "";
    var vodstinyTwitch = (platforms.includes("vodstiny")) ? urlParams.get("at") : "";
    var vodstinyYoutube = (platforms.includes("vodstiny")) ? urlParams.get("ay") : "";
    var odysee = (platforms.includes("odysee")) ? urlParams.get("od") : "";
    var rumble = (platforms.includes("rumble")) ? urlParams.get("r") : "";
    var kick = (platforms.includes("kick")) ? urlParams.get("k") : "";
    var chatonly = (platforms.includes("chatonly")) ? urlParams.get("chatonly") : "";
    var cdn = (platforms.includes("m3u8")) ? urlParams.get("cdn") : "";
    var time = (urlParams.get("t")) ? (convertTimeToSeconds(urlParams.get("t")) ?? urlParams.get("t")) : 0;
    var start = urlParams.get("start");
    var end = urlParams.get("end");
    var provider = (urlParams.get("provider")) ? urlParams.get("provider") : "orl";
    var nochat = (urlParams.get("nochat")) ? urlParams.get("nochat") : "";
    var page = 1;
    var playerActive = 0;
    var lwodActive = 0;
    var chatSide = localStorage.getItem('chatSide');
    var playerType = (id) ? "twitch" : (v) ? "youtube" : (hash) ? "m3u8" : (chatonly) ? "chatonly" : (vodstinyTwitch || vodstinyYoutube) ? "vodstiny" : (odysee) ? "odysee" : (rumble) ? "rumble" : (kick) ? "kick" : null;
    var tabType = "youtube";
    const twitchButton = document.getElementById("twitch-button");
    const rumbleButton = document.getElementById("rumble-button");
    const kickButton = document.getElementById("kick-button");
    const youtubeButton = document.getElementById("youtube-button");
    const vodstinyButton = document.getElementById("vodstiny-button");
    const odysteveButton = document.getElementById("odysteve-button");
    const omnimirrorButton = document.getElementById("omnimirror-button");
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
            case "rumble":
                rumbleButton.classList.toggle("visible")
                break;
            case "kick":
                kickButton.classList.toggle("visible")
                break;
            case "vodstiny":
                vodstinyButton.classList.toggle("visible")
                break;
            case "odysteve":
                odysteveButton.classList.toggle("visible")
                break;
            case "omnimirror":
                omnimirrorButton.classList.toggle("visible")
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

    if (id || v || hash || vodstinyYoutube || vodstinyTwitch || odysee || rumble || kick || chatonly) {
        var vidId;
        switch (playerType) {
            case "twitch":
                vidId = id;
                break;
            case "youtube":
                vidId = v;
                document.querySelector("#delay").value = -3
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
            case "rumble":
                vidId = rumble;
                document.querySelector("#delay").value = -2
                break;
            case "kick":
                vidId = kick;
                break;
            case "chatonly":
                vidId = "nothing";
                $(".chatonly-setting").css('display', 'block');
                break;
            default:
                break;
        }
        if (vodstinyYoutube || vodstinyTwitch) {
            loadVODs("vodstiny").then(result => {
                return result[1];
            }).then((map) => {
                loadPlayer(vidId, time, playerType, cdn, start, end, provider, map, nochat);
            });
        } else {
            loadPlayer(vidId, time, playerType, cdn, start, end, provider, null, nochat);
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
        $(".rumble-credit").hide();
        $(".polecat-credit").hide();
        $(".odysteve-credit").hide();
        $(".omnimirror-credit").hide();
        $("#copy-button").hide();
        playerActive = 0;
    }

    if (!nochat) {
        globals.splitInstance = Split(splits, {
            sizes: globals.sizes,
            gutterSize: 8,
            minSize: 200,
            cursor: 'col-resize',
            onDragEnd: function(sizes) {
                localStorage.setItem('split-sizes', JSON.stringify(sizes));
            }
        });
    }

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
            $(".rumble-credit").hide();
            $(".polecat-credit").hide();
            $(".odysteve-credit").hide();
            $(".omnimirror-credit").hide();
            twitchButton.classList.add("active");
            tabType = "twitch";
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            kickButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVODs.slice((page - 1) * 9, page * 9);
            createVodEntries(nineEntries, tabType);
        }
    })

    $("#youtube-button").click(function() {
        if (!youtubeButton.classList.contains("active")) {
            $(".rumble-credit").hide();
            $(".polecat-credit").hide();
            $(".odysteve-credit").hide();
            $(".omnimirror-credit").hide();
            youtubeButton.classList.add("active");
            tabType = "youtube";
            twitchButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            kickButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = allVids.slice((page - 1) * 9, page * 9);
            createVodEntries(nineEntries, tabType);
        }
    })

    $("#vodstiny-button").click(function() {
        if (!vodstinyButton.classList.contains("active")) {
            $(".rumble-credit").hide();
            $(".polecat-credit").show();
            $(".odysteve-credit").hide();
            $(".omnimirror-credit").hide();
            vodstinyButton.classList.add("active");
            tabType = "vodstiny";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            kickButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allArch.length == 0) {
                loadVODs("vodstiny").then(result => {
                    allArch = result[0];
                    return result[0];
                }).then((arr) => {
                    return arr.slice((page - 1) * 9, page * 9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allArch.slice((page - 1) * 9, page * 9);
                createVodEntries(nineEntries, tabType);
            }
        }
    })

    $("#odysteve-button").click(function() {
        if (!odysteveButton.classList.contains("active")) {
            $(".rumble-credit").hide();
            $(".odysteve-credit").show();
            $(".polecat-credit").hide();
            $(".omnimirror-credit").hide();
            odysteveButton.classList.add("active");
            tabType = "odysteve";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            kickButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allOdysteve.length == 0) {
                loadVODs("odysteve").then(result => {
                    allOdysteve = result[0];
                    return result[0];
                }).then((arr) => {
                    return arr.slice((page - 1) * 9, page * 9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allOdysteve.slice((page - 1) * 9, page * 9);
                createVodEntries(nineEntries, tabType);
            }
        }
    })

    $("#omnimirror-button").click(function() {
        if (!omnimirrorButton.classList.contains("active")) {
            $(".rumble-credit").hide();
            $(".omnimirror-credit").show();
            $(".odysteve-credit").hide();
            $(".polecat-credit").hide();
            omnimirrorButton.classList.add("active");
            tabType = "omnimirror";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            kickButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allOmnimirror.length == 0) {
                loadVODs("omnimirror").then(result => {
                    allOmnimirror = result;
                    return result;
                }).then((arr) => {
                    return arr.slice((page - 1) * 9, page * 9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allOmnimirror.slice((page - 1) * 9, page * 9);
                createVodEntries(nineEntries, tabType);
            }
        }
    })

    $("#rumble-button").click(function() {
        if (!rumbleButton.classList.contains("active")) {
            $(".rumble-credit").show();
            $(".omnimirror-credit").hide();
            $(".odysteve-credit").hide();
            $(".polecat-credit").hide();
            rumbleButton.classList.add("active");
            tabType = "rumble";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            kickButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allRumblevods.length == 0) {
                loadVODs("rumble").then(result => {
                    allRumblevods = result;
                    return result;
                }).then((arr) => {
                    return arr.slice((page - 1) * 9, page * 9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allRumblevods.slice((page - 1) * 9, page * 9);
                createVodEntries(nineEntries, tabType);
            }
        }
    })

    $("#kick-button").click(function() {
        if (!kickButton.classList.contains("active")) {
            $(".rumble-credit").hide();
            $(".omnimirror-credit").hide();
            $(".odysteve-credit").hide();
            $(".polecat-credit").hide();
            kickButton.classList.add("active");
            tabType = "kick";
            twitchButton.classList.remove("active");
            youtubeButton.classList.remove("active");
            vodstinyButton.classList.remove("active");
            odysteveButton.classList.remove("active");
            rumbleButton.classList.remove("active");
            omnimirrorButton.classList.remove("active");
            page = 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            if (allKickvods.length == 0) {
                loadVODs("kick").then(result => {
                    allKickvods = result;
                    return result;
                }).then((arr) => {
                    return arr.slice((page - 1) * 9, page * 9);
                }).then((slice) => {
                    createVodEntries(slice, tabType);
                });
            } else {
                nineEntries = allKickvods.slice((page - 1) * 9, page * 9);
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
            case "odysteve":
                vodinfo = allOdysteve;
                break;
            case "omnimirror":
                vodinfo = allOmnimirror;
                break;
            case "rumble":
                vodinfo = allRumblevods;
                break;
            case "kick":
                vodinfo = allKickvods;
                break;
        }
        if (page != Math.ceil(vodinfo.length / 9)) {
            page += 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page - 1) * 9, page * 9);
            createVodEntries(nineEntries, tabType);
        }

        if (page === Math.ceil(vodinfo.length / 9)) {
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
            case "odysteve":
                vodinfo = allOdysteve;
                break;
            case "omnimirror":
                vodinfo = allOmnimirror;
                break;
            case "rumble":
                vodinfo = allRumblevods;
                break;
            case "kick":
                vodinfo = allKickvods;
                break;
        }
        if (page > 1) {
            page -= 1;
            $("#page-number").text(page);
            $("#vod-list").empty();
            nineEntries = vodinfo.slice((page - 1) * 9, page * 9);
            createVodEntries(nineEntries, tabType);
        }

        if (page === Math.ceil(vodinfo.length / 9)) {
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

    $("#log-fallback-button").click(function() {
        window.location.href += "&provider=vyneer";
    });

    $("#dgg-controls").click(function() {
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
                percent = globals.sizes[0] / 5;
                globals.sizes[0] = globals.sizes[0] - percent;
            } else {
                percent = globals.sizes[1] / 5;
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

    $("#disable-chat-button").click(function() {
        let params = new URLSearchParams(window.location.search);
        params.set("nochat", "true");
        window.location.search = decodeURIComponent(params.toString());
    });

    $("#enable-chat-button").click(function() {
        let params = new URLSearchParams(window.location.search);
        params.delete("nochat");
        window.location.search = decodeURIComponent(params.toString());
    });

    $("body").on("click", ".copy-orig", function(ev) {
        navigator.clipboard.writeText($(this).attr("copy"));
        ev.preventDefault();
    });

    $("body").on("click", ".nochat-button", function(ev) {
        window.location.href = window.location.href + $(this).attr("data-href");
        ev.preventDefault();
    });
});

var allVODs = [];
var allVids = [];
var allArch = [];
let allOdysteve = [];
let allKickvods = [];
let allRumblevods = [];
let allOmnimirror = [];

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
        case "odysteve": {
            let response = await fetch('https://api.lbry.tv/api/v1/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        "method": "claim_search",
                        "params": {
                            "channel": "@odysteve:7",
                            "order_by": "release_time",
                            "page": 1,
                            "page_size": 45,
                        }
                    }
                )
            });
            let data = await response.json();
            data.result.items.forEach((element) => {
                let vod = {};
                vod.title = element.value.title;
                vod.id = element.short_url.substring(7).replace("#", ":");
                vod.thumbnail = element.value.thumbnail.url;
                vod.duration = element.value.video.duration;
                const descriptionSplit = element.value.description.replace(/\r/g, "").split(/\n/);
                vod.starttime = descriptionSplit[0];
                vod.endtime = descriptionSplit[1];
                vodArray.push(vod);
                vodMap[vod.id] = vod;
            });
            return [vodArray, vodMap];
        }
        case "omnimirror": {
            var omnimirrorURL = omnimirrorUrl;
            let response = await fetch(omnimirrorURL);
            let data = await response.json();
            vodArray.push(...data);
            return vodArray;
        }
        case "rumble": {
            var rumbleURL = rumbleUrl;
            let response = await fetch(rumbleURL);
            let data = await response.json();
            vodArray.push(...data);
            return vodArray;
        }
        case "kick": {
            let response = await fetch('https://kick.vyneer-cors.duckdns.org/api/v1/channels/destiny', {
                method: 'GET',
            });
            let data = await response.json();
            vodArray.push(...data['previous_livestreams']);
            return vodArray;
        }
    }
};

var pageCursor = 0;

var loadPlayer = function(id, time, type, cdn, start, end, provider, map, nochat) {
    $("#player").css("display", "flex");

    if (nochat) {
        $("#chat-container").hide();
        $("#video-player").css("width", "100%")
        $("#enable-chat-button").show();
    } else {
        $("#disable-chat-button").show();
    }

    switch (type) {
        case "twitch": {
            var player = new Twitch.Player("video-player", { video: id, time: time });

            $("#copy-button").show();
            $("#copy-button").click(function() {
                let params = new URLSearchParams(window.location.href);
                params.set("t", convertSecondsToTime(player.getCurrentTime()));
                if (nochat) {
                    params.set("nochat", "true");
                }
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });

            var lwod = new LWOD(id, type, player);
            if (!nochat) {
                var chat = new Chat(id, player, type, start, end, provider);
                player.addEventListener(Twitch.Player.PLAYING, function() {
                    chat.startChatStream();
                });

                player.addEventListener(Twitch.Player.PAUSE, function() {
                    chat.pauseChatStream();
                });
            }
            break;
        }
        case "youtube": {
            var player;
            var chat;
            // creating a div to be replaced by yt's iframe
            replacedDiv = document.createElement('div');
            replacedDiv.id = "yt-player";
            document.querySelector("#video-player").appendChild(replacedDiv);
            window.onYouTubeIframeAPIReady = function() {
                player = new YT.Player("yt-player", { videoId: id, playerVars: { "start": time, "autoplay": 1, "playsinline": 1 } });

                player.addEventListener("onReady", function() {
                    $("#copy-button").show();
                    $("#copy-button").click(function() {
                        let params = new URLSearchParams(window.location.href);
                        params.set("t", convertSecondsToTime(player.getCurrentTime()));
                        if (nochat) {
                            params.set("nochat", "true");
                        }
                        navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
                    });

                    if (!nochat) {
                        chat = new Chat(id, player, type, start, end, provider);
                        player.addEventListener("onStateChange", function(event) {
                            if (event.data == YT.PlayerState.PLAYING) {
                                chat.startChatStream();
                            } else {
                                chat.pauseChatStream();
                            }
                        });
                    }
                    lwod = new LWOD(id, type, player);
                })
            }
            // add yt embed api after creating the function so it calls it after loading
            var tag = document.createElement('script');

            tag.src = "https://www.youtube.com/iframe_api";
            var firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
            break;
        }
        case "chatonly": {
            var chat = new Chat(id, player, type, start, end, provider);
            chat.startChatStream();
            break;
        }
        case "m3u8": {
            var replacedVideo = document.createElement('video');
            replacedVideo.controls = true;
            replacedVideo.autoplay = true;
            replacedVideo.muted = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            document.querySelector("#video-player").appendChild(replacedVideo);
            var videoSrc = `${corsProxyUrl}/https://${cdnUrl[cdn]}/${id}/chunked/index-dvr.m3u8`;
            if (Hls.isSupported()) {
                var hls = new Hls({
                    enableWorker: true,
                    xhrSetup: function(xhr) {
                        xhr.setRequestHeader('X-Requested-With', 'vyneer.me');
                    },
                });
                hls.loadSource(videoSrc);
                hls.attachMedia(replacedVideo);
            }
            else if (replacedVideo.canPlayType('application/vnd.apple.mpegurl')) {
                replacedVideo.src = videoSrc;
            }
            replacedVideo.crossOrigin = 'anonymous';
            replacedVideo.currentTime = time;

            if (!nochat) {
                var chat = new Chat(id, replacedVideo, type, start, end, provider);
                replacedVideo.addEventListener("play", function() {
                    chat.startChatStream();
                })

                replacedVideo.addEventListener("pause", function() {
                    chat.pauseChatStream();
                });
            }

            $("#copy-button").show();
            $("#copy-button").click(function() {
                let params = new URLSearchParams(window.location.href);
                params.set("t", convertSecondsToTime(replacedVideo.currentTime));
                if (nochat) {
                    params.set("nochat", "true");
                }
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });
            break;
        }
        case "vodstiny": {
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

            if (!nochat) {
                var chat = new Chat(id, replacedVideo, type, start, end, provider);
                replacedVideo.addEventListener("play", function() {
                    chat.startChatStream();
                })

                replacedVideo.addEventListener("pause", function() {
                    chat.pauseChatStream();
                });
            }

            $("#copy-button").show();
            $("#copy-button").click(function() {
                let params = new URLSearchParams(window.location.href);
                params.set("t", convertSecondsToTime(replacedVideo.currentTime));
                if (nochat) {
                    params.set("nochat", "true");
                }
                navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
            });
            break;
        }
        case "odysee": {
            var replacedVideo = document.createElement('video');
            replacedVideo.controls = true;
            replacedVideo.autoplay = true;
            replacedVideo.muted = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            document.querySelector("#video-player").appendChild(replacedVideo);
            fetch('https://api.lbry.tv/api/v1/proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(
                    {
                        "method": "resolve",
                        "params": {
                            "urls": `${decodeURI(id).replace(":", "#")}`,
                        }
                    }
                )
            }).then(resp => {
                return resp.json();
            }).then(data => {
                const m3u8URL = `https://player.odycdn.com/v6/streams/${data['result'][decodeURI(id).replace(":", "#")]['claim_id']}/${data['result'][decodeURI(id).replace(":", "#")]['value']['source']['sd_hash']}/master.m3u8`;
                const downloadURL = `https://odysee.com/$/download/${data['result'][decodeURI(id).replace(":", "#")]['permanent_url'].substring(7).replace('#', '/')}`;

                fetch(m3u8URL).then((resp) => {
                    if (resp.status === 200) {
                        const playerContainer = document.querySelector("#video-player");
                        playerContainer.classList.add("youtube-theme");
                        const shakaPlayer = new shaka.Player();
                        new shaka.ui.Overlay(shakaPlayer, playerContainer, replacedVideo);
                        shakaPlayer.attach(replacedVideo);
                        shakaPlayer.load(m3u8URL);
                        replacedVideo.controls = false;
                        replacedVideo.currentTime = time;
                    } else {
                        throw new Error('status != 200')
                    }
                }).catch((err) => {
                    console.warn('unable to get odysee m3u8 vod', err)
                    replacedVideo.src = downloadURL;
                    replacedVideo.currentTime = time;
                });

                if (!nochat) {
                    var chat = new Chat(id, replacedVideo, type, start, end, provider);
                    replacedVideo.addEventListener("play", function() {
                        chat.startChatStream();
                    })

                    replacedVideo.addEventListener("pause", function() {
                        chat.pauseChatStream();
                    });
                }

                $("#copy-button").show();
                $("#copy-button").click(function() {
                    let params = new URLSearchParams(window.location.href);
                    params.set("t", convertSecondsToTime(replacedVideo.currentTime));
                    if (nochat) {
                        params.set("nochat", "true");
                    }
                    navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
                });
            });
            break;
        }
        case "rumble": {
            const playerObservser = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    if (mutation.attributeName === 'src') {
                        if (time) mutation.target.currentTime = time;
                        playerObservser.disconnect();
                    }
                })
            })
            playerObservser.observe(document.querySelector('#video-player'), { attributes: true, subtree: true })
            Rumble("play", {
                video: id, div: "video-player", api: function(api) {
                    if (!nochat) {
                        var chat = new Chat(id, api, type, start, end, provider);
                        api.on("play", function() {
                            chat.startChatStream();
                        });

                        api.on("pause", function() {
                            chat.pauseChatStream();
                        });
                    }

                    $("#copy-button").show();
                    $("#copy-button").click(function() {
                        let params = new URLSearchParams(window.location.href);
                        params.set("t", convertSecondsToTime(api.getCurrentTime()));
                        if (nochat) {
                            params.set("nochat", "true");
                        }
                        navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
                    });
                }
            });
            break;
        }
        case "kick": {
            var replacedVideo = document.createElement('video');
            replacedVideo.autoplay = true;
            replacedVideo.id = "m3u8-player";
            replacedVideo.style.width = "100%";
            replacedVideo.style.objectFit = "contain";
            replacedVideo.style.height = "100%";
            const playerContainer = document.querySelector("#video-player");
            playerContainer.appendChild(replacedVideo);
            playerContainer.classList.add("youtube-theme");
            const shakaPlayer = new shaka.Player();
            new shaka.ui.Overlay(shakaPlayer, playerContainer, replacedVideo);
            shakaPlayer.getNetworkingEngine().registerRequestFilter(function(type, request, context) {
                request.headers['X-Requested-With'] = 'vyneer.me';
            });
            shakaPlayer.attach(replacedVideo);
            fetch(`https://kick.vyneer-cors.duckdns.org/api/v1/video/${id}`).then(resp => resp.json()).then(data => {
                var videoSrc = data.source;
                shakaPlayer.load(videoSrc);

                replacedVideo.crossOrigin = 'anonymous';
                replacedVideo.currentTime = time;

                const startTime = start ?? data?.livestream?.created_at?.split(' ').join('T') + 'Z'
                const endTime = end ?? Date.parse(startTime) + data?.livestream?.duration

                var chat = new Chat(id, replacedVideo, "m3u8", startTime, endTime, provider);
                replacedVideo.addEventListener("play", function() {
                    chat.startChatStream();
                })

                replacedVideo.addEventListener("pause", function() {
                    chat.pauseChatStream();
                });

                $("#copy-button").show();
                $("#copy-button").click(function() {
                    let params = new URLSearchParams(window.location.href);
                    params.set("t", convertSecondsToTime(replacedVideo.currentTime));
                    if (nochat) {
                        params.set("nochat", "true");
                    }
                    navigator.clipboard.writeText(`${decodeURIComponent(params.toString())}`);
                });
            })
            break;
        }
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
                // vodstiny timestamps are 5h off bc of timezone memes, adjusting for it
                starttime: moment.utc(vod.date).add(5, 'hours').toISOString(),
                endtime: moment.utc(vod.date).add(17, 'hours').toISOString()
            });
        })
    } else if (type === "odysteve") {
        vodData.forEach(function(vod) {
            createOdysteveEntry({
                id: vod.id.replace('#', ':'),
                title: vod.title,
                image: vod.thumbnail,
                date: formatDate(vod.starttime),
                starttime: vod.starttime,
                endtime: vod.endtime,
                length: formatLength(vod.duration)
            });
        })
    } else if (type === "omnimirror") {
        vodData.forEach(function(vod) {
            createRumbleEntry({
                id: `${vod.embed_id}`,
                link: vod.link,
                title: vod.title,
                image: vod.thumbnail,
                date: formatDate(vod.starttime),
                starttime: vod.starttime,
                endtime: vod.endtime
            });
        })
    } else if (type === "rumble") {
        vodData.forEach(function(vod) {
            createRumbleEntry({
                id: `${vod.embed_id}`,
                link: vod.link,
                title: vod.title,
                image: vod.thumbnail,
                date: formatDate(vod.starttime),
                starttime: vod.starttime,
                endtime: vod.endtime
            });
        })
    } else if (type === "kick") {
        vodData.forEach(function(vod) {
            createKickEntry({
                id: vod?.video?.uuid,
                title: vod?.session_title,
                image: vod?.thumbnail?.src,
                date: formatDate(vod.created_at)
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

var createOdysteveEntry = function(vod) {
    $("#os-tmpl").tmpl(vod).appendTo("#vod-list");
};

var createRumbleEntry = function(vod) {
    $("#rumble-tmpl").tmpl(vod).appendTo("#vod-list");
};

var createKickEntry = function(vod) {
    if (platforms.includes("kick")) {
        $("#kick-tmpl").tmpl(vod).appendTo("#vod-list");
        return
    }
    $("#kick-redirect-tmpl").tmpl(vod).appendTo("#vod-list");
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
            var hoursFloat = fullSec / (60 * 60);
            var hoursInt = Math.floor(hoursFloat);
            var minutesFloat = (hoursFloat - hoursInt) * 60;
            var minutesInt = Math.floor(minutesFloat);
            var secInt = fullSec - (minutesInt * 60 + hoursInt * 60 * 60);
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

