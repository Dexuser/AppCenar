import User from "../../models/User.js";

export const getProfile = async (req, res) => {
    try {

        const user = await User.findById(req.session.user.id).lean();

        res.render("commerce/profile/profile", { // Ruta exacta de tu archivo
            layout: "commerce-layout",
            pageTitle: "Mi Perfil",
            user: user, // Aquí van los datos para precargar
            hasSuccess: req.query.success === "true",
            success: req.query.success === "true" ? ["Perfil actualizado correctamente"] : []
        });
    } catch (error) {
        console.error("Error al obtener perfil:", error);
        res.redirect("/commerce/");
    }
};


export const postProfile = async (req, res) => {
    const { email, phone, openTime, closeTime } = req.body;
    const userId = req.session.user.id;

    try {

        const currentUser = await User.findById(userId);


        let logoPath = currentUser.commerceLogo;
        if (req.file) {

            logoPath = `/uploads/images/users/commerce-logos/${req.file.filename}`;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                email,
                phone,
                openTime,
                closeTime,
                commerceLogo: logoPath
            },
            { new: true, runValidators: true }
        );


        req.session.user.email = updatedUser.email;
        req.session.user.commerceLogo = updatedUser.commerceLogo;
        req.session.user.firstName = updatedUser.firstName;

        req.session.save(() => {
            res.redirect("/commerce/profile?success=true");
        });

    } catch (error) {
        console.error("Error al actualizar perfil:", error);
        res.render("commerce/profile/profile", {
            layout: "commerce-layout",
            pageTitle: "Mi Perfil",
            user: { ...req.body, commerceLogo: req.session.user.commerceLogo },
            hasError: true,
            errorMessage: "Error al actualizar los datos. Verifica el formato de hora (HH:mm)."
        });
    }
};