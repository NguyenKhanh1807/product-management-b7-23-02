const Product = require("../../models/product.model");

const filterStatusHelper = require("../../helpers/filterStatus");

const searchHelper = require("../../helpers/search");

const paginationHelper = require("../../helpers/pagination");

const systemConfig = require("../../config/system");

try {
// [GET] /admin/products
module.exports.index = async (req, res) => {
  
  
  const filterStatus = filterStatusHelper(req.query);
  let objectSearch = searchHelper(req.query);

  let find = {
    deleted: false,

  }

  if(req.query.status){
    find.status = req.query.status;
  }

  if(req.query.keyword) {
    find.title = objectSearch.regex;
  }


  // Pagination
  let initPagination = {
    currentPage: 1,
    limitItem: 4
  };
  const countProducts = await Product.count(find);
  const objectPagination = paginationHelper(initPagination, req.query, countProducts);
  // End Pagination

  // Sort
  let sort = {};

  if(req.query.sortKey && req.query.sortValue) {
    sort[req.query.sortKey] = req.query.sortValue;
  } else {
    sort.position = "desc";
  }
  // End Sort


  const products = await Product.find(find)
    .sort(sort)
    .limit(objectPagination.limitItem)
    .skip(objectPagination.skip);
    

    if(products.length > 0 || countProducts == 0) {
      res.render("admin/pages/products/index", {
        pageTitle: "Danh sách sản phẩm",
        products: products,
        filterStatus: filterStatus,
        keyword: objectSearch.keyword,
        pagination: objectPagination
      });
    } else {
      let stringQuery = "";
  
      for(const key in req.query) {
        if(key != "page") {
          stringQuery += `&${key}=${req.query[key]}`;
        }
      }
  
      const href = `${req.baseUrl}?page=1${stringQuery}`;
  
      res.setHeader(href);
    }
  res.render("admin/pages/products/index", {
    pageTitle: "Danh sách sản phẩm",
    products: products,
    filterStatus: filterStatus,
    keyword: objectSearch.keyword,
    pagination: objectPagination
  });
};

// [PATCH] /admin/products/change-status/:status/:id
module.exports.changeStatus = async (req, res) => {

  const status = req.params.status;
  const id = req.params.id;

  await Product.updateOne({ _id: id }, { status: status });

  req.flash("success", "Cập nhật trạng thái thành công!");

  res.redirect("back");
};

// [PATCH] /admin/products/change-multi
module.exports.changeMulti = async (req, res) => {

  const type = req.body.type;
  const ids = req.body.ids.split(", ");

  switch (type) {
    case "active":
    case "inactive":
      await Product.updateMany({ _id: {$in: ids} }, { status: type });
      req.flash("success", `Cập nhật trạng thái thành công ${ids.length} sản phẩm!`);
      break;
    case "delete-all":
      await Product.updateMany({ _id: {$in: ids} }, {
        deleted: true,
        deletedAt: new Date()
      });
      req.flash("success", `Xóa thành công ${ids.length} sản phẩm!`);
      break;
    case "change-position":
      for (const item of ids) {
        const [id, position] = item.split("-");
        await Product.updateOne({ _id: id }, { position: position });
      }
      req.flash("success", `Thay đổi vị trí thành công của ${ids.length} sản phẩm!`);
      break;
    default:
      break;
  }

  res.redirect("back");
};

// [DELETE] /admin/products/delete/:id
module.exports.deleteItem = async (req, res) => {
  const id = req.params.id;

  // await Product.deleteOne({ _id: id }); xóa vĩnh viễn một sản phẩm (xóa trong database)
  await Product.updateOne({ _id: id }, 
    {
      deleted: true,
      deletedAt: new Date()
    }
  );

  req.flash("success", `Xóa thành công sản phẩm!`);

  res.redirect("back");
};

// [GET] /admin/products/create
module.exports.create = async (req, res) => {
  res.render("admin/pages/products/create", {
    pageTitle: "Tạo mới sản phẩm"
  });
};

// [POST] /admin/products/create
module.exports.createPost = async (req, res) => { 
  

  req.body.price = parseInt(req.body.price);
  req.body.discountPercentage = parseInt(req.body.discountPercentage);
  req.body.stock = parseInt(req.body.stock);

  if(req.body.position === "") {
    const countProducts = await Product.countDocuments();
    req.body.position = countProducts + 1;
  } else {
    req.body.position = parseInt(req.body.position);
  }

  // if(req.file && req.file.filename) {
  //  req.body.thumbnail = `/uploads/${req.file.filename}`;
  // }

  const product = new Product(req.body);
  await product.save();

  res.setHeader(`/${systemConfig.prefixAdmin}/products`);
};

// [GET] /admin/products/edit/:id
module.exports.edit = async (req, res) => {
  try {
  const id = req.params.id;

  const product = await Product.findOne({
    _id: id,
    deleted: false
  });

  console.log(product);

  res.render("admin/pages/products/edit", {
    pageTitle: "Chỉnh sửa sản phẩm",
    product: product
  });
  } catch (error) {
    res.setHeader(`/${systemConfig.prefixAdmin}/products`);
  }
};

// [PATCH] /admin/products/edit/:id
module.exports.editPatch = async (req, res) => {
  const id = req.params.id;

  req.body.price = parseInt(req.body.price);
  req.body.discountPercentage = parseInt(req.body.discountPercentage);
  req.body.stock = parseInt(req.body.stock);

  req.body.position = parseInt(req.body.position);

  if(req.file && req.file.filename) {
    req.body.thumbnail = `/uploads/${req.file.filename}`;
  }

  await Product.updateOne({ _id: id }, req.body);

  req.flash("success", "Cập nhật sản phẩm thành công!");

  res.redirect("back");
};

// [GET] /admin/products/detail/:id
module.exports.detail = async (req, res) => {
  try {
    const id = req.params.id;

    const product = await Product.findOne({
      _id: id,
      deleted: false
    });

    res.render("admin/pages/products/detail", {
      pageTitle: "Chi tiết sản phẩm",
      product: product
    });
  } catch (error) {
    res.redirect(`/${systemConfig.prefixAdmin}/products`);
  }
};

} catch (error) {
  console.log(error);
}


