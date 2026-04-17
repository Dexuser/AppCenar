import { body } from "express-validator";

export const validateCommerceType = [
    body("title").trim().notEmpty().withMessage("El nombre del tipo es requerido").escape(),
    body("description").trim().notEmpty().withMessage("La descripción es requerida").escape(),
    body("image").custom((value, { req }) => {
        // En creación es obligatoria, en edición no.
        if (!req.file && !req.body.id) {
            throw new Error("El icono del tipo es requerido");
        }
        return true;
    })
];