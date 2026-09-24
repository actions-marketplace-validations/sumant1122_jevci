# Knowledge Signal

> A JEV-powered learning diagnostic that turns study notes into confidence-aware knowledge profiles.

Knowledge Signal helps learners understand what their notes actually demonstrate about a subject. Paste notes or upload a text/Markdown file, set a topic and scope, and receive a visual profile—not a black-box grade.

The app evaluates demonstrated knowledge across five dimensions, reports JEV's confidence in every rating, and clearly separates evidence from assumptions.

## Why it exists

Notes are a useful learning artifact, but their length and polish do not reliably reveal understanding. A page full of terminology may reflect less knowledge than a short note that accurately explains a concept, links causes to effects, and applies it to a realistic situation.

Knowledge Signal uses structured JEV judgments to make that distinction visible. It is designed to support reflection and study planning—not to label a learner or make high-stakes decisions.

## What it assesses

JEV evaluates the submitted notes independently across these five lenses:

| Dimension | What it looks for |
| --- | --- |
| Conceptual depth | Understanding beyond isolated keywords or definitions |
| Technical accuracy | Accurate claims and absence of material errors |
| Applied reasoning | Examples, procedures, trade-offs, troubleshooting, or decisions |
| Mental model | Relationships, mechanisms, causes, and consequences |
| Topic scope | Demonstrated breadth relative to the selected topic scope |

Each lens uses a descriptive five-level scale, from no demonstrated understanding to nuanced mastery. The server normalizes the scores to 0–100, then combines them with transparent weights:

```text
30% conceptual depth
25% technical accuracy
20% applied reasoning
15% mental model
10% topic scope
```

The resulting overall score is a summary, not a replacement for the individual dimensions.

## Understanding JEV rating confidence

**Score** and **JEV rating confidence** mean different things:

- A score of `85/100` means the notes strongly demonstrate that dimension.
- A `66% JEV rating confidence` means the evidence is somewhat split between nearby levels, so the exact score is less certain.

Confidence measures how concentrated JEV's probability distribution is around its rating. It does **not** measure the learner's ability, intelligence, or potential.

## How it works

```text
Notes + topic + expected scope
              │
              ▼
      Node.js server (API key stays here)
              │
              ▼
       JEV scores 5 questions in parallel
              │
              ▼
 Normalize scores → apply weights → return profile
              │
              ▼
   Browser renders score, dimensions, confidence, and elapsed time
```

The browser displays the user-visible analysis time, which includes the network request, server work, and JEV response.

## Quick start

### Prerequisites

- Node.js 20+
- A [TypeSafe AI](https://typesafe.ai) API key

### Install and run

```sh
git clone https://github.com/sumant1122/knowledge-signal.git
cd knowledge-signal
npm install
TYPESAFE_API_KEY=your_key npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For a local-only configuration, you can place the key in your shell environment before starting the server. Do not commit API keys or `.env` files.

## Using the diagnostic

1. Enter a topic, such as `Linux`.
2. Optionally define the scope, such as `command line and permissions`.
3. Paste study notes or upload a `.txt` / `.md` file.
4. Select **Analyze notes**.
5. Review the overall score, JEV rating confidence, elapsed time, and each diagnostic lens.

The prototype accepts up to 40,000 characters. It currently supports pasted text and text/Markdown files.

## Project structure

```text
.
├── server.js          # Static server, JEV request, normalization, and composite score
├── public/
│   ├── index.html     # Product interface
│   ├── app.js         # Form handling and profile rendering
│   └── styles.css     # Responsive visual design
├── package.json
└── README.md
```

## Privacy and responsible use

- The TypeSafe API key is only read by the server; it is never sent to the browser.
- Keep secrets and personal data out of submitted notes.
- This prototype sends notes to the configured TypeSafe AI service for analysis.
- The output reflects **demonstrated knowledge in the submitted material**, not complete subject mastery.
- Do not use it as the sole basis for admissions, hiring, grading, or other high-stakes decisions.

## Roadmap

- [ ] Add `.docx` and PDF text extraction
- [ ] Generate a short adaptive quiz to validate uncertain or weak dimensions
- [ ] Suggest a personalized study plan based on the profile
- [ ] Let users tune assessment weights by learning goal
- [ ] Add optional history and progress tracking with explicit consent

## Built with

- [JEV / TypeSafe AI](https://typesafe.ai) for typed, probability-aware assessments
- Node.js and the TypeSafe JavaScript SDK
- Vanilla HTML, CSS, and JavaScript

## License

TBD.
