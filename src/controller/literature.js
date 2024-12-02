const { literature, year, collection, user } = require("../../models");
const Joi = require("joi");
const { capitalCase, nameFormat } = require("../helper/function");
const cloudinary = require("../helper/cloudinary");
const yearInformation = {
  model: year,
  as: "year",
  attributes: {
    exclude: ["id", "createdAt", "updatedAt"],
  },
};

const userInformation = {
  model: user,
  as: "user",
  attributes: {
    exclude: ["createdAt", "updatedAt"],
  },
};
const litExclude = ["createdAt", "updatedAt"];

exports.addLit = async (req, res) => {
  const scheme = Joi.object({
    title: Joi.string().required(),
    publicationDate: Joi.string().required(),
    pages: Joi.number().required(),
    isbn: Joi.string().max(13).required(),
    author: Joi.string().required(),
  });

  const { pdf:file, ...dataVal } = req.body;
  const { error } = scheme.validate(dataVal);

  if (error) {
    const err = error.details[0].message.split(" ").map((e, i) => {
      if (i == 0) {
        const word = JSON.parse(e);
        return capitalCase(word);
      } else {
        return e;
      }
    });
    return res.status(400).send({
      status: "error",
      message: err.join(" "),
    });
  }

  try {
    const { publicationDate, pdf:file, ...data } = req.body;
    const yearData = publicationDate.split("-")[0].toString();

    let yearLit = await year.findOne({
      where: {
        year: yearData,
      },
    });

    if (!yearLit) {
      yearLit = await year.create({ year: yearData });
    }

    let author1 = data?.author?.split(",").map((d) => {
      return nameFormat(d);
    });

    const thumbnail = await cloudinary?.getThumbnailFromClaudinary(file)
    const litAdded = await literature.create({
      ...data,
      title: capitalCase(data.title),
      idYear: yearLit.id,
      idUser: req.user.id,
      status: "Pending",
      publicationDate,
      thumbnail,
      author: author1.join(", "),
      file
    });

    const litData = await literature.findOne({
      where: {
        id: litAdded.id,
      },
      include: [yearInformation, userInformation],
      attributes: {
        exclude: litExclude,
      },
      raw: true,
      nest: true,
    });
    res.send({
      status: "sucsess",
      data: litData,
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.getLits = async (req, res) => {
  try {
    const status = req.query.status;
    const year = req.query.year;
    const title = req.query.title;

    let filterData = await literature.findAll({
      include: [yearInformation, userInformation],
      attributes: {
        exclude: litExclude,
      },
      raw: true,
      nest: true,
    });

    filterData = await Promise.all(filterData.map(async(data) => {
      const file_url = await cloudinary?.getFileUrlFromClaudinary({
        public_id: data?.file
      })
      return {
        ...data,
        file: file_url ,
      };
    }))

    if (status) {
      filterData = filterData.filter((f) => f.status == `${status}`);
    }

    if (year !== "All" || (year == "" && title)) {
      const filterYear = new RegExp(year, "ig");
      const filterTitle = new RegExp(title, "ig");
      filterData = filterData.filter(
        (f) => f.year.year.match(filterYear) && f.title.match(filterTitle)
      );
    } else if (year !== "All" && title == "") {
      const filter = new RegExp(year, "ig");
      filterData = filterData.filter((f) => f.year.year.match(filter));
    } else if ((title != "" && year == "All") || year == "") {
      const filter = new RegExp(title, "ig");
      filterData = filterData.filter((f) => f.title.match(filter));
    }

    //Arrange Data Pnding-Proove-Cancel:
    const pendingData = filterData.filter((f) => f.status == "Pending");
    const approveData = filterData.filter((f) => f.status == "Approve");
    const rejectData = filterData.filter((f) => f.status == "Rejected");

    const totalData = {
      pending: pendingData.length,
      approve: approveData.length,
      reject: rejectData.length,
    };
    filterData = [...pendingData, ...approveData, ...rejectData];
    res.status(200).send({
      status: "success",
      data: filterData,
      totalData,
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.getLit = async (req, res) => {
  try {
    let lit = await literature.findOne({
      include: yearInformation,
      where: {
        id: req.params.id,
      },
      attributes: {
        exclude: litExclude,
      },
      raw: true,
      nest: true,
    });

    const file_url = await cloudinary?.getFileUrlFromClaudinary({
      public_id:lit?.file
    })

    lit = {
      ...lit,
      file : file_url,
    };
    res.status(200).send({
      status: "success",
      data: lit,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.getMyLits = async (req, res) => {
  try {
    let lit = await literature.findAll({
      include: yearInformation,
      where: {
        idUser: req.user.id,
      },
      attributes: {
        exclude: litExclude,
      },
      raw: true,
      nest: true,
    });

    lit = await Promise.all(lit.map(async(data) => {
      const file_url = await cloudinary?.getFileUrlFromClaudinary({
        public_id: data?.file
      })
      return {
        ...data,
        file: file_url ,
      };
    }))

    res.status(200).send({
      status: "success",
      data: lit,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.getMyCollections = async (req, res) => {
  try {
    let lit = await literature.findAll({
      include: [
        yearInformation,
        {
          model: collection,
          as: "collections",
          where: {
            idUser: req.user.id,
          },
          attributes: {
            exclude: ["id", "createdAt", "updatedAt"],
          },
        },
      ],
      attributes: {
        exclude: litExclude,
      },
      raw: true,
      nest: true,
    });
    lit = await Promise.all(lit.map(async(data) => {
      const file_url = await cloudinary?.getFileUrlFromClaudinary({
        public_id: data?.file
      })
      return {
        ...data,
        file: file_url ,
      };
    }))
    res.status(200).send({
      status: "success",
      data: lit,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.editLit = async (req, res) => {
  try {
    const { id } = req.params;

    const litFinded = await literature.findOne({
      include: yearInformation,
      where: { id },
    });
    let data;
    if (req.body.pdf) {

      const filePDFUrl  = cloudinary.getFileUrlFromClaudinary({
        public_id : req.body.pdf
      })
      data = {
        ...req.body,
        file: filePDFUrl ,
      };

      await cloudinary.deleteImageFromCloudinary(litFinded?.file)
    } else {
      data = req.body;
    }

    await literature.update(data, {
      where: {
        id,
      },
    });

    let litData = await literature.findOne({
      where: {
        id,
      },
      attributes: {
        exclude: litExclude,
      },
    });

    res.status(200).send({
      status: "success",
      data: litData,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.deleteLit = async (req, res) => {
  try {
    const { id } = req.params;
    const litData = await literature.findOne({
      include: yearInformation,
      where: { id },
    });

    if (litData?.file) {
      await cloudinary.deleteImageFromCloudinary(litData?.file)
    }

    await literature.destroy({
      where: {
        id,
      },
    });

    res.status(200).send({
      status: "success",
      data: {
        id,
      },
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

