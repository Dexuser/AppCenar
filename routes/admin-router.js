import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";


import { getHome } from "../controllers/admin/homeController.js";
// Importación del nuevo controlador de mantenimientos
import * as commerceTypeController from "../controllers/admin/commerceTypeController.js";
import * as clientController from "../controllers/admin/clientController.js";

// Middlewares de apoyo
import { uploadCommerceTypeImage } from "../middlewares/multer.js";
import { validateCommerceType } from "./validations/commerceTypeValidation.js";
import { handleValidationErrors } from "../middlewares/handleValidation.js";

const adminRouter = express.Router();

// Protección de rutas: Solo Admins autenticados
adminRouter.use(isAuth);
adminRouter.use(roleMiddleware(UserRoles.ADMIN));

// --- Home ---
adminRouter.get("/", getHome);

// --- Mantenimiento de Tipo de Comercios ---

// Pantalla inicial: Listado de tipos
adminRouter.get("/commerce-types", commerceTypeController.getCommerceTypes);

// Pantalla de creación: Formulario
adminRouter.get("/commerce-types/create", commerceTypeController.getCreateCommerceType);
adminRouter.post(
    "/commerce-types/create",
    uploadCommerceTypeImage,
    validateCommerceType,
    handleValidationErrors(),
    commerceTypeController.postCreateCommerceType
);

// Pantalla de edición: Formulario con valores cargados
adminRouter.get("/commerce-types/edit/:id", commerceTypeController.getEditCommerceType);
adminRouter.post(
    "/commerce-types/edit",
    uploadCommerceTypeImage,
    validateCommerceType,
    handleValidationErrors(),
    commerceTypeController.postEditCommerceType
);

// Pantalla de eliminación: Confirmación y Acción
adminRouter.get("/commerce-types/delete/:id", commerceTypeController.getDeleteConfirm);
adminRouter.post("/commerce-types/delete", commerceTypeController.postDeleteCommerceType);

// --- Listado de Clientes ---

// 1. Ruta para ver la tabla (GET)
adminRouter.get("/clients", clientController.getClientsList);

// 2. Ruta para el botón de activar/inactivar (POST)
adminRouter.post("/clients/toggle-status/:id", clientController.postToggleClientStatus);

export default adminRouter;