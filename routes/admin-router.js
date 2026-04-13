import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";

// Importación de controladores
import * as commerceTypeController from "../controllers/admin/commerceTypeController.js";
import * as clientController from "../controllers/admin/clientController.js";
import * as deliveryController from "../controllers/admin/deliveryController.js";
import * as commerceController from "../controllers/admin/commerceController.js";
import * as adminUserController from "../controllers/admin/adminUserController.js";
import * as configController from "../controllers/admin/configController.js";
import { getDashboard } from "../controllers/admin/homeController.js";

// Validaciones y Middlewares de apoyo
import { validateAdminUser } from "./validations/adminUserValidation.js";
import { handleValidationErrors } from "../middlewares/handleValidation.js"; // IMPORTACIÓN ÚNICA
import { uploadCommerceTypeImage } from "../middlewares/multer.js";
import { validateCommerceType } from "./validations/commerceTypeValidation.js";
import { validateConfig } from "./validations/configValidation.js";

const adminRouter = express.Router();

// Protección de rutas: Solo Admins autenticados
adminRouter.use(isAuth);
adminRouter.use(roleMiddleware(UserRoles.ADMIN));

// --- Home ---
adminRouter.get("/", getDashboard);

// --- Mantenimiento de Tipo de Comercios ---
adminRouter.get("/commerce-types", commerceTypeController.getCommerceTypes);
adminRouter.get("/commerce-types/create", commerceTypeController.getCreateCommerceType);
adminRouter.post(
    "/commerce-types/create",
    uploadCommerceTypeImage,
    validateCommerceType,
    handleValidationErrors(),
    commerceTypeController.postCreateCommerceType
);

adminRouter.get("/commerce-types/edit/:id", commerceTypeController.getEditCommerceType);
adminRouter.post(
    "/commerce-types/edit",
    uploadCommerceTypeImage,
    validateCommerceType,
    handleValidationErrors(),
    commerceTypeController.postEditCommerceType
);

adminRouter.get("/commerce-types/delete/:id", commerceTypeController.getDeleteConfirm);
adminRouter.post("/commerce-types/delete", commerceTypeController.postDeleteCommerceType);

// --- Listado de Clientes ---
adminRouter.get("/clients", clientController.getClientsList);
adminRouter.post("/clients/toggle-status/:id", clientController.postToggleClientStatus);

// --- Listado de Delivery ---
adminRouter.get("/delivery", deliveryController.getDeliveryList);
adminRouter.post("/delivery/toggle-status/:id", deliveryController.postToggleDeliveryStatus);

// --- Listado de Comercios ---
adminRouter.get("/commerces", commerceController.getCommerceList);
adminRouter.post("/commerces/toggle-status/:id", commerceController.postToggleCommerceStatus);

// --- Mantenimiento de Usuarios Admin ---
adminRouter.get("/admins-management", adminUserController.getAdminList);
adminRouter.get("/admins-management/create", adminUserController.getSaveAdmin);
adminRouter.post(
    "/admins-management/create",
    validateAdminUser,
    handleValidationErrors("/admin/admins-management/create"), // Forzamos el regreso al formulario de crear
    adminUserController.postSaveAdmin
);

adminRouter.get("/admins-management/edit/:id", adminUserController.getSaveAdmin);
adminRouter.post(
    "/admins-management/edit",
    validateAdminUser,
    handleValidationErrors((req) => `/admin/admins-management/edit/${req.body.id}`),
    adminUserController.postSaveAdmin
);

adminRouter.post("/admins-management/toggle-status/:id", adminUserController.postToggleAdminStatus);


// --- Mantenimiento de Configuración ---
adminRouter.get("/config", configController.getConfigHome);
adminRouter.get("/config/edit", configController.getEditConfig);


adminRouter.post(
    "/config/edit",
    validateConfig,
    handleValidationErrors("/admin/config/edit"), // Si falla, vuelve al formulario
    configController.postEditConfig
);

export default adminRouter;