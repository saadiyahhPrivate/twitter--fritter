var express = require('express');
var router = express.Router();

//mongoose addition
var mongoose = require('mongoose');
var Users = require("../models/users").Users;
var Posts = require("../models/posts").Posts;

//++++++++++++++++++++++++++++++GETS FOR PAGE RENDERING++++++++++++++++++++++++++++++++++++++

/* GET home/welcome page. */
router.get('/', function(req, res) {
    res.render('welcomepage', { title: 'Welcome to Fritter' });
});

/*GET sign_up page!!*/ 
router.get('/sign_up', function(req, res){
    res.render('sign_up', {title: 'Welcome to the sign-up page'})
})

/*GET failure to sign-up page!!*/
router.get('/failure', function(req, res){
    res.render('failure', {title: 'Invalid username chosen'})
})

/* GET logging out page*/
router.get('/logout',function(req,res){
    req.session.destroy(function(){
        res.redirect('/'); //go back to homepage
    });
});

/* GET the confirmation page for postRemoval */
router.get('/update_post', function(req, res) {
    res.render('update_post', { title: 'Post Updated' })
});

/* GET the delete post page */
router.get('/delete_post', function(req, res) {
    res.render('update_post', { title: 'Post Deleted' })
});

/* GET the post new post page */
router.get('/post_new_post', function(req, res){
    var user_name = req.session.user_name;
    res.render('post_new_post', {title: 'Post Another Post', user_name: user_name});
});

function newUser(reqBody){
    var user_name = reqBody.user_name;
    var password = reqBody.password;
    var name = reqBody.name;
    var newUser = {"user_name":user_name, "password": password, "name":name};
    return newUser
}

//+++++++++++++++++++++++++++USER AUTHENTICATION AND SIGN_UP++++++++++++++++++++++++++

//This function logs-in a user and the session user_name (used for authentication purposes)
router.post('/open_user_session', function(req, res){
    var username = req.body.user_name;
    var password = req.body.password; 
    Users.findOne({user_name: username}, function(err, doc){
        if (err){
            res.send("En error occured during your login")
        }
        else{
            //if a match was found
            if (doc !== null){ 
                //cross check passwords
                if(doc.password === password){
                    req.session.regenerate(
                         function(){
                        req.session.user_name = username;
                        ///go to new post page
                        res.render('post_new_post', {title : "signing in complete", user_name: username});
                    });
                }
            }
            else{
                res.redirect("/");  //go sign up properly
            }
        }
    });
});


/* POST to Add User Service, essentially equal to signing up */
router.post('/sign_up', function(req, res) {

    // Get our form values. These rely on the "name" attributes
    var name = req.body.name;
    var username = req.body.user_name;
    var password = req.body.password;

    Users.findOne({
        user_name : username
    }, function (err, doc) {
        if (err) {
            // If it failed, return error
            res.send("There was a problem finding your information in the database.");
        }
        else {
            //new approach
            if(doc===null){
                var user = new Users(newUser(req.body));
                user.save(function(err, doc){
                    if (err){
                        res.send("There was a problem adding the information to the database.");
                    }
                    else{
                        res.redirect("/");
                    }
                });
            }
            else {
                //resets addressbar
                res.location("/failure");
                // And forward to success page!
                res.redirect("/failure");
            }
        }
    });
});


//++++++++++++++++++++++++++++++++++++++POSTS+++++++++++++++++++++++++++++++++++++++++++++++++++++++++

/* POST new post to the database */
router.post('/post_new_post', function(req, res){
    var user_post = req.body.post;
    var user_name = req.session.user_name;

    //if the user authenticated himself to see this page
    if (user_name !== undefined){
        var newPost = new Posts({user_name:user_name, post:user_post });
        newPost.save(function(err, doc){
            if (err){
                res.send("There was a problem posting your post.");
            }
            var postId = newPost.id; //add post to the user's list of posts

            Users.update({user_name:user_name},{$push:{posts:postId}},{upsert:true}, function(err,doc){
                if (err){
                    res.send("There was a problem referencing your post to the user.");
                }
                    var path = "allposts/"+user_name;
                    res.location(path);
                    // And forward to success page!
                    res.redirect(path);
            });
        });

    } else{
        res.location("/");
        res.redirect("/");
    }
});

/* POST to see all posts sevice*/
router.get('/allposts/:user_name', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.params.user_name
    var path = "allposts";
    
    //show all the posts in the database
    Posts.find({},{},function(e,docs){
        res.render(path, { 
            title: "Welcome to the Posts Feed!",
            result : docs, 
            user_name : current_user
        });
    });
});

/* POST to see all posts that match the query in the search box*/
router.get('/allposts/search/:user_name', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.params.user_name;
    var searchword = req.param("searchword");
    var path = "allposts";
    var splits = searchword.split(/\s+/).join("|");
    var regex = new RegExp(splits);
    
    //show all the posts in the database that match query
    Posts.find({post:regex},{},function(e,docs){
        res.render(path, { 
            title: "Search Results",
            result : docs, 
            user_name : current_user
        });
    });
});



/* POST to see all posts sevice*/
router.get('/allusers/:user_name', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.params.user_name
    var path = "allusers";

    if (user_name !== undefined){
        //finding myself, to get who I am subscribed to
        Users.findOne({user_name:user_name}).populate('following').exec(function(err, doc){
            if (err){
                res.send("could not find you!");
            }else{

                var myid = doc._id;
                var thoseISubscribeto = doc.following;
                //process those i subscribe to, to give only ID
                var idstoexclude = [myid]; // I want to not show myself on the users List
                var numbersubscribing = thoseISubscribeto.length;

                for (var i=0; i<numbersubscribing; i++) {
                    var current_user = thoseISubscribeto[i];
                    idstoexclude.push(current_user._id);
                }
                //now find all users and exclude those I am subscribed to
                Users.find({"_id":{"$nin":idstoexclude}},{},function(e,docs){
                    if (e){
                        //console.log(e);
                        res.send("cannot find all users")
                    }else{
                        res.render(path, { 
                            title: "alluserstoshow",
                            subscribe : docs, 
                            unsubscribe: thoseISubscribeto,
                            user_name : current_user
                        });
                    }
                }); 
            }
        });
    }else{
        res.location("/");
        res.redirect("/");
    }
});

/* This is the function called when a user follows another, It adds the user who clicks the button to the
followee's "followers" section and adds the user chosen to the current user's "following" section*/
router.post('/allusers/subscribe', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.body.user_name;
    var subscribeToid = req.body.id;
    // find my id
    if (user_name !== undefined){
        Users.findOne({user_name:user_name}, function(err, doc){ //find myself to find my id
            if (err){
                res.send("could not find you!");
            }else{
                var current_user_id = doc._id;
                //add the user I clicked on to my following section
                Users.update({user_name:user_name},{$push:{following:subscribeToid}},{upsert:true}, function(err,doc){
                if (err){
                    res.send("There was a problem subscribing to the user.");
                }else{
                    //add the follower to the other user's followers section
                    Users.update({_id:subscribeToid}, {$push:{followers:current_user_id}},{upsert:true}, function(err,doc){
                        if (err){
                            res.send("could not show who you are following");
                        }else{
                            //all worked out
                            var path = "/allposts/"+user_name;
                            res.location(path);
                            // And forward to success page!
                            res.redirect(path);
                        }
                    })
                }
            });
            }
        })
    }
    else{ //go back to sign-in page
        res.location("/");
        res.redirect("/");
    }
});

/* This is the function called when a user unfollows another, It removes the user who clicks the button from the
followee's "followers" section and deletes the user chosen from the current user's "following" section*/
router.post('/allusers/unsubscribe', function(req, res){
    var user_name = req.session.user_name;
    var current_user = req.body.user_name;
    var subscribeToid = req.body.id;
    // find my id
    if (user_name !== undefined){
        Users.findOne({user_name:user_name}, function(err, doc){
            if (err){
                res.send("could not find you!");
            }else{
                var current_user_id = doc._id;
                //Removes the user I clicked on from my following section
                Users.update({user_name:user_name},{$pull:{following:subscribeToid}},{upsert:true}, function(err,doc){
                if (err){
                    res.send("There was a problem subscribing to the user.");
                }else{
                    //remove the follower from the other user's followers section
                    Users.update({_id:subscribeToid}, {$pull:{followers:current_user_id}},{upsert:true}, function(err,doc){
                        if (err){
                            res.send("could not show who you are following");
                        }else{
                            //all worked out
                            var path = "/allposts/"+user_name;
                            res.location(path);
                            // And forward to success page!
                            res.redirect(path);
                        }
                    })
                }
            });
            }
        })
    }
    else{ //go back to sign-in page
        res.location("/");
        res.redirect("/");
    }
});

module.exports = router;
