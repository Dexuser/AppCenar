import mongoose from "mongoose";
import Address from "../../models/Address.js";

export async function getAddresses(req, res) {
    try {
        const addresses = await Address.find({ userId: req.session.user.id }).sort({ createdAt: -1 }).lean();

        return res.render("client/addresses/index", {
            "page-title": "Mis direcciones",
            addresses,
            hasAddresses: addresses.length > 0
        });
    } catch (error) {
        console.error("Error loading addresses:", error);
        req.flash("errors", "Error al cargar direcciones");
        return res.redirect("/client/home");
    }
}

export async function getCreateAddress(req, res) {
    return res.render("client/addresses/create", {
        "page-title": "Crear dirección"
    });
}

export async function postCreateAddress(req, res) {
    try {
        const { label, street, sector, city, reference } = req.body;

        await Address.create({
            userId: req.session.user.id,
            label,
            street,
            sector,
            city,
            reference,
            // Legacy fields for backward compatibility
            title: label,
            description: reference
        });

        req.flash("success", "Dirección creada correctamente");
        return res.redirect("/client/addresses");
    } catch (error) {
        console.error("Error creating address:", error);
        req.flash("errors", "Error al crear la dirección");
        return res.redirect("/client/addresses/create");
    }
}

export async function getEditAddress(req, res) {
    try {
        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            req.flash("errors", "Dirección inválida");
            return res.redirect("/client/addresses");
        }

        const address = await Address.findOne({ _id: addressId, userId: req.session.user.id }).lean();

        if (!address) {
            req.flash("errors", "Dirección no encontrada");
            return res.redirect("/client/addresses");
        }

        return res.render("client/addresses/edit", {
            "page-title": "Editar dirección",
            address
        });
    } catch (error) {
        console.error("Error loading edit address:", error);
        req.flash("errors", "Error al cargar la dirección");
        return res.redirect("/client/addresses");
    }
}

export async function postEditAddress(req, res) {
    try {
        const { addressId } = req.params;
        const { label, street, sector, city, reference } = req.body;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            req.flash("errors", "Dirección inválida");
            return res.redirect("/client/addresses");
        }

        const updated = await Address.findOneAndUpdate(
            { _id: addressId, userId: req.session.user.id },
            {
                label,
                street,
                sector,
                city,
                reference,
                // Legacy fields for backward compatibility
                title: label,
                description: reference
            },
            { new: true }
        );

        if (!updated) {
            req.flash("errors", "Dirección no encontrada");
            return res.redirect("/client/addresses");
        }

        req.flash("success", "Dirección actualizada correctamente");
        return res.redirect("/client/addresses");
    } catch (error) {
        console.error("Error updating address:", error);
        req.flash("errors", "Error al actualizar la dirección");
        return res.redirect("/client/addresses");
    }
}

export async function getDeleteAddress(req, res) {
    try {
        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            req.flash("errors", "Dirección inválida");
            return res.redirect("/client/addresses");
        }

        const address = await Address.findOne({ _id: addressId, userId: req.session.user.id }).lean();

        if (!address) {
            req.flash("errors", "Dirección no encontrada");
            return res.redirect("/client/addresses");
        }

        return res.render("client/addresses/delete", {
            "page-title": "Eliminar dirección",
            address
        });
    } catch (error) {
        console.error("Error loading delete address:", error);
        req.flash("errors", "Error al cargar la dirección");
        return res.redirect("/client/addresses");
    }
}

export async function postDeleteAddress(req, res) {
    try {
        const { addressId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(addressId)) {
            req.flash("errors", "Dirección inválida");
            return res.redirect("/client/addresses");
        }

        await Address.deleteOne({ _id: addressId, userId: req.session.user.id });

        req.flash("success", "Dirección eliminada correctamente");
        return res.redirect("/client/addresses");
    } catch (error) {
        console.error("Error deleting address:", error);
        req.flash("errors", "Error al eliminar la dirección");
        return res.redirect("/client/addresses");
    }
}
