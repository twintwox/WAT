/**
 * isAuthorized
 *
 * @description :: Policy to check if user is authorized with JSON web token
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

module.exports = function (req, res, next) {
    if(!req.session.data) res.json(401,{err:'Permission deny'});
    var templateId = req.param('id');
    // Disable the template owner, problems to connect from app.
    // var userId = req.session.data.user.id;

    Template.findOne({id:templateId}).exec(function (err, found){
      if(err) res.json(500,{err:err});
      if(found){
          next();
          // if(found.author === userId) next();
          // else res.json(401,{err:'Permission deny'})
      }else{
        return res.json(404, {err: 'No template with id'+templateId});
      }
    });
};
