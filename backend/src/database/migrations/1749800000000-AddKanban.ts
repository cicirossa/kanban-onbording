import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddKanban1749800000000 implements MigrationInterface {
  name = 'AddKanban1749800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // If the schema was already provisioned out-of-band (e.g. an environment
    // first booted with `synchronize` on), the tables already exist. Skip so
    // `migration:run` records it as applied instead of failing on
    // `relation "..." already exists`. Fresh databases run the full body.
    if (await queryRunner.hasTable('boards')) {
      return;
    }

    await queryRunner.query(
      `CREATE TABLE "boards" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" character varying, "userId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_boards" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_boards_userId" ON "boards" ("userId") `,
    );

    await queryRunner.query(
      `CREATE TABLE "board_columns" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "position" double precision NOT NULL DEFAULT '0', "boardId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_board_columns" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_board_columns_boardId" ON "board_columns" ("boardId") `,
    );

    await queryRunner.query(
      `CREATE TYPE "public"."cards_priority_enum" AS ENUM('low', 'medium', 'high')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" text, "dueDate" TIMESTAMP WITH TIME ZONE, "priority" "public"."cards_priority_enum" NOT NULL DEFAULT 'medium', "position" double precision NOT NULL DEFAULT '0', "columnId" integer NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "PK_cards" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_cards_columnId" ON "cards" ("columnId") `,
    );

    await queryRunner.query(
      `ALTER TABLE "boards" ADD CONSTRAINT "FK_boards_userId" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_columns" ADD CONSTRAINT "FK_board_columns_boardId" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "FK_cards_columnId" FOREIGN KEY ("columnId") REFERENCES "board_columns"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cards" DROP CONSTRAINT "FK_cards_columnId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "board_columns" DROP CONSTRAINT "FK_board_columns_boardId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "boards" DROP CONSTRAINT "FK_boards_userId"`,
    );
    await queryRunner.query(`DROP TABLE "cards"`);
    await queryRunner.query(`DROP TYPE "public"."cards_priority_enum"`);
    await queryRunner.query(`DROP TABLE "board_columns"`);
    await queryRunner.query(`DROP TABLE "boards"`);
  }
}
