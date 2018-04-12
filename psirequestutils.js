var request = require("request"),
    async = require("async"),
    fs = require('fs'),
    config = require('../static/config.json'),
    Converter = require('csvtojson').Converter,
    importsFolder = process.env.HOME+ '/'+ config.usersFolder+ '/hub-batch/imports',
    count = 1;

// Global Variables set by user input
var csvFileName,
    queryString,
    cosContentType;

module.exports = (function() {
  function makePsiRequests(answersObj) {
    cosContentType = answersObj.contentType;
    csvFileName = importsFolder + '/' + answersObj.rollbackFilename;

    fetchCsvData(csvFileName).then(function(pageDataObject) {
      return createBatches(pageDataObject);
    })
    .then(function(batchedPagesObject) {
      batchRollbackContent(batchedPagesObject);
    });
  }

  function fetchPreviousVersionId(pageId) {
      // var getOptions = {
      //   method: 'GET',
      //   url: 'https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=http%3A%2F%2F' + pageId + '&fields=id%2CruleGroups',
      // };
      var getOptions = {
        method: 'GET',
        url: 'https://www.googleapis.com/pagespeedonline/v4/runPagespeed?url=http%3A%2F%2F' + pageId + '&fields=id%2CruleGroups&strategy=mobile',
      };
      request(getOptions, function (error, response, body) {
          var parsedBody = JSON.parse(body);
          if (parsedBody.id) {
              console.log(parsedBody.id + ' Mobile PSI Score:,' + parsedBody.ruleGroups.SPEED.score);
          } else {
            console.log('hmmmmm');
          }
      });
  }

  function rollbackContent(pageObject) {
    var pageId = pageObject.id;
    fetchPreviousVersionId(pageId);
  }

  function batchRollbackContent(batchedPagesObject) {
    async.eachLimit(batchedPagesObject, 1, function(collection, callback) {
        collection.forEach(rollbackContent);
        ++count;
        setTimeout(callback, 23000);
    },
    function(err) {
        if ( err ) { // if any of the file produced an error, error is printed
        } else {
        }
    });
  }

  function createBatches(pagesDataObject) {
    return new Promise(function(resolve, reject) {
      var batchArray = [];
      do { //populate batchArray with page content divided into 10s
        for (; pagesDataObject.length > 0;) {
          batchArray.push(pagesDataObject.splice(0, 1)); //batchArray created
        }
      } while (pagesDataObject.lenth > 0);
      resolve(batchArray);
    });
  }

  function fetchCsvData(csvFileName) {
    return new Promise(function(resolve, reject) {
      csvConverter=new Converter({}); // new converter instance
      csvConverter.on('end_parsed', function(pageDataObject) { // Converts csv to json object
        if ( pageDataObject ) {
          resolve(pageDataObject);
        }
        else {
          reject(console.log("not working"));
        }
      });
      fs.createReadStream(csvFileName).pipe(csvConverter); //read from file
    });
  }

  return {
    makePsiRequests: makePsiRequests,
  };
})();
