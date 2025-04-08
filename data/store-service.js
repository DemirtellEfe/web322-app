const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
    query: { raw: true },
  },
);

const Item = sequelize.define("Item", {
  title: Sequelize.STRING,
  body: Sequelize.TEXT,
  postDate: Sequelize.DATE,
  featureImage: Sequelize.STRING,
  published: Sequelize.BOOLEAN,
  price: Sequelize.DOUBLE,
});

const Category = sequelize.define("Category", {
  category: Sequelize.STRING,
});

Item.belongsTo(Category, { foreignKey: "category" });

module.exports = {
  initialize: () => sequelize.sync(),
  getAllItems: () => Item.findAll(),
  getItemsByCategory: (catId) => Item.findAll({ where: { category: catId } }),
  getItemsByMinDate: (minDateStr) => {
    const { gte } = Sequelize.Op;
    return Item.findAll({
      where: { postDate: { [gte]: new Date(minDateStr) } },
    });
  },
  getItemById: (id) => {
    return Item.findByPk(id).then((data) => {
      if (data) return data;
      else return Promise.reject("no results returned");
    });
  },
  addItem: (data) => {
    data.published = data.published ? true : false;
    for (let prop in data) {
      if (data[prop] === "") data[prop] = null;
    }
    data.postDate = new Date();
    return Item.create(data);
  },
  getPublishedItems: () => Item.findAll({ where: { published: true } }),
  getPublishedItemsByCategory: (catId) =>
    Item.findAll({ where: { published: true, category: catId } }),
  getCategories: () => Category.findAll(),
  addCategory: (data) => {
    for (let prop in data) {
      if (data[prop] === "") data[prop] = null;
    }
    return Category.create(data);
  },
  deleteCategoryById: (id) => {
    return Category.destroy({ where: { id } }).then((rowsDeleted) => {
      if (rowsDeleted > 0) return Promise.resolve();
      else return Promise.reject("No category deleted");
    });
  },
  deletePostById: (id) => {
    return Item.destroy({ where: { id } }).then((rowsDeleted) => {
      if (rowsDeleted > 0) return Promise.resolve();
      else return Promise.reject("No item deleted");
    });
  },
};
