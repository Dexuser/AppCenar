import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";

import { getHome } from "../controllers/customer/CustomerController.js";

const customerRouter = express.Router();

customerRouter.use(isAuth);
customerRouter.use(roleMiddleware(UserRoles.CLIENT));

customerRouter.get("/home", getHome);

export default customerRouter;
