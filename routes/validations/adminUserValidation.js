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
        .withMessage("La cédula es requerida.")
        .matches(/^\d{3}-?\d{7}-?\d{1}$/) // Formato dominicano: 000-0000000-0
        .withMessage("Formato de cédula no válido.")
        .custom(async (value, { req }) => {
            // Validar duplicidad de cédula (muy importante en RD)
            const existingUser = await User.findOne({ cedula: value });
            if (existingUser && existingUser._id.toString() !== req.body.id) {
                throw new Error("Esta cédula ya pertenece a otro administrador.");
            }
            return true;
        }),

    body("email")
        .trim()
        .notEmpty()
        .withMessage("El correo es requerido.")
        .isEmail()
        .withMessage("Debe ingresar un correo electrónico válido.")
        .normalizeEmail()
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: value });
            if (user && user._id.toString() !== req.body.id) {
                throw new Error("Este correo ya está registrado por otro usuario.");
            }
            return true;
        }),

    body("username")
        .trim()
        .notEmpty()
        .withMessage("El nombre de usuario es requerido.")
        .custom(async (value, { req }) => {
            const user = await User.findOne({ username: value });
            if (user && user._id.toString() !== req.body.id) {
                throw new Error("Este nombre de usuario ya está en uso.");
            }
            return true;
        }),

    body("password")
        .if((value, { req }) => !req.body.id || (value && value.trim() !== ""))
        .isLength({ min: 6 })
        .withMessage("La contraseña debe tener al menos 6 caracteres.")
        .matches(/[A-Z]/)
        .withMessage("La contraseña debe contener al menos una letra mayúscula.")
        .matches(/[0-9]/)
        .withMessage("La contraseña debe contener al menos un número.")
        .matches(/[\W_]/)
        .withMessage("La contraseña debe contener al menos un carácter especial."),

    body("confirmPassword")
        .if((value, { req }) => !req.body.id || req.body.password)
        .custom((value, { req }) => {
            if (value !== req.body.password) {
                throw new Error("La confirmación de la contraseña no coincide.");
            }
            return true;
        }),
];