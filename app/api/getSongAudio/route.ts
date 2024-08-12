import * as zip from "@zip.js/zip.js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  const servers = [
    "https://direct.osuokayu.moe/api/v1/download/",
    "https://catboy.best/d/",
    "https://proxy.nerinyan.moe/d/"
  ];

  let audioStream = null;
  let blob = null;

  // Selfish individualism at its finest. We're going 💪
  blob = await blobRace(blob, servers, id!);

  if (!blob) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const reader = new zip.ZipReader(new zip.BlobReader(blob));
    const files = (await reader.getEntries()) || [];

    for (const file of files) {
      if (!file.filename.endsWith(".osu")) continue;

      const text = await file.getData!(new zip.TextWriter());
      for (const line of text.split("\n")) {
        if (!line.startsWith("AudioFilename:")) continue;

        const audioFilename = line.split(":")[1].trim();
        const audioFile = files.find((f) => f.filename === audioFilename);

        if (!audioFile) {
          console.error("Audio file not found in beatmap");
          break;
        }

        audioStream = await audioFile.getData!(
          new zip.BlobWriter(`audio/${audioFilename.split(".").pop()}`)
        );
        break;
      }
    }
  } catch (e) {
    console.error("Failed to extract audio from beatmap");
    console.error(e);
  }

  let isShortVer = false;
  if (!audioStream) {
    const previewUrl = `https://b.ppy.sh/preview/${id}.mp3`;
    audioStream = await fetch(previewUrl).then((res) => res.blob());
    isShortVer = true;
  }

  return new Response(audioStream, {
    headers: {
      "Content-Type": "audio/mp3",
      "Content-Length": audioStream.size.toString(),
      "Cache-Control": `public, max-age=${isShortVer ? 0 : 31536000}`,
    },
  });
}

async function getBlobFromUrl(url: string) {
  return await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
  })
    .then((res) => {
      if (!res.ok) return { url: url, blob: null };
      return { url: url, blob: res.blob() };
    })
    .catch((err) => {
      console.error(err); // Got "socketError: other side closed" some times, need to investigate
      return { url: url, blob: null };
    });
}

async function blobRace(blob: any, servers: string[], id: string) {
  let promises = servers.map((server) => getBlobFromUrl(server + id));
  const data = await Promise.race(promises);

  if (data.blob) {
    return await data.blob;
  } else {
    const url = data.url.split("/").slice(0, -1).join("/");
    servers = servers.filter((s) => s !== url + "/");
    if (servers.length === 0) return blob;
    return await blobRace(blob, servers, id);
  }
}
