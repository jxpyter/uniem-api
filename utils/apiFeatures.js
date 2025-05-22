class APINoteFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["sort", "limit", "page", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // MongoDB için uygun formatta filtreleme yap
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // 📌 Belirli alanlar için filtreleme
    if (queryObj.university) {
      this.query = this.query.where("university").equals(queryObj.university);
    }
    if (queryObj.faculty) {
      this.query = this.query.where("faculty").equals(queryObj.faculty);
    }
    if (queryObj.department) {
      this.query = this.query.where("department").equals(queryObj.department);
    }
    if (queryObj.class) {
      this.query = this.query.where("class").equals(queryObj.class);
    }
    if (queryObj.course) {
      this.query = this.query.where("course").equals(queryObj.course);
    }
    return this;
  }
  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      this.query = this.query.find({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { description: { $regex: searchTerm, $options: "i" } },
          { tags: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }
    return this;
  }
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Varsayılan olarak en yeni
    }
    return this;
  }
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
class APICommunityFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }
  // Filtreleme (kategori, etiket, tür, vb.)
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["sort", "limit", "page", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Kategoriler, etiketler ve türlere göre filtreleme
    if (queryObj.category) {
      this.query = this.query
        .where("category")
        .in(queryObj.category.split(","));
    }
    if (queryObj.tags) {
      this.query = this.query.where("tags").in(queryObj.tags.split(","));
    }
    if (queryObj.type) {
      this.query = this.query.where("type").equals(queryObj.type);
    }

    return this;
  }
  // Arama (kullanıcı, başlık, içerik, vb.)
  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      this.query = this.query.find({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { content: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }
    return this;
  }
  // Sıralama (en yeni, en eski, vb.)
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Varsayılan olarak en yeni
    }
    return this;
  }
  // Alan seçimi
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }
  // Sayfalama
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
class APIBlogFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // 🔍 **Arama (başlık, içerik)**
  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search;
      this.query = this.query.find({
        $or: [
          { title: { $regex: searchTerm, $options: "i" } },
          { content: { $regex: searchTerm, $options: "i" } },
        ],
      });
    }
    return this;
  }

  // 🎯 **Filtreleme (premium, yazar, okuma süresi)**
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["sort", "limit", "page", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // **Premium filtreleme**
    if (queryObj.premium) {
      this.query = this.query
        .where("premium")
        .equals(queryObj.premium === "true");
    }

    // **Yazar filtreleme**
    if (queryObj.author) {
      this.query = this.query.where("author").equals(queryObj.author);
    }

    // **Okuma süresi (gte, lte)**
    if (queryObj.readTime) {
      const readTimeFilters = {};
      if (queryObj.readTime.gte)
        readTimeFilters.$gte = Number(queryObj.readTime.gte);
      if (queryObj.readTime.lte)
        readTimeFilters.$lte = Number(queryObj.readTime.lte);
      this.query = this.query
        .where("readTime")
        .gte(readTimeFilters.$gte)
        .lte(readTimeFilters.$lte);
    }

    return this;
  }

  // 🔼 **Sıralama (en yeni, en çok beğenilen, en uzun yazı)**
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt"); // Varsayılan olarak en yeni
    }
    return this;
  }

  // 🎯 **Belirli Alanları Getirme**
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }
    return this;
  }

  // 📌 **Sayfalama**
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = { APINoteFeatures, APICommunityFeatures, APIBlogFeatures };
