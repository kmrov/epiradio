var request = require("request");
var player = require("player");
var later = require("later");

var utils = require("./utils.js");

var config = {
    groups: [
        "e_music",
        "progressivemetal",
        "e_avantgarde",
        "e_music_progrock",
        "e_russian_chanson",
        "e_music_krautrock",
        "e_music_neoprog",
        "experimental_rock",
        "e_music_psychedelic",
    ],
    update_period: 60 // minutes
}

var groups_updated = {};

var playing = false;

var files = [];

function next() {
    var audio = utils.random_select(files);
    console.log("Now playing: " + audio.title + " by " + audio.artist);
    new player(audio.url).play(next);
}

function play() {
    if (!playing)
    {
        playing = true;
        next();
    }
}

function add_audio(audio) {
    files.push(
        {
            artist: audio.artist,
            title: audio.title,
            url: audio.url.split("?")[0],
        }
    );
}

function add_post(post) {
    for (var i=0; i<post.attachments.length; i++) {
        if (post.attachments[i].type == "audio")
        {
            add_audio(post.attachments[i].audio);
        }
    }
}

function update_group(group_name) {
    request(
    {
        uri: "https://api.vk.com/method/wall.get",
        method: "POST",
        form: {
            domain: group_name,
            count: 10,
            filter: "owner"
        }
    },
    function(error, response, body) {
        res = JSON.parse(body).response.slice(1); // first item is posts count
        for (var i=0; i<res.length; i++) {
            if (res[i].attachments && !res[i].is_pinned) {
                add_post(res[i]);
            }
        }
        console.log("Updated " + group_name + ".");
        groups_updated[group_name] = true;
        for (group in groups_updated) {
            if (!groups_updated[group]) {
                return;
            }
        }
        console.log("Update finished.");
        if (!playing) {
            play();
        }
    }
    );
}

function update_groups() {
    console.log("Updating...");
    for (var i=0; i<config.groups.length; i++) {
        groups_updated[config.groups[i]] = false;
        update_group(config.groups[i]);
    }
}

var sched = later.parse.recur().every(config.update_period).minute();
var timer = later.setInterval(update_groups, sched);

update_groups();