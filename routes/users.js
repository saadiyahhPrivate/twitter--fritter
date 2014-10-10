var express = require('express');
var router = express.Router();

//mongoose addition
var mongoose = require('mongoose');
var Users = require("../models/users").Users;
var Posts = require("../models/posts").Posts;

/* GET users listing. */
router.get('/', function(req, res) {
  res.send('respond with a resource');
});


module.exports = router;
