const { Client, Intents, MessageAttachment } = require("discord.js-selfbot-v13");
const fetch = require("node-fetch");

const client = new Client({ checkUpdate: false });

// Token は Render の環境変数
client.login(process.env.TOKEN);

client.on("ready", () => {
    console.log(`${client.user.tag}でログインしました！`);
    client.user.setStatus("online");
    client.user.setActivity("Make it a Quote", { type: "PLAYING" });
});

// メッセージイベント
client.on("messageCreate", async (msg) => {
    if (msg.author.id !== client.user.id) return;
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
        // APIが返すURLから画像を取得して送信
        const imgRes = await fetch(data.url);
        const buffer = await imgRes.arrayBuffer();
        const attachment = new MessageAttachment(Buffer.from(buffer), "quote.png");

        msg.channel.send({ files: [attachment] });

    } catch (err) {
        console.error(err);
        msg.channel.send("⚠️画像生成中にエラーが発生しました。");
    }
});
