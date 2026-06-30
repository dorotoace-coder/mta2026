import { useRef, useState } from "react";
import { Pause, Play, Music2, X } from "lucide-react";
import { mtaAudioTracks } from "@/lib/mtaAudioTracks";

const FloatingPlayer = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [visible, setVisible] = useState(true);
  const [trackIndex, setTrackIndex] = useState(0);
  const selectedTrack = mtaAudioTracks[trackIndex];

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const selectTrack = (index: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setPlaying(false);
    setTrackIndex(index);
  };

  if (!visible) return null;

  return (
    <>
      <audio ref={audioRef} src={selectedTrack.src} loop preload="metadata" />
      <div
        className="fixed bottom-5 left-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
        style={{
          background: "rgba(45,10,78,0.92)",
          border: "1px solid rgba(201,151,42,0.35)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="relative w-8 h-8 rounded-full gold-gradient flex items-center justify-center shrink-0">
          <Music2
            className="w-4 h-4 text-[#2D0A4E]"
            style={{ animation: playing ? "rotate-slow 3s linear infinite" : "none" }}
          />
        </div>

        <div className="leading-tight">
          <p className="max-w-[170px] truncate text-white text-xs font-bold">{selectedTrack.label}</p>
          <div className="mt-1 flex gap-1" aria-label="MTA audio playlist">
            {mtaAudioTracks.map((track, index) => (
              <button
                key={track.id}
                type="button"
                onClick={() => selectTrack(index)}
                className="h-1.5 w-5 rounded-full transition-colors"
                style={{ background: index === trackIndex ? "#C9972A" : "rgba(255,255,255,0.2)" }}
                aria-label={`Play ${track.label}`}
              />
            ))}
          </div>
        </div>

        <button
          onClick={toggle}
          className="w-8 h-8 rounded-full bg-[#C9972A]/20 hover:bg-[#C9972A]/40 flex items-center justify-center transition-colors"
        >
          {playing
            ? <Pause className="w-3.5 h-3.5 text-[#C9972A]" />
            : <Play className="w-3.5 h-3.5 text-[#C9972A] translate-x-px" />
          }
        </button>

        <button
          onClick={() => { audioRef.current?.pause(); setVisible(false); }}
          className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <X className="w-3 h-3 text-white/40" />
        </button>
      </div>
    </>
  );
};

export default FloatingPlayer;
