import { body } from "express-validator";
import User from "../../models/User.js";

export const validateAdminUser = [
    body("firstName")
        .trim()
        .notEmpty()
        .withMessage("El nombre es requerido."),

    body("lastName")
        .trim()
        .notEmpty()
        .withMessage("El apellido es requerido."),

    body("cedula")
        .trim()
        .notEmpty()
        .withMessage("La cédula es requerida."),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Debe ingresar un correo electrónico válido.")
        .notEmpty()
        .withMessage("El correo es requerido.")
        .custom(async (value, { req }) => {
            // Validar que el correo no esté duplicado (excepto si es el del mismo usuario que editamos)
            const user = await User.findOne({ email: value });
            if (user && user._id.toString() !== req.body.id) {
                throw new Error("Este correo ya está registrado por otro usuario.");
            }
            return true;
        }),

    body("username")
        .trim()
        .notEmpty()
        .withMessage("El nombre de usuario es requerido."),

    body("password")
        .if((value, { req }) => !req.body.id || value)
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres.")
        .matches(/[A-Z]/)
        .withMessage("La contraseña debe de contener letras")
        .matches(/[0-9]/)
        .withMessage("La contraseña debe de contener numeros")
        .matches(/[\W_]/)
        .withMessage("La contraseña debe de contener caracteres especiales"),

    body("confirmPassword")
        .if((value, { req }) => !req.body.id || req.body.password) // Solo validar si es nuevo o si se intenta cambiar la clave
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("La confirmación de la contraseña no coincide.");
            }
            return true;
        }),
];