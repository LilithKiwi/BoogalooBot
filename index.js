var discord = require("discord.js");
var fs = require("fs")
var ytdl = require("ytdl-core");
var ytsr = require("ytsr")
var bot = new discord.Client();
var prefix = "b!";
var playCmdRegex = /^b!p(?:lay)?\s+(?:https:\/\/)?(?:www\.)?youtu\.?be+(?:.com\/)?\/?(?:watch\?v=)?(.\S*)/is;
var searchCmdRegex = /^\s*b!p(?:lay)?(?:$|\s)(\S.*)/is;

function addQueue(url, guild){
    guild.queue.push(url);
    if(!guild.isPlaying){
        playMusic(guild.queue[0], guild);
        guild.isPlaying = true;
        console.log(guild.isPlaying);
    }
}

async function playMusic(url, guild){
    songStream = ytdl(url, {quality:"highestaudio"});
    guild.voice.connection.play(songStream);
    songStream.on("end", () => {
        guild.isPlaying = false;
        console.log(guild.isPlaying);
        guild.queue.shift();
    });
}



bot.on("ready", () => {
    console.log("My body is ready! :D");
    for(var [id, guilds] of bot.guilds.cache){
        guilds.isPlaying = false;
        guilds.testVar = 0;
        //console.log(guilds)
        console.log(guilds.name + "=" + guilds.isPlaying);
    }
    
});

bot.on("message", async msg => {
    var linkdat = playCmdRegex.exec(msg.content);
    var searchdat = searchCmdRegex.exec(msg.content);
    var vc = msg.guild.me.voice.connection;

    //join vc
    if(msg.content === prefix + "join"||msg.content === prefix + "j"){
        await msg.member.voice.channel.join();
        vc = msg.guild.me.voice.connection;
        msg.channel.send(`🥝 Joined ${msg.member.voice.channel.name}`)
        vc.play("silence.ogg") //bugfix workaround for guildMemberSpeaking
        msg.guild.queue = [];
        songStream.destroy();
    }
    //disconnect from vc
    if(msg.content === prefix + "disconnect"||msg.content === prefix + "dc"){
        msg.channel.send("🏃‍♀️ Bye bye!")
        msg.guild.me.voice.channel.leave();
        msg.guild.isPlaying = false;
    }
    //play music command (and search if link isnt provided) | b!play | b!p
    if((/^\s*b!p(?:lay)?(?:$|\s)/is).exec(msg.content) && vc != null){
        await msg.member.voice.channel.join();
        if(linkdat != null){
            addQueue("https://www.youtube.com/watch?v=" + linkdat[1], msg.guild);
        } else {
            addQueue((await ytsr(searchdat[1],{limit:1})).items[0].url, msg.guild)
        }
    }
    if(msg.content === "b!test"){
        //msg.guild.testVar += 1;
        console.log("isPlaying:" + msg.guild.isPlaying)
        console.log(msg.guild.queue);
    }
    //music skip command | b!skip
    if(msg.content === "b!skip"){
        songStream.destroy();
        
        msg.guild.queue.shift();
        if(msg.guild.queue[1] != null){
            playMusic(msg.guild.queue[0], msg.guild);
        } else {
            vc.play("silence.ogg");
            msg.guild.isPlaying = false
        }
    }
    //pause music command | b!pause
    if((/^\s*b!pause(?:$|\s)/is).exec(msg.content)){
        if(vc != null && vc.dispatcher != null){
        vc.dispatcher.pause(true);
        msg.channel.send("⏸ Music has been paused")
        } else {console.log("Bot is not connected to a voice channel or is not playing audio")}
    }
    //resume music command | b!resume
    if((/^\s*b!resume(?:$|\s)/is).exec(msg.content)){
        if(vc != null && vc.dispatcher != null){
        vc.dispatcher.resume();
        msg.channel.send("▶ Music has been resumed")
        } else {console.log("Bot is not connected to a voice channel or is not playing audio")}
    }
});

bot.on("guildMemberSpeaking", (member, speaking) => {
    if(speaking.bitfield){
        console.log(`${member.displayName} is now talking`)
        const audio = member.guild.voice.connection.receiver.createStream(member, { mode: 'pcm' });
        audio.pipe(fs.createWriteStream('user_audio_'+ Date.now()+".pcm"));
    } else console.log(`${member.displayName} has stopped talking`)
});

bot.login("Nzk3OTgxOTM1MDkxMDU2NjUw.X_uYlw.Y4mgwkkwepoOT7QXJllPC0ddrPY");