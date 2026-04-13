import User from "../../models/User.js";
import path from "path";

export async function getProfile(req, res) {
    try {
        const user = await User.findById(req.session.user.id)
            .select("firstName lastName phone profilePicture")
            .lean();

        return res.render("client/profile", {
            "page-title": "Mi perfil",
            user
        });
    } catch (error) {
        console.error("Error loading profile:", error);
        req.flash("errors", "Error al cargar el perfil");
        return res.redirect("/client/home");
    }
}

export async function postProfile(req, res) {
    try {
        const { firstName, lastName, phone } = req.body;

        let profilePicturePath;
        if (req.file) {
            profilePicturePath = "\\" + path.relative("public", req.file.path);
        }

        const updateDoc = {
            firstName,
            lastName,
            phone
        };

        if (profilePicturePath) {
            updateDoc.profilePicture = profilePicturePath;
        }

        const updated = await User.findByIdAndUpdate(
            req.session.user.id,
            updateDoc,
            { new: true, runValidators: true, context: "query" }
        );

        if (!updated) {
            req.flash("errors", "Usuario no encontrado");
            return res.redirect("/client/profile");
        }

        // Actualizar sesión si se cambió nombre/apellido
        req.session.user.firstName = updated.firstName;
        req.session.user.lastName = updated.lastName;
        req.session.user.phone = updated.phone;
        req.session.user.profilePicture = updated.profilePicture;

        req.flash("success", "Perfil actualizado correctamente");
        return res.redirect("/client/profile");
    } catch (error) {
        console.error("Error updating profile:", error);
        req.flash("errors", "Error al actualizar el perfil");
        return res.redirect("/client/profile");
    }
}
