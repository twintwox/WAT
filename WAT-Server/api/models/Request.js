/**
* Request.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    initiator:{
      model:'user',
      required:true
    },
    date:{
      type:'date',
      required:true
    },
    domain:{
      model:'domain',
      required:true
    },
    description:{
      type:'string'
    },
    solved:{
      type:'boolean',
      defaultsTo : false
    },
    lang:{
      type:'string',
      required:true
    }
  }
};

