import { body } from "express-validator";

export const validateClientProfile = [
  body("firstName")
    .trim()
    .notEmpty()
    .withMessage("El nombre es requerido")
    .escape(),
  body("lastName")
    .trim()
    .notEmpty()
    .withMessage("El apellido es requerido")
    .escape(),
  body("phone")
    .trim()
    .notEmpty()
    .withMessage("El teléfono es requerido")
    .escape(),
];
