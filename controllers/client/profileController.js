import User from "../../models/User.js";
import { normalizeAssetPath, updateSessionUser } from "./clientHelpers.js";

export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.session.user.id).lean();

    if (!user) {
      req.flash("errors", "No se pudo cargar tu perfil.");
      return res.redirect("/client");
    }

    res.render("client/profile", {
      layout: "client-layout",
      pageTitle: "Mi perfil",
      user: {
        ...user,
        profilePicture: normalizeAssetPath(user.profilePicture),
      },
    });
  } catch (error) {
    console.error("Error al obtener el perfil del cliente:", error);
    req.flash("errors", "No se pudo cargar tu perfil.");
    res.redirect("/client");
  }
}

export async function postProfile(req, res) {
  const { firstName, lastName, phone } = req.body;

  try {
    const currentUser = await User.findById(req.session.user.id);

    if (!currentUser) {
      req.flash("errors", "No se pudo actualizar tu perfil.");
      return res.redirect("/client");
    }

    const profilePicturePath = req.file
      ? `/uploads/images/users/profiles-pictures/${req.file.filename}`
      : currentUser.profilePicture;

    const updatedUser = await User.findByIdAndUpdate(
      req.session.user.id,
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        profilePicture: profilePicturePath,
      },
      { new: true, runValidators: true }
    ).lean();

    await updateSessionUser(req, {
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      phone: updatedUser.phone,
      profilePicture: normalizeAssetPath(updatedUser.profilePicture),
    });

    req.flash("success", "Perfil actualizado correctamente.");
    res.redirect("/client/profile");
  } catch (error) {
    console.error("Error al actualizar el perfil del cliente:", error);
    req.flash("errors", "No se pudo actualizar tu perfil.");
    res.redirect("/client/profile");
  }
}
