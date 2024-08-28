import { User } from "./index";
import { File } from "multer";
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

declare module "express-serve-static-core" {
  interface Request {
    file?: File;
  }
}
