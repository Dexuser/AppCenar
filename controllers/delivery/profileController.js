import User from "../../models/User.js";

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id).lean();

        res.render("delivery/profile/profile", {
            layout: "delivery-layout",
            pageTitle: "Mi Perfil",
            user,
            hasSuccess: req.query.success === "true",
            success: req.query.success === "true"
                ? ["Perfil actualizado correctamente"]
                : []
        });

    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.redirect("/delivery");
    }
};


export const postProfile = async (req, res) => {
    const { firstName, lastName, phone } = req.body;
    const userId = req.session.user.id;

    try {

        // Validación básica
        if (!firstName || !lastName || !phone) {
            const user = await User.findById(userId).lean();

            return res.render("delivery/profile/profile", {
                layout: "delivery-layout",
                pageTitle: "Mi Perfil",
                user,
                hasError: true,
                errorMessage: "Nombre, apellido y teléfono son requeridos."
            });
        }

        // Usuario actual
        const currentUser = await User.findById(userId);

        // Manejo de imagen (opcional)
        let profilePicturePath = currentUser.profilePicture;

        if (req.file) {
            profilePicturePath = `/uploads/images/users/profiles-pictures/${req.file.filename}`;
        }

        //Update real
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                firstName,
                lastName,
                phone,
                profilePicture: profilePicturePath
            },
            { new: true, runValidators: true }
        );

        //actualizar sesión
        req.session.user.firstName = updatedUser.firstName;
        req.session.user.lastName = updatedUser.lastName;
        req.session.user.phone = updatedUser.phone;
        req.session.user.profilePicture = updatedUser.profilePicture;

        req.session.save(() => {
            res.redirect("/delivery/profile?success=true");
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);

        res.render("delivery/profile/profile", {
            layout: "delivery-layout",
            pageTitle: "Mi Perfil",
            user: {
                ...req.body,
                profilePicture: req.session.user.profilePicture
            },
            hasError: true,
            errorMessage: "Error al actualizar los datos."
        });
    }
};