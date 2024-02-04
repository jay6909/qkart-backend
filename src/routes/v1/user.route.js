const express = require("express");
const validate = require("../../middlewares/validate");
const userValidation = require("../../validations/user.validation");
const userController = require("../../controllers/user.controller");
const { User } = require("../../models");
const mongoose=require('mongoose');
const { userService } = require("../../services");
const auth = require("../../middlewares/auth");
const router = express.Router();

// router.use( validate(userValidation.getUser))

// TODO: CRIO_TASK_MODULE_UNDERSTANDING_BASICS - Implement a route definition for `/v1/users/:userId`
// router.put("/create",userController.create)

router.get(
  "/:userId",
  auth,
  validate(userValidation.getUser),
  userController.getUser
);
// router.get("/:userId?q=address",auth,validate(userValidation.getUser),userController.getUser)

router.put(
  "/:userId",
  auth,
  validate(userValidation.setAddress),
  userController.setAddress
);

module.exports = router;
