# metalsmith-tags

  A metalsmith plugin to create dedicated pages for tags from files included in 
  collections. Designed to work closely with metalsmith-collections.

  This plugin takes much inspiration (and some of its logic) from 
  <https://github.com/totocaster/metalsmith-tags>, and its pagination behavior 
  from <https://github.com/RobinThrift/metalsmith-paginate>.

## Installation

    $ npm install metalsmith-collection-tags

## Description in Pages

  In your pages:

```
---
title: This is page with tags
tags: tagged, page, metalsmith, plugin
---

Hello World
```

  You can use different handle for the tags, by configuring the `handle` option. 
  `tags` is the default.


## CLI Usage

  Install the node modules and then add the `metalsmith-tags` key to your 
  `metalsmith.json` plugins. The simplest use case just requires a collection 
  you want to look inside for tags, which points to an object that contains a 
  handle to parse for tags, and a template and path for the tag pages output:

```json
{
  "plugins": {
    "metalsmith-collections": {
      "blog": 'blog/*.md'
    },
    "metalsmith-collection-tags": {
      "blog": {
        "handle": "tags",
        "path": "blog/topics/:tag.html",
        "template": "/partials/tag.hbt"
      }
    }
  }
}
```

## JavaScript Usage

  Pass the plugin to `Metalsmith#use`:

```js
var collection-tags = require('metalsmith-collection-tags');

metalsmith
  .use(collections({
    blog: "blog/*.md"
  }))
  .use(tags({
    handle: "tags",
    path: "blog/topics/:tag.html",
    template: "/partials/tag.hbt"
  }));
```

## Result

  This will generate `blog/topics/[tagname].html` pages in your `build` 
  directory with array of `pagination.files` objects on which you can iterate 
  on. You can use `tag` for tag name in your templates. (You can refer to tests 
  folder for tags template.)

  The `tags` property on your pages will remain but it will be modified to an 
  array of String containing the tags.

  You can use `metalsmith-permalink` to customize the permalink of the tag 
  pages as you would do with anything else.

## Pagination

  Additionally you can paginate your tag pages.  To do so add two additional 
  properties to your configuration object, `pathPage` and `perPage`, and modify 
  `path` to point to the root pagination location:

```json
{
  "handle": "tags",
  "path": "blog/topics/:tag/index.html",
  "template": "/partials/tag.hbt",
  "pathPage": "blog/topics/:tag/:num/index.html",
  "perPage": 6
}
```

  This will paginate your array of tags so that 6 appear per page, with 
  additional tag pages being nested underneath the first page of tags.  For 
  additional details please look at the tests.

## Contribution

  Feel free to contribute to this plug-in. Fork, commit, send pull request.
  Issues, suggestions and bugs are more than welcome.

  In case you add functionality, please write corresponding test. Test using 
  `npm test`.

  Thanks!

## License

  MIT
