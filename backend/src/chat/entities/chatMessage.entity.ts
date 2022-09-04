import { Field, ObjectType } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class ChatMessage {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column({ type: "longtext" })
  @Field(() => String)
  message: string;

  @Column()
  @Field(() => String)
  room: string;

  @ManyToOne(() => User)
  @Field(() => User)
  user: User;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;
}
