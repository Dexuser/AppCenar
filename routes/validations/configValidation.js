import { body } from "express-validator";

export const validateConfig = [
    body("itebis")
        .trim()
        .notEmpty()
        .withMessage("El campo ITBIS es obligatorio.")
        .isFloat({ min: 0, max: 100 })
        .withMessage("El ITBIS debe ser un valor numérico entre 0 y 100.")
];