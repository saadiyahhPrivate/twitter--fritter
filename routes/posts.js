var express = require('express');
var router = express.Router();

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});

/* show the post that the user wants to edit*/
router.get('/:id',function(req, res) {  
    var db = req.db;
    var id = req.params.id; //_id from link
    var current_user = req.session.user_name; 
    var collection = db.get("posts");
    collection.findOne({_id:id}, function (err, docs){
        if (err){
            res.send("There was a problem looking for your post.");
        }
        //if you are allowed to edit this go on ahead
        else{
            if (docs.user_name === current_user){
                res.render('post_to_edit', {title:"Edit", postText: docs.post, id:docs._id, user_name:docs.user_name});
            }
            else{
                //no, you stay here
                res.location("/allposts");
                res.redirect("/allposts");
            }
        }
    });
});

/*Record the changes and navigate user to a success page if successful
else, redirect the user to sign-in page*/
router.post('/update_post', function(req, res){
    var db = req.db;
    var collection = db.get('posts');
    var id = req.body.id; ////
    var post = req.body.post;
    var current_user = req.body.user_name; // from html form
    var user_name = req.session.user_name; //session user

    //aditional level of security in case anybody navigates to page without authentication
    //it checks if the session user is the one making the changes
    if (current_user === user_name){
        collection.findAndModify({
                query: {_id: id}, 
                update: {user_name: user_name, post: post, _id: id} 
        }, function(err, doc){
            if (err){
                res.send("There was a problem updating your post.");
            }
            else{
                res.location("/update_post");
                res.redirect("/update_post");
            }
        });
    }
    else{
        res.location("/");
        res.redirect("/");
    }
});


/*Record the changes, in this case deleting the post and navigate user 
to a success page if successful
else, redirect the user to sign-in page*/
router.post('/delete_post', function(req,res){
    var db = req.db;
    var collection = db.get('posts');
    var id = req.body.id;
    var current_user = req.body.user_name; //from html form
    var user_name = req.session.user_name; //session user
    //aditional level of security in case anybody navigates to page without authentication
    //it checks if the session user is the one making the changes
    if (current_user === user_name){
        collection.findAndModify({
                query: {_id: id}, 
                remove: true //for some reason, it does not delete
        }, function(err, doc){
            if (err){
                res.send("There was a problem deleting your post.");
            }
            else{
                collection.remove({_id:id}); //forced delete
                res.location("/update_post");
                res.redirect("/update_post");
            }
        });
    //in case the user got there without authentication, 
    //redirect to sign in page
    }else{
        res.location("/");
        res.redirect("/");
    }
});

module.exports = router;
