const cloudinary = require('cloudinary').v2


cloudinary.config({
  cloud_name : process.env.CLOUDINARY_NAME,
  api_key : process.env.CLOUDINARY_API_KEY,
  api_secret : process.env.CLOUDINARY_API_SECRET
});

const baseFolder = "literature";

exports.uploadFileToCloudinary = async (
  file,
  folder
)=>{
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: "auto", folder: `${baseFolder}/${folder}` },
        (error, result) => {
          if (error) {
            reject(new Error(error?.message));
          } else {
            resolve(result);
          }
        }
      )
      .end(file.buffer);
  });
};

exports.getFileUrlFromClaudinary = async (params) => {
  if (!params?.publicId) return;

  const { publicId, options } = params;
  const result = cloudinary.url(publicId, {
    secure: true,
    ...options,
  });
  return result;
};

exports.deleteImageFromCloudinary = async (
  publicId
)=> {
  try {
    if (!publicId) return;

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result !== "ok") {
      throw new Error(
        `Failed to delete image from Cloudinary: ${result.result}`
      );
    }
  } catch (error) {
    throw new Error(
      `Error deleting image from Cloudinary: ${error.message}`
    );
  }
};


exports.getThumbnailFromClaudinary = async(publicID)=>{
  let thumbnail = await cloudinary
  .image(publicID, { page: 1, format: "png" })
  .split(" ")[1];
  thumbnail = thumbnail.split("=")[1];
  return thumbnail?.replaceAll("'", "")
}