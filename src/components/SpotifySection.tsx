import { useRef, useState, useEffect } from "react";
import { Music, Headphones, Disc3, Play, Pause, Volume2 } from "lucide-react";
import { mtaAudioTracks } from "@/lib/mtaAudioTracks";

const SpotifySection = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [trackIndex, setTrackIndex] = useState(0);
  const selectedTrack = mtaAudioTracks[trackIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onLoad = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onLoad);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onLoad);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play();
    }
    setPlaying(!playing);
  };

  const selectTrack = (index: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setCurrent(0);
    setDuration(0);
    setTrackIndex(index);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setCurrent(Number(e.target.value));
  };

  const changeVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full max-w-lg mx-auto mb-10">
      <audio ref={audioRef} src={selectedTrack.src} preload="metadata" />

      <div className="text-center mb-5">
        <p className="mta-kicker mb-3">
          Listen Now
        </p>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          MTA 2026 Audio
        </h3>
        <p className="text-white/50 text-sm">
          A three-track MTA 2026 audio playlist — EXPLOITS
        </p>
      </div>

      <div
        className="mta-glass overflow-hidden rounded-[1.75rem]"
        style={{
          background: "linear-gradient(145deg, rgba(15,42,105,0.78), rgba(43,23,104,0.72))",
        }}
      >
        {/* Header bar */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: "rgba(255,255,255,0.055)" }}
        >
          <div className="flex items-center gap-2">
            <Disc3
              className="w-5 h-5 text-[#d7b767]"
              style={{ animation: playing ? "rotate-slow 3s linear infinite" : "none" }}
            />
            <span className="text-[#c8b7ff] text-xs font-bold tracking-wider uppercase">
              Now Playing
            </span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#d7b767]/70" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#c8b7ff]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
          </div>
        </div>

        {/* Player body */}
        <div className="p-6 sm:p-8 text-center">
          {/* Album art */}
          <div className="relative mb-6">
            <div
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl mx-auto flex items-center justify-center relative overflow-hidden"
              style={{ background: "linear-gradient(145deg, #0b1f4d 0%, #442a85 55%, #d7b767 100%)" }}
            >
              <Music className="w-12 h-12 sm:w-14 sm:h-14 text-white/30" />
              {playing && (
                <div
                  className="absolute inset-0 animate-shimmer opacity-20"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                    backgroundSize: "200% auto",
                  }}
                />
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 sm:right-4 w-10 h-10 rounded-full gold-gradient flex items-center justify-center shadow-lg">
              <Headphones className="w-5 h-5 text-[#2D0A4E]" />
            </div>
          </div>

          {/* Track info */}
          <p className="text-white font-bold text-base mb-1">{selectedTrack.label}</p>
          <p className="text-[#c8b7ff] text-xs font-medium tracking-wider uppercase mb-5">
            Official MTA Audio
          </p>

          <div className="mb-5 grid gap-2">
            {mtaAudioTracks.map((track, index) => (
              <button
                key={track.id}
                type="button"
                onClick={() => selectTrack(index)}
                className="rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors"
                style={{
                  background: index === trackIndex ? "rgba(215,183,103,0.18)" : "rgba(255,255,255,0.04)",
                  border: index === trackIndex ? "1px solid rgba(215,183,103,0.46)" : "1px solid rgba(255,255,255,0.08)",
                  color: index === trackIndex ? "#F7E8B5" : "rgba(255,255,255,0.62)",
                }}
              >
                {track.label}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mb-1">
            <input
              type="range"
              min={0}
              max={duration || 0}
              value={current}
              onChange={seek}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#d7b767" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-white/30 mb-5">
            <span>{fmt(current)}</span>
            <span>{duration ? fmt(duration) : "--:--"}</span>
          </div>

          {/* Play/pause */}
          <div className="flex items-center justify-center gap-6 mb-5">
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full gold-gradient flex items-center justify-center text-[#07142b] hover:scale-110 transition-transform shadow-lg shadow-[#d7b767]/20"
            >
              {playing ? <Pause size={22} /> : <Play size={22} className="translate-x-0.5" />}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-3 justify-center">
            <Volume2 className="w-4 h-4 text-[#c8b7ff]" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={changeVolume}
              className="w-28 h-1 rounded-full appearance-none cursor-pointer"
              style={{ accentColor: "#d7b767" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpotifySection;
