import "reflect-metadata"
import { DataSource } from "typeorm"
import { MeCaseForms } from "./entity/MeCaseForms"
import { load } from 'ts-dotenv';

const env = load({
    DB_HOST: String,
    DB_NAME: String,
    DB_USER: String,
    DB_PASS: String,
    DB_PORT: Number,
});

export const AppDataSource = new DataSource({
    type: "mysql",
    host: env.DB_HOST,
    port: env.DB_PORT || 3306,
    username: env.DB_USER,
    password: env.DB_PASS,
    database: env.DB_NAME,
    synchronize: false,
    logging: false,
    entities: [MeCaseForms],
    migrations: [],
    subscribers: [],
    extra: {
        connectionLimit: 20
    },
})
