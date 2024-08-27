import { User } from "../types/index";
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
