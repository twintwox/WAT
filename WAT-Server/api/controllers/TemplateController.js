/**
 * TemplateController
 *
 * @description :: Server-side logic for managing Templates
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {


  create: function (req, res) {

    if(typeof req.body.domain === "string" || !req.body.domain.id){
      var domain = req.body.domain.url || req.body.domain;
      var lang = req.body.domain.lang || req.body.lang;

      console.log("Looking for domain ",domain);
      // Find domain for template:
      Domain.find({url:domain,lang:lang}).exec(function (err, records) {
        if(records.length == 0){
          console.log("Creating domain ",domain);
          // Create domain
          Domain.create({url:domain,lang:lang}).exec(function(err,created){
              req.body.domain = created;
              console.log("Domain created",created);
              Template.create(req.body).exec(function (err, temp) {
                if (err)
                  return res.json(err.status, {err: err});
                console.log("Template create",temp);
                res.json(200,temp);
              });

          });
        }else{
          console.log("Domain found",records);
          if(records.length>1) console.warn('More than 1 domain for'+req.body.domain);
          // Change domain
          req.body.domain = records[0];
          Template.create(req.body).exec(function (err, temp) {
            if (err)
              return res.json(err.status, {err: err});
            console.log("Template create",temp);
            res.json(200,temp);
          });
        }
      });
    }else{
      Template.create(req.body).exec(function (err, temp) {
        if (err)
          return res.json(err.status, {err: err});
        console.log("Template create",temp);
        res.json(200,temp);
      });
    }
  },

  update: function (req, res) {
    delete req.body.domain;
    console.log("Update",req.body);
    Template.update({id:req.body.id},req.body).exec(function (err, temp) {
      console.log("Updated");
      res.json(200,temp);
    });
  },

  forDomain: function(req,res){
    var domain = req.body.domain.url || req.body.domain;
    var lang   = req.body.lang;

    console.log('For domain',domain,lang);
    Domain.find({url:domain,lang:lang}).exec(function (err, records) {
        if(err) return res.json(err.status, {err: err});
        console.log('For domain found domains:',records);
        if(records.length == 0) res.json(200,{});
        else{
          Template.find({domain:records[0].id})
            .populate('domain')
            .populate('positivePoints')
            .populate('negativePoints')
            .exec(function(err,records2){
              console.log('For domain found templates:',records2);
              if(err) return res.json(err.status, {err: err});
              else {
                var response = [];
                for(var i = 0; i<records2.length; i++){
                  response.push(JSON.parse(JSON.stringify(records2[i])));
                  response[i].pp = response[i].positivePoints.length;
                  response[i].np = response[i].negativePoints.length;
                  delete response[i].positivePoints;
                  delete response[i].negativePoints;
                }
                res.json(200,response);
              }
          });
        }
    });
  },


  findKeywords: function(req,res) {

    function returnResult(result){
      result.sort(function (a, b) {
        a.domain.url < b.domain.url;
      });
      //for(var i in result){
      //  result[i].author = result[i].author.id;
      //}
      res.json(result);
    }

    var keywords = req.body.keywords;
    var searchFields = ['alias','description'];
    var arr = [];

    for (var i = keywords.length - 1; i >= 0; i--)
      if (keywords[i].length == 0) keywords.splice(i, 1);

    if(keywords.length==0){
      Template.find()
        .populate('author')
        .populate('domain')
        .populate('positivePoints')
        .populate('negativePoints')
        .exec(function(err,founds){
          for (var i in founds) arr.push(founds[i]);
          returnResult(arr);
      });
    }

    var queries = keywords.length * searchFields.length;


    function barrier(results) {
      for (var i in results) arr.push(results[i]);
      queries--;
      if (queries == 0) {
        returnResult(arr);
      }
    }
    if (keywords.length > 0) {
      for (var i = 0; i < keywords.length; i++) {
        var word = keywords[i];
        if (word.length == 0)continue;
        for (var j = 0; j < searchFields.length; j++) {
          var query = {};
          query[searchFields[j]] = {"contains":word};
          Template.find(query)
            .populate('author')
            .populate('domain')
            .populate('positivePoints')
            .populate('negativePoints')
            .exec(function (err, founds) {
            if (err) res.json(500, {err: err});
            var results = {}
            for (var k = 0; k < founds.length; k++) {
              results[founds[k].id] = founds[k];
            }
            barrier(results);
          });
        }
      }
    }
  }
};

