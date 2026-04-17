import fs from "fs";
import multer from "multer";
import path from "path";
import { v4 as guidV4 } from "uuid";
import { projectRoot } from "../utils/Paths.js";

const commerceLogoDirectory = path.join(
  projectRoot,
  "public",
  "uploads",
  "images",
  "users",
  "commerce-logos"
);
const profilePictureDirectory = path.join(
  projectRoot,
  "public",
  "uploads",
  "images",
  "users",
  "profiles-pictures"
);
const commerceTypeDirectory = path.join(
  projectRoot,
  "public",
  "uploads",
  "images",
  "commerce-types"
);
const commerceProductDirectory = path.join(
  projectRoot,
  "public",
  "uploads",
  "images",
  "commerce-products"
);

const uploadDirectories = [
  commerceLogoDirectory,
  profilePictureDirectory,
  commerceTypeDirectory,
  commerceProductDirectory,
];

function ensureDirectoryExists(directory) {
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
}

for (const directory of uploadDirectories) {
  ensureDirectoryExists(directory);
}

function createImageStorage(directory) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      try {
        ensureDirectoryExists(directory);
        cb(null, directory);
      } catch (error) {
        cb(error, directory);
      }
    },
    filename: (req, file, cb) => {
      cb(null, `${guidV4()}-${file.originalname}`);
    },
  });
}

const imageStorageForLogoAssets = createImageStorage(commerceLogoDirectory);
const imageStorageForProfileImage = createImageStorage(profilePictureDirectory);
const imageStorageForCommerceTypes = createImageStorage(commerceTypeDirectory);
const productStorage = createImageStorage(commerceProductDirectory);

export const uploadProductImage = multer({ storage: productStorage });
export const uploadCommerceTypeImage = multer({
  storage: imageStorageForCommerceTypes,
}).single("image");
export const uploadLogo = multer({ storage: imageStorageForLogoAssets }).single(
  "logo"
);
export const uploadProfilePicture = multer({
  storage: imageStorageForProfileImage,
}).single("profilePicture");
export { ensureDirectoryExists };
