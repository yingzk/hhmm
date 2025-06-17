import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local")
}

// 全局缓存连接
let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose
    })
  }

  try {
    cached.conn = await cached.promise
  } catch (e) {
    cached.promise = null
    throw e
  }

  return cached.conn
}

// 定义数据模型
const geoAbbreviationSchema = new mongoose.Schema(
  {
    abbreviation: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    copied_count: {
      type: Number,
      default: 0,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
)

// 创建索引
geoAbbreviationSchema.index({ abbreviation: "text", full_name: "text" })

export interface GeoAbbreviation {
  _id: string
  abbreviation: string
  full_name: string
  created_at: Date
  updated_at: Date
}

// 避免重复编译模型
const GeoAbbreviationModel = mongoose.models.GeoAbbreviation || mongoose.model("GeoAbbreviation", geoAbbreviationSchema)

export class GeoAbbreviationDB {
  // 确保数据库连接
  private static async ensureConnection() {
    await connectDB()
  }

  // 初始化示例数据
  static async initSampleData() {
    await this.ensureConnection()

    const count = await GeoAbbreviationModel.countDocuments()
    if (count === 0) {
      const sampleData = [
        { abbreviation: "GSDJ", full_name: "公示地价" },
        { abbreviation: "JZDJ", full_name: "基准地价" },
        { abbreviation: "TDLY", full_name: "土地利用" },
        { abbreviation: "GHGH", full_name: "规划规划" },
        { abbreviation: "ZRZY", full_name: "自然资源" },
        { abbreviation: "GTPO", full_name: "国土空间规划" },
        { abbreviation: "TDQX", full_name: "土地权属" },
        { abbreviation: "JBNT", full_name: "基本农田" },
        { abbreviation: "STTD", full_name: "生态土地" },
        { abbreviation: "CJYD", full_name: "城建用地" },
      ]

      await GeoAbbreviationModel.insertMany(sampleData)
    }
  }

  // 根据简写搜索
  static async search(abbreviation: string): Promise<GeoAbbreviation[]> {
    await this.ensureConnection()

    const results = await GeoAbbreviationModel.find({
      $or: [
        { abbreviation: { $regex: abbreviation.toUpperCase(), $options: "i" } },
        { full_name: { $regex: abbreviation, $options: "i" } },
      ],
    })
      .sort({ created_at: -1 })
      .lean()

    return results.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }))
  }

  // 获取所有记录
  static async getAll(): Promise<GeoAbbreviation[]> {
    await this.ensureConnection()

    const results = await GeoAbbreviationModel.find({}).sort({ created_at: -1 }).lean()

    return results.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }))
  }

  // 添加新记录
  static async add(abbreviation: string, fullName: string): Promise<GeoAbbreviation> {
    await this.ensureConnection()

    const newDoc = new GeoAbbreviationModel({
      abbreviation: abbreviation.toUpperCase(),
      full_name: fullName,
    })

    const saved = await newDoc.save()
    return {
      ...saved.toObject(),
      _id: saved._id.toString(),
    }
  }

  // 更新记录
  static async update(id: string, abbreviation: string, fullName: string): Promise<GeoAbbreviation | null> {
    await this.ensureConnection()

    const updated = await GeoAbbreviationModel.findByIdAndUpdate(
      id,
      {
        abbreviation: abbreviation.toUpperCase(),
        full_name: fullName,
        updated_at: new Date(),
      },
      { new: true },
    ).lean()

    if (!updated) return null

    return {
      ...updated,
      _id: updated._id.toString(),
    }
  }

  // 删除记录
  static async delete(id: string): Promise<boolean> {
    await this.ensureConnection()

    const result = await GeoAbbreviationModel.findByIdAndDelete(id)
    return !!result
  }

  // 根据ID获取记录
  static async getById(id: string): Promise<GeoAbbreviation | null> {
    await this.ensureConnection()

    const doc = await GeoAbbreviationModel.findById(id).lean()
    if (!doc) return null

    return {
      ...doc,
      _id: doc._id.toString(),
    }
  }

  // 获取复制量最高的N条
  static async getMostCopied(limit: number): Promise<GeoAbbreviation[]> {
    await this.ensureConnection();
    const results = await GeoAbbreviationModel.find({})
      .sort({ copied_count: -1, created_at: -1 })
      .limit(limit)
      .lean();
    return results.map((doc) => ({
      ...doc,
      _id: doc._id.toString(),
    }));
  }
}

export default connectDB
