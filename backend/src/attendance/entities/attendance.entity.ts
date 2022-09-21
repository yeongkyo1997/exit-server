import { Field, Float, ObjectType } from "@nestjs/graphql";
import { Board } from "src/boards/entities/board.entity";
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Attendance {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  userId: string;

  @Column()
  @Field(() => String)
  nickname: string;

  @Column()
  @Field(() => Date)
  attendedAt: Date;

  @Column({ type: "float" })
  @Field(() => Float)
  latitude: number;

  @Column({ type: "float" })
  @Field(() => Float)
  longitude: number;

  @ManyToOne(() => Board)
  @Field(() => Board)
  board: Board;
}
