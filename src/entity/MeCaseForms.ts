import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity("me_case_forms")
export class MeCaseForms {

    @PrimaryGeneratedColumn()
    ca_fo_id: number

    @Column()
    ca_fo_activity_id: number

    @Column()
    ca_fo_case_id: number

    @Column({ type: 'datetime' })
    ca_fo_date: string

    @Column()
    ca_fo_author: number

    @Column()
    ca_fo_type: number

    @Column("text")
    ca_fo_code: string

    @Column()
    ca_fo_lang: string

    @Column()
    ca_req_type: number

    @Column()
    json_updated: boolean

    @Column()
    json_update_error: boolean

    @Column()
    try_to_update: number

    @Column("text")
    json_data: string

}
