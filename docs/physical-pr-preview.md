# Physical iPhone preview for a pull request

Use a GitHub Codespace created from the pull request branch. A forwarded Codespaces port gives the iPhone an isolated HTTPS origin without deploying to or changing the production GitHub Pages site.

## Start an exact-commit preview

1. Open PR #152 on GitHub and choose **Code → Codespaces → Create codespace on this branch**.
2. In the Codespace terminal, verify and start the expected commit:

   ```sh
   git status --short --branch
   PREVIEW_EXPECTED_SHA="$(git rev-parse HEAD)" npm run preview:physical
   ```

   To pin a SHA supplied by the reviewer, replace `$(git rev-parse HEAD)` with that full SHA. The server refuses a mismatch or a dirty working tree.
3. Open the **Ports** tab, find port `4173`, and set **Port visibility** to **Public** only for the duration of the physical test. Copy its HTTPS forwarded address.
4. On the iPhone, first open `<forwarded-url>/__preview`. Confirm that the full commit SHA matches PR #152, then use **Open candidate**.
5. After testing, set the port back to **Private**, stop the server with `Ctrl+C`, and delete the Codespace if it is no longer needed.

The machine-readable identity is available at `<forwarded-url>/__preview.json`. Every response also includes `X-Preview-Commit`. Static application requests are allowlisted to the production root files and the `css/`, `data/`, `icons/`, and `js/` trees; repository metadata and audit files are not exposed.

## Why this method

| Method | Production isolation | HTTPS iPhone access | Exact SHA evidence | Repository secret required |
| --- | --- | --- | --- | --- |
| Codespaces forwarded port | Yes, unique temporary origin | Yes | Yes, diagnostic route and response header | No |
| Production GitHub Pages | No | Yes | No; serves `main` | No |
| Third-party preview deployment | Usually | Yes | Provider-dependent | Usually yes |

Codespaces is the lowest-risk repository-controlled option here: it does not alter the Pages deployment, requires no third-party deployment credential, and can be destroyed after acceptance.
