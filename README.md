# Knowledge Diagnostic

A small JEV-powered prototype for assessing what a user's notes demonstrate about a topic.

## Run

```sh
npm install
TYPESAFE_API_KEY=your_key npm run dev
```

Then open `http://localhost:3000`.

## Assessment design

JEV scores the submitted notes independently on conceptual depth, technical accuracy, applied reasoning, mental model, and topic scope. The server normalizes each 0–4 score to 0–100 and applies transparent weights. It also returns per-dimension confidence, which the UI displays instead of hiding uncertainty.

This measures *demonstrated knowledge in the submitted notes*, not a user's complete knowledge. A stronger product should use this result to select a short adaptive quiz, then combine the two signals.

The prototype accepts pasted text or `.txt`/`.md` uploads. The TypeSafe API key remains server-side.
