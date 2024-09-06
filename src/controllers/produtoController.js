import { request, response } from "express";
import conn from "../config/conn.js";
import getBody from "../helpers/get-body-produto.js";

export const addProdutoCubo = async (request, response) =>{
    const {tipo, dificuldade} = request.body

    if(!tipo){
        response.status(400).json({ message: "O tipo do cubo é obrigatório" });
        return;
    }
    if(!dificuldade){
        response.status(400).json({ message: "A dificuldade do cubo é obrigatório" });
        return;
    }

    const insertSql = /*sql*/ `insert into produtosCubo (??, ??) values (?, ?)`
    const insertSqlData = [
        "tipo",
        "dificuldade",
        tipo,
        dificuldade
    ]

    conn.query(insertSql, insertSqlData, (err)=>{
        if(err){
            console.error(err);
            response.status(500).json({ err: "Erro ao cadastrar produto" });
            return;
        }

        response.status(200).json({message:"Produto cadastrado"})
    })

}

export const checkProduto = async (request, response)=>{
    if (request.headers.authorization) {

        const body = getBody(request)
        console.log(body);
        const produtobody = body
        const selectSql = /*sql*/ `select tipo, dificuldade from produtosCubo where ?? = ?`
        const selectSqlData = ["tipo", "dificuldade", produtobody]
        conn.query(selectSql, selectSqlData, (err, data) => {
            if(err){
                console.error(err);
                response.status(500).json({ err: "Erro ao verificar produto" })
                return
            }
                produto = data
                response.status(200).json(produto)
     
            })
    }
}
