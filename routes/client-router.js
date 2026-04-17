import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";
import { uploadProfilePicture } from "../middlewares/multer.js";
import { handleValidationErrors } from "../middlewares/handleValidation.js";
import { validateAddress } from "./validations/addressValidation.js";
import { validateClientProfile } from "./validations/clientProfileValidation.js";
import { getAddresses, getCreateAddress, getDeleteAddress, getEditAddress, postCreateAddress, postDeleteAddress, postEditAddress } from "../controllers/client/addressesController.js";
import { getCatalog } from "../controllers/client/catalogController.js";
import { postAddProductToCart, postRemoveProductFromCart } from "../controllers/client/cartController.js";
import { getCheckout, postCheckout } from "../controllers/client/checkoutController.js";
import { getFavorites, postToggleFavorite } from "../controllers/client/favoritesController.js";
import { getHome, getCommerces } from "../controllers/client/homeController.js";
import { getOrderDetail, getOrders } from "../controllers/client/ordersController.js";
import { getProfile, postProfile } from "../controllers/client/profileController.js";

const clientRouter = express.Router();

clientRouter.use(isAuth);
clientRouter.use(roleMiddleware(UserRoles.CLIENT));

clientRouter.get("/", getHome);
clientRouter.get("/commerces/:typeId", getCommerces);
clientRouter.post("/favorites/toggle/:commerceId", postToggleFavorite);
clientRouter.get("/favorites", getFavorites);

clientRouter.get("/catalog/:commerceId", getCatalog);
clientRouter.post("/catalog/:commerceId/cart/add/:productId", postAddProductToCart);
clientRouter.post(
  "/catalog/:commerceId/cart/remove/:productId",
  postRemoveProductFromCart
);
clientRouter.get("/catalog/:commerceId/checkout", getCheckout);
clientRouter.post("/catalog/:commerceId/checkout", postCheckout);

clientRouter.get("/profile", getProfile);
clientRouter.post(
  "/profile",
  uploadProfilePicture,
  validateClientProfile,
  handleValidationErrors("/client/profile"),
  postProfile
);

clientRouter.get("/orders", getOrders);
clientRouter.get("/orders/:id", getOrderDetail);

clientRouter.get("/addresses", getAddresses);
clientRouter.get("/addresses/create", getCreateAddress);
clientRouter.post(
  "/addresses/create",
  validateAddress,
  handleValidationErrors("/client/addresses/create"),
  postCreateAddress
);
clientRouter.get("/addresses/edit/:id", getEditAddress);
clientRouter.post(
  "/addresses/edit/:id",
  validateAddress,
  handleValidationErrors((req) => `/client/addresses/edit/${req.params.id}`),
  postEditAddress
);
clientRouter.get("/addresses/delete/:id", getDeleteAddress);
clientRouter.post("/addresses/delete", postDeleteAddress);

export default clientRouter;
