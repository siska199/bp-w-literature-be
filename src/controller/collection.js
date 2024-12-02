const { collection } = require("../../models");

exports.addCollection = async (req, res) => {
  try {
    const collAdded = await collection.create({
      ...req.body,
      idUser: req.user.id,
    });

    const dataColl = await collection.findOne({
      where: { id: collAdded.id },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });

    res.status(200).send({
      status: "success",
      data: dataColl,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};
exports.getCollection = async (req, res) => {
  //by id literature
  try {
    const coll = await collection.findOne({
      where: {
        idUser: req.user.id,
        idLiterature: req.params.idLiterature,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    res.status(200).send({
      status: "success",
      data: coll,
    });
  } catch (error) {
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};
exports.deleteColl = async (req, res) => {
  try {
    const { id } = req.params;
    await collection.destroy({
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
