import { ObjectType, Field, Int } from "@nestjs/graphql";
import { User } from "src/users/entities/user.entity";
import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity()
@ObjectType()
export class UserUrl {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @ManyToOne(() => User)
  @Field(() => User)
  userId: User;
}
