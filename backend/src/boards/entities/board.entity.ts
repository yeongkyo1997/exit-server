import { ObjectType, Field, Int } from "@nestjs/graphql";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
import { User } from "src/users/entities/user.entity";
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
@ObjectType()
export class Board {
  @PrimaryGeneratedColumn("uuid")
  @Field(() => String)
  id: string;

  @Column()
  @Field(() => String)
  title: string;

  @Column()
  @Field(() => String)
  context: string;

  @Column()
  @Field(() => Int)
  num: number;

  @Column()
  @Field(() => String)
  description: string;

  @Column()
  @Field(() => String)
  leader: string;

  @Column({ default: 0 })
  @Field(() => Int)
  price: number;

  @Column()
  @Field(() => Date)
  startAt: Date;

  @Column()
  @Field(() => Date)
  endAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @JoinColumn()
  @OneToOne(() => BoardImage)
  @Field(() => BoardImage)
  boardImage: BoardImage;

  @JoinTable()
  @ManyToMany(() => Tag, (tags) => tags.boards)
  @Field(() => [Tag])
  tags: Tag[];

  @JoinTable()
  @ManyToMany(() => User, (users) => users.boards)
  @Field(() => [User])
  users: User[];

  @JoinTable()
  @ManyToMany(() => Keyword, (keywords) => keywords.boards)
  @Field(() => [Keyword])
  keywords: Keyword[];
}
