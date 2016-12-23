/**
 * AuthController
 *
 * @description :: Server-side logic for managing auths
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
  index: function (req, res) {
    if(req.session.data) return res.json(req.session.data);

    var email = req.param('email');
    var password = req.param('password');

    if (!email || !password) {
      return res.json(401, {err: 'email and password required'});
    }

    User.findOne({email: email}).populate('installedTemplates').exec(function (err, user) {
          if (!user) {
            return res.json(401, {err: 'invalid email or password'});
          }

          User.comparePassword(password, user, function (err, valid) {
            if (err) {
              return res.json(403, {err: 'forbidden'});
            }

            if (!valid) {
              return res.json(401, {err: 'invalid email or password'});
            } else {
              console.log('Logged in!',user.email);
              req.session.data = {
                user: user,
                token: jwToken.issue({id : user.id })
              };
              return res.json(req.session.data);
            }
          });
    });

  },

  logout: function(req,res){
    req.session.user = {};
    req.session.destroy(function(err) {
      setTimeout(function(){
        return res.json({status:"Logout successful",data:req.session});
      }, 1000);
    });
  }


};
