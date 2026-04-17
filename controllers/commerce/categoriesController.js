import Category from "../../models/Category.js";
import Product from "../../models/Product.js";

// 1. Listado: Muestra solo lo del comercio logueado
export const getCategories = async (req, res) => {
    try {
        const commerceId = req.session.user.id;


        const categories = await Category.find({ commerceId }).lean();

        // Conteo de productos por categoría
        const categoriesWithCount = await Promise.all(
            categories.map(async (category) => {
                const productCount = await Product.countDocuments({
                    categoryId: category._id
                });
                return { ...category, productCount };
            })
        );

        res.render("commerce/categories/list", {
            layout: "commerce-layout",
            pageTitle: "Mis Categorías",
            categories: categoriesWithCount,
            hasCategories: categoriesWithCount.length > 0,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error al listar categorías:", error);
        res.redirect("/commerce");
    }
};


export const getCreateCategory = (req, res) => {
    res.render("commerce/categories/save-category", {
        layout: "commerce-layout",
        pageTitle: "Nueva Categoría",
        editMode: false,
        user: req.session.user
    });
};

// 3. Procesar Creación
export const postCreateCategory = async (req, res) => {
    const { name, description } = req.body;
    const commerceId = req.session.user.id;

    try {
        await Category.create({ name, description, commerceId });
        res.redirect("/commerce/categories");
    } catch (error) {
        res.render("commerce/categories/save-category", {
            layout: "commerce-layout",
            hasErrors: true,
            errors: ["Todos los campos son requeridos"],
            category: req.body
        });
    }
};


export const getEditCategory = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findById(id).lean();


        if (!category || category.commerceId.toString() !== req.session.user.id) {
            return res.redirect("/commerce/categories");
        }

        res.render("commerce/categories/save-category", { // Ruta: views/categories/save-category.hbs
            layout: "commerce-layout",
            pageTitle: "Editar Categoría",
            editMode: true,
            category,
            user: req.session.user
        });
    } catch (error) {
        res.redirect("/commerce/categories");
    }
};


export const postEditCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    try {
        // Solo actualizamos si el ID existe
        await Category.findByIdAndUpdate(id, { name, description });
        res.redirect("/commerce/categories");
    } catch (error) {
        res.redirect("/commerce/categories");
    }
};


export const getDeleteConfirm = async (req, res) => {
    const { id } = req.params;
    try {
        const category = await Category.findById(id).lean();

        // Verificación de propiedad
        if (!category || category.commerceId.toString() !== req.session.user.id) {
            return res.redirect("/commerce/categories");
        }

        res.render("commerce/categories/delete-confirm", {
            layout: "commerce-layout",
            pageTitle: "¿Eliminar Categoría?",
            category,
            user: req.session.user
        });
    } catch (error) {
        res.redirect("/commerce/categories");
    }
};


export const postDeleteCategory = async (req, res) => {
    const { id } = req.body;
    try {
        await Category.findByIdAndDelete(id);
        res.redirect("/commerce/categories");
    } catch (error) {
        res.redirect("/commerce/categories");
    }
};