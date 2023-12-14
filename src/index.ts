import { AppDataSource } from "./data-source"
import { MeCaseForms } from "./entity/MeCaseForms"
import { exec } from "child_process"
import { createClient } from "redis";
import { load } from "ts-dotenv";
import { LessThan } from "typeorm";

const env = load({
    REDIS_URL: String,
    TIME_INTERVAL: String,
});

const client = createClient({
    url: env.REDIS_URL
});

client.on('error', err => console.log('Redis Client Error', err));

AppDataSource.initialize().then(async () => {

    await client.connect();
    const CaseFormRepository = AppDataSource.getRepository(MeCaseForms)
    const TimeInterval = Number(env.TIME_INTERVAL) || 1000;
    setInterval(async () => {
        const AllFormData = await CaseFormRepository.find({
            where: {
                json_updated: false,
                json_update_error: false,
                try_to_update: LessThan(5)
            },
            order: { try_to_update: 1 },
            take: 100
        });

        if (AllFormData.length == 0) return;

        let IDs = AllFormData.map((formData: MeCaseForms) => {
            return formData.ca_fo_id.toString();
        });


        let updateQuery = `UPDATE me_case_forms SET try_to_update =  \`try_to_update\`+1 WHERE ca_fo_id IN (${IDs.join(',')})`;
        AppDataSource.query(updateQuery);


        AllFormData.map(async (formData: MeCaseForms) => {
            let newObject: any = {};
            console.log("Loaded formData: ", formData.ca_fo_id)
            await client.set(formData.ca_fo_id.toString(), formData.ca_fo_code);

            if (formData.ca_fo_code.toString() == "") {
                newObject.try_to_update = 0;
                newObject.json_updated = 1;
                newObject.json_data = ` CAST('{}' AS JSON) `;
                await AppDataSource.createQueryBuilder()
                    .update(MeCaseForms)
                    .set(newObject)
                    .where("ca_fo_id = :id", { id: formData.ca_fo_id })
                    .execute();
                // await AppDataSource.manager.save(formData);
                console.log(`success update json in row ${formData.ca_fo_id}`);
                return;
            }
            try {
                exec(`php ${process.cwd()}/src/unserialize.php ${formData.ca_fo_id.toString()}`,
                    async (err, stdout, stderr) => {
                        let response = stdout;

                        if (err != null) {
                            console.log(`error on update json in row ${formData.ca_fo_id}`, err);
                            newObject.json_update_error = 1;
                            newObject.json_updated = 0;
                            newObject.json_data = "{}";
                        } else {
                            newObject.json_data = response.toString().replace(/'/g, "\\'")
                            newObject.json_update_error = 0;
                            newObject.json_updated = 1;
                            newObject.try_to_update = 0;
                        }

                        updateQuery = `UPDATE me_case_forms SET  json_data =  CAST('${newObject.json_data}' AS JSON) , json_update_error = ${newObject.json_update_error}, json_updated = ${newObject.json_updated} , try_to_update = ${newObject.try_to_update} WHERE ca_fo_id = ${formData.ca_fo_id}`;
                        await AppDataSource.query(updateQuery);
                        console.log(`success update json in row ${formData.ca_fo_id}`);
                    });

            } catch (error) {
                updateQuery = `UPDATE me_case_forms SET json_data =  CAST('{}' AS JSON) , json_update_error = 1, json_updated = 0 WHERE ca_fo_id = ${formData.ca_fo_id}`;
                await AppDataSource.query(updateQuery);
                console.log(`================================================`)
                console.log(`updateQuery is `, updateQuery)
                // console.log(error)
                console.log(`================================================`)
            }
        });
    }, TimeInterval);
}).catch(async (error) => {
    console.log(error)
})
