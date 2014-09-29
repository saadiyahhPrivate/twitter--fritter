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

/* new session */
router.get('/open_user_session', function(req, res){
    var user_name = req.body.user_name;
    var password = req.body.password;
    var db = req.db;
    var collection = db.get('users_collection');
    collection.findOne({username: user_name}, function(err, doc){
        if (err){
            res.send("En error occured during your login")
        }
        if (doc.password === password){
            req.session.regenerate(
                function(){
                req.session.user_name = user_name;
                res.redirect('/allposts'); ///go to allposts
            });
        }
        else{
            res.redirect("/");  //go sign up
        }
    });
});

/* logging out*/
router.get('/logout',function(req,res){
    req.session.destroy(function(){
        res.redirect('/'); //go back to homepage
    });
});


/* POST to Add User Service */ // non functional
router.post('/sign_up', function(req, res) {
    // Set our internal DB variable
    var db = req.db;

    // Get our form values. These rely on the "name" attributes
    var name = req.body.name;
    var user_name = req.body.user_name;
    var password = req.body.password;

    console.log("user signing up. user_name = "+ user_name);

    // Set our collection ****************************************Cannot call method 'get' of undefined
    var collection = db.get('users_collection');

    collection.findOne({
        user_name : user_name
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem finding your information in the database.");
        }
        else {
            if (doc === null){ // command not working : doc.length === 1
                console.log("user signing up. user_name = "+ user_name + " valid username");
                collection.insert({
                    name : name,
                    user_name : user_name,
                    password : password
                    }, function (err, doc) {
                        if (err) {
                        // If it failed, return error
                            res.send("There was a problem adding the information to the database.");
                        }
                        else {
                             // If it worked, set the header so the address bar doesn't still say /adduser
                            res.render("/failure", {title: "Failed operation"})
                        }
                    });
                }
            else {
                res.location("/");
                // And forward to success page
                res.redirect("/");
            }
        }

    });
});


//+++++++++++++POSTS+++++++++++++++++++++++++++++++++++++


/* show this post that i want to edit*/
router.get('/:_id',function(req, res) {  //is that how it is done???
    var db = req.db;
    var id = req.params.value;
    var current_user = req.session.user_name; ///////check this out/////////session
    var collection = db.get("posts");
    collections.findOne({_id:id}, function (err, docs){
        //if you are allowed to edit this go on ahead
        if (docs.user_name === current_user){
            res.render('/post_to_edit', {title:"Edit", post: docs.post, id:docs._id});
        }
        else{
            //no, you stay here
            res.location("/allposts");
            res.redirect("/allposts");
        }
    });
});


router.post('/update_post', function(req, res){
    var db = req.db;
    var collection = db.get('posts');
    var button_pressed = req.params.value; //how to check which button was pressed?
    var id = req.params._id;
    var post = req.params.post;
    if (button_pressed === 1){ //update
        collection.findAndModify({
            query: {_id: id}, 
            update: {post: post}, 
            upsert: true
        })
    }
    else{
        collection.findAndModify({ //delete entry
            query: {_id: id}, 
            delete: true   
        })
    }
});

/* GET the confirmation page for postRemoval */
router.get('/postupdated', function(req, res) {
    res.render('postupdated', { title: 'Post Updated' })
});

router.post("/post_new_post", function(req, res){
    var db = req.db;
    var user_post = req.body.post;
    var user_name = req.session.user_name; //find a way to use session for this
    var collection = db.get('posts');

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
});

/* POST to seeallposts sevice*/
router.get('/allposts', function(req, res){
    var db = req.db;
    var user_name = req.params.user_name; //substitute for proper way to call it via session

    var collection = db.get('posts');
        
    collection.find({},{},function(e,docs){
        res.render('allposts', {
            allposts : docs
        });
    });
});

module.exports = router;
