import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import bcrypt from "bcrypt";

// --- LISTADO ---
export const getAdminList = async (req, res) => {
    try {
        const userId = (req.session.user._id || req.session.user.id).toString();
        const admins = await User.find({ role: UserRoles.ADMIN }).lean();

        const mappedAdmins = admins.map(admin => ({
            ...admin,
            isCurrentUser: admin._id.toString() === userId,
            canBeManaged: !admin.isDefaultAdmin
        }));

        res.render("admin/users/admin-list", {
            pageTitle: "Mantenimiento de Administradores",
            admins: mappedAdmins,
            hasAdmins: admins.length > 0
            // PROHIBIDO: No pongas success: req.flash(...) aquí. 
            // El app.js ya lo hizo por ti y lo puso en res.locals.
        });
    } catch (error) {
        res.redirect("/admin");
    }
};

// --- MOSTRAR PANTALLA (CREAR / EDITAR) ---
export const getSaveAdmin = async (req, res) => {
    const { id } = req.params;
    let admin = null;

    try {
        const sessionUserId = (req.session.user._id || req.session.user.id).toString();

        if (id) {
            // Protección: No puedes editarte a ti mismo aquí
            if (id === sessionUserId) {
                req.flash("errors", "Usa la sección de 'Mi Perfil' para editar tus propios datos.");
                return res.redirect("/admin/admins-management");
            }

            admin = await User.findById(id).lean();

            // REGLA DE ORO: Si es un admin por defecto, nadie lo toca
            if (admin && admin.isDefaultAdmin) {
                req.flash("errors", "El Administrador Principal del sistema no puede ser modificado.");
                return res.redirect("/admin/admins-management");
            }
        }

        res.render("admin/users/save-admin", {
            pageTitle: id ? "Editar Administrador" : "Nuevo Administrador",
            editMode: !!id,
            admin: admin
        });
    } catch (error) {
        res.redirect("/admin/admins-management");
    }
};

export const postSaveAdmin = async (req, res) => {
    const { id, firstName, lastName, cedula, email, username, password, phone } = req.body;

    try {
        if (id) {
            // 1. Buscamos si existe y si no es el default
            const targetAdmin = await User.findById(id);
            if (!targetAdmin || targetAdmin.isDefaultAdmin) {
                req.flash("errors", "No se puede editar este administrador.");
                return res.redirect("/admin/admins-management");
            }

            // 2. Preparamos datos
            const updateData = { firstName, lastName, cedula, email, username, phone };

            if (password && password.trim() !== "") {
                updateData.password = await bcrypt.hash(password, 10);
            }

            // 3. EJECUTAR LA ACTUALIZACIÓN (Esto era lo que faltaba)
            await User.findByIdAndUpdate(id, updateData);

            req.flash("success", "Administrador actualizado correctamente.");
        } else {
            // Lógica de CREAR (Ya la tienes bien)
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                firstName, lastName, cedula, email, username, phone,
                password: hashedPassword,
                role: UserRoles.ADMIN,
                isActive: true,
                isDefaultAdmin: false
            });
            req.flash("success", "Nuevo administrador creado con éxito.");
        }

        res.redirect("/admin/admins-management");

    } catch (error) {
        console.error(error);
        req.flash("errors", "Error de base de datos al guardar.");
        res.redirect("/admin/admins-management");
    }
};

// --- CAMBIAR ESTADO ---
export const postToggleAdminStatus = async (req, res) => {
    const { id } = req.params;

    try {
        const currentAdminId = (req.session.user._id || req.session.user.id).toString();
        const user = await User.findById(id);

        if (!user) return res.redirect("/admin/admins-management");

        // 1. No te puedes apagar a ti mismo
        if (id === currentAdminId) {
            req.flash("errors", "No puedes desactivar tu propia cuenta.");
            return res.redirect("/admin/admins-management");
        }

        // 2. No puedes apagar al admin por defecto
        if (user.isDefaultAdmin) {
            req.flash("errors", "El administrador base no puede ser desactivado.");
            return res.redirect("/admin/admins-management");
        }

        user.isActive = !user.isActive;
        await user.save();

        req.flash("success", `Usuario ${user.isActive ? 'activado' : 'desactivado'} con éxito.`);
        res.redirect("/admin/admins-management");
    } catch (error) {
        res.redirect("/admin/admins-management");
    }
};