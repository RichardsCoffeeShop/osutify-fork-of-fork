import { getPack } from "@/app/actions/getPack";
import { Header } from "@/components/Header";
import Image from "next/image";
import PlaylistContent from "./components/PlaylistContent";

export default async function Playlist({
  params,
}: {
  params: { tag: string };
}) {
  const data = await getPack(params.tag);
  const { packName, songs } = data;

  return (
    <div
      className="
        bg-neutral-900
        rounded-lg
        h-full
        w-full
        overflow-hidden
        overflow-y-auto
      "
    >
      <Header>
        <div className="mt-20">
          <div
            className="
              flex
              flex-col
              md:flex-row
              items-center
              gap-x-5
            "
          >
            <div className="relative h-32 w-32 lg:h-44 lg:w-44">
              <Image
                className="object-cover rounded-lg shadow-2xl shadow-black"
                fill
                src={songs?.[0]?.thumbnail || "/images/unknown.jpg"}
                alt="Playlist"
                loading="lazy"
                blurDataURL="/images/unknown.jpg"
                placeholder="blur"
                unoptimized
              />
            </div>
            <div className="flex flex-col gap-y-2 mt-4 md:mt-0">
              <p className="hidden md:block font-semibold text-sm">Playlist</p>
              <h1
                className="
                  text-white
                  text-4xl
                  sm:text-5xl
                  lg:text-7xl
                  font-bold
                "
              >
                {packName || "Unknown Playlist"}
              </h1>
            </div>
          </div>
        </div>
      </Header>
      <PlaylistContent songs={songs} />
    </div>
  );
}
