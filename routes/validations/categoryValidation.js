import { body, validationResult } from "express-validator";

export const validateCategory = [
    // 1. Reglas de validación
    body("name")
        .trim()
        .notEmpty()
        .withMessage("El nombre de la categoría es obligatorio."),

    body("description")
        .trim()
        .notEmpty()
        .withMessage("La descripción de la categoría es obligatoria."),

    // 2. Middleware para capturar y manejar los errores
    (req, res, next) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // Determinamos si estamos editando o creando basándonos en la URL o el ID
            const isEditing = req.params.id || req.body.id;

            return res.render("categories/save-category", {
                layout: "commerce-layout",
                pageTitle: isEditing ? "Editar Categoría" : "Nueva Categoría",
                editMode: !!isEditing,
                hasErrors: true,
                errors: errors.array().map(err => err.msg),
                // Devolvemos lo que el usuario escribió para que no se borre
                category: {
                    ...req.body,
                    _id: req.params.id // Mantenemos el ID si estamos editando
                },
                user: req.session.user
            });
        }
        next();
    }
];