import express from "express";
import { body } from "express-validator";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";

import { handleValidationErrors } from "../middlewares/handleValidation.js";
import { uploadProfilePicture } from "../middlewares/multer.js";

import { getClientHome, getHome, getCommerces, toggleFavorite } from "../controllers/client/homeController.js"
import { getCatalog, addToCart, removeFromCart, clearCart } from "../controllers/client/catalogController.js";
import { getCheckout, postCheckout } from "../controllers/client/checkoutController.js";
import {
    getAddresses,
    getCreateAddress,
    postCreateAddress,
    getEditAddress,
    postEditAddress,
    getDeleteAddress,
    postDeleteAddress
} from "../controllers/client/addressController.js";
import { getOrders, getOrderDetail } from "../controllers/client/orderController.js";
import { getProfile, postProfile } from "../controllers/client/profileController.js";
import { getFavorites, removeFromFavorites } from "../controllers/client/favoritesController.js";

// Como todas estas rutas deben de estar protegidas de los otros roles que no son client,
// se pone el middleware en el enrutador usando el metodo use
const clientRouter = express.Router();
clientRouter.use(isAuth);

clientRouter.use(roleMiddleware(UserRoles.CLIENT));

clientRouter.get("/", (req, res) => res.redirect("/client/home"));
clientRouter.get("/home", getClientHome)
clientRouter.get("/commerces", getCommerces)
clientRouter.post("/favorite/:commerceId", toggleFavorite)

clientRouter.get("/catalog/:commerceId", getCatalog)
clientRouter.post("/catalog/:commerceId/cart/add", addToCart)
clientRouter.post("/catalog/:commerceId/cart/remove", removeFromCart)
clientRouter.post("/cart/clear", clearCart)

clientRouter.get("/checkout", getCheckout)
clientRouter.post("/checkout", postCheckout)

clientRouter.get("/addresses", getAddresses)
clientRouter.get("/addresses/create", getCreateAddress)
clientRouter.post(
    "/addresses/create",
    [
        body("title").trim().notEmpty().withMessage("El nombre de la dirección es requerido"),
        body("description").trim().notEmpty().withMessage("La descripción es requerida")
    ],
    handleValidationErrors(() => "/client/addresses/create"),
    postCreateAddress
)

clientRouter.get("/addresses/:addressId/edit", getEditAddress)
clientRouter.post(
    "/addresses/:addressId/edit",
    [
        body("title").trim().notEmpty().withMessage("El nombre de la dirección es requerido"),
        body("description").trim().notEmpty().withMessage("La descripción es requerida")
    ],
    handleValidationErrors((req) => `/client/addresses/${req.params.addressId}/edit`),
    postEditAddress
)

clientRouter.get("/addresses/:addressId/delete", getDeleteAddress)
clientRouter.post("/addresses/:addressId/delete", postDeleteAddress)

// Rutas placeholder para evitar 404 (se implementarán después)
clientRouter.get("/profile", getProfile)
clientRouter.post(
    "/profile",
    uploadProfilePicture,
    [
        body("firstName").trim().notEmpty().withMessage("El nombre es requerido"),
        body("lastName").trim().notEmpty().withMessage("El apellido es requerido"),
        body("phone").trim().notEmpty().withMessage("El teléfono es requerido")
    ],
    handleValidationErrors(() => "/client/profile"),
    postProfile
)

clientRouter.get("/orders", getOrders)
clientRouter.get("/orders/:orderId", getOrderDetail)

clientRouter.get("/favorites", getFavorites)
clientRouter.post("/favorites/:commerceId/remove", removeFromFavorites)

export default clientRouter;