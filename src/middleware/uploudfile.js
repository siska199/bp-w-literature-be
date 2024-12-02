const {uploadFileToCloudinary}  = require("../helper/cloudinary");
const multer = require("multer");


exports.uploudFile = (fileRules) => {
  const storage = multer.memoryStorage();

  const upload = multer({
    storage,
    fileFilter: (
      req,
      file,
      cb
    ) => {
      const { fieldname } = file;
      const rules = fileRules[fieldname];

      if (!rules)
        return cb(
          new Error(`No validation rules defined for field: ${fieldname}`)
        );

      const { types } = rules;
      const isAllowedType = types
        .map((type) => type.toLowerCase())
        .filter((type) => {
          return file.mimetype.toLowerCase()?.includes(type);
        })[0];

      if (!isAllowedType)
        return cb(
          new Error(
            `Invalid file type for ${fieldname}. Allowed types: ${types.join(
              ", "
            )}`
          )
        );
      cb(null, true);
    },
  });
  const listFieldFile = Object.entries(fileRules).map(([key, value]) => ({
    name: key,
    maxCount: value?.maxCount,
  }));

  return async (req, res, next) => {
    upload.fields(listFieldFile)(req, res, async (err) => {
      if (err) next(new Error(err.message, 400));
      await uploadFilesToClaudinary(req, next, fileRules);
    });
  };
};

const uploadFilesToClaudinary = async (
  req,
  next,
  fileRules
) => {
  if (!req.files) return next(new Error(`No files were uploaded`, 400));

  for (const field in req.files) {
    const fileArray = req?.files?.[field];
    if (!Array.isArray(fileArray)) return null;

    await Promise.all(
      fileArray?.map(async (file, i) => {
        const fileSize = file.buffer.length;
        const rules = fileRules[field];

        if (fileSize > (rules?.size || 5) * 1024 * 1024) {
          next(
            new CustomError(
              `File size exceeds the limit for ${field}. Maximum size is ${rules.size} MB.`,
              400
            )
          );
        }

        const result = await uploadFileToCloudinary(
          file,
          fileRules[`${field}`].folder
        );

        if (fileArray?.length > 1) {

          req.body[`${field}`] = (
            Array.isArray(req.body[`${field}`])
              ? req.body[`${field}`].concat(result?.public_id)
              : [req.body[`${field}`], result?.public_id]
          )?.filter((data) => data);
        } else {
          req.body[`${field}`] = result?.public_id;
        }
      })
    );
  }
  next();
};

