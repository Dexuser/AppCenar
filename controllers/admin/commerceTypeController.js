import CommerceType from "../../models/CommerceType.js";
import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import mongoose from "mongoose";

// 1. LISTADO INICIAL
export const getCommerceTypes = async (req, res) => {
    try {
        const types = await CommerceType.find().lean();

        // Mapeamos para obtener la cantidad de comercios por cada tipo
        const typesWithCount = await Promise.all(types.map(async (type) => {
            const count = await User.countDocuments({
                role: UserRoles.COMMERCE,
                commerceTypeId: type._id
            });
            return { ...type, commerceCount: count };
        }));

        res.render("admin/commerce-types/index", {
            pageTitle: "Mantenimiento de Tipo de Comercios",
            types: typesWithCount,
            hasTypes: typesWithCount.length > 0
        });
    } catch (error) {
        console.error("Error al obtener tipos de comercio:", error);
        res.redirect("/admin");
    }
};

// 2. PANTALLA DE CREACIoN (Formulario)
export const getCreateCommerceType = (req, res) => {
    res.render("admin/commerce-types/save-commerce-type", {
        pageTitle: "Crear Tipo de Comercio",
        editMode: false
    });
};

export const postCreateCommerceType = async (req, res) => {
    const { title, description } = req.body;
    // Guardamos la ruta relativa para las imágenes
    const image = req.file ? `/uploads/images/commerce-types/${req.file.filename}` : "";

    try {
        await CommerceType.create({ title, description, image });
        req.flash("success", "Tipo de comercio creado correctamente.");
        res.redirect("/admin/commerce-types");
    } catch (error) {
        console.error("Error al crear tipo de comercio:", error);
        res.redirect("/admin/commerce-types/create");
    }
};

// 3. PANTALLA DE EDICIoN (Formulario con valores cargados)
export const getEditCommerceType = async (req, res) => {
    const { id } = req.params;
    try {
        const type = await CommerceType.findById(id).lean();

        if (!type) {
            return res.redirect("/admin/commerce-types");
        }

        res.render("admin/commerce-types/save-commerce-type", {
            pageTitle: "Editar Tipo de Comercio",
            editMode: true,
            type
        });
    } catch (error) {
        console.error("Error al cargar edición:", error);
        res.redirect("/admin/commerce-types");
    }
};

export const postEditCommerceType = async (req, res) => {
    const { id, title, description } = req.body;
    const newImage = req.file ? `/uploads/images/commerce-types/${req.file.filename}` : null;

    try {
        const updateData = { title, description };
        if (newImage) {
            updateData.image = newImage;
        }

        await CommerceType.findByIdAndUpdate(id, updateData);
        req.flash("success", "Tipo de comercio actualizado correctamente.");
        res.redirect("/admin/commerce-types");
    } catch (error) {
        console.error("Error al editar tipo de comercio:", error);
        res.redirect(`/admin/commerce-types/edit/${id}`);
    }
};

// 4. PANTALLA DE ELIMINACIoN 
export const getDeleteConfirm = async (req, res) => {
    const { id } = req.params;
    try {
        const type = await CommerceType.findById(id).lean();

        if (!type) {
            return res.redirect("/admin/commerce-types");
        }

        res.render("admin/commerce-types/delete-confirm", {
            pageTitle: "Confirmar Eliminación",
            type
        });
    } catch (error) {
        console.error("Error en confirmación de borrado:", error);
        res.redirect("/admin/commerce-types");
    }
};

export const postDeleteCommerceType = async (req, res) => {
    const { id } = req.body;
    try {
        await User.deleteMany({ commerceTypeId: id, role: UserRoles.COMMERCE });
        await CommerceType.findByIdAndDelete(id);

        req.flash("success", "Tipo de comercio y sus comercios asociados eliminados.");
        res.redirect("/admin/commerce-types");
    } catch (error) {
        console.error("Error al eliminar tipo de comercio:", error);
        res.redirect("/admin/commerce-types");
    }
};