# Merry Little Draw

A mobile-first Secret Santa site in English and Polish. Supports 2–50 people.

Add names individually or paste a comma-separated list, then start the draw.
Pass the phone to the named person, wait five seconds, and let that person reveal
their recipient. After they remember the name, Next clears the reveal and starts
the next handoff. The last person finishes the draw without a pairing summary.

Every recipient appears exactly once, and nobody draws themselves. Draws use
cryptographic browser randomness and uniformly sample valid derangements.

Pending pairings stay in this tab's session storage. A pairing is removed before
it is shown. Refreshing or leaving a revealed screen skips forward: that reveal
cannot be recovered. The app creates no browser history entries for draw steps.
Closing the tab ends the session. Keep one tab open and pass the same device.
This is privacy for a shared-phone party flow, not protection against someone
inspecting browser developer tools or taking screenshots.

## Local preview

From this folder, run:

    python3 -m http.server 5173

Then open http://localhost:5173 in a browser. No install or build step is needed.
Google Fonts enhance the typography; system fonts are used if unavailable.
