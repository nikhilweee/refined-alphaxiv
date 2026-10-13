# Refined alphaXiv

A lightweight chrome extension that adds two controls on alphaXiv pages:

- An **arXiv button** which opens the matching arXiv abstract or PDF for your
  current view.
- An **auto highlight** mode that enables highlight as you go, without having to
  dismiss the modal.

## Demo

https://github.com/user-attachments/assets/a8b44f9a-99b0-43c3-bfea-4fda825809da

## Install

Chrome Web Store:
https://chromewebstore.google.com/detail/refined-alphaxiv/kecfmgjdkpfpkmckdenanlnhieepnhlk

Local Installation:

1. Clone the repository:
   `git clone https://github.com/nikhilweee/refined-alphaxiv.git`.
2. Open `chrome://extensions` and enable **Developer mode**.
3. Click **Load unpacked** and select the cloned `refined-alphaxiv` directory.
4. Refresh your alphaXiv tab.

No runtime dependencies or build step.

## Usage

Enable Auto highlight, then select text in the PDF reader. It saves using your
selected highlight color without showing the popup. Turn it off for the normal
selection menu. If saving stalls, that menu reappears after 1.5 seconds.

Selections outside the PDF and nonempty notes are left alone. Highlights use
alphaXiv's native UI and account requirements. Changes to its DOM may require
updating the selectors in `content.js`.

## Privacy

The extension makes no network requests of its own and sends no data for any
kind of analytics. It stores only your highlight-mode preference locally in
Chrome.

Highlight saving is handled by alphaXiv's own note system under its privacy
policy. The arXiv button simply opens the corresponding page on arxiv.org.

## Testing

Run the tests (requires Node.js):

```sh
make test
```

For a live check, reload the extension and refresh alphaXiv. Verify highlighting
with the toggle on and off, preference persistence, and arXiv links in both views.

## Release

Create the distributable ZIP from the project root (requires Node.js and `zip`):

```sh
make pack
```

This writes `dist/refined-alphaxiv-<version>.zip`, using the version in
`manifest.json`. It includes only runtime files, PNG icons, and
[license and third-party asset notices](LICENSE.md). Repacking removes stale
archive entries. Run `make` to see all commands. The release ZIP does not submit
or publish the extension.

## License

Original code is licensed under MIT. Third party notices and arXiv logo terms
are in [LICENSE.md](LICENSE.md).

This extension is independently developed and is not affiliated with or endorsed
by alphaXiv or arXiv.
