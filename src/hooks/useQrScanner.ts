import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

type ScannerState = "idle" | "starting" | "scanning" | "error";

/**
 * Rear-camera QR scanner using getUserMedia + jsQR. Decodes video frames
 * on an interval until a code is found, then stops the camera
 * automatically. Designed for mobile browsers (Android Chrome, iOS
 * Safari) — both support getUserMedia with facingMode: "environment"
 * for the rear camera.
 */
export function useQrScanner(onDecoded: (text: string) => void) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) track.stop();
      streamRef.current = null;
    }
    setState("idle");
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setState("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState("scanning");

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
          onDecoded(result.data);
          stop();
        }
      }, 300);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Camera unavailable: ${err.message}`
          : "Camera unavailable.",
      );
      setState("error");
    }
  }, [onDecoded, stop]);

  useEffect(() => stop, [stop]);

  return { videoRef, canvasRef, state, error, start, stop };
}
