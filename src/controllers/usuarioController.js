import conn from "../config/conn.js";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

//Helpers
import createUserToken from "../helpers/create-user-token.js";
import getToken from "../helpers/get-token.js";
import { request, response } from "express";

export const register = async (request, response) => {
    const {nome, email, telefone, senha, confirmaSenha} = request.body

    if(!nome){
        response.status(400).json({ message: "O Nome é obrigatório" });
        return;
    }
    if(!email){
        response.status(400).json({ message: "O Email é obrigatório" });
        return;
    }
    if(!telefone){
        response.status(400).json({ message: "O Telefone é obrigatório" });
        return;
    }
    if(!senha){
        response.status(400).json({ message: "A senha é obrigatória" });
        return;
    }
    if(!confirmaSenha){
        response.status(400).json({ message: "A Confirmação da Senha é obrigatória" });
        return;
    }
    //? Verificar se o email é válido
    if(!email.includes("@")){
        response.status(409).json({ message: "O E-mail deve conter @ incluso" });
        return;
    }

    //? Senha === confirmaSenha
    if(senha !== confirmaSenha){
        response.status(409).json({ message: "A Senha e a confirmação de senha devem ser iguais!" });
        return;
    }

    const checkSql = /*sql*/ `SELECT * FROM usuarios WHERE ?? = ?`
    const checkSqlData = ["email", email]
    conn.query(checkSql, checkSqlData, async (err, data)=>{
        if(err){
            console.error(err);
            response.status(500).json({ err: "Erro ao buscar email para cadastro." });
            return;
        }

        //? 2º Erro
        if(data.length > 0){
            response.status(409).json({ err: "O email já esta em uso" });
            return;
        }
        
        //? Posso fazer o registro
        const salt = await bcrypt.genSalt(12)
        //* console.log(salt);
        const senhaHash = await bcrypt.hash(senha, salt)
        //* console.log("Senha digitada: ", senha);
        //* console.log("Senha com hash: ", senhaHash);

        //Criar o usuário
        const id = uuidv4();
        const usuario_img = "userDefault.png"
        const insertSql = /*sql*/ `INSERT INTO usuarios (??, ??, ??, ??, ??, ??) VALUES (?, ?, ?, ?, ?, ?)`
        const insertSqlData = [
            "usuario_id", 
            "nome", 
            "email", 
            "telefone", 
            "senha", 
            "imagem", 
            id, 
            nome, 
            email, 
            telefone, 
            senhaHash, 
            usuario_img
        ]
        conn.query(insertSql, insertSqlData, (err)=> {
            if(err){
                console.error(err);
                response.status(500).json({ err: "Erro ao cadastrar usuário" });
                return;
            }
            //1º Criar um token
            //2º Passar o token para o front-end
            const usuarioSql = /*sql*/ `SELECT * FROM usuarios WHERE ?? = ?`
            const usuarioData = ["usuario_id", id]
            conn.query(usuarioSql, usuarioData, async (err, data) => {
                if(err){
                    console.error(err);
                    response.status(500).json({err: "Erro ao fazer login"})
                    return
                }
                const usuario = data[0]

                try {
                    await createUserToken(usuario, request, response)
                } catch (error) {
                    console.error(error);
                    response.status(500).json({err: "Erro ao processar requisição"})
                }
            })
            
            
            response.status(201).json({ message: "Usuário cadastrado" });
        });
    });
};

export const login = (request, response) => {
    const { email, senha } = request.body;

    if(!email){
        response.status(400).json({ message: "O Email é obrigatório" });
        return;
    }
    if(!senha){
        response.status(400).json({ message: "A senha é obrigatória" });
        return;
    }

    const checkEmailSql = /*sql*/ `SELECT * FROM usuarios WHERE ?? = ?`
    const checkEmailData = ["email", email]
    conn.query(checkEmailSql, checkEmailData, async (err, data)=> {
        if(err){
            console.error(err);
            response.status(500).json({err: "Erro ao fazer login" })
            return;
        }
        if(data.length === 0){
            response.status(500).json({err: "E-mail não está cadastrado"})
            return;
        }

        const usuario = data[0]
        console.log(usuario.senha);

        //? Comparar senhas
        const comparaSenha = await bcrypt.compare(senha, usuario.senha)
        console.log("Compara senha: ", comparaSenha);
        if(!comparaSenha){
            response.status(401).json({ message: "Senha inválida" })
        }

        //1º Criar um token
        try {
            await createUserToken (usuario, request, response)
        } catch (error) {
            console.error(error);
            response.status(500).json({err: "Erro ao processar a informação"})
        }
    });
};

//CheckUser -> verificar os usuários logado na aplicação
export const checkUser = async (request, response) => {
    let usuarioAtual;
    
    if(request.headers.authorization){
        //extrair o token -> barear TOKEN
        const token = getToken(request)
        console.log(token);
        //descriptografar o token do jwt.decode
        const decoded = jwt.decode(token, "SENHASUPERSEGURA")
        console.log(decoded);

        const usuarioId = decoded.id
        const selectSql = /*sql*/ `SELECT nome, email, telefone, imagem FROM usuarios WHERE ?? = ?`
        const selectData = ["usuario_id", usuarioId]
        conn.query(selectSql, selectData, (err, data) => {
            if(err){
                console.error(err);
                response.status(500).json({ err: "Erro ao verificar usuário" })
                return
            }
            usuarioAtual = data[0]
            response.status(200).json(usuarioAtual)
        })
    }else{
        usuarioAtual = null
        response.status(200).json(usuarioAtual)
    }
}

//getUserById -> verificar usuário
export const getUserById = async (request, response) => {
    const id = request.params.id

    const checkSql = /*sql*/ `select usuario_id, nome, email, telefone, imagem from usuarios where ?? = ?`
    const checkSqlData = ["usuario_id", id]
    conn.query(checkSql, checkSqlData, (err, data)=>{
        if (err) {
            console.error(err)
            response.status(500).json({message: "erro ao buscar usuario"})
            return
        }

        if (data.length === 0) {
            response.status(404).json({message: "usuario nao encotrado"})
            return
        }

        const usuario = data[0]
        response.status(200).json(usuario)
    }) 
}
//editUser -> Controlador Protegido, contém imagem de usuário
export const editUser = async (request, response) => {
    const {id} = request.params

    try {
        const token = getToken(request)
        const user = await getUserByToken(token)
        console.log();
    } catch (error) {
        
    }
}


//! Prova prática: dividida em 3 dias. 30/09 02/10 04/10