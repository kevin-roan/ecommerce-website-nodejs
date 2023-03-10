var express = require("express");
var router = express.Router();
var productHelpers = require("../helpers/product-helpers");
const userHelper = require("../helpers/user-helper");
var userHelpers = require("../helpers/user-helper");

const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next();
  } else {
    res.redirect("login");
  }
};
/* GET home page. */
router.get("/", async function (req, res, next) {
  let user = req.session.user;
  console.log(user);
  let cartCount = null;
  // when the user is not avail we cant access cart, so we need to check whether there is a user or not. by
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelpers.getAllProducts().then((products) => {
    res.render("user/view-products", {
      admin: false,
      products,
      user,
      cartCount,
    });
  });
});
router.get("/login", (req, res) => {
  if (req.session.loggedIn) {
    res.redirect("/");
  } else {
    res.render("user/login", { LoginErr: req.session.loginErr });
    req.session.loginErr = false;
  }
  res.render("user/login");
});
router.get("/signup", (req, res) => {
  res.render("user/signup");
});

router.post("/signup", (req, res) => {
  userHelper.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.loggedIn = true;
    req.session.user = response.user;
    res.redirect("/");
  });
});

router.post("/login", (req, res) => {
  userHelper.doLogin(req.body).then((response) => {
    if (response.status) {
      req.session.loggedIn = true;
      req.session.user = response.user; // response.user is result form db
      res.redirect("/");
    } else {
      req.session.loginErr = true;
      res.redirect("/login");
    }
  });
});
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/login");
});

router.get("/cart", verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let totalamount = await userHelpers.getTotalAmount(req.session.user._id);
  console.log("&*&*" + req.session.user._id);
  res.render("user/cart", {
    products,
    user: req.session.user._id,
    totalamount,
  });
});

router.get("/add-to-cart/:id", verifyLogin, (req, res) => {
  let prodId = req.params.id;
  let userId = req.session.user._id;
  userHelpers.addToCart(prodId, userId).then(() => {
    res.json({ status: true });
    // res.redirect("/");
  });
});

router.post("/change-product-quantity/", (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

router.post("/remove-product", (req, res, next) => {
  userHelpers.removeProduct(req.body).then((response) => {
    res.json(response);
  });
});

router.get("/place-order", verifyLogin, async (req, res) => {
  let total = await userHelpers.getTotalAmount(req.session.user._id);
  res.render("user/place-order", { total, user: req.session.user });
});

router.post("/place-order", async (req, res) => {
  let products = await userHelpers.getCartProductsList(req.body.userId);
  let totalPrice = await userHelpers.getTotalAmount(req.body.userId);
  userHelpers.placeOrder(req.body, products, totalPrice).then((response) => {
    res.json({ status: true });
  });
  console.log("Placed order");
  console.log(req.body);
});
router.get("/order-success", (req, res) => {
  res.render("user/order-success", { user: req.session.user });
});
router.get("/orders", async (req, res) => {
  let orders = await userHelpers.getUserOrders(req.session.user._id);
  res.render("user/orders", { user: req.session.user, orders });
});
router.get("/view-order-products/:id", async (req, res) => {
  let products = await userHelpers.getOrderProducts(req.params.id);
  res.render("user/view-order-products", {
    user: req.session.user,
    products
  });
});
module.exports = router;
