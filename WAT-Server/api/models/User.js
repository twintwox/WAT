/**
* User.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

var bcrypt = require('bcrypt');

module.exports = {

  schema:true,

  attributes: {
    uid:{
      type:'string'
    },
    name:{
      type:'string',
      required:true
    },
    email:{
      type:'string',
      required:true,
      unique:true
    },
    userType:{
      type:'string',
      required:true
    },
    installedTemplates:{
      collection: 'template',
      via: 'clients'
    },
    thumbUp:{
      collection: 'template',
      via: 'positivePoints'
    },
    thumbDown:{
      collection: 'template',
      via: 'negativePoints'
    },
    encryptedPassword:{
      type:'string'
    },
    lang:{
      type:'string',
      required:true
    },
    toJson: function(){
      var obj = this.toObject();
      delete obj.encryptedPassword;
      return obj;
    }
  },

  // Here we encrypt password before creating a User
  beforeCreate : function (values, next) {
    bcrypt.genSalt(10, function (err, salt) {
      if(err) return next(err);
      bcrypt.hash(values.password, salt, function (err, hash) {
        if(err) return next(err);
        values.encryptedPassword = hash;
        next();
      })
    })
  },

  comparePassword : function (password, user, cb) {
    bcrypt.compare(password, user.encryptedPassword, function (err, match) {

      if(err) cb(err);
      if(match) {
        cb(null, true);
      } else {
        cb(err);
      }
    })
  }

};

