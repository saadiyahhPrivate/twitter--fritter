var express = require('express');
var router = express.Router();

/* GET home/welcome page. */ //OK
router.get('/', function(req, res) {
    res.render('welcomepage', { title: 'Welcome to Fritter' });
});

/*GET sign_up page!!*/  //OK
router.get('/sign_up', function(req, res){
    res.render('sign_up', {title: 'Welcome to the sign-up page'})
})

/* new session */ //    ************************************************postr or get here????
//cannot read password property of null when "post" it dies
router.post('/open_user_session', function(req, res){
    var db = req.db;
    var username = req.body.user_name;
    var password = req.body.password; 
    var collection = db.get('users_collection');
    //console.log(collection.find());
    console.log("gathered data: password = " + username);
    collection.findOne({user_name: username}
        , function(err, doc){
        if (err){
            res.send("En error occured during your login")
        }
        else{
            if (doc !== null){ 
            console.log("HEHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHHH");
            console.log(doc);
            if(doc.password === password){
                req.session.regenerate(
                    function(){
                    req.session.user_name = username;
                    res.render('post_new_post', {title : "signing in complete"}); ///go to allposts
                });
            }
        }
            else{
                res.redirect("/");  //go sign up
            }
        }
    });
});


/* POST to Add User Service */ // non functional
router.post('/sign_up', function(req, res) {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var name = req.body.name;
    var username = req.body.user_name;
    var password = req.body.password;

    console.log("user signing up. user_name = "+ username);

    // Set our collection ****************************************Cannot call method 'get' of undefined
    var collection = db.get('users_collection');

    collection.findOne({
        user_name : username
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem finding your information in the database.");
        }
        else {
            if (doc === null){ // command not working : doc.length === , .size??
                console.log("user signing up. user_name = "+ username + " valid username");
                collection.insert({
                    name : name,
                    user_name : username,  //                          ???????********do i have to use ""?
                    password : password
                    }, function (err, doc) {
                        if (err) {
                        // If it failed, return error
                            res.send("There was a problem adding the information to the database.");
                        }
                        else {
                             // If it worked, set the header so the address bar doesn't still say /adduser
                            res.redirect("/");
                        }
                    });
                }
            else {
                res.location("/failure");
                // And forward to success page
                res.redirect("/failure");
            }
        }

    });
});

/* logging out*/
router.get('/logout',function(req,res){
    req.session.destroy(function(){
        res.redirect('/'); //go back to homepage
    });
});


//+++++++++++++POSTS+++++++++++++++++++++++++++++++++++++


/* show this post that i want to edit*/
router.get('/posts/:id',function(req, res) {  
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


router.post('/posts/update_post', function(req, res){
    var db = req.db;
    var collection = db.get('posts');
    var id = req.body.id; ////
    var post = req.body.post;
    var current_user = req.body.user_name; // from html form
    var user_name = req.session.user_name; //session user
    console.log(" CURRENTLY UPDATING THE POST WITH ID : "+ id);
    //aditional level of security in case anybody navigates to page without authentication
    if (current_user === user_name){
        console.log(" CURRENTLY UPDATING THE POST FROM : "+ user_name);
        console.log(" CURRENTLY UPDATING THE POST FROM : "+ current_user);

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


router.post('/posts/delete_post', function(req,res){
    var db = req.db;
    var collection = db.get('posts');
    var id = req.body.id;
    var current_user = req.body.user_name; //from html form
    var user_name = req.session.user_name; //session user
    console.log(" CURRENTLY DELETING THE POST WITH ID : "+ id);
    //aditional level of security in case anybody navigates to page without authentication
    if (current_user === user_name){
        collection.findAndModify({
                query: {_id: id}, 
                remove: true //for some reason, it does not delete
        }, function(err, doc){
            if (err){
                res.send("There was a problem deleting your post.");
            }
            else{
                collection.remove({_id:id});
                console.log(" CURRENTLY deleting THE POST FROM : "+ user_name);
                console.log(" CURRENTLY deleting THE POST FROM : "+ current_user);
                res.location("/update_post");
                res.redirect("/update_post");
            }
        });
    }else{
        res.location("/");
        res.redirect("/");
    }
});

/* GET the confirmation page for postRemoval */
router.get('/update_post', function(req, res) {
    res.render('update_post', { title: 'Post Updated' })
});

router.get('/delete_post', function(req, res) {
    res.render('update_post', { title: 'Post Deleted' })
});

router.get('/post_new_post', function(req, res){
    res.render('post_new_post', {title: 'Post Another Post'})
});

router.post('/post_new_post', function(req, res){
    var db = req.db;
    var user_post = req.body.post;
    var user_name = req.session.user_name; //find a way to use session for this
    var collection = db.get('posts');
    console.log("USERNAME FOR THIS POST IS>>>>>>>>>>>>>>>>>>>>>>>>>: "+ user_name);
    if (user_name !== undefined){
        collection.insert({
            user_name : user_name,  //user_name
            post : user_post        //post
            },
            function(err, doc) {
                if (err) {
                     // If it failed, return error
                 res.send("There was a problem posting your post.");
                }
                else{
                    //hader
                    res.location("/allposts");
                    // And forward to success page
                    res.redirect("/allposts");
                }
            })
    } else{
        res.location("/");
        res.redirect("/");
    }
});

/* POST to seeallposts sevice*/
router.get('/allposts', function(req, res){
    var db = req.db;
    var user_name = req.session.user_name; //substitute for proper way to call it via session

    var collection = db.get('posts');
        
    collection.find({},{},function(e,docs){
        res.render('allposts', { 
            title: "allpoststoshow",
            result : docs
        });
    });
});

module.exports = router;
