import { useRef, useState } from "react";
import { Pause, Play, Music2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <>
      <audio ref={audioRef} src={selectedTrack.src} loop preload="metadata" />
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed bottom-5 left-5 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl"
            style={{
              background: "rgba(7,20,43,0.92)",
              border: "1px solid rgba(215,183,103,0.34)",
              backdropFilter: "blur(12px)",
            }}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 12 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <div className="relative w-8 h-8 rounded-full gold-gradient flex items-center justify-center shrink-0">
              <Music2
                className="w-4 h-4 text-[#2D0A4E]"
                style={{ animation: playing ? "rotate-slow 3s linear infinite" : "none" }}
              />
            </div>

            <div className="leading-tight">
              <AnimatePresence mode="wait">
                <motion.p
                  key={trackIndex}
                  className="max-w-[170px] truncate text-white text-xs font-bold"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                >
                  {selectedTrack.label}
                </motion.p>
              </AnimatePresence>
              <div className="mt-1 flex gap-1" aria-label="MTA audio playlist">
                {mtaAudioTracks.map((track, index) => (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => selectTrack(index)}
                    className="h-1.5 w-5 rounded-full transition-colors"
                    style={{ background: index === trackIndex ? "#d7b767" : "rgba(255,255,255,0.22)" }}
                    aria-label={`Play ${track.label}`}
                  />
                ))}
              </div>
            </div>

            <button
              onClick={toggle}
              className="w-8 h-8 rounded-full bg-[#d7b767]/18 hover:bg-[#d7b767]/34 flex items-center justify-center transition-colors"
            >
              {playing
                ? <Pause className="w-3.5 h-3.5 text-[#d7b767]" />
                : <Play className="w-3.5 h-3.5 text-[#d7b767] translate-x-px" />
              }
            </button>

            <button
              onClick={() => { audioRef.current?.pause(); setVisible(false); }}
              className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3 text-white/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingPlayer;
