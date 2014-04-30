'use strict';

/* jshint -W104 */
/* global io */
/* exported loadINI */

function loadINI(url, callback) {
  var ctx = this.ctx;
  io.load(url, function(err, source) {
    var pos = ctx.resLinks.indexOf(url);

    if (err) {
      // remove the ini link from resLinks
      ctx.resLinks.splice(pos, 1);
      return callback(err);
    }

    if (!source) {
      ctx.resLinks.splice(pos, 1);
      return callback(new Error('Empty file: ' + url));
    }

    var patterns = parseINI(source, url).resources.map(function(x) {
      return x.replace('en-US', '{{locale}}');
    });
    ctx.resLinks.splice.apply(ctx.resLinks, [pos, 1].concat(patterns));
    callback();
  });
}

function relativePath(baseUrl, url) {
  if (url[0] === '/') {
    return url;
  }

  var dirs = baseUrl.split('/')
    .slice(0, -1)
    .concat(url.split('/'))
    .filter(function(path) {
      return path !== '.';
    });

  return dirs.join('/');
}

var iniPatterns = {
  'section': /^\s*\[(.*)\]\s*$/,
  'import': /^\s*@import\s+url\((.*)\)\s*$/i,
  'entry': /[\r\n]+/
};

function parseINI(source, iniPath) {
  var entries = source.split(iniPatterns.entry);
  var locales = ['en-US'];
  var genericSection = true;
  var uris = [];
  var match;

  for (var i = 0; i < entries.length; i++) {
    var line = entries[i];
    // we only care about en-US resources
    if (genericSection && iniPatterns['import'].test(line)) {
      match = iniPatterns['import'].exec(line);
      var uri = relativePath(iniPath, match[1]);
      uris.push(uri);
      continue;
    }

    // but we need the list of all locales in the ini, too
    if (iniPatterns.section.test(line)) {
      genericSection = false;
      match = iniPatterns.section.exec(line);
      locales.push(match[1]);
    }
  }
  return {
    locales: locales,
    resources: uris
  };
}
