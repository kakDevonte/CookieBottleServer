module.exports = function(req, res, next){
  let path, pages;

  pages = {
    index: true,
    setups: true,
    camping: true,
    canvas: true
  };

  if(/\/control\//.test(req.url)){
    path = req.url.split('/');
    path = path[2];

    if(pages[path] || path === ''){

      if(req.session.user){
        req.User = req.session.user;
        req.User.views++;

        next();
      }else{
        if(req.method === 'POST'){
          res.status(403).json({success: false, error: 'No authorized'});
        }else{
          res.redirect('/');
        }
      }
    }else{
      next();
    }
  }else{
    next();
  }
};