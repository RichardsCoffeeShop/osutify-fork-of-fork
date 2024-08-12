import { Song } from "@/types";
import { checkSongCover } from "./utils";
import axios from "axios";
import { cookies } from "next/headers";

export async function getSongsByIds(
  ids: string[]
): Promise<Song[]> {
  const cookieStore = cookies();
  if (!cookieStore.get("osu_access_token")) return [];

  const beatmapsets = await Promise.all(
    ids.map(async (id) => {
      const data = await axios
        .get(`https://osu.ppy.sh/api/v2/beatmapsets/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${cookieStore.get("osu_access_token")?.value}`,
          },
        })
        .then((res) => res.data);
      return data;
    })
  );

  if (!beatmapsets) {
    return [];
  }

  await Promise.all(
    beatmapsets.map(async (song: any) => {
      await checkSongCover(song);
    })
  );

  const songs = beatmapsets.map((song: any) => ({
    id: song.id,
    author: song.artist,
    title: song.title,
    song_url: song.preview_url,
    thumbnail: song.covers.cover,
  }));

  return songs;
}
