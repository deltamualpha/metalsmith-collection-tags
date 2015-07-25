var assert = require("assert");
var equal = require('assert-dir-equal');
var Metalsmith = require('metalsmith');
var templates = require('metalsmith-templates');
var collections = require('metalsmith-collections');
var tags = require('../lib');

describe('metalsmith-tags', function() {

  it('should split comma separated tags into an array', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html'
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags'
        }
      }))
      .build(function(err, files){
        if (err) { 
          return done(err);
        }
        assert.equal(
          files['blog/one.html'].tags.toString(), 
          ['tag one', 'tag two'].toString()
        );
        done();
      });
  });

  it('should create a tags property to metalsmith.metadata', function(done) {
    var tagList;

    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html'
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags'
        }
      }))
      .use(function(files, metalsmith, done) {
        tagList = metalsmith.metadata().tags;
        done();
      })
      .build(function(err){
        if (err) {
          return done(err);
        }
        var tagListKeys = Object.keys(tagList).sort();
        assert.deepEqual(tagListKeys, ['tag one', 'tag three', 'tag two']);
        // Ensure every object in the metadata tags array is a data object.
        tagListKeys.forEach(function(tagName) {
          var tagPostsArray = tagList[tagName];
          tagPostsArray.forEach(function(fileData) {
            assert.equal(typeof fileData, 'object');
            assert.ok(fileData.stats);
            assert.ok(fileData.contents);
            assert.ok(fileData.tags);
          });
        });
        done();
      });
  });

  it('should skip creating a tags property on metalsmith.metadata', function(done) {
    var tagList;

    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html'
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          skipMetadata: true
        }
      }))
      .use(function(files, metalsmith, done) {
        tagList = metalsmith.metadata().tags;
        done();
      })
      .build(function(err){
        if (err) { return done(err); }
        assert.deepEqual(tagList, {});
        done();
      });
  });

  var templateConfig = {
    engine: 'handlebars',
    directory: './'
  };

  it('should create tag page with post lists according to template, maintaining collection order', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag.html',
          template: '../tag.hbt'
        }
      }))
      .use(templates(templateConfig))
      .build(function(err){
        if (err) { return done(err); }
        equal('test/fixtures/expected/no-pagination/tags', 'test/fixtures/basic/build/blog/tags');
        done();
      });
  });

  it('should add references to the previous and next pages in a paginaged tag array', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag/index.html',
          pathPage: 'blog/tags/:tag/:num/index.html',
          perPage: 1,
          template: '../tag.hbt'
        }
      }))
      .use(templates(templateConfig))
      .build(function(err, files){
        if (err) { return done(err); }
        assert.equal(files['blog/tags/tag-one/2/index.html'].pagination.prev, files['blog/tags/tag-one/index.html']);
        assert.equal(files['blog/tags/tag-one/index.html'].pagination.next, files['blog/tags/tag-one/2/index.html']);
        assert.equal(typeof files['blog/tags/tag-one/index.html'].pagination.prev, 'undefined');
        assert.equal(typeof files['blog/tags/tag-one/2/index.html'].pagination.next, 'undefined');
        assert.equal(typeof files['blog/tags/tag-three/index.html'].pagination.prev, 'undefined');
        assert.equal(typeof files['blog/tags/tag-three/index.html'].pagination.next, 'undefined');
        done();
      });
  });

  it('should create tag pages with pagination with post lists according to template and sorted by date decreasing', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag/index.html',
          pathPage: 'blog/tags/:tag/:num/index.html',
          perPage: 1,
          template: '../tag.hbt'
        }
      }))
      .use(templates(templateConfig))
      .build(function(err){
        if (err) { return done(err); }
        equal('test/fixtures/expected/pagination/tags', 'test/fixtures/basic/build/blog/tags');
        done();
      });
  });

  it('should add metadata to a tags collection', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag/index.html',
          pathPage: 'blog/tags/:tag/:num/index.html',
          perPage: 1,
          template: '../tag.hbt',
          metadata: {
            title: 'Tags'
          }
        }
      }))
      .use(templates(templateConfig))
      .build(function(err, files){
        if (err) { return done(err); }
        assert.equal(files['blog/tags/tag-one/index.html'].title, "Tags");
        done();
      });
  });

  it('should replace :tag and :num in a tag page\' metadata', function(done) {
    Metalsmith('test/fixtures/basic')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag/index.html',
          pathPage: 'blog/tags/:tag/:num/index.html',
          perPage: 1,
          template: '../tag.hbt',
          metadata: {
            title: ':tag - :num',
            description: "this is the :num page for :tag"
          }
        }
      }))
      .use(templates(templateConfig))
      .build(function(err, files){
        if (err) { return done(err); }
        assert.equal(files['blog/tags/tag-one/index.html'].title, "tag one - 1");
        assert.equal(files['blog/tags/tag-one/2/index.html'].description, "this is the 2 page for tag one");
        done();
      });
  });

  it('should handle multiple collections with the same tags as separate entities but unified in root metadata', function(done) {
    var tagList;
    Metalsmith('test/fixtures/complex')
      .use(collections({
        blog: {
          pattern: 'blog/*.html',
          sort: 'date',
          reverse: true
        },
        pages: {
          pattern: 'pages/*.html',
          sort: 'date',
          reverse: true
        }
      }))
      .use(tags({
        blog: {
          handle: 'tags',
          path: 'blog/tags/:tag/index.html',
          template: '../tag.hbt'
        },
        pages: {
          handle: 'tags',
          path: 'pages/tags/:tag/index.html',
          template: '../tag.hbt'
        }
      }))
      .use(templates(templateConfig))
      .use(function(files, metalsmith, done) {
        tagList = metalsmith.metadata().tags;
        done();
      })
      .build(function(err){
        if (err) { return done(err); }
        var tagListKeys = Object.keys(tagList).sort();
        assert.deepEqual(tagListKeys, ['tag five', 'tag one', 'tag three', 'tag two']);
        tagList['tag five'].length === 4;
        tagList['tag one'].length === 3;
        equal('test/fixtures/expected/complex', 'test/fixtures/complex/build/');
        done();
      });
  });
});
