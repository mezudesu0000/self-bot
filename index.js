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
// Express（Render keepalive）
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

    // ======== 自動 /up （テキスト送信） ========
    const channelId = "1421271498785685554";

    const sendUp = () => {
        const ch = client.channels.cache.get(channelId);
        if (!ch) return console.log("⚠️ /up 用チャンネルが見つかりません");

        ch.send("/up").then(() => {
            console.log("✅ /up を自動送信しました");
        }).catch(err => {
            console.error("❌ /up 自動送信エラー:", err);
        });
    };

    // 起動時にまず1回送信
    sendUp();

    // 2時間ごとに実行（7200000ms = 2時間）
    setInterval(sendUp, 2 * 60 * 60 * 1000);
});

// =========================
// メッセージ反応
// =========================
client.on("messageCreate", async (msg) => {

    //==========================
    // !ping
    //==========================
    if (msg.content === "!ping") {
        const sent = await msg.channel.send("🏓 Ping中...");
        const ping = sent.createdTimestamp - msg.createdTimestamp;
        return sent.edit(`🏓 Pong! ${ping}ms`);
    }

    //==========================
    // !server（テキスト表示）
    //==========================
    if (msg.content === "!server") {
        const g = msg.guild;
        if (!g) return msg.channel.send("⚠️ サーバー内で使ってね。");

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
    // !mq（Make it a Quote）
    //==========================
    if (msg.content === "!mq") {
        if (!msg.reference)
            return msg.channel.send("⚠️ 返信で使ってください。");

        const replied = await msg.channel.messages.fetch(msg.reference.messageId);

        const member = replied.guild?.members?.cache?.get(replied.author.id);

        const displayName = member?.displayName || replied.author.username;

        const avatarURL =
            member?.avatarURL({ format: "png", size: 512 }) ||
            replied.author.displayAvatarURL({ format: "png", size: 512 });

        const text = replied.content;

        try {
            const res = await axios.post("https://api.voids.top/quote", {
                username: displayName,
                display_name: displayName,
                text: text,
                avatar: avatarURL,
                color: true
            });

            const imageURL = res.data.url;
            if (!imageURL)
                return msg.channel.send("⚠️ 画像生成に失敗しました。");

            msg.channel.send({ files: [imageURL] });

        } catch (err) {
            console.error("MQ ERROR:", err);
            msg.channel.send("⚠️ 画像生成中にエラーが発生しました。");
        }
    }
});
