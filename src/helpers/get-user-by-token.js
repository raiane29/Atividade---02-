import { response } from "express"
import jwt from "jsonwebtoken"
import conn from "../config/conn"

const getUserByToken = async (token) => {
    return new Promise((resolve, reject)=>{
        if (!token) {
            response.status(401).json({message:"Acesso negado"})
            return
        }
        const decoded = jwt.verify(token, "SUNHASUPERSEGURA")
        const userId = decoded.id
        const checkSql = /*sql*/ `select  from usuarios where ?? = ?`
        const checksqlData = ["usuario_id", userId]
        conn.query(checkSql, checksqlData, (err, data)=>{
            if (err) {
                reject({status: 500, message:"erro ao buscar usuário"})
            }else{
                resolve(data[0])
            }
        })
    })
}