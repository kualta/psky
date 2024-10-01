import { createSignal, For, onMount, type Component } from "solid-js";

const CHARLIMIT = 12;
const MAXPOSTS = 50;
const DID = "did:plc:bpmiiiabnbf2hf7uuqdbjne6";
const SERVER_URL = "https://pico.api.bsky.mom";
const WEBSOCKET = "wss://pico.api.bsky.mom/subscribe";

type PostRecord = {
  rkey: string;
  post: string;
  indexedAt: number;
};

const PostFeed: Component = () => {
  const [posts, setPosts] = createSignal<PostRecord[]>([]);
  const socket = new WebSocket(WEBSOCKET!);

  onMount(async () => {
    setPosts(await getPosts());
    socket.addEventListener("message", (event) => {
      const data = JSON.parse(event.data) as PostRecord;
      setPosts([data, ...posts().slice(0, MAXPOSTS - 1)]);
    });
  });

  const getPosts = async () => {
    const res = await fetch(`${SERVER_URL}/posts`);
    const json = await res.json();
    return json;
  };

  return (
    <div class="flex flex-col">
      <For each={posts()}>
        {(record) => (
          <a
            target="_blank"
            href={`https://bsky.app/profile/${DID}/post/${record.rkey}`}
          >
            <span class="flex gap-x-2 hover:bg-slate-200">
              <span class="w-48 truncate">{record.post}</span>
              <span>{new Date(record.indexedAt).toLocaleTimeString()}</span>
            </span>
          </a>
        )}
      </For>
      <p></p>
    </div>
  );
};

const PostComposer: Component = () => {
  let postInput = "";
  const segmenter = new Intl.Segmenter();

  const graphemeLen = (text: string): number => {
    let iterator = segmenter.segment(text)[Symbol.iterator]();
    let count = 0;

    while (!iterator.next().done) count++;

    return count;
  };

  const sendPost = async (post: string) => {
    await fetch(`${SERVER_URL}/post`, {
      method: "POST",
      body: JSON.stringify({ post: post }),
      headers: { "Content-Type": "application/json" },
    });
  };

  return (
    <div>
      <form
        id="postForm"
        onsubmit={(e) => {
          e.currentTarget.reset();
          e.preventDefault();
        }}
      >
        <input
          type="text"
          id="post"
          placeholder="12 chars max"
          required
          size="12"
          class="mb-4 mr-2 border border-black px-2 py-1"
          onInput={(e) => (postInput = e.currentTarget.value)}
          onPaste={(e) => {
            if (
              graphemeLen(e.clipboardData?.getData("text") ?? "") >= CHARLIMIT
            )
              e.preventDefault();
          }}
          onBeforeInput={(e) => {
            if (e.data && graphemeLen(postInput) >= CHARLIMIT)
              e.preventDefault();
          }}
        />
        <button
          onclick={() => {
            if (postInput.length) sendPost(postInput);
            postInput = "";
          }}
          class="bg-slate-500 px-2 py-1 font-bold text-white hover:bg-slate-700"
        >
          Pico
        </button>
      </form>
    </div>
  );
};

const App: Component = () => {
  return (
    <div class="m-5 flex flex-col items-center font-mono">
      <h1 class="mb-3 text-2xl">picosky</h1>
      <p class="text-xs">
        original idea by{" "}
        <a class="text-sky-500" href="https://bsky.app/profile/cam.fyi">
          @cam.fyi
        </a>
      </p>
      <p class="mb-3 text-xs">
        developed by{" "}
        <a class="text-sky-500" href="https://bsky.app/profile/bsky.mom">
          @bsky.mom
        </a>
      </p>
      <PostComposer />
      <PostFeed />
    </div>
  );
};

export default App;
