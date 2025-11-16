const { Client, Intents, MessageAttachment } = require("discord.js-selfbot-v13");
const fetch = require("node-fetch");
const { createCanvas } = require("canvas");

const client = new Client({ checkUpdate: false });

// ログイン（Renderの環境変数TOKENを使用）
client.login(process.env.TOKEN);

client.on("ready", () => {
    console.log(`${client.user.tag}でログインしました！`);
    client.user.setStatus("online");
    client.user.setActivity("Make it a Quote", { type: "PLAYING" });
});

// テキスト折り返し関数
function wrapText(ctx, text, maxWidth) {
    const words = text.split(" ");
    const lines = [];
    let line = "";

    for (let word of words) {
        const testLine = line + word + " ";
        const width = ctx.measureText(testLine).width;
        if (width > maxWidth && line !== "") {
            lines.push(line);
            line = word + " ";
        } else {
            line = testLine;
        }
    }
    lines.push(line);
    return lines;
}

// 本家風画像生成関数
async function createQuoteImage(text, author) {
    const width = 900;
    const height = 500;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext("2d");

    // 背景
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    // 文字
    ctx.fillStyle = "#000000";
    ctx.font = "38px Arial";
    ctx.textAlign = "left";

    const quoteText = `"${text}"`;
    const lines = wrapText(ctx, quoteText, width - 160);
    const lineHeight = 50;

    lines.forEach((line, i) => {
        ctx.fillText(line, 80, 120 + i * lineHeight);
    });

    // 作者名
    ctx.font = "bold 36px Arial";
    ctx.textAlign = "right";
    ctx.fillText(`— ${author}`, width - 80, height - 80);

    return canvas.toBuffer("image/png");
}

// メッセージイベント
client.on("messageCreate", async (msg) => {
    if (msg.author.id !== client.user.id) return;
    if (msg.content !== "!mq") return;

    if (!msg.reference) return msg.channel.send("⚠️返信で使ってください。");

    const replied = await msg.channel.messages.fetch(msg.reference.messageId);
    const text = replied.content;
    const author = replied.author.username;

    const imgBuffer = await createQuoteImage(text, author);
    const attachment = new MessageAttachment(imgBuffer, "quote.png");
    msg.channel.send({ files: [attachment] });
});
