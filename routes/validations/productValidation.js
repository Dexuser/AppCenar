import { body, validationResult } from "express-validator";
import Category from "../../models/Category.js";

export const validateProduct = [
    // 1. Reglas de validación para campos de texto
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre del producto es obligatorio."),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción del producto es obligatoria."),

    body("price")
        .notEmpty()
        .withMessage("El precio es obligatorio.")
        .isNumeric()
        .withMessage("El precio debe ser un número válido.")
        .custom((value) => value > 0)
        .withMessage("El precio debe ser mayor a 0."),

    body("categoryId")
        .notEmpty()
        .withMessage("Debes seleccionar una categoría."),

    // 2. Middleware para procesar errores y manejar la lógica de la imagen
    async (req, res, next) => {
        const errors = validationResult(req);
        const isEditing = req.params.id || req.body.id;
        const commerceId = req.session.user.id;

        // VALIDACIÓN DE IMAGEN SEGÚN EL MANDATO:
        // Si no estamos editando (es creación) y no hay archivo, es un error.
        if (!isEditing && !req.file) {
            errors.errors.push({ msg: "La foto del producto es obligatoria para la creación.", path: "image" });
        }

        if (!errors.isEmpty()) {
            // Necesitamos recargar las categorías para que el Select no aparezca vacío en la vista de error
            const categories = await Category.find({ commerceId }).lean();

            return res.render("commerce/products/save-product", {
                layout: "commerce-layout",
                pageTitle: isEditing ? "Editar Producto" : "Nuevo Producto",
                editMode: !!isEditing,
                hasErrors: true,
                errors: errors.array().map(err => err.msg),
                categories,
                product: {
                    ...req.body,
                    _id: req.params.id // Mantenemos el ID para la ruta del form en edición
                },
                user: req.session.user
            });
        }
        next();
    }
];