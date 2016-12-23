/**
* Template.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  schema:true,

  attributes: {
    domain:{
      model:'domain',
      required:true
    },
    alias:{
      type:'string'
    },
    date:{
      type:'date',
      required:true
    },
    lang:{
      type:'string',
      required:true
    },
    data:{
      type:'string',
      required:true
    },
    author:{
      model:'user',
      required:true
    },
    description:{
      type:'string'
    },
    positivePoints:{
      collection:'user',
      via:'thumbUp'
    },
    negativePoints:{
      collection:'user',
        via:'thumbDown'
    },
    copyright:{
      type:'string'
    },
    clients:{
      collection: 'user',
      via: 'installedTemplates'
    }
  }
};

