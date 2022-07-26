-- CreateEnum
CREATE TYPE "reaction" AS ENUM ('like', 'dislike');

-- CreateTable
CREATE TABLE "Post" (
    "id" VARCHAR(32) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "body" TEXT NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" VARCHAR(32) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_hashtags" (
    "post_id" VARCHAR(32) NOT NULL,
    "hashtag_id" VARCHAR(32) NOT NULL,

    CONSTRAINT "post_hashtags_pkey" PRIMARY KEY ("post_id","hashtag_id")
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" VARCHAR(32) NOT NULL,
    "post_id" VARCHAR(32) NOT NULL,
    "body" TEXT NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parent_comment_id" VARCHAR(32),

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostReaction" (
    "user_id" VARCHAR(32) NOT NULL,
    "post_id" VARCHAR(32) NOT NULL,
    "reaction" "reaction" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostReaction_pkey" PRIMARY KEY ("user_id","post_id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "user_id" VARCHAR(32) NOT NULL,
    "comment_id" VARCHAR(32) NOT NULL,
    "reaction" "reaction" NOT NULL,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("user_id","comment_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_name_key" ON "Hashtag"("name");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_hashtags" ADD CONSTRAINT "post_hashtags_hashtag_id_fkey" FOREIGN KEY ("hashtag_id") REFERENCES "Hashtag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostReaction" ADD CONSTRAINT "PostReaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommentReaction" ADD CONSTRAINT "CommentReaction_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "Comment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
