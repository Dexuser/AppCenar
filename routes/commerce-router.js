import express from "express";
import isAuth from "../middlewares/isAuth.js";
import roleMiddleware from "../middlewares/roleMiddleware.js";
import UserRoles from "../models/enums/userRoles.js";

// Controllers
import * as homeController from "../controllers/commerce/homeController.js";
import { getProfile, postProfile } from "../controllers/commerce/profileController.js";
import * as categoriesController from "../controllers/commerce/categoriesController.js";
import * as productController from "../controllers/commerce/productController.js";

// Middlewares específicos
import { uploadLogo } from "../middlewares/multer.js";
import { uploadProductImage } from "../middlewares/multer.js";
import { validateProfile } from "./validations/commerceProfileValidation.js";
import { validateCategory } from "./validations/categoryValidation.js";
import { validateProduct } from "./validations/productValidation.js";
import { validateAssignDelivery } from "./validations/homeCommerceValidation.js";

const commerceRouter = express.Router();

// Protección global para este router
commerceRouter.use(isAuth);
commerceRouter.use(roleMiddleware(UserRoles.COMMERCE));

// --- DASHBOARD / HOME ---

//  Ruta para el listado de pedidos (Home)
commerceRouter.get("/", homeController.getHome);

//  Ruta para ver el detalle de un pedido específico
commerceRouter.get("/order/:id", homeController.getOrderDetail);

//  Ruta para procesar la asignación (Esta ya la tenías, déjala ahí)
commerceRouter.post(
    "/assign-delivery",
    validateAssignDelivery,
    homeController.postAssignDelivery
);

// --- PERFIL ---
commerceRouter.get("/profile", getProfile);

// Primero Multer (para procesar el archivo), luego Validation (para los campos)
commerceRouter.post("/profile", uploadLogo, validateProfile, postProfile);

// --- MANTENIMIENTO DE CATEGORÍAS ---

// Listado principal de categorías
commerceRouter.get("/categories", categoriesController.getCategories);

// Crear Categoría (Pantalla y Procesamiento)
commerceRouter.get("/categories/create", categoriesController.getCreateCategory);
commerceRouter.post("/categories/create", validateCategory, categoriesController.postCreateCategory);

// Editar Categoría (Pantalla y Procesamiento)
commerceRouter.get("/categories/edit/:id", categoriesController.getEditCategory);
commerceRouter.post("/categories/edit/:id", validateCategory, categoriesController.postEditCategory);

// Eliminar Categoría (Pantalla de confirmación y Acción)
commerceRouter.get("/categories/delete/:id", categoriesController.getDeleteConfirm);
commerceRouter.post("/categories/delete", categoriesController.postDeleteCategory);

// --- MANTENIMIENTO DE PRODUCTOS ---

// Listado de productos
commerceRouter.get("/products", productController.getProducts);

// Crear Producto
commerceRouter.get("/products/create", productController.getCreateProduct);
// Nota: uploadProductImage debe ir antes de validateProduct
commerceRouter.post(
    "/products/create",
    uploadProductImage.single("image"),
    validateProduct,
    productController.postCreateProduct
);

// Editar Producto
commerceRouter.get("/products/edit/:id", productController.getEditProduct);
commerceRouter.post(
    "/products/edit/:id",
    uploadProductImage.single("image"),
    validateProduct,
    productController.postEditProduct
);

// Eliminar Producto
commerceRouter.get("/products/delete/:id", productController.getDeleteConfirm);
commerceRouter.post("/products/delete", productController.postDeleteProduct);

export default commerceRouter;