# Gallery Display

[![CI](https://github.com/philhoyt/Gallery-Display/actions/workflows/ci.yml/badge.svg)](https://github.com/philhoyt/Gallery-Display/actions/workflows/ci.yml)

An image gallery block for WordPress with grid, masonry, mosaic, justified, and list layouts.

## Requirements

- WordPress 6.6 or later (tested up to 7.1)
- PHP 7.4 or later

## Installation

Download `gallery-display.zip` from the [latest release](https://github.com/philhoyt/Gallery-Display/releases/latest) and install it through Plugins > Add New Plugin > Upload Plugin. Installed sites pick up later releases through Plugin Update Checker.

To run from a checkout instead, clone the repository into `wp-content/plugins/` and build it:

```bash
npm install
composer install
npm run build
```

## Usage

Add the Gallery Display block, pick images from the media library, and choose a layout in the block sidebar. A core Gallery block can be converted to Gallery Display from the block toolbar, and back again; images, captions, alt text, columns, link settings, alignment, spacing, and colours carry across.

| Layout | What it does | Options |
| --- | --- | --- |
| Grid | Equal-size cells on a fixed column count | Columns, aspect ratio |
| Masonry | Columns with items of varying height | Columns |
| Mosaic | Mixed cell sizes, wide images in the larger slots | Columns |
| Justified | Rows of a consistent height | Row height |
| List | One image per row with caption and description | None |

Options shared by the layouts:

- 1 to 6 columns for grid, masonry, and mosaic.
- Thumbnail and full-size image sizes, listed from the sizes the site registers.
- Captions below the image or overlaid on it, and a caption for the gallery itself.
- Order by date, title, random, or manual arrangement. Mosaic adds a best-fit order that places wide images in the larger cells.
- Click behaviour: PhotoSwipe lightbox, attachment page, media file, or nothing. Links can open in a new tab.
- Left, centre, right, wide, and full alignment, background colour, border, block gap, and an HTML anchor.

Captions and alt text set on the block take precedence. Images without them are read from the media library at render time, so editing an image there updates every gallery it appears in.

The gallery wrapper is a `<figure>`. Masonry and mosaic use Isotope, justified uses `justified-layout`, and the lightbox uses PhotoSwipe 5. Each script is enqueued only on pages whose galleries need it.

### Block attributes

| Attribute | Default | Notes |
| --- | --- | --- |
| `images` | `[]` | Array of `{ id }`, with optional `altOverride`, `captionOverride`, `isDecorative`, `linkTarget`, and `rel` |
| `layout` | `grid` | `grid`, `masonry`, `mosaic`, `justified`, `list`, or a layout added by filter |
| `linkTo` | `lightbox` | `lightbox`, `attachment`, `media`, `none` |
| `thumbnailSize` | `large` | Any registered image size |
| `fullSize` | `full` | Size used by the lightbox and media-file links |
| `showCaption` | `false` | |
| `captionPosition` | `below` | `below` or `overlay` |
| `columns` | `3` | 1 to 6 |
| `aspectRatio` | `1/1` | Grid only |
| `rowHeight` | `200` | Justified only |
| `orderBy` | `default` | `default`, `date-asc`, `date-desc`, `title-asc`, `title-desc`, `rand`, or `auto` (mosaic best fit) |
| `caption` | `""` | Gallery caption, rich text |
| `anchor` | | HTML id |

## REST API

`GET /wp-json/gallery-display/v1/image-sizes` returns every registered image size as `{ slug, label }`, with `full` appended. The inspector's size dropdowns use it. Requires the `edit_posts` capability.

## Extending

A companion plugin can register its own layout:

```php
add_filter( 'gallery_display_valid_layouts', function ( $layouts ) {
    $layouts[] = 'carousel';
    return $layouts;
} );
```

```js
wp.hooks.addFilter(
    'galleryDisplay.layouts',
    'my-plugin/carousel',
    ( layouts ) => [ ...layouts, { value: 'carousel', label: 'Carousel' } ]
);

// Load the layout's stylesheet in the editor preview.
wp.hooks.addFilter(
    'galleryDisplay.previewStylesheets',
    'my-plugin/carousel',
    ( sheets, layout ) =>
        layout === 'carousel'
            ? [ ...sheets, myPluginUrl + 'carousel.css' ]
            : sheets
);
```

## Development

```bash
npm install
composer install     # also copies Plugin Update Checker into lib/

npm run start        # watch build
npm run build        # production build
npm run test:unit    # Jest
npm run lint         # ESLint, Stylelint, and phpcs
npm run format       # Prettier
composer run lint    # phpcs on its own
npm run plugin-zip   # build gallery-display.zip
```

CI runs on every pull request and push to `main`: `composer audit`, a `php -l` syntax check, and phpcs across PHP 7.4 through 8.4, then `npm audit --omit=dev`, ESLint, Stylelint, the Jest suite, and a production build.

Blocks build from `src/` into `build/`. `src/render.php` is copied into `build/` by the `WP_COPY_PHP_FILES_TO_DIST` flag in the build scripts, so at runtime it lives at `build/render.php`.

| Path | Purpose |
| --- | --- |
| `gallery-display.php` | Plugin bootstrap, block registration, REST route |
| `src/render.php` | Server-side render callback |
| `src/edit.js` | Block edit component |
| `src/preview-doc.js` | Builds the editor preview document |
| `src/sanitize.js` | Attribute sanitizers for the preview document |
| `src/inspector.js` | Inspector controls |
| `src/transforms.js` | Core Gallery to Gallery Display transforms |
| `src/frontend/` | Layout initializers and bundled libraries |
| `src/styles/` | One stylesheet per layout |

The editor preview renders into an `<iframe srcdoc>`, which inherits the admin origin. Block attributes come from post content and are not validated by the block API, so everything interpolated into that document goes through `src/sanitize.js` first, and the iframe is sandboxed with `allow-scripts` and no `allow-same-origin`. `src/preview-doc.test.js` covers this; keep those tests passing when changing the preview.

## Releases

Bump the version in `gallery-display.php` (header and `GALLERY_DISPLAY_VERSION`), `src/block.json`, `package.json`, and `readme.txt` (Stable tag and a `= X.Y.Z =` changelog entry), then push a `v` tag:

```bash
git tag v1.2.1 && git push origin v1.2.1
```

The release workflow builds the assets, runs `wp-scripts plugin-zip` (honouring `.distignore`, so `build/` and `lib/` ship and `src/`, `node_modules/`, and `vendor/` do not), checks that the zip contains the plugin file, `build/render.php`, `build/block.json`, the update checker, and `readme.txt`, pulls the matching changelog section out of `readme.txt` for the release notes (and fails if there is none), and attaches the zip and `readme.txt` to the GitHub release.

## Limitations

- The plugin stores no options, user meta, or custom tables and makes no external requests. Deactivating it leaves the block markup in post content unrendered.
- Image sizes come from the sizes the site registers; the block does not generate its own.
- The preview iframe is sandboxed, so a layout added by filter must bring its own stylesheet through `galleryDisplay.previewStylesheets` to appear in the editor.

## Changelog

See `readme.txt`.
