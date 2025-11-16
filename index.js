const { Client, MessageAttachment, MessageEmbed } = require("discord.js-selfbot-v13");
const fetch = require("node-fetch");

const client = new Client({ checkUpdate: false });

client.login(process.env.TOKEN);

client.on("ready", () => {
    console.log(`${client.user.tag}でログインしました！`);
    client.user.setStatus("online");
    client.user.setActivity("Make it a Quote", { type: "PLAYING" });
});

client.on("messageCreate", async (msg) => {
    if (msg.author.id !== client.user.id) return;

    // --- !ping 機能 ---
    if (msg.content === "!ping") {
        const sent = await msg.channel.send("🏓 Ping中...");
        const ping = sent.createdTimestamp - msg.createdTimestamp;
        return sent.edit(`🏓 Pong! ${ping}ms`);
    }

    // --- !server 機能 ---
    if (msg.content === "!server") {
        const guild = msg.guild;
        if (!guild) return msg.channel.send("⚠️このコマンドはサーバー内でのみ使用可能です。");

        const embed = new MessageEmbed()
            .setTitle(`🛡️ ${guild.name} の情報`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addField("サーバーID", guild.id, true)
            .addField("メンバー数", guild.memberCount.toString(), true)
            .addField("作成日", guild.createdAt.toDateString(), true)
            .addField("ブーストレベル", guild.premiumTier.toString(), true)
            .setColor("BLUE")
            .setFooter({ text: `リクエスト: ${msg.author.tag}` });

        return msg.channel.send({ embeds: [embed] });
    }

    // --- !mq 機能 ---
    if (msg.content !== "!mq") return;

    if (!msg.reference) return msg.channel.send("⚠️返信で使ってください。");

    const replied = await msg.channel.messages.fetch(msg.reference.messageId);
    const text = replied.content;
    const author = replied.author.username;
    const avatar = replied.author.displayAvatarURL({ format: "png", size: 512 });

    try {
        const res = await fetch("https://api.voids.top/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: author,
                display_name: author,
                text: text,
                avatar: avatar,
                color: true
            })
        });

        const data = await res.json();
        const imgRes = await fetch(data.url);
        const buffer = await imgRes.arrayBuffer();
        const attachment = new MessageAttachment(Buffer.from(buffer), "quote.png");

        msg.channel.send({ files: [attachment] });

    } catch (err) {
        console.error(err);
        msg.channel.send("⚠️画像生成中にエラーが発生しました。");
    }
});
