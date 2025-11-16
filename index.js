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
    // !mq（Make it a Quote 完全互換）
    //==========================
    if (msg.content === "!mq") {
        if (!msg.reference)
            return msg.channel.send("⚠️ 返信で使ってください。");

        const replied = await msg.channel.messages.fetch(msg.reference.messageId);

        // サーバー情報を取得（ニックネーム＆サーバーアバター対応）
        const member = replied.guild?.members?.cache?.get(replied.author.id);

        // サーバー名（ニックネーム） > 通常ユーザー名
        const displayName = member?.displayName || replied.author.username;

        // サーバーアバター > 通常アバター
        const avatarURL =
            member?.avatarURL({ format: "png", size: 512 }) ||
            replied.author.displayAvatarURL({ format: "png", size: 512 });

        const text = replied.content;

        try {
            const res = await axios.post("https://api.voids.top/quote", {
                username: displayName,        // ← Make it a Quote が使う名前
                display_name: displayName,    // ← これが無いと ID になる
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
