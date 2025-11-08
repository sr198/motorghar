-- CreateTable
CREATE TABLE "domain_outbox" (
    "id" UUID NOT NULL,
    "aggregate_type" VARCHAR(100) NOT NULL,
    "aggregate_id" VARCHAR(100) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload_jsonb" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processed_at" TIMESTAMP(6),

    CONSTRAINT "domain_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_catalog" (
    "id" UUID NOT NULL,
    "make" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "year" INTEGER NOT NULL,
    "trim" VARCHAR(100),
    "fuel_type" VARCHAR(50),
    "specs_jsonb" JSONB NOT NULL DEFAULT '{}',
    "media" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "vehicle_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_variant" (
    "id" UUID NOT NULL,
    "catalog_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "specs_jsonb" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehicle_variant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_vehicle" (
    "id" UUID NOT NULL,
    "user_id" VARCHAR(100) NOT NULL,
    "catalog_id" UUID NOT NULL,
    "nickname" VARCHAR(200),
    "odo_km" INTEGER,
    "fields_jsonb" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    "deleted_at" TIMESTAMP(6),

    CONSTRAINT "owner_vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_vehicle_note" (
    "id" UUID NOT NULL,
    "owner_vehicle_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "owner_vehicle_note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_vehicle_media" (
    "id" UUID NOT NULL,
    "owner_vehicle_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "kind" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_vehicle_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_vehicle_review" (
    "id" UUID NOT NULL,
    "owner_vehicle_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "owner_vehicle_review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_center" (
    "id" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "phone" VARCHAR(50),
    "email" VARCHAR(200),
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "service_center_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_appointment" (
    "id" UUID NOT NULL,
    "owner_vehicle_id" UUID NOT NULL,
    "center_id" UUID NOT NULL,
    "slot_ts" TIMESTAMP(6) NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "service_appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_post" (
    "id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "body_md" TEXT NOT NULL,
    "vehicle_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" VARCHAR(50) NOT NULL,
    "publish_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "content_post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_outbox_processed" ON "domain_outbox"("processed_at");

-- CreateIndex
CREATE INDEX "vehicle_catalog_make_model_year_idx" ON "vehicle_catalog"("make", "model", "year");

-- CreateIndex
CREATE INDEX "vehicle_catalog_deleted_at_idx" ON "vehicle_catalog"("deleted_at");

-- CreateIndex
CREATE INDEX "vehicle_variant_catalog_id_idx" ON "vehicle_variant"("catalog_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_user_id_idx" ON "owner_vehicle"("user_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_catalog_id_idx" ON "owner_vehicle"("catalog_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_deleted_at_idx" ON "owner_vehicle"("deleted_at");

-- CreateIndex
CREATE INDEX "owner_vehicle_note_owner_vehicle_id_idx" ON "owner_vehicle_note"("owner_vehicle_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_media_owner_vehicle_id_idx" ON "owner_vehicle_media"("owner_vehicle_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_review_owner_vehicle_id_idx" ON "owner_vehicle_review"("owner_vehicle_id");

-- CreateIndex
CREATE INDEX "owner_vehicle_review_approved_idx" ON "owner_vehicle_review"("approved");

-- CreateIndex
CREATE INDEX "service_center_latitude_longitude_idx" ON "service_center"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "service_appointment_owner_vehicle_id_idx" ON "service_appointment"("owner_vehicle_id");

-- CreateIndex
CREATE INDEX "service_appointment_center_id_idx" ON "service_appointment"("center_id");

-- CreateIndex
CREATE INDEX "service_appointment_slot_ts_idx" ON "service_appointment"("slot_ts");

-- CreateIndex
CREATE INDEX "service_appointment_status_idx" ON "service_appointment"("status");

-- CreateIndex
CREATE INDEX "content_post_type_idx" ON "content_post"("type");

-- CreateIndex
CREATE INDEX "content_post_status_idx" ON "content_post"("status");

-- CreateIndex
CREATE INDEX "content_post_publish_at_idx" ON "content_post"("publish_at");

-- AddForeignKey
ALTER TABLE "vehicle_variant" ADD CONSTRAINT "vehicle_variant_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vehicle_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_vehicle" ADD CONSTRAINT "owner_vehicle_catalog_id_fkey" FOREIGN KEY ("catalog_id") REFERENCES "vehicle_catalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_vehicle_note" ADD CONSTRAINT "owner_vehicle_note_owner_vehicle_id_fkey" FOREIGN KEY ("owner_vehicle_id") REFERENCES "owner_vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_vehicle_media" ADD CONSTRAINT "owner_vehicle_media_owner_vehicle_id_fkey" FOREIGN KEY ("owner_vehicle_id") REFERENCES "owner_vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_vehicle_review" ADD CONSTRAINT "owner_vehicle_review_owner_vehicle_id_fkey" FOREIGN KEY ("owner_vehicle_id") REFERENCES "owner_vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointment" ADD CONSTRAINT "service_appointment_owner_vehicle_id_fkey" FOREIGN KEY ("owner_vehicle_id") REFERENCES "owner_vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_appointment" ADD CONSTRAINT "service_appointment_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "service_center"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
