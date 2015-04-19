var request = require("request");
var player = require("player");

var utils = require("./utils.js");

var groups = [
    "progressivemetal",
    "e_avantgarde"
];

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
            if (!res[i].is_pinned) {
                add_post(res[i]);
            }
        }
        if (!playing) {
            play();
        }
    }
    );
}

function update_groups() {
    for (var i=0; i<groups.length; i++) {
        update_group(groups[i]);
    }
}

update_groups();