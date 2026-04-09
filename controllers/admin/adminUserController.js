import User from "../../models/User.js";
import UserRoles from "../../models/enums/userRoles.js";
import bcrypt from "bcrypt";

// --- LISTADO ---
export const getAdminList = async (req, res) => {
    try {

        if (!req.session || !req.session.user) {
            console.log("DEBUG: No hay sesión de usuario activa.");
            return res.redirect("/");
        }


        const userId = req.session.user._id || req.session.user.id;

        if (!userId) {
            console.log("DEBUG: El objeto user en sesión no tiene ID:", req.session.user);
            req.flash("errors", "Error de sesión. Por favor, inicie sesión nuevamente.");
            return res.redirect("/");
        }

        const currentAdminId = userId.toString();

        // 3. Buscar los administradores
        const admins = await User.find({ role: UserRoles.ADMIN }).lean();

        const mappedAdmins = admins.map(admin => ({
            ...admin,
            isCurrentUser: admin._id.toString() === currentAdminId
        }));

        res.render("admin/users/admin-list", {
            pageTitle: "Mantenimiento de Administradores",
            admins: mappedAdmins,
            hasAdmins: admins.length > 0
        });
    } catch (error) {
        console.error("Error detallado en getAdminList:", error);
        res.redirect("/admin");
    }
};


// --- MOSTRAR PANTALLA (CREAR / EDITAR) ---
export const getSaveAdmin = async (req, res) => {
    const { id } = req.params;
    let admin = null;

    try {
        // 1. Verificación de seguridad de sesión
        if (!req.session || !req.session.user) {
            console.log("DEBUG: Sesión no encontrada en getSaveAdmin");
            return res.redirect("/");
        }

        const sessionUserId = (req.session.user._id || req.session.user.id);

        if (!sessionUserId) {
            console.log("DEBUG: El usuario en sesión no tiene ID definido");
            return res.redirect("/admin/admins-management");
        }

        const currentAdminId = sessionUserId.toString();

        if (id) {
            if (id === currentAdminId) {
                req.flash("errors", "No puedes editar tu propio usuario desde el mantenimiento. Usa tu perfil personal.");
                return res.redirect("/admin/admins-management");
            }

            admin = await User.findById(id).lean();
            if (!admin) {
                req.flash("errors", "Administrador no encontrado.");
                return res.redirect("/admin/admins-management");
            }
        }
        res.render("admin/users/save-admin", {
            pageTitle: id ? "Editar Administrador" : "Crear Administrador",
            editMode: !!id,
            admin: admin
        });

    } catch (error) {
        console.error("Error en getSaveAdmin:", error);
        res.redirect("/admin/admins-management");
    }
};

// --- ACCIoN DE GUARDAR ---
export const postSaveAdmin = async (req, res) => {
    const { id, firstName, lastName, cedula, email, username, password } = req.body;

    try {
        // Validación de sesion
        if (!req.session || !req.session.user) return res.redirect("/");

        if (id) {
            // EDITAR
            const currentAdminId = (req.session.user._id || req.session.user.id).toString();

            // REGLA DEL MANDATO: No puedes editarte a ti mismo desde aqui
            if (id === currentAdminId) {
                req.flash("errors", "Para editar tu propio perfil, ve a la sección de configuración personal.");
                return res.redirect("/admin/admins-management");
            }

            const updateData = { firstName, lastName, cedula, email, username };
            if (password && password.trim() !== "") {
                updateData.password = await bcrypt.hash(password, 10);
            }
            await User.findByIdAndUpdate(id, updateData);
        } else {
            // CREAR
            const hashedPassword = await bcrypt.hash(password, 10);
            await User.create({
                firstName, lastName, cedula, email, username,
                password: hashedPassword,
                role: UserRoles.ADMIN,
                isActive: true
            });
        }
        res.redirect("/admin/admins-management");
    } catch (error) {
        console.error("Error en postSaveAdmin:", error);
        res.redirect("/admin/admins-management");
    }
};

// --- CAMBIAR ESTADO ---
export const postToggleAdminStatus = async (req, res) => {
    const { id } = req.params;

    try {
        // Validación de sesión a prueba de balas
        if (!req.session || !req.session.user) {
            return res.redirect("/");
        }

        const currentAdminId = (req.session.user._id || req.session.user.id).toString();

        // REGLA DEL MANDATO: No puedes inactivar tu propia cuenta
        if (id === currentAdminId) {
            req.flash("errors", "No puedes inactivar tu propia cuenta mientras estás logueado.");
            return res.redirect("/admin/admins-management");
        }

        const user = await User.findById(id);
        if (user) {
            user.isActive = !user.isActive;
            await user.save();
            req.flash("success", "Estado del administrador actualizado.");
        }

        res.redirect("/admin/admins-management");
    } catch (error) {
        console.error("Error en postToggleAdminStatus:", error);
        res.redirect("/admin/admins-management");
    }
};