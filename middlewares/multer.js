import multer from "multer"; // Import multer for file uploads
import { projectRoot } from "../utils/Paths.js";
import path from "path";
import { v4 as guidV4 } from "uuid";


let test;

const imageStorageForLogoAssets = multer.diskStorage({
  destination: (req, file, cb) => {

    cb(null, path.join(projectRoot, "public", "uploads", "images", "users", "commerce-logos"));
  },
  filename: (req, file, cb) => {
    const fileName = `${guidV4()}-${file.originalname}`; //
    cb(null, fileName);
  },
});

const imageStorageForProfileImage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(
      null,
      path.join(projectRoot, "public", "uploads", "images", "users", "profiles-pictures")
    );
  },
  filename: (req, file, cb) => {
    const fileName = `${guidV4()}-${file.originalname}`;
    cb(null, fileName);
  },
});

// Añade esto a tu multer.js
const imageStorageForCommerceTypes = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(projectRoot, "public", "uploads", "images", "commerce-types"));
  },
  filename: (req, file, cb) => {
    const fileName = `${guidV4()}-${file.originalname}`;
    cb(null, fileName);
  },
});

// Configuración para Productos
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Usamos path.join para evitar errores de ruta
    cb(null, path.join(projectRoot, "public", "uploads", "images", "commerce-products"));
  },
  filename: (req, file, cb) => {
    // Usamos guidV4 para mantener la consistencia con tus otros storages
    const fileName = `${guidV4()}-${file.originalname}`;
    cb(null, fileName);
  },
});


export const uploadProductImage = multer({ storage: productStorage });
export const uploadCommerceTypeImage = multer({ storage: imageStorageForCommerceTypes }).single("image");
export const uploadLogo = multer({ storage: imageStorageForLogoAssets }).single("logo");
export const uploadProfilePicture = multer({ storage: imageStorageForProfileImage }).single("profilePicture"); 