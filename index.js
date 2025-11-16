const Eris = require("eris-self");
const fetch = require("node-fetch");

const TOKEN = process.env.TOKEN;

const client = new Eris(TOKEN);

client.on("ready", () => {
    client.editStatus("online", { name: "Make it a Quote", type: 0 });
});

client.on("messageCreate", async (msg) => {
    if (msg.author.id !== client.user.id) return;
    if (msg.content !== "!mq") return;
    if (!msg.messageReference) return client.createMessage(msg.channel.id, "⚠️返信で使ってください！");

    const replied = await client.getMessage(msg.channel.id, msg.messageReference.messageID);
    const text = replied.content || "(テキストなし)";
    const avatarURL = replied.author.avatarURL;

    const response = await fetch("https://api.voids.top/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            username: replied.author.username,
            display_name: replied.author.username,
            text: text,
            avatar: avatarURL,
            color: true
        })
    });

    const result = await response.json();
    if (!result.success) return client.createMessage(msg.channel.id, "❌生成に失敗しました。");

    await client.createMessage(msg.channel.id, {
        content: "",
        file: {
            file: await (await fetch(result.url)).buffer(),
            name: "quote.png"
        }
    });
});

client.connect();
