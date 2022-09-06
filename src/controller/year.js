const { year } = require("../../models");
const Joi = require("joi");

exports.addYear = async (req, res) => {
  const scheme = Joi.object({
    year: Joi.string().required(),
  });
  const { error } = scheme.validate(req.body);

  if (error) {
    return res.status(400).send({
      status: "error",
      message: "Please Fill Yaer",
    });
  }

  try {
    const matchYear = await year.findOne({
      where: {
        year: req.body.year,
      },
    });

    if (matchCountry) {
      return res.status(400).send({
        status: "failed",
        message: "This year has been exist",
      });
    }

    const yearAdded = await year.create(req.body);

    const dataYear = await country.findOne({
      where: { id: yearAdded.id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(201).send({
      status: "success",
      data: dataYear,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.getYears = async (req, res) => {
  try {
    const yearsData = await year.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      status: "success",
      data: yearsData,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.getYear = async (req, res) => {
  try {
    const yearData = await year.findOne({
      where: {
        id: req.params.id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      status: "success",
      data: yearData,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.editYear = async (req, res) => {
  try {
    const { id } = req.params;
    await year.update(req.body, {
      where: {
        id,
      },
    });

    const yearData = await year.findOne({
      where: {
        id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send({
      status: "success",
      data: yearData,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.deleteYear = async (req, res) => {
  try {
    const { id } = req.params;
    await year.destroy({
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
