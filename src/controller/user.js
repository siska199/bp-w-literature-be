const { user } = require("../../models");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const { capitalCase } = require("../helper/function");
const cloudinary = require("../helper/cloudinary");

exports.register = async (req, res) => {
  const scheme = Joi.object({
    fullName: Joi.string().min(2).required(),
    email: Joi.string().email().min(7).required(),
    password: Joi.string().min(5).required(),
    phone: Joi.number().integer().required(),
    address: Joi.string().required(),
    gender: Joi.string().required(),
  });
  const { error } = scheme.validate(req.body);
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
    const matchEmail = await user.findOne({
      where: {
        email: req.body.email,
      },
    });
    if (matchEmail) {
      return res.status(400).send({
        status: "failed",
        message: "This email has been registered",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    let profilePath;
    const name = Math.floor(Math.random() * 8); //0 until 7
    if (req.body.gender == "Female") {
      profilePath = `avatar/female${name}.png`;
    } else {
      profilePath = `avatar/male${name}.png`;
    }

    const userCreated = await user.create({
      ...req.body,
      password: hashedPassword,
      image: profilePath,
      status: "user",
    });

    const token = jwt.sign({ id: userCreated.id }, process.env.TOKEN_USER);

    res.status(201).send({
      status: "success",
      data: {
        email: userCreated.email,
        token,
      },
    });
  } catch (error) {
    if (req.file) {
      fs.unlinkSync("uploud/profile/" + req.file.filename);
    }
    res.status(500).send({
      status: "faild",
      message: `${error}`,
    });
  }
};

exports.login = async (req, res) => {
  const scheme = Joi.object({
    email: Joi.string().email().min(2).required(),
    password: Joi.string().min(1).required(),
  });
  const { error } = scheme.validate(req.body);
  if (error) {
    const err = error.details[0].message.split(" ").map((e, i) => {
      if (i == 0) {
        const word = JSON.parse(e);
        return word[0].toUpperCase() + word.substring(1);
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
    const userFinded = await user.findOne({
      where: {
        email: req.body.email,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
    });
    if (userFinded == null) {
      res.status(404).send({
        status: "failed",
        message: "Email or password is wrong",
      });
    } else {
      const isPasswordValid = await bcrypt.compare(
        req.body.password,
        userFinded.password
      );

      if (!isPasswordValid) {
        return res.status(404).send({
          status: "failed",
          message: "Email and password dont match",
        });
      }

      const token = jwt.sign({ id: userFinded.id }, process.env.TOKEN_USER);
      res.status(200).send({
        status: "success",
        message: "Login success",
        data: {
          email: userFinded.email,
          token,
          fullName: userFinded.fullName,
          gender: userFinded.gender,
          address: userFinded.address,
          phone: userFinded.phone,
          status: userFinded.status,
          image: cloudinary.url(userFinded.image, { secure: true }),
        },
      });
    }
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    let dataUser = await user.findAll({
      attributes: {
        exclude: ["createdAt", "updatedAt", "password"],
      },
      raw: true,
      nest: true,
    });
    dataUser = dataUser.map((data) => {
      return {
        ...data,
        image: cloudinary.url(data.image, { secure: true }),
      };
    });
    res.status(200).send({
      status: "success",
      data: dataUser,
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    let dataUser = await user.findOne({
      where: {
        id: req.user.id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt"],
      },
      raw: true,
      nest: true,
    });
    dataUser = {
      ...dataUser,
      image: cloudinary.url(dataUser.image, { secure: true }),
    };

    res.status(200).send({
      status: "success",
      data: dataUser,
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.updateUser = async (req, res) => {
  try {
    let data;
    if (req.file) {
      const dataUser = await user.findOne({
        where: {
          id: req.user.id,
        },
      });

      if (!dataUser.image.match(/avatar\//g)) {
        await cloudinary.destroy(dataUser.image, (res) => {});
      }

      const image = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile",
        use_filename: true,
        unique_name: false,
      });
      data = {
        ...req.body,
        image: image.profile_id,
      };
    } else if (req.body.fullName) {
      data = {
        ...req.body,
      };
    }

    await user.update(data, {
      where: {
        id: req.user.id,
      },
    });

    res.status(200).send({
      status: "success",
      message: "Success update user data",
      data,
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const userData = await user.findOne({
      where: { id },
    });

    if (!userData) {
      res.status(401).send({
        status: "failed",
        message: "this user has been removed",
      });
    }

    if (!userData.image.match(/avatar\//g)) {
      await cloudinary.destroy(userData.image, (res) => {});
    }

    await user.destroy({
      where: { id },
    });

    res.status(200).send({
      status: "success",
      data: {
        id,
      },
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};

exports.checkAuth = async (req, res) => {
  try {
    const id = req.user.id;
    const dataUser = await user.findOne({
      where: {
        id,
      },
      attributes: {
        exclude: ["createdAt", "updatedAt", "password"],
      },
    });
    if (!dataUser) {
      return res.status(404).send({
        status: "failed",
      });
    }

    res.status(200).send({
      status: "success",
      data: {
        id: dataUser.id,
        email: dataUser.email,
        fullName: dataUser.fullName,
        gender: dataUser.gender,
        address: dataUser.address,
        phone: dataUser.phone,
        status: dataUser.status,
        image: cloudinary.url(dataUser.image, { secure: true }),
      },
    });
  } catch (error) {
    res.status(500).send({
      status: "failed",
      message: `${error}`,
    });
  }
};
