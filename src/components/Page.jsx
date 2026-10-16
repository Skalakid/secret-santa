import { Trans, useTranslation } from "react-i18next";
import { supportedLanguages } from "../i18n.js";

export function Page({ onLanguage, canvasRef, children }) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage;
  return (
    <>
      <div className="site-shell">
        <header>
          <div className="brand">
            <span className="brand-icon" aria-hidden="true">
              ✳
            </span>
            <span>
              merry little draw<span className="brand-dot">.</span>
            </span>
          </div>
          <div className="languages" role="group" aria-label={t("languageLabel")}>
            {supportedLanguages.map((code) => (
              <button
                key={code}
                type="button"
                data-lang={code}
                lang={code}
                aria-pressed={language === code}
                onClick={() => onLanguage(code)}
              >
                {code.toUpperCase()}
              </button>
            ))}
          </div>
        </header>
        <main>
          <section
            className="intro"
            data-layout="intro"
            aria-labelledby="headline"
          >
            <div className="eyebrow">
              <span className="tiny-star">✦</span>
              <span data-i18n="eyebrow">
                {t("eyebrow")}
              </span>
            </div>
            <h1 id="headline" data-i18n="headline">
              <Trans t={t} i18nKey="headline" />
            </h1>
            <p className="intro-copy" data-i18n="intro">
              <Trans t={t} i18nKey="intro" />
            </p>
            <div className="illustration" aria-hidden="true">
              <svg
                viewBox="0 0 440 300"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="223" cy="269" rx="136" ry="15" fill="#e9eadf" />
                <path
                  d="M66 154l7-17 7 17 17 7-17 7-7 17-7-17-17-7 17-7Z"
                  fill="#f3ac96"
                />
                <path
                  d="M344 58l5-13 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z"
                  fill="#1f5146"
                />
                <path
                  d="M365 212l5-11 5 11 11 5-11 5-5 11-5-11-11-5 11-5Z"
                  fill="#c9a24e"
                />
                <circle cx="112" cy="66" r="4" fill="#c8a154" />
                <circle cx="342" cy="144" r="4" fill="#eca08c" />
                <path
                  d="M96 225l-8-8m-3 20-12 3m29-28 2-12M298 31l6-11m7 21 12-2"
                  stroke="#cbab6c"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <g transform="rotate(-9 201 181)">
                  <rect
                    x="116"
                    y="137"
                    width="175"
                    height="125"
                    rx="7"
                    fill="#26584b"
                  />
                  <path d="M120 143h167v24H120z" fill="#164537" />
                  <path d="M191 145h31v117h-31z" fill="#f1b6a9" />
                  <rect
                    x="106"
                    y="119"
                    width="194"
                    height="39"
                    rx="6"
                    fill="#3b6e5c"
                  />
                  <path d="M191 119h31v39h-31z" fill="#fac9bb" />
                  <path
                    d="M207 119c-58 0-80-36-57-43 24-8 53 28 57 43Z"
                    stroke="#edaa99"
                    strokeWidth="11"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M207 119c47-9 66-55 40-53-22 2-33 30-40 53Z"
                    stroke="#fac9bb"
                    strokeWidth="11"
                    strokeLinejoin="round"
                  />
                  <path d="m218 123 19 56 9-13 12 6-29-52" fill="#edaa99" />
                </g>
                <g transform="rotate(12 294 214)">
                  <rect
                    x="255"
                    y="193"
                    width="88"
                    height="70"
                    rx="5"
                    fill="#f3ac96"
                  />
                  <path d="M289 198h17v65h-17z" fill="#bf624f" />
                  <rect
                    x="248"
                    y="182"
                    width="102"
                    height="23"
                    rx="4"
                    fill="#f8c5af"
                  />
                  <path d="M289 182h17v23h-17z" fill="#cf7964" />
                  <path
                    d="M298 184c-34-3-44-25-28-28 14-3 28 28 28 28Zm0 0c29-8 34-33 20-30-13 2-20 30-20 30Z"
                    stroke="#c7715b"
                    strokeWidth="7"
                  />
                </g>
                <path
                  d="m168 217 4-8 5 8 9 1-7 6 2 9-9-4-8 4 1-9-6-6 9-1Z"
                  fill="#a5c0a4"
                />
              </svg>
              <span className="illustration-note" data-i18n="illustrationNote">
                {t("illustrationNote")}
              </span>
            </div>
            <div className="promise">
              <span aria-hidden="true">↗</span>
              <span data-i18n="promise">
                {t("promise")}
              </span>
            </div>
          </section>
          <section
            className="draw-panel"
            data-layout="panel"
            aria-label="Secret Santa"
          >
            <div id="app">{children}</div>
            <noscript>
              Please enable JavaScript to draw names. / Włącz JavaScript, aby
              losować imiona.
            </noscript>
          </section>
        </main>
        <section
          className="how-it-works"
          data-layout="instructions"
          aria-label="How it works"
        >
          <div>
            <span className="step-num">01</span>
            <p>
              <strong data-i18n="step1Title">
                {t("step1Title")}
              </strong>
              <span data-i18n="step1">
                {t("step1")}
              </span>
            </p>
          </div>
          <div>
            <span className="step-num">02</span>
            <p>
              <strong data-i18n="step2Title">
                {t("step2Title")}
              </strong>
              <span data-i18n="step2">
                {t("step2")}
              </span>
            </p>
          </div>
          <div>
            <span className="step-num">03</span>
            <p>
              <strong data-i18n="step3Title">
                {t("step3Title")}
              </strong>
              <span data-i18n="step3">
                {t("step3")}
              </span>
            </p>
          </div>
        </section>
        <footer data-layout="footer">
          <span data-i18n="footer">
            {t("footer")}
          </span>
          <span className="footer-note">
            <svg
              className="footer-star"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
            <span data-i18n="footerRight">
              {t("footerRight")}
            </span>
          </span>
        </footer>
      </div>
      <canvas ref={canvasRef} id="confetti" aria-hidden="true"></canvas>
    </>
  );
}
