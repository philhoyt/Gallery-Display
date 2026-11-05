=== Gallery Display ===
Contributors: philhoyt
Tags: gallery, images, masonry, lightbox, block
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.2.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An image gallery block with grid, masonry, mosaic, justified, and list layouts

== Description ==

Gallery Display adds one block that renders a set of images in one of five layouts. Pick the images from the media library, choose a layout, and set the options that apply to it.

Layouts:

* Grid: equal-size cells on a fixed column count, with a choice of aspect ratio.
* Masonry: columns with items of varying height.
* Mosaic: mixed cell sizes, with wide images placed in the larger slots.
* Justified: rows of a consistent height, like a contact sheet.
* List: one image per row with its caption and description.

Options:

* 1 to 6 columns for the grid, masonry, and mosaic layouts.
* Row height for the justified layout.
* Thumbnail and full-size image sizes, listed from the sizes your site registers.
* Captions below the image or overlaid on it.
* A caption for the gallery itself, shown below the images, with bold, italic, and links.
* Order by date, title, random, or the order you arranged the images in. Mosaic adds a best-fit order that places wide images in the larger cells.
* Click behaviour: open a PhotoSwipe lightbox, link to the attachment page, link to the media file, or do nothing.
* Left, centre, right, wide, and full alignment, background colour, border, block gap, and an HTML anchor.

A core Gallery block can be converted to a Gallery Display block from the block toolbar, and back again. Images, captions, alt text, columns, link settings, alignment, spacing, and colours carry across.

Captions and alt text set on the block take precedence. Images without them read their metadata from the media library at render time, so editing an image there updates every gallery it appears in.

The masonry, mosaic, justified, and lightbox scripts load only on pages that use them. A page with a grid gallery loads none of them.

== Installation ==

1. Download `gallery-display.zip` from the latest release at https://github.com/philhoyt/Gallery-Display/releases/latest.
2. In the WordPress admin, go to Plugins > Add New Plugin > Upload Plugin.
3. Choose the zip, click Install Now, then Activate Plugin.
4. Add the Gallery Display block to a post or page.

The plugin checks GitHub releases for updates, so later versions appear on the Plugins screen.

== Frequently Asked Questions ==

= Does the block work in a block theme? =

Yes. It supports wide and full alignment, background colour, border, and block gap, and reads spacing presets from theme.json.

= Can another plugin add a layout? =

Yes. Add the layout to the `gallery_display_valid_layouts` PHP filter and to the `galleryDisplay.layouts` JavaScript filter, and register a stylesheet for it through `galleryDisplay.previewStylesheets` so the editor preview picks it up.

= What happens to galleries if I deactivate the plugin? =

The block stops rendering and its markup is left in the post content. Nothing is deleted. The plugin stores no options, user meta, or custom tables and makes no external requests.

== Screenshots ==

1. The grid layout with captions below each image.
2. The masonry layout.
3. The block's layout and image settings in the inspector.

== Changelog ==

= 1.2.1 =
* Tested up to WordPress 7.1 and rebuilt with the current block editor toolchain.

= 1.2.0 =
* Added a toolbar transform from the core Gallery block to Gallery Display and back. Images, captions, alt text, columns, link settings, alignment, spacing, and colours carry across.
* Added a caption for the gallery itself, shown below the images, with bold, italic, and links.
* Added left, centre, and right alignment alongside wide and full.
* Added an HTML anchor so a gallery can be linked to directly.
* Added per-image alt text and captions on the block. Where set, they take precedence; images without them keep following the media library.
* Added an open-in-new-tab option per image. Images marked decorative in a converted gallery stay decorative.
* Changed the gallery wrapper from a `<div>` to a `<figure>` so the gallery caption is valid HTML. Custom CSS targeting the old element name may need updating.

= 1.1.0 =
* Added image ordering: by date, title, random, or the order you arranged, plus a best-fit option that places wide images in the mosaic layout's larger cells.
* Added filters for a companion plugin to register its own layout: `gallery_display_valid_layouts` in PHP, `galleryDisplay.layouts` and `galleryDisplay.previewStylesheets` in JavaScript.
* Security: block attributes are escaped and validated before they reach the editor preview. A crafted attribute could previously inject markup that ran in the admin. The preview iframe is now sandboxed as well.
* Security: the aspect-ratio and block-gap values used in the block's inline styles are validated.
* Fixed masonry and mosaic layouts keeping their load-time widths after the browser is resized.
* Fixed the lightbox stylesheet loading after the page content, which caused a flash of unstyled links. It now loads in the document head.
* Fixed gallery links with no alt text so they fall back to the attachment title or caption for their accessible name.
* Fixed asset cache-busting using a stale version number, so browsers could keep serving old CSS and JavaScript after an update.
* Changed image-size labels in the block sidebar to be translatable.

= 1.0.0 =
* Initial release.
