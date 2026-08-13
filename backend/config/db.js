import {Pool} from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString : process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized : false ,
    },
})
 

pool.on("connect", ()=>{
    console.log("Connecte a la base de donnee");
});

pool.on("error", (err)=> {
    console.error("Erreur de base de donnee", err);
});

export default pool;