var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
];

const destinyUserID = 18074328;
const vodModules = ["youtube", "vodstiny"]

// vyneer.me stuff, make sure to edit if you have your own logging system/not gonna use my logs
var featuresUrl = "https://vyneer.me/tools/features";
var ytvodUrl = "https://vyneer.me/tools/ytvods";
var lwodUrl = "https://vyneer.me/tools/lwod";

var vodstinyUrl = "https://polecat.anax.feralhosting.com/vods.json";

var chatUrl = {
    "orl" : "chat",
    "vyneer" : "https://vyneer.me/tools/logs"
}

var cdnUrl = {
    "ttv1" : "vod-secure.twitch.tv",
    "ttv2" : "vod-metro.twitch.tv",
    "ttv3" : "vod-pop-secure.twitch.tv",
    "d2e2" : "d2e2de1etea730.cloudfront.net",
    "d2nv" : "d2nvs31859zcd8.cloudfront.net",
    "dqrp" : "dqrpb9wgowsf5.cloudfront.net",
    "ds0h" : "ds0h3roq6wcgc.cloudfront.net",
    "d2ab" : "d2aba1wr3818hz.cloudfront.net",
    "d3c2" : "d3c27h4odz752x.cloudfront.net",
    "dgef" : "dgeft87wbj63p.cloudfront.net",
    "d1m7" : "d1m7jfoe9zdc1j.cloudfront.net"
}

var servicesUrl = {
    "twitch" : "vodinfo?id=",
    "youtube" : "vidinfo?id=",
    "chatonly" : "",
    "m3u8" : "",
}

var customFlairs = {
    "Ban" : "ban",
    "vyneer_" : "cute",
    "vyneer" : "cute"
}

var cuteEmotes = ['ASLAN', 'AYAYA', 'Blubstiny', 'Cutestiny', 'DestiSenpaii', 'FeelsOkayMan', 
                    'FerretLOL', 'FrankerZ', 'Hhhehhehe', 'NOBULLY', 'OhMyDog', 'PepoTurkey',
                    'POTATO', 'Slugstiny', 'SoDoge', 'TeddyPepe', 'widepeepoHappy', 'WOOF',
                    'Wowee', 'YEE', 'YEEHAW', 'ComfyAYA', 'ComfyFerret', 'MiyanoHype',
                    'PepoComfy', 'ComfyDog', 'nathanAYAYA', 'nathanWeeb'];

var memeMessages = ["<div class='emote YEE' title=YEE></div> neva lie, <div class='emote YEE' title=YEE></div> neva, <div class='emote YEE' title=YEE></div> neva lie.",
                    "Don't believe his lies.", "You could've played that better.", "Dishonorable PVP <div class='emote OverRustle' title=OverRustle></div>", 
                    "how do not have any cups in your apartment wtf",
                    "destiny before you have sex are you supposed to have a boner before the girl sees it?", 
                    "Well RightToBearArmsLOL, honestly, I think I might talk to Steven about your odd rhetoric.",
                    "BAR BAR BAR", "he handles my", "nukesys", "Did I shield in Lords Mobile?", "THE TIME FOR CHILLING HAS PASSED",
                    "OK HERES THE PLAN", "NO TEARS NOW, ONLY DREAMS", "How did I end up cleaning carpets? <div class='emote LeRuse' title=LeRuse></div>",
                    "B O D G A Y", "JIMMY NOOOO", "<div class='emote nathanTiny2' title=nathanTiny2></div>", ">more like", "Chat, don't woof.",
                    "Yeah, fuck off buddy we absolutely need more RNA duos.", "kids fuckin dirt nasty man", 
                    "Fuckin every time this kid steps in the battleground someone dies.",
                    "HELP MEEEE <div class='emote OOOO' title=OOOO></div>", "You're a fucking statitician!", 
                    "YOU'RE A DUMBFUCK! <div class='emote REE' title=REE></div> A DUMBFUCK <div class='emote REE' title=REE></div>",
                    "Gen <div class='emote YEE' title=YEE></div>"];

// From http://stackoverflow.com/a/21903119
var getUrlParameter = function(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

var formatLength = function(seconds) {
    var time = Math.floor(Number(seconds));
    var minutesTotal = Math.floor(time / 60);
    var seconds = time - minutesTotal * 60;
    var minutes = minutesTotal % 60
    var hours = Math.floor(time / 3600);

    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }

    if (hours == 0) {
        return minutes + ":" + seconds;
    } else {
        return hours + ":" + minutes + ":" + seconds;
    }
}

var formatDate = function(dateString) {
    var date = new Date(dateString);

    return months[date.getMonth()] + " " + date.getDate() + ", " + date.getFullYear();
}

// detecting if url is yt or twitch
function vodURL(url) {
    // var urlCheck = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/gm;
    try {
        const urlCheck = new URL(url);
        var startTimestamp = ($("#start-timestamp").val() === "") ? "" : moment($("#start-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
        var endTimestamp = ($("#end-timestamp").val() === "") ? "" : moment($("#end-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
        var timestamps = (startTimestamp != "" && endTimestamp != "") ? "&start=" + startTimestamp + "&end=" + endTimestamp : "";
        if (urlCheck.hostname === "www.twitch.tv" || urlCheck.hostname === "twitch.tv") {
            regex = new RegExp('(?=[0-9])[^\/]+', 'gm');
            replaced = url.match(regex);
            window.location.href = window.location.origin + window.location.pathname + "?id=" + replaced[0].replace(/[?]/gm, '&') + timestamps;
        }
        if (urlCheck.hostname === "www.youtube.com" || urlCheck.hostname === "youtube.com") {
            window.location.href = window.location.origin + window.location.pathname + urlCheck.search + timestamps;
        }
        if (urlCheck.hostname === "youtu.be") {
            window.location.href = window.location.origin + window.location.pathname + "?v=" + urlCheck.pathname.slice(1) + urlCheck.search.replace(/[?]/gm, '&') + timestamps;
        }
        if (urlCheck.hostname === "www.odysee.com" || urlCheck.hostname === "odysee.com") {
            if (urlCheck.pathname.match(/\/\$\/download\/.+/)) {
                window.location.href = window.location.origin + window.location.pathname + "?od=" + encodeURI(urlCheck.pathname.slice(12)) + timestamps;
            } else {
                const odysseySplit = urlCheck.pathname.slice(1).split("/")
                const videoName = odysseySplit[1].split(":")[0]
                if (odysseySplit.length === 2) {
                    fetch("https://api.lbry.tv/api/v1/proxy", {
                        method: "post",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            "method": "claim_search",
                            "params": {
                                "channel": odysseySplit[0],
                                "name": videoName
                            }
                        })
                    }).then(resp => {
                        if (resp.status === 200) {
                            return resp.json()
                        } else {
                            console.error(`LBRY status: ${resp.status}`)
                            return Promise.reject("server")
                        }
                    }).then(data => {
                        if ("result" in data && data["result"]["items"].length !== 0) {
                            claim = data["result"]["items"][0]["claim_id"]
                            window.location.href = window.location.origin + window.location.pathname + "?od=" + encodeURI(`${videoName}/${claim}`) + timestamps;
                        }
                    })
                }
            }
        }
    } catch (e) {
        console.error(e)
    }
    // var matches = url.matchAll(urlCheck);
    // var matchArray = [...matches];
};

function onlyChat() {
    var startTimestamp = ($("#start-timestamp").val() === "") ? "" : moment($("#start-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
    var endTimestamp = ($("#end-timestamp").val() === "") ? "" : moment($("#end-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
    var timestamps = (startTimestamp != "" && endTimestamp != "") ? "&start=" + startTimestamp + "&end=" + endTimestamp : "";
    if (startTimestamp && endTimestamp) {
        window.location.href = window.location.origin + window.location.pathname + '?chatonly=true' + timestamps;
    }
}

function m3u8(url) {
    var urlCheck = /^((http[s]?|ftp):\/)?\/?([^:\/\s]+)((\/\w+)*\/)([\w\-\.]+[^#?\s]+)(.*)?(#[\w\-]+)?$/gm;
    var matches = url.matchAll(urlCheck);
    var matchArray = [...matches];
    var startTimestamp = ($("#start-timestamp").val() === "") ? "" : moment($("#start-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
    var endTimestamp = ($("#end-timestamp").val() === "") ? "" : moment($("#end-timestamp").val(), "YYYY-MM-DD HH:mm:ss UTC").format("YYYY-MM-DDTHH:mm:ss[Z]");
    var timestamps = (startTimestamp != "" && endTimestamp != "") ? "&start=" + startTimestamp + "&end=" + endTimestamp : "";
    if (startTimestamp && endTimestamp) {
        switch (matchArray[0][3]) {
            case "vod-secure.twitch.tv":
                window.location.href = window.location.origin + window.location.pathname + "?hash=" + matchArray[0][4].slice(1,-9) + "&cdn=ttv1" + timestamps;
                break;
            case "vod-metro.twitch.tv":
                window.location.href = window.location.origin + window.location.pathname + "?hash=" + matchArray[0][4].slice(1,-9) + "&cdn=ttv2" + timestamps;
                break;
            case "vod-pop-secure.twitch.tv":
                window.location.href = window.location.origin + window.location.pathname + "?hash=" + matchArray[0][4].slice(1,-9) + "&cdn=ttv3" + timestamps;
                break;
            default:
                if (matchArray[0][3].match(/.+\.cloudfront\.net/) != undefined) {
                    window.location.href = window.location.origin + window.location.pathname + "?hash=" + matchArray[0][4].slice(1,-9) + `&cdn=${matchArray[0][3].substring(0,4)}` + timestamps;
                }
                break;
        }
    }
}

$(document).ready(function (){
    headerTitle = document.createElement("a");
    headerTitle.id = "header-title";
    headerTitle.innerHTML = "orvods";
    headerTitle.target = "_self";
    headerTitle.href = window.location.origin + window.location.pathname;
    document.querySelector("#main-links").prepend(headerTitle);
});

$(document).ready(function (){
    if (window.location.pathname != "/" && window.location.search == "") {
        headerTitle = document.createElement("a");
        headerTitle.id = "homepage-button";
        headerTitle.innerHTML = `<span style="font-size: 36px;" class="octicon octicon-home"></span>`;
        headerTitle.target = "_self";
        headerTitle.href = window.location.origin;
        document.querySelector("#main-links").prepend(headerTitle);
    }
});

// click button on "Enter" press
// stolen from https://stackoverflow.com/questions/155188/trigger-a-button-click-with-javascript-on-the-enter-key-in-a-text-box
$(document).ready(function (){
    document.getElementById("customUrlText").addEventListener("keyup", function(event) {
        event.preventDefault();
        if (event.key === "Enter") {
            document.getElementById("customUrlButton").click();
        }
    });
});

$(document).ready(function () {
    $("head").append("<style id='timeFormatStyle'></style>");
    $("head").append("<style id='flairStyle'></style>");
    $("head").append("<style id='fontSizeStyle'></style>");
    $("head").append('<link rel="stylesheet" href="https://cdn.destiny.gg/emotes/emotes.css?_=' + (parseInt((new Date()).getTime()/1000) - (parseInt((new Date()).getTime()/1000) % 1800)) + '" type="text/css"/>');
    $("head").append('<link rel="stylesheet" href="https://cdn.destiny.gg/flairs/flairs.css?_=' + (parseInt((new Date()).getTime()/1000) - (parseInt((new Date()).getTime()/1000) % 1800)) + '" type="text/css">');

    document.querySelector(".ignore-label").addEventListener("click", () => {
        document.querySelector(".ignore-list").classList.toggle(
            "expanded",
            document.querySelector(".ignore-label").classList.toggle("expanded")
        )
    })

    if (localStorage.getItem('lineLimit')) {
        $("#lineLimit").val(localStorage.getItem('lineLimit'));
    } else {
        $("#lineLimit").val(300);
        localStorage.setItem('lineLimit', $("#lineLimit").val());
    }

    if (localStorage.getItem('timeFormat')) {
        $(`#timeFormat option[value=${localStorage.getItem('timeFormat')}]`).prop('selected', true);
    } else {
        $(`#timeFormat option[value=None]`).prop('selected', true);
    }
    updateTimeFormat();

    if (localStorage.getItem('hideFlairs')) {
        document.getElementById("hideFlairs").checked = (localStorage.getItem('hideFlairs') === "true") ? true : false;
    } else {
        document.getElementById("hideFlairs").checked = false;
    }
    updateFlairVisibility();

    if (localStorage.getItem('fontSize')) {
        $(`#fontSize option[value=${localStorage.getItem('fontSize')}]`).prop('selected', true);
    } else {
        $(`#fontSize option[value=small]`).prop('selected', true);
    }
    updateFontSize();

    if (localStorage.getItem('badWords')) {
        document.getElementById("badWords").checked = (localStorage.getItem('badWords') === "true") ? true : false;
    } else {
        document.getElementById("badWords").checked = false;
    }
    updateBadWords();

    if (localStorage.getItem('letterVis')) {
        document.getElementById("letterVis").checked = (localStorage.getItem('letterVis') === "true") ? true : false;
    } else {
        document.getElementById("letterVis").checked = false;
    }
    updateLetterVis();

    if (localStorage.getItem('asciiLimit')) {
        document.querySelector("#asciiLimit").value = localStorage.getItem('asciiLimit');
    } else {
        document.querySelector("#asciiLimit").value = 0;
        localStorage.setItem('asciiLimit', document.querySelector("#asciiLimit").value);
    }

    if (localStorage.getItem('ignoredPhrases')) {
        document.getElementById("ignoredPhrases").value = localStorage.getItem('ignoredPhrases')
    } else {
        document.getElementById("ignoredPhrases").value = ""
    }
    updateIgnoredPhrases();
});

// stolen from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_dropdown
function showManualTimestamps() {
    document.getElementById("manual-content").classList.toggle("show");
};

// stolen from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_dropdown
function showSettings() {
    document.getElementById("settings-content").classList.toggle("show");
};

// stolen from https://www.w3schools.com/howto/tryit.asp?filename=tryhow_css_js_dropdown
function showSkipSettings() {
    document.getElementById("skip-content").classList.toggle("show");
};

function updateLineLimit() {
    localStorage.setItem('lineLimit', $("#lineLimit").val());
}

function updateTimeFormat() {
    state = $("#timeFormat").val();
    localStorage.setItem('timeFormat', state);
    sheet = document.getElementById("timeFormatStyle").sheet;
    len = sheet.cssRules.length;
    for (let i = 0; i < len; i++) {
        sheet.deleteRule(sheet.cssRules[i]);
    }
    if (state == "hms") {
        sheet.insertRule('.msg-chat .time {display: inline !important;}');
        sheet.insertRule('.msg-chat .time {padding-right: 0;}');
        sheet.insertRule('.msg-chat .time-seconds {display: inline !important;}');
    } else if (state == "hm") {
        sheet.insertRule('.msg-chat .time {display: inline !important;}');
        sheet.insertRule('.msg-chat .time {padding-right: .6em;}');
        sheet.insertRule('.msg-chat .time-seconds {display: none !important;}');
    } else {
        sheet.insertRule('.msg-chat .time {display: none !important;}');
        sheet.insertRule('.msg-chat .time {padding-right: 0;}');
        sheet.insertRule('.msg-chat .time-seconds {display: none !important;}');
    }
}

function updateFlairVisibility() {
    state = document.getElementById("hideFlairs").checked;
    localStorage.setItem('hideFlairs', state);
    sheet = document.getElementById("flairStyle").sheet;
    len = sheet.cssRules.length;
    for (let i = 0; i < len; i++) {
        sheet.deleteRule(sheet.cssRules[i]);
    }
    if (state) {
        sheet.insertRule('.msg-chat .features .flair {display: none !important;}');
    }
}

function updateFontSize() {
    state = $("#fontSize").val();
    localStorage.setItem('fontSize', state);
    sheet = document.getElementById("fontSizeStyle").sheet;
    len = sheet.cssRules.length;
    for (let i = 0; i < len; i++) {
        sheet.deleteRule(sheet.cssRules[i]);
    }
    if (state == "large") {
        sheet.insertRule('#chat-stream {font-size: 16px !important;}');
    } else if (state == "medium") {
        sheet.insertRule('#chat-stream {font-size: 14px !important;}');
    } else {
        sheet.insertRule('#chat-stream {font-size: 13px !important;}');
    }
}

function updateLetterVis() {
    localStorage.setItem('letterVis', document.getElementById("letterVis").checked);
}

function updateBadWords() {
    localStorage.setItem('badWords', document.getElementById("badWords").checked);
}

function updateASCIILimit() {
    localStorage.setItem('asciiLimit', document.querySelector("#asciiLimit").value);
}

function updateIgnoredPhrases() {
    localStorage.setItem('ignoredPhrases', document.getElementById("ignoredPhrases").value);
}