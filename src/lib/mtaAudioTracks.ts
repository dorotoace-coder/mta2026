export type MtaAudioTrack = {
  id: string;
  label: string;
  src: string;
};

export const mtaAudioTracks: MtaAudioTrack[] = [
  {
    id: "announcement",
    label: "MTA 2026 — Official Announcement",
    src: "/audio/mta-2026-announcement.mp3",
  },
  {
    id: "fast-prayer-charge",
    label: "MTA 2026 — Fast & Prayer Charge",
    src: "/audio/mta-2026-fast-prayer-charge.mp3",
  },
  {
    id: "prophetic-theme",
    label: "MTA 2026 — Prophetic Theme Sound",
    src: "/audio/mta-2026-prophetic-theme.mp3",
  },
];
