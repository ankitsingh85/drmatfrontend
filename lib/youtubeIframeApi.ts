// Multiple components on the same page (e.g. Treatment.tsx and
// HappyStories.tsx, both rendered on the homepage) each want to know when
// the YouTube IFrame API is ready. window.onYouTubeIframeAPIReady is a
// single global slot — if each component just assigns to it directly,
// whichever component mounts last silently clobbers every earlier
// registration, so only the last-mounted component's players ever
// initialize (the others stay as empty/black boxes forever). This queues
// every caller's callback in one shared list and fires all of them off a
// single script load, instead of components stomping on each other.
const pendingCallbacks: Array<() => void> = [];

export function loadYouTubeIframeApi(onReady: () => void) {
  if (typeof window === "undefined") return;

  const w = window as any;
  if (w.YT && w.YT.Player) {
    onReady();
    return;
  }

  pendingCallbacks.push(onReady);

  w.onYouTubeIframeAPIReady = () => {
    const callbacks = pendingCallbacks.splice(0, pendingCallbacks.length);
    callbacks.forEach((cb) => cb());
  };

  if (!document.getElementById("youtube-iframe-api")) {
    const tag = document.createElement("script");
    tag.id = "youtube-iframe-api";
    tag.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(tag);
  }
}
