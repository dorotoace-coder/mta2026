// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, cleanup } from "@testing-library/react";
import { useQrScanner } from "./useQrScanner";

const mockJsQR = vi.fn();
vi.mock("jsqr", () => ({ default: (...args: unknown[]) => mockJsQR(...args) }));

function makeTrack() {
  return { stop: vi.fn() };
}

function makeStream(tracks: ReturnType<typeof makeTrack>[]) {
  return { getTracks: () => tracks } as unknown as MediaStream;
}

function makeFakeVideo() {
  return {
    srcObject: null,
    play: vi.fn().mockResolvedValue(undefined),
    videoWidth: 100,
    videoHeight: 100,
    readyState: 4,
    HAVE_ENOUGH_DATA: 4,
  } as unknown as HTMLVideoElement;
}

function makeFakeCanvas() {
  const ctx = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })) };
  return { getContext: () => ctx, width: 0, height: 0 } as unknown as HTMLCanvasElement;
}

/** Lets any pending promise continuations (e.g. a resolved play()) run. */
const flushMicrotasks = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("useQrScanner", () => {
  let getUserMediaMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    getUserMediaMock = vi.fn();
    Object.defineProperty(global.navigator, "mediaDevices", {
      value: { getUserMedia: getUserMediaMock },
      configurable: true,
    });
    mockJsQR.mockReset();
    // Scoped to just setInterval/clearInterval — faking setTimeout too
    // would break the flushMicrotasks() helper above.
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("stops every track when active flips back to false (cancel)", async () => {
    const track = makeTrack();
    const stream = makeStream([track]);
    getUserMediaMock.mockResolvedValue(stream);

    const { result, rerender } = renderHook(({ active }) => useQrScanner(active, vi.fn()), {
      initialProps: { active: true },
    });
    result.current.videoRef.current = makeFakeVideo();

    await vi.waitFor(() => expect(getUserMediaMock).toHaveBeenCalled());
    await flushMicrotasks();

    rerender({ active: false });

    expect(track.stop).toHaveBeenCalled();
  });

  it("stops every track and calls onDecoded when a QR code is found", async () => {
    const track = makeTrack();
    const stream = makeStream([track]);
    getUserMediaMock.mockResolvedValue(stream);
    mockJsQR.mockReturnValue({ data: "https://mta.heartbeatofgod.ca/checkin/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });

    const onDecoded = vi.fn();
    const { result } = renderHook(() => useQrScanner(true, onDecoded));
    result.current.videoRef.current = makeFakeVideo();
    result.current.canvasRef.current = makeFakeCanvas();

    await vi.waitFor(() => expect(getUserMediaMock).toHaveBeenCalled());
    await flushMicrotasks();

    await vi.advanceTimersByTimeAsync(300);

    expect(onDecoded).toHaveBeenCalledWith("https://mta.heartbeatofgod.ca/checkin/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
    expect(track.stop).toHaveBeenCalled();
  });

  it("stops every track on unmount while still active", async () => {
    const track = makeTrack();
    const stream = makeStream([track]);
    getUserMediaMock.mockResolvedValue(stream);

    const fakeVideo = makeFakeVideo();
    const { result, unmount } = renderHook(() => useQrScanner(true, vi.fn()));
    result.current.videoRef.current = fakeVideo;

    // Wait for the acquisition to fully settle (getUserMedia resolved,
    // srcObject assigned, play() called and its promise drained) before
    // unmounting — otherwise unmount can race ahead of the stream ever
    // being attached to streamRef, which would make "stop was called"
    // trivially true for the wrong reason (nothing to stop yet).
    await vi.waitFor(() => expect(fakeVideo.play).toHaveBeenCalled());
    await flushMicrotasks();

    unmount();

    expect(track.stop).toHaveBeenCalled();
  });

  it("stops the acquired stream if the video element never mounted", async () => {
    const track = makeTrack();
    const stream = makeStream([track]);
    getUserMediaMock.mockResolvedValue(stream);

    const { result } = renderHook(() => useQrScanner(true, vi.fn()));
    // videoRef.current intentionally left null.

    await vi.waitFor(() => expect(getUserMediaMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(track.stop).toHaveBeenCalled());
    await vi.waitFor(() => expect(result.current.error).toMatch(/video element not ready/i));
  });

  it("stops the acquired stream if video.play() rejects", async () => {
    const track = makeTrack();
    const stream = makeStream([track]);
    getUserMediaMock.mockResolvedValue(stream);

    const fakeVideo = makeFakeVideo();
    (fakeVideo.play as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("NotAllowedError"));

    const { result } = renderHook(() => useQrScanner(true, vi.fn()));
    result.current.videoRef.current = fakeVideo;

    await vi.waitFor(() => expect(getUserMediaMock).toHaveBeenCalled());
    await vi.waitFor(() => expect(track.stop).toHaveBeenCalled());
    await vi.waitFor(() => expect(result.current.error).toMatch(/NotAllowedError/));
  });

  it("surfaces an error and acquires nothing further when getUserMedia itself rejects", async () => {
    getUserMediaMock.mockRejectedValue(new Error("Permission denied"));

    const { result } = renderHook(() => useQrScanner(true, vi.fn()));

    await vi.waitFor(() => expect(result.current.error).toMatch(/Permission denied/));
  });
});
