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

        var currPage = 0;
        var prev = '';
        for (var i = 0; i < currentCollection.tags[tag].length; ) {
          var start = currPage * postsPerPage;
          var end = currPage * postsPerPage + postsPerPage;

          var page = {
            template: template,
            contents: '',
            tag: tag,
            pagination: {
              num: currPage + 1,
              pages: numPages,
              tag: tag,
              start: start,
              end: end,
              files: _.slice(currentCollection.tags[tag], start, end)
            }
          };
          var currPath = currPage !== 0 ? pathPage : path;
          files[getFilePath(currPath, {tag: tag, num: currPage + 1})] = page;
          if (prev) {
            page.pagination.prev = prev;
            prev.pagination.next = page;
          }
          prev = files[getFilePath(currPath, {tag: tag, num: currPage + 1})];

          currPage++;
          i += postsPerPage;
        }
      }

    }

    done();
  };
}

module.exports = collectionTags;
