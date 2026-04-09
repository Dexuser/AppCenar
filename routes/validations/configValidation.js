import { body } from "express-validator";

export const validateConfig = [
    body("itebis")
        .notEmpty()
        .withMessage("El campo ITBIS es obligatorio.")
        .isNumeric()
        .withMessage("El ITBIS debe ser un valor numérico.")
        .custom((value) => {
            if (parseFloat(value) < 0 || parseFloat(value) > 100) {
                throw new Error("El ITBIS debe estar entre 0 y 100.");
            }
            return true;
        }),
];