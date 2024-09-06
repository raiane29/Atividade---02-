import { Router } from "express";
import { checkUser, login, register, getUserById, editUser} from "../controllers/usuarioController.js"
import { addProdutoCubo, checkProduto } from "../controllers/produtoController.js";

//middlewares
import verifyToken from "../helpers/verify-token.js";

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.get("/checkuser", checkUser)
router.get("/:id", getUserById)
router.put("/edit/:id", verifyToken, editUser)
router.post("/produtoCubo/:id", addProdutoCubo)
router.get("/produtoCubo/checkProduto", checkProduto)


export default router;