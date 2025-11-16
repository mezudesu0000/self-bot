// =========================
// 必要なライブラリ
// =========================
const express = require("express");
const axios = require("axios");
const { Client } = require("discord.js-selfbot-v13");

// =========================
// Selfbot 起動
// =========================
const client = new Client({ checkUpdate: false });

// =========================
// Express（Render用 keepalive）
// =========================
const app = express();
app.get("/", (req, res) => res.send("Selfbot Running!"));
app.listen(3000, () => console.log("Express: 3000番で起動"));

client.login(process.env.TOKEN);

// =========================
// Bot Ready
// =========================
client.on("ready", () => {
    console.log(`${client.user.tag} でログインしました！`);
    client.user.setStatus("online");
    client.user.setActivity("Make it a Quote", { type: "PLAYING" });
});

// =========================
// メッセージ反応
// =========================
client.on("messageCreate", async (msg) => {
    // Selfbotなので基本的に本人しか使えない → 他人も使用できるように変更
    // if (msg.author.id !== client.user.id) return; ← これを削除

    //==========================
    // !ping
    //==========================
    if (msg.content === "!ping") {
        const sent = await msg.channel.send("🏓 Ping中...");
        const ping = sent.createdTimestamp - msg.createdTimestamp;
        return sent.edit(`🏓 Pong! ${ping}ms`);
    }

    //==========================
    // !server → テキスト表示
    //==========================
    if (msg.content === "!server") {
        const g = msg.guild;
        if (!g)
            return msg.channel.send("⚠️ このコマンドはサーバー内でのみ使えます。");

        const infoText =
            "===== 🛡 サーバー情報 =====\n" +
            `サーバー名：${g.name}\n` +
            `サーバーID：${g.id}\n` +
            `メンバー数：${g.memberCount}\n` +
            `作成日：${g.createdAt.toLocaleString()}\n` +
            `ブーストレベル：${g.premiumTier}`;

        return msg.channel.send(infoText);
    }

    //==========================
    // !mq（返信したメッセージを画像に）
    //==========================
    if (msg.content === "!mq") {
        if (!msg.reference)
            return msg.channel.send("⚠️ 返信で使ってください。");

        const replied = await msg.channel.messages.fetch(msg.reference.messageId);

        const text = replied.content;
        const author = replied.author.username;
        const avatar = replied.author.displayAvatarURL({
            format: "png",
            size: 512
        });

        try {
            // axios版（Renderで確実に動く）
            const res = await axios.post("https://api.voids.top/quote", {
                username: author,
                display_name: author,
                text: text,
                avatar: avatar,
                color: true
            });

            const imageURL = res.data.url;
            if (!imageURL) return msg.channel.send("⚠️ 画像生成に失敗しました。");

            msg.channel.send({ files: [imageURL] });

        } catch (err) {
            console.error("MQ ERROR:", err);
            msg.channel.send("⚠️ 画像生成中にエラーが発生しました。");
        }
    }
});
