var _ = require('lodash');

function collectionTags(opts) {
  opts = opts || {};

  return function(files, metalsmith, done) {

    var safeTag = function (tag) {
      if (tag) {
        return tag
          .toLowerCase()
          .replace(/ /g, '-');
      } else {
        return '';
      }
    };

    var splitTags = function (taglist) {
      if (taglist) {
        return _.map(taglist.split(','), _.trim);
      } else {
        return '';
      }
    };

    var getFilePath = function (path, opts) {
      return path
        .replace(/:tag/g, safeTag(opts.tag))
        .replace(/:num/g, opts.num);
    };

    var deepMergeHelper = function(a, b) {
      if (_.isArray(a)) {
        return a.concat(b);
      }
    };

    var metadata = metalsmith.metadata();
    metadata.tags = {};
    
    for (var collection in opts) {
      var handle = opts[collection].handle || 'tags';
      var skipMetadata = opts[collection].skipMetadata || false;
      var path = opts[collection].path || safeTag(collection) + '/tags/:tag/index.html';
      var pathPage = opts[collection].pathPage || safeTag(collection) + '/tags/:tag/:num/index.html';
      var perPage = opts[collection].perPage || 0;
      var template = opts[collection].template || 'partials/tag.hbt';
      var pageMeta = opts[collection].metadata || false;

      var currentCollection = metadata.collections[collection];

      currentCollection.tags = {};

      currentCollection.forEach(function(file){
        var tags = {};
        if (file[handle]) {
          file[handle] = splitTags(file[handle]);
          file[handle].forEach(function(tag){
            if (!tags[tag]) {
              tags[tag] = [];
            }
            tags[tag].push(file);
          });
        }

        _.merge(metadata.collections[collection].tags, tags, deepMergeHelper);

        if (!skipMetadata) {
          _.merge(metadata.tags, tags, deepMergeHelper);
        }
      });

      for (var tag in currentCollection.tags) {
        var postsPerPage = perPage === 0 ? currentCollection.tags[tag].length : perPage;
        var numPages = Math.ceil(currentCollection.tags[tag].length / postsPerPage);
        var prev = '';

        for (var i = 0; i < numPages; i++) {
          var start = i * postsPerPage;
          var end = i * postsPerPage + postsPerPage;

          var page = {
            template: template,
            contents: '',
            tag: tag,
            pagination: {
              num: i + 1,
              pages: numPages,
              tag: tag,
              start: start,
              end: end,
              files: _.slice(currentCollection.tags[tag], start, end)
            }
          };
          if (pageMeta) {
            _.merge(page, _.mapValues(pageMeta, function (str) {
              return str.replace(/:tag/g, tag).replace(/:num/g, i + 1);
            }));
          }
          var currPath = getFilePath(i === 0 ? path : pathPage, {tag: tag, num: i + 1});
          files[currPath] = page;
          if (prev) {
            page.pagination.prev = prev;
            prev.pagination.next = page;
          }
          prev = files[currPath];
        }
      }

    }

    done();
  };
}

module.exports = collectionTags;
