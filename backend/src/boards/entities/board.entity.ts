import { ObjectType, Field, Int } from "@nestjs/graphql";
import { BoardImage } from "src/board-images/entities/board-image.entity";
import { Category } from "src/categories/entities/category.entity";
import { Keyword } from "src/keywords/entities/keyword.entity";
import { Tag } from "src/tags/entities/tag.entity";
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

  @Column({ default: "" })
  @Field(() => String)
  context: string;

  @Column()
  @Field(() => Int)
  totalMember: number;

  @Column({ default: 1 })
  @Field(() => Int)
  countMember: number;

  @Column({ default: 0 })
  @Field(() => Int)
  countLike: number;

  @Column()
  @Field(() => String)
  description: string;

  @Column()
  @Field(() => String)
  leader: string;

  @Column()
  @Field(() => String)
  leaderNickname: string;

  @Column()
  @Field(() => Int)
  bail: number;

  @Column({ default: false })
  @Field(() => Boolean)
  status: boolean;

  @Column({ default: false })
  @Field(() => Boolean)
  isSuccess: boolean;

  @Column({ default: "" })
  @Field(() => String)
  projectUrl: string;

  @Column()
  @Field(() => String)
  address: string;

  @Column()
  @Field(() => Int)
  frequency: number;

  @Column()
  @Field(() => Date)
  startAt: Date;

  @Column()
  @Field(() => Date)
  endAt: Date;

  @CreateDateColumn()
  @Field(() => Date)
  createdAt: Date;

  @Column({ nullable: true })
  @Field(() => Date)
  closedAt: Date;

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
  @ManyToMany(() => Keyword, (keywords) => keywords.boards)
  @Field(() => [Keyword])
  keywords: Keyword[];

  @JoinTable()
  @ManyToMany(() => Category, (categories) => categories.boards)
  @Field(() => [Category])
  categories: Category[];
}
