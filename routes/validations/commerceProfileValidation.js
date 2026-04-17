import { body, validationResult } from "express-validator";

export const validateProfile = [
    body("email")
        .isEmail()
        .withMessage("Por favor, ingresa un correo electrónico válido.")
        .notEmpty()
        .withMessage("El correo es obligatorio."),

    body("phone")
        .notEmpty()
        .withMessage("El teléfono es obligatorio.")
        .isLength({ min: 10 })
        .withMessage("El teléfono debe tener al menos 10 dígitos."),

    body("openTime")
        .notEmpty()
        .withMessage("La hora de apertura es obligatoria.")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Formato de hora de apertura inválido (HH:mm)."),

    body("closeTime")
        .notEmpty()
        .withMessage("La hora de cierre es obligatoria.")
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage("Formato de hora de cierre inválido (HH:mm)."),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render("commerce/profile", {
                layout: "commerce-layout",
                pageTitle: "Mi Perfil",
                user: req.body,
                hasErrors: true, // Coincide con tu layout
                errors: errors.array().map(err => err.msg) // Coincide con tu layout
            });
        }
        next();
    }
];