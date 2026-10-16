import { useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createConfetti } from "./confetti.js";
import {
  initialGame,
  nextGame,
  restoreGame,
  revealGame,
  startGame,
  validateNames,
} from "./game.mjs";
import { stopLayoutMotion } from "./layout.mjs";
import { readInitialState, saveLanguage, saveSession } from "./session.mjs";
import { DrawPanel } from "./components/DrawPanel.jsx";
import { LayoutMotion } from "./components/LayoutMotion.jsx";
import { Page } from "./components/Page.jsx";

export default function App() {
  const [model, setModel] = useState(() => ({
    ...readInitialState(),
    names: [],
    draft: "",
    error: "",
    errorRevision: 0,
    announcementCount: 0,
    layoutRevision: 0,
    contentRevision: 0,
  }));
  const current = useRef(model);
  const focusRequest = useRef(null);
  const canvasRef = useRef(null);
  const confetti = useRef(null);

  function commit(
    changes,
    { layout = true, content = false, persist = false } = {},
  ) {
    const previous = current.current;
    const next = {
      ...previous,
      ...changes,
      layoutRevision: previous.layoutRevision + Number(layout),
      contentRevision: previous.contentRevision + Number(content),
    };
    // Persist only future pairings, before allowing React to display a reveal.
    // Persistence is deliberately an event operation, never a delayed effect.
    if (persist && !saveSession(next.game.session))
      next.storageAvailable = false;
    current.current = next;
    setModel(next);
  }

  function listScroll() {
    return document.querySelector(".participants")?.scrollTop || 0;
  }
  function onLanguage(language) {
    saveLanguage(language);
    focusRequest.current = { scroll: listScroll() };
    commit({ language, error: "", announcementCount: 0 }, { content: true });
  }
  function onDraft(draft) {
    commit({ draft }, { layout: false });
  }
  function onAdd() {
    const previous = current.current;
    const result = validateNames(
      previous.draft,
      previous.names,
      previous.language,
    );
    if (result.issue) {
      commit(
        { error: result.issue, errorRevision: previous.errorRevision + 1 },
        { layout: false },
      );
      return;
    }
    focusRequest.current = { type: "input", scrollToEnd: true };
    commit({
      names: [...previous.names, ...result.entries],
      draft: "",
      error: "",
      announcementCount: result.entries.length,
    });
  }
  function onRemove(index) {
    const names = current.current.names.filter(
      (_, position) => position !== index,
    );
    focusRequest.current = { type: "remove", index, scroll: listScroll() };
    commit({ names });
  }
  function onStart() {
    const previous = current.current;
    if (previous.names.length < 2 || previous.game.stage !== "setup") return;
    focusRequest.current = { type: "heading" };
    commit(
      {
        game: startGame(previous.names),
        names: [],
        draft: "",
        error: "",
        announcementCount: 0,
      },
      { content: true, persist: true },
    );
  }
  function onReveal() {
    const game = revealGame(current.current.game);
    if (!game) return;
    focusRequest.current = { type: "heading" };
    commit({ game }, { content: true, persist: true });
    confetti.current?.celebrate();
  }
  function onNext() {
    const game = nextGame(current.current.game);
    if (!game) return;
    confetti.current?.stop();
    focusRequest.current = { type: "heading" };
    commit({ game }, { content: true, persist: true });
  }
  function onAgain() {
    focusRequest.current = { type: "input" };
    commit(
      {
        game: initialGame(),
        names: [],
        draft: "",
        error: "",
        announcementCount: 0,
      },
      { content: true, persist: true },
    );
  }

  useLayoutEffect(() => {
    document.documentElement.lang = model.language;
    document.title =
      model.language === "pl"
        ? "Merry Little Draw · Mikołajki"
        : "Merry Little Draw · Secret Santa";
  }, [model.language]);

  useLayoutEffect(() => {
    const controller = createConfetti(canvasRef.current);
    confetti.current = controller;
    function pageHide() {
      if (current.current.game.stage === "reveal") {
        // A browser can cache the DOM immediately after pagehide. Flush the
        // forward state here so Back can never restore the outgoing reveal.
        flushSync(onNext);
      }
      controller.stop();
      stopLayoutMotion();
      document.body.classList.add("page-hidden");
    }
    function pageShow(event) {
      document.body.classList.remove("page-hidden");
      if (event.persisted) {
        flushSync(() =>
          commit(
            { game: restoreGame(current.current.game) },
            { content: true },
          ),
        );
      }
    }
    function visibilityChange() {
      document.body.classList.toggle("page-hidden", document.hidden);
      if (document.hidden) {
        controller.stop();
        stopLayoutMotion();
      }
    }
    window.addEventListener("pagehide", pageHide);
    window.addEventListener("pageshow", pageShow);
    document.addEventListener("visibilitychange", visibilityChange);
    return () => {
      window.removeEventListener("pagehide", pageHide);
      window.removeEventListener("pageshow", pageShow);
      document.removeEventListener("visibilitychange", visibilityChange);
      controller.stop();
      stopLayoutMotion();
    };
  }, []);

  return (
    <LayoutMotion revision={model.layoutRevision}>
      <Page
        language={model.language}
        onLanguage={onLanguage}
        canvasRef={canvasRef}
      >
        <DrawPanel
          model={model}
          focusRequest={focusRequest}
          handlers={{
            onDraft,
            onAdd,
            onRemove,
            onStart,
            onReveal,
            onNext,
            onAgain,
          }}
        />
      </Page>
    </LayoutMotion>
  );
}
