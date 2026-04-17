import { body } from "express-validator";

export const validateAddress = [
  body("label")
    .trim()
    .notEmpty()
    .withMessage("El nombre de la dirección es requerido")
    .escape(),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("La descripción de la dirección es requerida")
    .escape(),
  body("street")
    .trim()
    .optional({ checkFalsy: true })
    .escape(),
  body("sector")
    .trim()
    .optional({ checkFalsy: true })
    .escape(),
  body("city")
    .trim()
    .optional({ checkFalsy: true })
    .escape(),
  body("reference")
    .trim()
    .optional({ checkFalsy: true })
    .escape(),
];
