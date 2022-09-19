import { ObjectType, Field } from "@nestjs/graphql";
import {
  Column,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class BoardImage {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column({ default: "null" })
  @Field(() => String)
  url: string;

  @DeleteDateColumn()
  deletedAt: Date;
}
