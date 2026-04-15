import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";

import { getHome, getOrderDetail, completeOrder } from "../controllers/delivery/homeController.js"
import { getProfile, postProfile } from "../controllers/delivery/profileController.js"
import { uploadProfilePicture } from "../middlewares/multer.js";

// Como todas estas rutas deben de estar protegidas de los otros roles que no son Admin,
// se pone el middleware en el enrutador usando el metodo use
const deliveryRouter = express.Router();
deliveryRouter.use(isAuth);
deliveryRouter.use(roleMiddleware(UserRoles.DELIVERY));

deliveryRouter.get("/", getHome);
deliveryRouter.get("/order/:id", getOrderDetail);
deliveryRouter.post("/order/:id/complete", completeOrder);
deliveryRouter.get("/profile", getProfile);
deliveryRouter.post("/profile", uploadProfilePicture, postProfile);
export default deliveryRouter;