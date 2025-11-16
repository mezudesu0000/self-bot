const { Client, MessageAttachment, MessageEmbed } = require("discord.js-selfbot-v13");
const fetch = require("node-fetch");
const express = require("express");

// -------------------- Express サーバー --------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get("/", (req, res) => res.send("Selfbot is running!"));
app.listen(PORT, () => console.log(`Express running on ${PORT}`));

// -------------------- Selfbot クライアント --------------------
const client = new Client({ checkUpdate: false });

client.login(process.env.TOKEN);

client.on("ready", () => {
    console.log(`${client.user.tag} でログインしました！`);
    client.user.setStatus("online");
    client.user.setActivity("Make it a Quote", { type: "PLAYING" });
});

// ----------------------------------------------------------
// メッセージ処理
// ----------------------------------------------------------
client.on("messageCreate", async (msg) => {
    // Botのメッセージは無視（ループ防止）
    if (msg.author.bot) return;

    // ======================================================
    // !ping
    // ======================================================
    if (msg.content === "!ping") {
        const sent = await msg.channel.send("🏓 Ping中...");
        const ping = sent.createdTimestamp - msg.createdTimestamp;
        return sent.edit(`🏓 Pong! ${ping}ms`);
    }

    // ======================================================
    // !server
    // ======================================================
    if (msg.content === "!server") {
        const guild = msg.guild;
        if (!guild) return msg.channel.send("⚠️ このコマンドはサーバー内でのみ使えます");

        const embed = new MessageEmbed()
            .setTitle(`🛡️ ${guild.name} の情報`)
            .setThumbnail(guild.iconURL({ dynamic: true }))
            .addFields(
                { name: "サーバーID", value: guild.id, inline: true },
                { name: "メンバー数", value: guild.memberCount.toString(), inline: true },
                { name: "作成日", value: guild.createdAt.toDateString(), inline: true },
                { name: "ブーストレベル", value: guild.premiumTier.toString(), inline: true }
            )
            .setColor("BLUE")
            .setFooter({ text: `リクエスト: ${msg.author.tag}` });

        // Selfbot は「embed単体送信禁止」なので content 必須
        return msg.channel.send({
            content: "📄 **サーバー情報はこちら：**",
            embeds: [embed]
        });
    }

    // ======================================================
    // !mq（Make Quote）
    // ======================================================
    if (msg.content === "!mq") {
        if (!msg.reference)
            return msg.channel.send("⚠️ **返信で使用してください！**");

        const replied = await msg.channel.messages.fetch(msg.reference.messageId);

        const text = replied.content;
        const author = replied.author.username;
        const avatar = replied.author.displayAvatarURL({ format: "png", size: 512 });

        try {
            // 画像生成 API
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

            return msg.channel.send({
                content: "🖼️ **引用画像を作成しました！**",
                files: [attachment]
            });

        } catch (err) {
            console.error(err);
            return msg.channel.send("⚠️ 画像生成に失敗しました。");
        }
    }
});
