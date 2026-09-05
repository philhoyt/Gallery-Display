=== Gallery Display ===
Contributors: philhoyt
Tags: gallery, images, masonry, lightbox, block
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

An image gallery block with grid, masonry, mosaic, justified, and list layouts.

== Description ==

Gallery Display adds a single block that renders a set of images in one of five
layouts. Pick the images from the media library, choose a layout, and set the
options that apply to it.

**Layouts**

* **Grid** — equal-size cells on a fixed column count, with a choice of aspect ratio.
* **Masonry** — column layout with items of varying height.
* **Mosaic** — mixed cell sizes, with wide images promoted into the larger slots.
* **Justified** — rows of a consistent height, like a contact sheet.
* **List** — one image per row with its caption and description.

**Options**

* 1 to 6 columns for the grid, masonry, and mosaic layouts.
* Row height for the justified layout.
* Thumbnail and full-size image sizes, listed from the sizes your site registers.
* Captions below the image or overlaid on it.
* Order by date, title, random, or the order you arranged the images in. Mosaic
  adds a best-fit order that places wide images in the larger cells.
* Click behaviour: open a PhotoSwipe lightbox, link to the attachment page, link
  to the media file, or do nothing.

Image metadata is read at render time, so editing an image's caption or alt text
in the media library updates every gallery it appears in.

Layout scripts load only on pages that use the layout that needs them. A page
with a grid gallery does not load the masonry or justified libraries.

== Frequently Asked Questions ==

= Does the block work in a block theme? =

Yes. It supports wide and full alignment, background colour, border, and block
gap, and reads spacing presets from theme.json.

= Can another plugin add a layout? =

Yes. Add the layout to the `gallery_display_valid_layouts` PHP filter and to the
`galleryDisplay.layouts` JavaScript filter, and register a stylesheet for it
through `galleryDisplay.previewStylesheets` so the editor preview picks it up.

= What happens to galleries if I deactivate the plugin? =

The block stops rendering and its markup is left in the post content. Nothing is
deleted. The plugin stores no options, user meta, or custom tables.

== Screenshots ==

1. The grid layout with captions below each image.
2. The masonry layout.
3. The block's layout and image settings in the inspector.

== Changelog ==

= 1.2.0 =
* Add: Convert a WordPress Gallery block into a Gallery Display block from the
  block toolbar, and convert it back again. Images, captions, alt text,
  columns, link settings, alignment, spacing and colours all carry across.
* Add: A caption for the gallery itself, shown below the images. Supports bold,
  italic and links.
* Add: Left, centre and right alignment, alongside the existing wide and full.
* Add: An HTML anchor, so a gallery can be linked to directly.
* Add: Per-image alt text and captions can now be set on the block. Where they
  are, they take precedence; images without them keep following the media
  library as before, so editing an image still updates every gallery using it.
* Add: Images can open in a new tab, and images marked decorative in a
  converted gallery stay decorative.
* Change: The gallery wrapper is now a <figure> element rather than a <div>, so
  the gallery caption is valid HTML. Custom CSS targeting the old element name
  may need updating.

= 1.1.0 =
* Add: Image ordering controls. Order a gallery by date, title, random, or the
  order you arranged it in, with a best-fit option that places wide images in
  the mosaic layout's larger cells.
* Add: Filters that let a companion plugin register its own layout —
  `gallery_display_valid_layouts` in PHP, `galleryDisplay.layouts` and
  `galleryDisplay.previewStylesheets` in JavaScript.
* Security: Escape and validate block attributes before they reach the editor
  preview. A crafted attribute could previously inject markup that ran in the
  admin. The preview is now sandboxed as well.
* Security: Validate the aspect-ratio and block-gap values used in the block's
  inline styles.
* Fix: Masonry and mosaic layouts no longer keep their load-time widths when
  the browser is resized.
* Fix: The lightbox stylesheet now loads in the document head instead of after
  the page content, removing a flash of unstyled links.
* Fix: Gallery links fall back to the attachment title or caption for their
  accessible name when the image has no alt text.
* Fix: Asset cache-busting used a stale version number, so browsers could keep
  serving outdated CSS and JavaScript after an update.
* Change: Image-size labels in the block sidebar are now translatable.

= 1.0.0 =
* Initial release.
