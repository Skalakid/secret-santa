import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { translate } from "../i18n.js";
import { fadeIn } from "../layout.mjs";
import { GiftIcon, LockIcon, PhoneIcon } from "./Icons.jsx";
import { RichText } from "./RichText.jsx";

function ActionButton({
  id,
  label,
  trailing = "↗",
  countdown,
  disabled = false,
  ariaLabel,
  onClick,
  buttonRef,
}) {
  return (
    <button
      className="primary"
      id={id}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      ref={buttonRef}
    >
      <span className="button-label">{label}</span>
      {countdown > 0 ? (
        <span className="countdown-pill" aria-hidden="true">
          {countdown}
        </span>
      ) : (
        <span className="button-arrow" aria-hidden="true">
          {trailing}
        </span>
      )}
    </button>
  );
}

function Actions({ children, message, progress = 0 }) {
  return (
    <div className="panel-actions" data-layout="actions">
      {children}
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      <p className="privacy-note">
        <LockIcon />
        <span>{message}</span>
      </p>
    </div>
  );
}

function Setup({ model, t, focusRequest, onDraft, onAdd, onRemove }) {
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const errorRef = useRef(null);
  useLayoutEffect(() => {
    const request = focusRequest.current;
    if (!request || request.type === "heading") return;
    const list = listRef.current;
    if (list)
      list.scrollTop = request.scrollToEnd
        ? list.scrollHeight
        : request.scroll || 0;
    if (request.type === "input")
      inputRef.current?.focus({ preventScroll: true });
    if (request.type === "remove") {
      const index = Math.min(request.index, model.names.length - 1);
      (
        list?.querySelector(`[data-remove="${index}"]`) || inputRef.current
      )?.focus({ preventScroll: true });
    }
    focusRequest.current = null;
  }, [model.names, model.language, focusRequest]);
  useLayoutEffect(() => {
    if (model.error) fadeIn(errorRef.current);
  }, [model.error, model.errorRevision]);

  return (
    <div
      className={`setup-content${model.names.length ? "" : " is-empty"}`}
      data-layout="content"
    >
      <h2 className="panel-title">{t("setupTitle")}</h2>
      <p className="panel-description">{t("setupDescription")}</p>
      <form
        className="entry-form"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd();
        }}
      >
        <label className="visually-hidden" htmlFor="name-input">
          {t("inputLabel")}
        </label>
        <input
          id="name-input"
          name="names"
          autoComplete="off"
          placeholder={t("placeholder")}
          maxLength={2200}
          ref={inputRef}
          value={model.draft}
          onChange={(event) => onDraft(event.target.value)}
        />
        <button className="add-button" type="submit">
          {t("add")}
        </button>
      </form>
      <p className="input-help">{t("inputHelp")}</p>
      <p id="error" className="error" role="alert" ref={errorRef}>
        {model.error ? t(model.error) : ""}
      </p>
      <div id="roster">
        {model.names.length ? (
          <ul className="participants" ref={listRef}>
            {model.names.map((name, index) => (
              <li className="person" data-person={name} key={name}>
                <span className="avatar" aria-hidden="true">
                  {Array.from(name)[0].toLocaleUpperCase(model.language)}
                </span>
                <span className="person-name">{name}</span>
                <button
                  type="button"
                  className="remove"
                  data-remove={index}
                  aria-label={t("remove", name)}
                  onClick={() => onRemove(index)}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty">
            <span className="empty-icon" aria-hidden="true">
              ✧
            </span>
            <strong>{t("emptyTitle")}</strong>
            <p>{t("emptyText")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PersonHeading({ name }) {
  return (
    <h2
      className={`recipient-name ${Array.from(name).length > 18 ? "is-long" : ""}`}
      tabIndex={-1}
    >
      {name}
    </h2>
  );
}

function StageBody({ game, t }) {
  if (game.stage === "done")
    return (
      <div className="stage-body" data-layout="content">
        <div className="stage-icon" aria-hidden="true">
          ✦
        </div>
        <div className="mini-stars" aria-hidden="true">
          ✧ ✦ ✧
        </div>
        <p className="stage-eyebrow placeholder" aria-hidden="true" />
        <h2 className="panel-title" tabIndex={-1}>
          {t("doneTitle")}
        </h2>
        <p className="stage-description">
          <RichText>{t("doneDescription")}</RichText>
        </p>
      </div>
    );
  const secret = game.stage === "reveal";
  return (
    <div className="stage-body" data-layout="content">
      <div className="stage-icon">{secret ? <GiftIcon /> : <PhoneIcon />}</div>
      <span
        className={`secret-label${secret ? "" : " placeholder"}`}
        aria-hidden={secret ? undefined : true}
      >
        {secret ? t("secretTag") : ""}
      </span>
      <p className="stage-eyebrow">{t(secret ? "yourGift" : "pass")}</p>
      <PersonHeading
        name={secret ? game.revealed.recipient : game.session.pending[0].giver}
      />
      <p className="stage-description">
        <RichText>
          {t(secret ? "secretDescription" : "handoffDescription")}
        </RichText>
      </p>
    </div>
  );
}

const secondsLeft = (deadline) =>
  deadline === null
    ? 0
    : Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
function useCountdown(deadline) {
  const [clock, setClock] = useState(() => ({
    deadline,
    remaining: secondsLeft(deadline),
  }));
  // A new deadline is rendered immediately, before effects run, so a newly
  // entered handoff never flashes an enabled Reveal button.
  const remaining =
    clock.deadline === deadline ? clock.remaining : secondsLeft(deadline);
  useEffect(() => {
    let timer;
    const update = () => {
      const next = secondsLeft(deadline);
      setClock((previous) =>
        previous.deadline === deadline && previous.remaining === next
          ? previous
          : { deadline, remaining: next },
      );
      if (!next) clearInterval(timer);
    };
    update();
    if (deadline !== null && secondsLeft(deadline))
      timer = setInterval(update, 150);
    return () => clearInterval(timer);
  }, [deadline]);
  return remaining;
}

export function DrawPanel({ model, focusRequest, handlers }) {
  const { language, game } = model;
  const t = (key, ...args) => translate(language, key, ...args);
  const { stage, session } = game;
  const panelRef = useRef(null);
  const revealRef = useRef(null);
  const deadline = stage === "handoff" ? session.readyAt : null;
  const remaining = useCountdown(deadline);
  const previousCountdown = useRef({ deadline, remaining });
  useLayoutEffect(() => {
    const previous = previousCountdown.current;
    if (
      previous.deadline === deadline &&
      previous.remaining > 0 &&
      remaining === 0 &&
      revealRef.current
    ) {
      fadeIn(revealRef.current.querySelector(".button-label"));
    }
    previousCountdown.current = { deadline, remaining };
  }, [deadline, remaining]);
  useLayoutEffect(() => {
    if (focusRequest.current?.type === "heading") {
      panelRef.current?.querySelector("h2")?.focus({ preventScroll: true });
      focusRequest.current = null;
    }
  }, [stage, model.contentRevision, focusRequest]);

  const tag = {
    setup: "list",
    handoff: "handoff",
    reveal: "secret",
    done: "doneLabel",
  }[stage];
  const badge =
    stage === "setup"
      ? t("people", model.names.length)
      : stage === "done"
        ? t("people", session.total)
        : t(
            "turn",
            session.completed + (stage === "handoff" ? 1 : 0),
            session.total,
          );
  let controls;
  if (stage === "setup")
    controls = (
      <Actions message={t("privacy")}>
        <ActionButton
          id="start"
          label={t("start")}
          disabled={model.names.length < 2}
          ariaLabel={t(model.names.length < 2 ? "min" : "start")}
          onClick={handlers.onStart}
        />
      </Actions>
    );
  if (stage === "handoff") {
    const person = session.pending[0].giver;
    const message = !model.storageAvailable
      ? t("storage")
      : game.resumed
        ? t("resume")
        : t("handoffPrivacy");
    controls = (
      <Actions
        message={message}
        progress={(session.completed / session.total) * 100}
      >
        <ActionButton
          id="reveal"
          label={t(remaining > 0 ? "wait" : "revealButton")}
          countdown={remaining}
          disabled={remaining > 0}
          ariaLabel={
            remaining > 0 ? t("wait") : `${t("revealButton")} (${person})`
          }
          onClick={handlers.onReveal}
          buttonRef={revealRef}
        />
      </Actions>
    );
  }
  if (stage === "reveal")
    controls = (
      <Actions
        message={t("secretPrivacy")}
        progress={(session.completed / session.total) * 100}
      >
        <ActionButton
          id="next"
          label={t(session.pending.length ? "next" : "finish")}
          trailing="→"
          onClick={handlers.onNext}
        />
      </Actions>
    );
  if (stage === "done")
    controls = (
      <Actions message={t("donePrivacy")} progress={100}>
        <ActionButton
          id="again"
          label={t("again")}
          onClick={handlers.onAgain}
        />
      </Actions>
    );

  return (
    <>
      <div
        className={`stage ${stage === "reveal" ? "secret" : stage === "done" ? "done" : ""}`}
        ref={panelRef}
      >
        <div className="panel-top">
          <span className="section-tag">{`${stage === "setup" ? "✳" : "✦"} ${t(tag)}`}</span>
          <span className="round-badge">{badge}</span>
        </div>
        {stage === "setup" ? (
          <Setup
            key={model.contentRevision}
            model={model}
            t={t}
            focusRequest={focusRequest}
            {...handlers}
          />
        ) : (
          <StageBody key={model.contentRevision} game={game} t={t} />
        )}
        {controls}
      </div>
      {stage === "setup" && (
        <span id="add-status" className="visually-hidden" role="status">
          {model.announcementCount ? t("added", model.announcementCount) : ""}
        </span>
      )}
      {stage === "handoff" && (
        <p className="visually-hidden" id="timer-status" role="status">
          {remaining === 0 ? t("reveal", session.pending[0].giver) : ""}
        </p>
      )}
    </>
  );
}
