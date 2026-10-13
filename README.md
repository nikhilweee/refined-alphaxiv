# Refined alphaXiv

A small Chrome extension with two controls on alphaXiv paper pages:

- The **arXiv logo**, next to Share on the left of the top bar, opens
  the arXiv abstract in Abstract view or the arXiv PDF in Paper view. It uses the official
  [small arXiv logomark](https://info.arxiv.org/brand/logos.html), embedded locally.
- The floating **highlighter** button, above Paper info and Notes, automatically
  saves selected PDF text using alphaXiv's native note composer. Red means on.
  It starts off; your preference is saved locally.

## Install

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select this directory.
3. Refresh your alphaXiv tab. The controls appear alongside the reader's native
   top-bar and floating buttons.

No runtime dependencies or build step. Your highlight preference is shared
across your alphaXiv tabs.

## Usage

Enable Auto highlight, then select text in the PDF reader. It saves using your
selected highlight color without showing the popup. Turn it off for the normal
selection menu. If saving stalls, that menu reappears after 1.5 seconds.

Selections outside the PDF and nonempty notes are left alone. Highlights use
alphaXiv's native UI and account requirements; changes to its DOM may require
updating the selectors in `content.js`.

## Privacy

The extension runs only on alphaXiv and uses the `storage` permission to save
your highlight-mode preference locally. It collects no analytics and does not
independently store or transmit selected text. Highlights are saved through
alphaXiv under its own privacy policy; the arXiv button simply navigates to
arxiv.org.

## Development

Run the regression checks with Node.js; no dependency installation is needed:

```sh
make test
```

The checks use a simulated reader to cover selection timing, delayed composers,
AI mode, timeouts, unrelated selections, preference changes, and SPA navigation.
For live validation, reload the extension and refresh an alphaXiv PDF page:

- Select text with Auto highlight on; verify it saves without a visible popup.
- Turn it off; verify the manual selection menu appears.
- Select text after switching the composer to Ask AI; verify a highlight saves.
- Reload the page; verify the preference and saved highlight persist.
- Navigate between papers and home; verify the arXiv link and control placement.

## Release

Create the distributable ZIP from the project root (requires Node.js and `zip`):

```sh
make pack
```

This writes `dist/refined-alphaxiv-<version>.zip`, using the version in
`manifest.json`. It includes only runtime files, PNG icons, and
[license and third-party asset notices](LICENSE.md). Repacking removes stale
archive entries. Run `make` to see all commands.

Chrome Web Store publishing additionally needs a listing and store screenshots;
the release ZIP does not submit or publish the extension.

## License

Original project code is [MIT-licensed](LICENSE.md). The Lucide highlighter
remains ISC-licensed, with its notice included in the same file. The arXiv
logomark is excluded from MIT; attribution does not establish logo-use
permission. Before public distribution, obtain applicable permission from
arXiv or replace the logo with a text or generic link button.

This extension is independently developed and is not affiliated with or
endorsed by alphaXiv or arXiv.
