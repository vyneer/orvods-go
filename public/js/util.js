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

var featuresUrl = "https://vyneer.me/tools/features";
var lwodUrl = "https://vyneer.me/tools/lwod";

var servicesUrl = {
    "twitch" : "/vodinfo?id=",
    "youtube" : "/vidinfo?id=",
    "chatonly" : ""
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
