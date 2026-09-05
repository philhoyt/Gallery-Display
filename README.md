# Gallery Display

[![CI](https://github.com/philhoyt/gallery-display/actions/workflows/ci.yml/badge.svg)](https://github.com/philhoyt/gallery-display/actions/workflows/ci.yml)

An image gallery block for WordPress with grid, masonry, mosaic, justified, and
list layouts.

- **Requires WordPress:** 6.6 or later (tested up to 7.1)
- **Requires PHP:** 7.4 or later
- **License:** GPL-2.0-or-later

## Layouts

| Layout | Description | Options |
| --- | --- | --- |
| Grid | Equal-size cells on a fixed column count | Columns, aspect ratio |
| Masonry | Column layout with items of varying height | Columns |
| Mosaic | Mixed cell sizes, wide images in the larger slots | Columns |
| Justified | Rows of a consistent height | Row height |
| List | One image per row with caption and description | — |

## Options

- 1 to 6 columns for grid, masonry, and mosaic.
- Thumbnail and full-size image sizes, listed from the sizes the site registers.
- Captions below the image or overlaid on it.
- Order by date, title, random, or manual arrangement. Mosaic adds a best-fit
  order that places wide images in the larger cells.
- Click behaviour: PhotoSwipe lightbox, attachment page, media file, or nothing.

Image metadata is read at render time, so editing an image in the media library
updates every gallery it appears in.

## Installation

Download a release zip and install it through **Plugins → Add New → Upload
Plugin**, or clone the repository into `wp-content/plugins/` and build it:

```bash
npm install
composer install
npm run build
```

## Development

```bash
npm run start        # watch build
npm run build        # production build
npm run test:unit    # Jest
npm run lint         # ESLint, Stylelint and PHPCS
npm run format       # Prettier
composer run lint    # PHPCS on its own
```

CI runs on every pull request and every push to `main`
(`.github/workflows/ci.yml`): PHPCS and a `php -l` syntax check across PHP
7.4 through 8.4, then ESLint, Stylelint, the Jest suite, and a production
build. Both dependency trees are audited — `composer audit` and
`npm audit --omit=dev`.

Blocks build from `src/` into `build/`. `src/render.php` is copied into `build/`
by the `WP_COPY_PHP_FILES_TO_DIST` flag in the build scripts, so at runtime it
lives at `build/render.php`.

### Layout of the source

| Path | Purpose |
| --- | --- |
| `gallery-display.php` | Plugin bootstrap, block registration, REST route |
| `src/render.php` | Server-side render callback |
| `src/edit.js` | Block edit component |
| `src/preview-doc.js` | Builds the editor preview document |
| `src/sanitize.js` | Attribute sanitizers for the preview document |
| `src/inspector.js` | Inspector controls |
| `src/frontend/` | Layout initializers and bundled libraries |
| `src/styles/` | One stylesheet per layout |

### Extending

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

## Security notes

The editor preview renders into an `<iframe srcdoc>`, which inherits the admin
origin. Block attributes come from post content and are not validated by the
block API, so everything interpolated into that document goes through
`src/sanitize.js` first, and the iframe is sandboxed with `allow-scripts` and no
`allow-same-origin`. `src/preview-doc.test.js` covers this — please keep those
tests passing when changing the preview.

## Privacy

The plugin stores no options, user meta, or custom tables, and makes no external
requests. Deactivating it leaves post content untouched.
