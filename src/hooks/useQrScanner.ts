import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

/**
 * Rear-camera QR scanner using getUserMedia + jsQR. The camera is
 * owned entirely by the `active` flag: the caller toggles it (e.g. a
 * "Scan QR" / "Cancel" button pair), and this hook's effect starts the
 * camera only once `active` is true AND the <video> element it's
 * attached to has actually mounted (refs are set during React's commit
 * phase, which always runs before effects) — never on the same tick
 * that flips `active`, which previously allowed an acquired stream to
 * be silently orphaned if the video element hadn't rendered yet.
 *
 * Every acquisition path — successful decode, effect cleanup (cancel
 * or unmount), a getUserMedia rejection, a play() rejection, or the
 * effect being cancelled mid-flight — stops every track on the
 * stream. No path can leave a camera stream running unstopped.
 */
export function useQrScanner(active: boolean, onDecoded: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stopTracks = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!active) {
      stopTracks();
      return;
    }

    let cancelled = false;
    setError(null);

    void (async () => {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? `Camera unavailable: ${err.message}` : "Camera unavailable.");
        }
        return;
      }

      // The effect was cancelled (active flipped off, or unmount) while
      // getUserMedia was pending, or the video element never mounted —
      // never leave the just-acquired stream running.
      if (cancelled || !videoRef.current) {
        for (const track of stream.getTracks()) track.stop();
        if (!cancelled) setError("Camera unavailable: video element not ready.");
        return;
      }

      videoRef.current.srcObject = stream;
      try {
        await videoRef.current.play();
      } catch (err) {
        for (const track of stream.getTracks()) track.stop();
        if (!cancelled) {
          setError(err instanceof Error ? `Camera unavailable: ${err.message}` : "Camera unavailable.");
        }
        return;
      }

      if (cancelled) {
        for (const track of stream.getTracks()) track.stop();
        return;
      }

      streamRef.current = stream;
      intervalRef.current = window.setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = jsQR(frame.data, frame.width, frame.height);
        if (result?.data) {
          stopTracks();
          onDecoded(result.data);
        }
      }, 300);
    })();

    return () => {
      cancelled = true;
      stopTracks();
    };
  }, [active, onDecoded, stopTracks]);

  return { videoRef, canvasRef, error };
}
