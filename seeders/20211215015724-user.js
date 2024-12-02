'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add seed commands here.
     *
     * Example:
     * await queryInterface.bulkInsert('People', [{
     *   name: 'John Doe',
     *   isBetaMember: false
     * }], {});
    */

    const existingUser = await queryInterface.rawSelect('users', {
      where: {
        email: 'admin@gmail.com'
      }
    }, ['id']);

    if (existingUser) {
      await queryInterface.bulkDelete('users', {
        email: 'admin@gmail.com'
      });
    }

     await queryInterface.bulkInsert(
       'users',
      [{
          fullName: 'Siska Apriana Rifianti',
          email: 'admin@gmail.com',
          password:
            '$2b$10$.c5VhzZuRINU566qjijggOp.Q/NFjyP51zjwyNyk8DzHXc8V9uL6C', //11aprilnaruto
          phone : '123456789',
          address: 'Jl. Gunung Kawi',
          status: 'admin',
          gender: 'Female',
          image: 'avatar/male6'
      }], {});
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add commands to revert seed here.
     *
     * Example:
     * await queryInterface.bulkDelete('People', null, {});
     */
  }
};
