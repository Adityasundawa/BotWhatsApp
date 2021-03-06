const { create, decryptMedia } = require("@open-wa/wa-automate");
const moment = require("moment-timezone");
const { tiktok, instagram, twitter, facebook } = require("./lib/dl-video");
const urlShortener = require("./lib/shortener");
const color = require("./lib/color");
const { fetchMeme } = require("./lib/fetcher");
const { getText } = require("./lib/ocr");
moment.tz.setDefault("Asia/Jakarta");
moment.locale("id");

const serverOption = {
  headless: true,
  qrRefreshS: 20,
  qrTimeout: 0,
  authTimeout: 0,
  autoRefresh: true,
  killProcessOnBrowserClose: true,
  cacheEnabled: false,
  chromiumArgs: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--aggressive-cache-discard",
    "--disable-cache",
    "--disable-application-cache",
    "--disable-offline-load-stale-cache",
    "--disk-cache-size=0",
  ],
};

const opsys = process.platform;
if (opsys === "win32" || opsys === "win64") {
  serverOption.executablePath =
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe";
} else if (opsys === "linux") {
  serverOption.browserRevision = "737027";
} else if (opsys === "darwin") {
  serverOption.executablePath =
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
}

const startServer = async () => {
  create("Imperial", serverOption)
    .then((client) => {
      console.log("[DEV] Red Emperor");
      console.log("[SERVER] Server Started!");
      // Force it to keep the current session
      client.onStateChanged((state) => {
        console.log("[Client State]", state);
        if (state === "CONFLICT") client.forceRefocus();
      });
      // listening on message
      client.onMessage((message) => {
        msgHandler(client, message);
      });

      client.onAddedToGroup((chat) => {
        client.sendText(
          chat.groupMetadata.id,
          `Halo sedulur grup *${chat.contact.name}* matur nuwun kanggo ngundang bot iki, kanggo ndeleng menu, kirim * #menu *`
        );
      });
    })
    .catch((err) => {
      console.error(err);
    });
};

async function msgHandler(client, message) {
  try {
    const {
      type,
      id,
      from,
      t,
      sender,
      isGroupMsg,
      chat,
      caption,
      isMedia,
      mimetype,
      quotedMsg,
      mentionedJidList,
    } = message;
    let { body } = message;
    const { name } = chat;
    let { pushname, verifiedName } = sender;
    pushname = pushname || verifiedName; // verifiedName is the name of someone who uses a business account
    // if (pushname === undefined) console.log(sender + '\n\n' + chat)
    const prefix = "#";
    body =
      type === "chat" && body.startsWith(prefix)
        ? body
        : type === "image" && caption && caption.startsWith(prefix)
        ? caption
        : "";
    const command = body
      .slice(prefix.length)
      .trim()
      .split(/ +/)
      .shift()
      .toLowerCase();
    const args = body.slice(prefix.length).trim().split(/ +/).slice(1);
    const isCmd = body.startsWith(prefix);
    const time = moment(t * 1000).format("DD/MM HH:mm:ss");
    if (!isCmd && !isGroupMsg)
      return console.log(
        "[RECV]",
        color(time, "yellow"),
        "Message from",
        color(pushname)
      );
    if (!isCmd && isGroupMsg)
      return console.log(
        "[RECV]",
        color(time, "yellow"),
        "Message from",
        color(pushname),
        "in",
        color(name)
      );
    if (isCmd && !isGroupMsg)
      console.log(
        color("[EXEC]"),
        color(time, "yellow"),
        color(`${command} [${args.length}]`),
        "from",
        color(pushname)
      );
    if (isCmd && isGroupMsg)
      console.log(
        color("[EXEC]"),
        color(time, "yellow"),
        color(`${command} [${args.length}]`),
        "from",
        color(pushname),
        "in",
        color(name)
      );

    const botNumber = await client.getHostNumber();
    const groupId = isGroupMsg ? chat.groupMetadata.id : "";
    const groupAdmins = isGroupMsg ? await client.getGroupAdmins(groupId) : "";
    const groupMembers = isGroupMsg
      ? await client.getGroupMembersId(groupId)
      : "";
    const isGroupAdmins = isGroupMsg ? groupAdmins.includes(sender.id) : false;
    const isBotGroupAdmins = isGroupMsg
      ? groupAdmins.includes(botNumber + "@c.us")
      : false;

    // Checking function speed
    // const timestamp = moment()
    // const latensi = moment.duration(moment() - timestamp).asSeconds()
    const uaOverride =
      "WhatsApp/2.2029.4 Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36";
    const url = args.length !== 0 ? args[0] : "";
    const isUrl = new RegExp(
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi
    );
    const isMediaGiphy = url.match(
      new RegExp(/https?:\/\/media.giphy.com\/media/, "gi")
    );
    const isGiphy = url.match(new RegExp(/https?:\/\/(www\.)?giphy.com/, "gi"));

    switch (command) {
      case "tnc":
        await client.sendText(
          from,
          "Bot iki minangka program open-source sing ditulis ing Javascript. \n\nKanthi nggunakake bot sing sampeyan setuju karo Ketentuan lan Ketentuan!\nKita ora nyimpen data ing server. Kita ora tanggung jawab kanggo stiker sing digawe nggunakake bot, video, gambar utawa data liyane sing dipikolehi saka bot iki."
        );
        break;
        case "donasi":
            await client.sendText(
              from,
              "Link Sumbangan : https://saweria.co/donate/Adityasundawa."
            );
            break;
      case "menu":
      case "help": {
        const text = `Halo sedulur, ${pushname}! 👋️ \n\nPrentah sing Bisa Digunakake!✨\n\n*Nggawe Stiker*\nKetiken: #stickersam \nDeskripsi: Ngonversi gambar dadi stiker,kirim gambar nganggo caption #stickersam utawa bales gambar sing wis ana dikirim ambek #stickersam\n\nKetiken: #stickersam <url gambar>\nKatrangan: Ngowahi url gambar menyang stiker\n\n*Gif Sticker*\nKetiken : #gif Giphy URL\nKatrangan: Konversi gif menyang stiker (nanging mung gif)\n\n*dunluder*\nKetiken: #tiktok <post/video url>\nKatrangan: Dunlud video Tiktok\n\nKetiken: #pesbuk <post/video url>\nKatrangan: dunlud tautan unduh video Facebook\n\nKetiken: #ige <post/video url>\nKatrangan: dunlud tautan unduh video Instagram\n\nKetiken: #tuiter <post/video url>\nKatrangan: dunlud tautan unduh video Twitter\n\n*Liyane*\nKetiken: #donasi\nKatrangan: Sampeyan bisa nulungi aku tuku dim sum lue aku cak :v \n\nMuga-muga sampeyan duwe dina sing apik! ✨\nKetiken: #tnc\nKatrangan: nuduhake Katentuan lan Ketentuan\n\nMuga-muga sampeyan duwe dina sing apik! ✨\n`;
        await client.sendText(from, text);
        break;
      }
      // Sticker Creator
      case "stikersam":
      case "stiker":
        if (isMedia) {
          const mediaData = await decryptMedia(message, uaOverride);
          const imageBase64 = `data:${mimetype};base64,${mediaData.toString(
            "base64"
          )}`;
          await client.sendImageAsSticker(from, imageBase64);
        } else if (quotedMsg && quotedMsg.type === "image") {
          const mediaData = await decryptMedia(quotedMsg);
          const imageBase64 = `data:${
            quotedMsg.mimetype
          };base64,${mediaData.toString("base64")}`;
          await client.sendImageAsSticker(from, imageBase64);
        } else if (args.length === 1) {
          if (!url.match(isUrl))
            await client.reply(
              from,
              "Nuwun sewu, tautan sing sampeyan kirim ora valid.",
              id
            );
          await client.sendStickerfromUrl(from, url).then((r) => {
            if (!r && r !== undefined)
              client.sendText(
                from,
                "Nuwun sewu, tautan sing sampeyan kirim ora ngemot gambar."
              );
          });
        } else {
          await client.reply(
            from,
            "Ora ana gambar! Kanggo mbukak dhaptar perintah kirim #menu",
            id
          );
        }
        break;
      case "stikergif":
      case "stickergif":
      case "gifstiker":
      case "gifsticker":
        if (args.length !== 1)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (isGiphy) {
          const getGiphyCode = url.match(
            new RegExp(/(\/|\-)(?:.(?!(\/|\-)))+$/, "gi")
          );
          if (!getGiphyCode)
            return client.reply(from, "Gagal njupuk kode giphy", id);
          const giphyCode = getGiphyCode[0].replace(/[-\/]/gi, "");
          console.log(giphyCode);
          const smallGiftUrl =
            "https://media.giphy.com/media/" +
            giphyCode +
            "/giphy-downsized.gif";
          await client
            .sendGiphyAsSticker(from, smallGiftUrl)
            .catch((err) => console.log(err));
        } else if (isMediaGiphy) {
          const giftUrl = url.match(
            new RegExp(/(giphy|source).(gif|mp4)/, "gi")
          );
          if (!giftUrl)
            return client.reply(from, "Gagal njupuk kode giphy", id);
          const smallGiftUrl = url.replace(giftUrl[0], "giphy-downsized.gif");
          await client
            .sendGiphyAsSticker(from, smallGiftUrl)
            .catch((err) => console.log(err));
        } else {
          await client.reply(
            from,
            "nuwun sewu, kanggo saiki stiker gif mung bisa nggunakake link saka giphy.",
            id
          );
        }
        break;
      // Video dunluder
      case "tiktok":
        if (args.length !== 1)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (!url.match(isUrl) && !url.includes("tiktok.com"))
          return client.reply(
            from,
            "Nuwun sewu, tautan sing sampeyan kirim ora valid",
            id
          );
        await client.sendText(from, "*Ngethok Metadata ...*");
        await tiktok(url)
          .then((videoMeta) => {
            const filename = videoMeta.authorMeta.name + ".mp4";
            const caps = `*Metadata:*\nUsername: ${
              videoMeta.authorMeta.name
            } \nMusic: ${
              videoMeta.musicMeta.musicName
            } \nView: ${videoMeta.playCount.toLocaleString()} \nLike: ${videoMeta.diggCount.toLocaleString()} \nComment: ${videoMeta.commentCount.toLocaleString()} \nShare: ${videoMeta.shareCount.toLocaleString()} \nCaption: ${
              videoMeta.text.trim() ? videoMeta.text : "-"
            } \n\nSumbangan: Sampeyan bisa nulungi aku tuku dim sum kanthi takoni https://saweria.co/donate/Adityasundawa utawa \nNuwun Sewu.`;
            client
              .sendFileFromUrl(
                from,
                videoMeta.url,
                filename,
                videoMeta.NoWaterMark
                  ? caps
                  : `⚠ Video tanpa tandha banyu ora kasedhiya. \n\n${caps}`,
                "",
                { headers: { "User-Agent": "okhttp/4.5.0" } }
              )
              .catch((err) => console.log("Caught exception: ", err));
          })
          .catch(() => {
            client.reply(
              from,
              "Gagal mengambil metadata, link yang kamu kirim tidak valid",
              id
            );
          });
        break;
      case "ige":
      case "instagram":
        if (args.length !== 1)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (!url.match(isUrl) && !url.includes("instagram.com"))
          return client.reply(
            from,
            "Nuwun sewu, tautan sing sampeyan kirim ora valid",
            id
          );
        await client.sendText(from, "*Ngethok Metadata ...*");
        instagram(url)
          .then(async (videoMeta) => {
            const content = [];
            for (let i = 0; i < videoMeta.length; i++) {
              await urlShortener(videoMeta[i].video)
                .then((result) => {
                  console.log("Shortlink: " + result);
                  content.push(`${i + 1}. ${result}`);
                })
                .catch((err) => {
                  client.sendText(from, "Error, " + err);
                });
            }
            await client.sendText(
              from,
              `Link dunlud:\n${content.join(
                "\n"
              )} \n\nSumbangan: Sampeyan bisa nulungi aku tuku dim sum kanthi takoni https://saweria.co/donate/Adityasundawa utawa \nNuwun Sewu.`
            );
          })
          .catch((err) => {
            if (err === "Not a video")
              return client.reply(
                from,
                "Error, tidak ada video di link yang kamu kirim",
                id
              );
            client.reply(from, "Error, user private atau link salah", id);
          });
        break;
      case "twttuiter":
      case "twitter":
        if (args.length !== 1)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (
          !url.match(isUrl) & !url.includes("twitter.com") ||
          url.includes("t.co")
        )
          return client.reply(
            from,
            "Nuwun sewu, tautan sing sampeyan kirim ora valid",
            id
          );
        await client.sendText(from, "*Ngethok Metadata ...*");
        twitter(url)
          .then(async (videoMeta) => {
            try {
              if (videoMeta.type === "video") {
                const content = videoMeta.variants
                  .filter((x) => x.content_type !== "application/x-mpegURL")
                  .sort((a, b) => b.bitrate - a.bitrate);
                const result = await urlShortener(content[0].url);
                console.log("Shortlink: " + result);
                await client.sendFileFromUrl(
                  from,
                  content[0].url,
                  "TwitterVideo.mp4",
                  `Link dunlud: ${result} \n\nSumbangan: Sampeyan bisa nulungi aku tuku dim sum kanthi takoni https://saweria.co/donate/Adityasundawa utawa \nNuwun Sewu.`
                );
              } else if (videoMeta.type === "photo") {
                for (let i = 0; i < videoMeta.variants.length; i++) {
                  await client.sendFileFromUrl(
                    from,
                    videoMeta.variants[i],
                    videoMeta.variants[i].split("/media/")[1],
                    ""
                  );
                }
              }
            } catch (err) {
              await client.sendText(from, "Error, " + err);
            }
          })
          .catch(() => {
            client.sendText(
              from,
              "Nuwun sewu, tautan kasebut ora valid utawa ora ana video ing tautan sing sampeyan kirim"
            );
          });
        break;
      case "pesbuk":
      case "facebook":
        if (args.length !== 1)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (!url.match(isUrl) && !url.includes("facebook.com"))
          return client.reply(
            from,
            "Nuwun sewu, tautan sing sampeyan kirim ora valid",
            id
          );
        await client.sendText(from, "*Ngethok Metadata ...*");
        facebook(url)
          .then(async (videoMeta) => {
            try {
              const title = videoMeta.response.title;
              const thumbnail = videoMeta.response.thumbnail;
              const links = videoMeta.response.links;
              const shorts = [];
              for (let i = 0; i < links.length; i++) {
                const shortener = await urlShortener(links[i].url);
                console.log("Shortlink: " + shortener);
                links[i].short = shortener;
                shorts.push(links[i]);
              }
              const link = shorts.map(
                (x) => `${x.resolution} Quality: ${x.short}`
              );
              const caption = `Text: ${title} \nLink dunlud: \n${link.join(
                "\n"
              )} \n\nSumbangan: Sampeyan bisa nulungi aku tuku dim sum kanthi takoni https://saweria.co/donate/Adityasundawa utawa \nNuwun Sewu.`;
              await client.sendFileFromUrl(
                from,
                thumbnail,
                "videos.jpg",
                caption
              );
            } catch (err) {
              await client.reply(from, "Error, " + err, id);
            }
          })
          .catch((err) => {
            client.reply(
              from,
              `Kesalahan, url ora valid utawa video ora dimuat \n\n${err}`,
              id
            );
          });
        break;
      // Other Command
      case "mim":
      case "memes":
      case "meme": {
        const { title, url } = await fetchMeme();
        await client.sendFileFromUrl(from, `${url}`, "meme.jpg", `${title}`);
        break;
      }
      case "ocr":
        if (isMedia) {
          const mediaData = await decryptMedia(message, uaOverride);
          const imageBase64 = `data:${mimetype};base64,${mediaData.toString(
            "base64"
          )}`;
          const text = await getText(imageBase64);
          await client.sendText(from, text);
        } else if (quotedMsg && quotedMsg.type === "image") {
          const mediaData = await decryptMedia(quotedMsg);
          const imageBase64 = `data:${
            quotedMsg.mimetype
          };base64,${mediaData.toString("base64")}`;
          const text = await getText(imageBase64);
          await client.sendText(from, text);
        } else if (args.length === 1) {
          if (!url.match(isUrl))
            await client.reply(
              from,
              "Nuwun sewu, format pesen salah, priksa menu.",
              id
            );
          const text = await getText(url);
          await client.sendText(from, text);
        } else {
          await client.reply(
            from,
            "Tidak ada gambar! Untuk membuka daftar perintah kirim #menu",
            id
          );
        }
        break;
      // Group Commands (group admin only)
      case "kick":
        if (!isGroupMsg)
          return client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing grup!",
            id
          );
        if (!isGroupAdmins)
          return client.reply(
            from,
            "Gagal, printah iki mung bisa digunakake dening admin grup!(Koe Sopo Sam)",
            id
          );
        if (!isBotGroupAdmins)
          return client.reply(
            from,
            "!",
            id
          );
        if (mentionedJidList.length === 0)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        await client.sendText(
          from,
          `Request takterima, tak tokno:\n${mentionedJidList.join("\n")}`
        );
        for (let i = 0; i < mentionedJidList.length; i++) {
          if (groupAdmins.includes(mentionedJidList[i]))
            return await client.sendText(
              "Gagal, kamu tidak bisa mengeluarkan admin grup."
            );
          await client.removeParticipant(groupId, mentionedJidList[i]);
        }
        break;
      case "promote": {
        if (!isGroupMsg)
          return await client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing grup!",
            id
          );
        if (!isGroupAdmins)
          return await client.reply(
            from,
            "Gagal, printah iki mung bisa digunakake dening admin grup!(Koe Sopo Sam)",
            id
          );
        if (!isBotGroupAdmins)
          return await client.reply(
            from,
            "Gagal, mangga tambah bot minangka admin grup!",
            id
          );
        if (mentionedJidList.length === 0)
          return await client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (mentionedJidList.length >= 2)
          return await client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing 1 pangguna.",
            id
          );
        if (groupAdmins.includes(mentionedJidList[0]))
          return await client.reply(
            from,
            "Nuwun sewu, pangguna wis dadi admin.",
            id
          );
        await client.promoteParticipant(groupId, mentionedJidList[0]);
        await client.sendTextWithMentions(
          from,
          `Request takditerima, nambah @${mentionedJidList[0].replace(
            "@c.us",
            ""
          )} dadi admin.`
        );
        break;
      }
      case "demote": {
        if (!isGroupMsg)
          return client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing grup!",
            id
          );
        if (!isGroupAdmins)
          return client.reply(
            from,
            "Gagal, printah iki mung bisa digunakake dening admin grup!(Koe Sopo Sam)",
            id
          );
        if (!isBotGroupAdmins)
          return client.reply(
            from,
            "!",
            id
          );
        if (mentionedJidList.length === 0)
          return client.reply(
            from,
            "Nuwun sewu, format pesen salah, priksa menu.",
            id
          );
        if (mentionedJidList.length >= 2)
          return await client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing 1 pangguna.",
            id
          );
        if (!groupAdmins.includes(mentionedJidList[0]))
          return await client.reply(
            from,
            "Maaf, user tersebut tidak menjadi admin.",
            id
          );
        await client.demoteParticipant(groupId, mentionedJidList[0]);
        await client.sendTextWithMentions(
          from,
          `Panjaluk ditampa, busak posisi @${mentionedJidList[0].replace(
            "@c.us",
            ""
          )}.`
        );
        break;
      }

      case "bye":
        if (!isGroupMsg)
          return client.reply(
            from,
            "Nuwun sewu, prentah iki mung bisa digunakake ing grup!",
            id
          );
        if (!isGroupAdmins)
          return client.reply(
            from,
            "Maaf, perintah ini hanya dapat dilakukan oleh admin grup!",
            id
          );
        await client
          .sendText(from, "Good bye... ( ⇀‸↼‶ )")
          .then(() => client.leaveGroup(groupId));
        break;
      default:
        console.log(
          color("[ERROR]", "red"),
          color(time, "yellow"),
          "Unregistered Command from",
          color(pushname)
        );
        break;
    }
  } catch (err) {
    console.log(color("[ERROR]", "red"), err);
  }
}

startServer();
