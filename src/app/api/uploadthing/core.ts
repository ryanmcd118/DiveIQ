import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Validate environment variables (SDK v7+ expects UPLOADTHING_TOKEN)
if (process.env.NODE_ENV === "development") {
  if (!process.env.UPLOADTHING_TOKEN) {
    console.error(
      "[UploadThing] Missing UPLOADTHING_TOKEN. Copy it from UploadThing Dashboard → API Keys → Quick Copy."
    );
  }
}

export const ourFileRouter = {
  avatarUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  }).onUploadComplete(async ({ file }) => {
    return { url: file.url };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;

// import { createUploadthing, type FileRouter } from "uploadthing/next";

// const f = createUploadthing();

// // Validate environment variables
// if (process.env.NODE_ENV === 'development') {
//   if (!process.env.UPLOADTHING_SECRET) {
//     console.error('[UploadThing] Missing UPLOADTHING_SECRET environment variable');
//   }
//   if (!process.env.UPLOADTHING_APP_ID) {
//     console.warn('[UploadThing] UPLOADTHING_APP_ID not set (optional but recommended)');
//   }
// }

// export const ourFileRouter = {
//   avatarUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
//     .onUploadComplete(async ({ metadata, file }) => {
//       // Return the file URL
//       return { url: file.url };
//     }),
// } satisfies FileRouter;

// export type OurFileRouter = typeof ourFileRouter;
