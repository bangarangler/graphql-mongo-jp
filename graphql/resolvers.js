const bcrypt = require("bcryptjs");
const validator = require("validator");
const jwt = require("jsonwebtoken");

const User = require("../models/user.js");
const Item = require("../models/item.js");

module.exports = {
  createUser: async ({ userInput }, req) => {
    const errors = [];
    if (!validator.isEmail(userInput.email)) {
      errors.push({ message: "Email is invalid." });
    }
    if (
      validator.isEmpty(userInput.password) ||
      !validator.isLength(userInput.password, { min: 5 })
    ) {
      errors.push({ message: "Password too short!" });
    }
    if (errors.length > 0) {
      const error = new Error("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error("User exists already!");
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },
  login: async ({ email, password }) => {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("User not found.");
      error.code = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("Password is incorrect.");
      error.code = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email
      },
      process.env.SECRET,
      { expiresIn: "1h" }
    );
    return { token: token, userId: user._id.toString() };
  },
  user: async (args, req) => {
    if (!req.isAuth) {
      const error = new Error(`Not authenticated!`);
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if (!user) {
      const error = new Error(`No user found!`);
      error.code = 404;
      throw error;
    }
    return { ...user._doc, _id: user._id.toString() };
  },
  createItem: async ({ itemInput }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    const errors = [];
    if (
      validator.isEmpty(itemInput.title) ||
      !validator.isLength(itemInput.title, { min: 5 })
    ) {
      errors.push({ message: "Title is invalid." });
    }
    if (
      validator.isEmpty(itemInput.description) ||
      !validator.isLength(itemInput.description, { min: 5 })
    ) {
      errors.push({ message: "Content is invalid." });
    }
    if (errors.length > 0) {
      const error = newError("Invalid input.");
      error.data = errors;
      error.code = 422;
      throw error;
    }
    const user = await User.findById(req.userId);
    console.log("User:", user);
    if (!user) {
      const error = new Error("Invalid user.");
      error.data = errors;
      error.code = 401;
      throw error;
    }
    const item = new Item({
      title: itemInput.title,
      description: itemInput.description,
      image: itemInput.image,
      price: itemInput.price,
      user: user
    });
    const createdItem = await item.save();
    console.log("item: ", createdItem);
    user.items.push(createdItem);
    await user.save();
    return {
      ...createdItem._doc,
      _id: createdItem._id.toString(),
      createdAt: createdItem.createdAt.toISOString(),
      updatedAt: createdItem.updatedAt.toISOString()
    };
  },
  items: async ({ page }, req) => {
    if (!req.isAuth) {
      const error = new Error("Not authenticated!");
      error.code = 401;
      throw error;
    }
    if (!page) {
      page = 1;
    }
    const perPage = 4;
    const totalItems = await Item.find().countDocuments();
    const items = await Item.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .populate("user");
    return {
      items: items.map(i => {
        return {
          ...i._doc,
          _id: i._id.toString(),
          createdAt: i.createdAt.toISOString(),
          updatedAt: i.updatedAt.toISOString()
        };
      }),
      totalItems: totalItems
    };
  }
};
