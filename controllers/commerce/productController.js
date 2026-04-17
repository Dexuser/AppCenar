import Product from "../../models/Product.js";
import Category from "../../models/Category.js";


export const getProducts = async (req, res) => {
    try {
        const commerceId = req.session.user.id;


        const products = await Product.find({ commerceId })
            .populate("categoryId")
            .lean();

        res.render("commerce/products/list", {
            layout: "commerce-layout",
            pageTitle: "Mantenimiento de Productos",
            products,
            hasProducts: products.length > 0,
            user: req.session.user
        });
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.redirect("/commerce");
    }
};


export const getCreateProduct = async (req, res) => {
    try {
        const commerceId = req.session.user.id;

        const categories = await Category.find({ commerceId }).lean();

        res.render("commerce/products/save-product", {
            layout: "commerce-layout",
            pageTitle: "Nuevo Producto",
            editMode: false,
            categories,
            user: req.session.user
        });
    } catch (error) {
        res.redirect("/commerce/products");
    }
};


export const postCreateProduct = async (req, res) => {
    const { name, description, price, categoryId } = req.body;
    const commerceId = req.session.user.id;
    const image = req.file ? `/uploads/images/commerce-products/${req.file.filename}` : null;

    try {
        await Product.create({
            name,
            description,
            price,
            image,
            categoryId,
            commerceId
        });
        res.redirect("/commerce/products");
    } catch (error) {
        const categories = await Category.find({ commerceId }).lean();
        res.render("commerce/products/save-product", {
            layout: "commerce-layout",
            editMode: false,
            hasErrors: true,
            errors: ["Error al crear el producto. Verifique los campos."],
            categories,
            product: req.body
        });
    }
};


export const getEditProduct = async (req, res) => {
    const { id } = req.params;
    const commerceId = req.session.user.id;

    try {
        const product = await Product.findById(id).lean();
        const categories = await Category.find({ commerceId }).lean();

        if (!product || product.commerceId.toString() !== commerceId) {
            return res.redirect("/commerce/products");
        }

        res.render("commerce/products/save-product", {
            layout: "commerce-layout",
            pageTitle: "Editar Producto",
            editMode: true,
            product,
            categories,
            user: req.session.user
        });
    } catch (error) {
        res.redirect("/commerce/products");
    }
};


export const postEditProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, categoryId } = req.body;

    try {
        const updateData = { name, description, price, categoryId };

        if (req.file) {
            updateData.image = `/uploads/images/commerce-products/${req.file.filename}`;
        }
        await Product.findByIdAndUpdate(id, updateData);

        res.redirect("/commerce/products");
    } catch (error) {
        console.error("Error al editar:", error);
        res.redirect("/commerce/products");
    }
};


export const getDeleteConfirm = async (req, res) => {
    const { id } = req.params;
    try {
        const product = await Product.findById(id).lean();

        if (!product || product.commerceId.toString() !== req.session.user.id) {
            return res.redirect("/commerce/products");
        }

        res.render("commerce/products/delete-confirm", {
            layout: "commerce-layout",
            pageTitle: "¿Eliminar Producto?",
            product,
            user: req.session.user
        });
    } catch (error) {
        res.redirect("/commerce/products");
    }
};


export const postDeleteProduct = async (req, res) => {
    const { id } = req.body;
    try {
        await Product.findByIdAndDelete(id);
        res.redirect("/commerce/products");
    } catch (error) {
        res.redirect("/commerce/products");
    }
};