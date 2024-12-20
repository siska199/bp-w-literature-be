const { chat, user } = require("../../models");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const cloudinary = require("../helper/cloudinary");

//Save user that online

const connectedUser = {};

const socketIo = (io) => {
  io.use((socket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      next();
    } else {
      next(new Error("Not Authorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.handshake.query.id;
    connectedUser[userId] = socket.id;

    //1. Making function to send data contact admin
    socket.on("load admin contact", async () => {
      try {
        let adminContact = await user.findAll({
          where: {
            status: "admin",
          },
          include: [
            {
              model: chat,
              as: "recipientMessage",
              attributes: {
                exclude: ["updatedAt", "idRecipient", "idSender"],
              },
            },
            {
              model: chat,
              as: "senderMessage",
              attributes: {
                exclude: ["updatedAt", "idRecipient", "idSender"],
              },
            },
          ],
          attributes: {
            exclude: ["updatedAt", "password"],
          },
          // raw: true,
          // nest: true,
        });

        adminContact = await Promise.all(
          JSON.parse(JSON.stringify(adminContact)).map((data) =>{
            
            const image_url = cloudinary?.getFileUrlFromClaudinary({
              publicId : data.image
            })
            return  ({
              ...data,
              image:image_url ,
            })
          })
        ) ;
        socket.emit("admin contact", adminContact);
      } catch (error) {
        console.log(error);
      }
    });

    //2. Load customer contact
    socket.on("load user contact", async () => {
      try {
        let customerContacts = await user.findAll({
          where: {
            status: "user",
          },
          include: [
            {
              model: chat,
              as: "recipientMessage",
              attributes: {
                exclude: ["updatedAt", "idRecipient", "idSender"],
              },
            },
            {
              model: chat,
              as: "senderMessage",
              attributes: {
                exclude: ["updatedAt", "idRecipient", "idSender"],
              },
            },
          ],
          attibutes: {
            exclude: ["updatedAt", "password"],
          },
          // raw: true,
          // nest: true,
        });

        customerContacts = await Promise.all(
          JSON.parse(JSON.stringify(customerContacts)).map(
            async(data) => {
              
              const image_url = cloudinary?.getFileUrlFromClaudinary({
                publicId : data.image
              })
              return ({
                ...data,
                image: image_url,
              })
            }
          )
        );
        socket.emit("user contact", customerContacts);
      } catch (error) {
        new Error(error);
      }
    });
    //3. Load Message
    socket.on("load messages", async (payload) => {
      try {
        const token = socket.handshake.auth.token;
        const tokenKey = process.env.TOKEN_USER;
        const verified = jwt.verify(token, tokenKey);

        const idRecipient = payload;
        const idSender = verified.id;

        let data = await chat.findAll({
          where: {
            idSender: {
              [Op.or]: [idRecipient, idSender],
            },
            idRecipient: {
              [Op.or]: [idRecipient, idSender],
            },
          },
          include: [
            {
              model: user,
              as: "recipient",
              attributes: {
                exclude: ["createdAt", "updatedAt", "password"],
              },
            },
            {
              model: user,
              as: "sender",
              attributes: {
                exclude: ["createdAt", "updatedAt", "password"],
              },
            },
          ],
          order: [["createdAt", "ASC"]],
          attibutes: {
            exclude: ["updatedAt", "idRecipient", "idSender"],
          },
          raw: true,
          nest: true,
        });
        data = await Promise.all( data.map(async(data) =>{
          const recipient_image_url = await cloudinary.getFileUrlFromClaudinary({
            publicId:data.recipient.image
          })
          const sender_image_url = await cloudinary.getFileUrlFromClaudinary({
            publicId:data.sender.image
          })
          return  ({
            ...data,
            recipient: {
              ...data.recipient,
              image: recipient_image_url,
            },
            sender: {
              ...data.sender,
              image: sender_image_url,
            },
          })
        }))
        
       ;
        socket.emit("messages", data);
      } catch (error) {
        new Error(error);
      }
    });

    //4. Send Message
    socket.on("send message", async (payload) => {
      try {
        const token = socket.handshake.auth.token;
        const tokenKey = process.env.TOKEN_USER;
        const verified = jwt.verify(token, tokenKey);

        const idSender = verified.id;

        const { message, idRecipient } = payload;
        await chat.create({
          message,
          idRecipient,
          idSender,
        });
        io.to(socket.id)
          .to(connectedUser[idRecipient])
          .emit("new message", idRecipient);
      } catch (error) {
        new Error(error);
      }
    });

    //5. Disconnect:
    socket.on("disconnect", () => {
      // console.log("user connected", socket.id);
      delete connectedUser[userId];
    });
  });
};

module.exports = socketIo;
