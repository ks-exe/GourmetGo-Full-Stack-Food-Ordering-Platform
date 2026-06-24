const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'db');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

function getCollectionPath(modelName) {
  return path.join(DB_DIR, `${modelName.toLowerCase()}s.json`);
}

function readCollection(modelName) {
  const file = getCollectionPath(modelName);
  if (!fs.existsSync(file)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeCollection(modelName, data) {
  const file = getCollectionPath(modelName);
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

class Query {
  constructor(modelName, filter = {}) {
    this.modelName = modelName;
    this.filter = filter;
    this._sort = null;
  }

  sort(sortOptions) {
    this._sort = sortOptions;
    return this;
  }

  async exec() {
    let docs = readCollection(this.modelName);
    
    // Apply filter
    docs = docs.filter(doc => {
      for (const key in this.filter) {
        const filterVal = this.filter[key];
        const docVal = doc[key];
        
        // Handle nested/regex or basic queries if needed
        // For matching exact values or simple filters
        if (docVal !== filterVal) {
          return false;
        }
      }
      return true;
    });

    // Apply sort
    if (this._sort) {
      const keys = Object.keys(this._sort);
      docs.sort((a, b) => {
        for (const key of keys) {
          const order = this._sort[key];
          let valA = a[key];
          let valB = b[key];
          
          if (key === 'createdAt') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
          }
          
          if (valA < valB) return order === -1 ? 1 : -1;
          if (valA > valB) return order === -1 ? -1 : 1;
        }
        return 0;
      });
    }

    const Model = mongoose.models[this.modelName];
    return docs.map(d => new Model(d));
  }

  then(onResolve, onReject) {
    return this.exec().then(onResolve, onReject);
  }
}

const mongoose = {
  models: {},
  connect: async (uri) => {
    console.log('MongoDB Connected (Mock File-Based Database)');
    return true;
  },
  Schema: class Schema {
    constructor(definition, options) {
      this.definition = definition;
      this.options = options;
    }
  },
  model: function(name, schema) {
    class Model {
      constructor(data = {}) {
        Object.assign(this, data);
        if (!this._id) {
          this._id = 'mock_' + Math.random().toString(36).substring(2, 11);
        }
        if (schema.options && schema.options.timestamps) {
          const now = new Date().toISOString();
          if (!this.createdAt) this.createdAt = now;
          this.updatedAt = now;
        }
      }

      async save() {
        const docs = readCollection(name);
        const index = docs.findIndex(d => d._id === this._id);
        const docData = { ...this };
        if (schema.options && schema.options.timestamps) {
          docData.updatedAt = new Date().toISOString();
        }
        if (index >= 0) {
          docs[index] = docData;
        } else {
          docs.push(docData);
        }
        writeCollection(name, docs);
        Object.assign(this, docData);
        return this;
      }

      static find(query = {}) {
        return new Query(name, query);
      }

      static async findOne(query = {}) {
        const docs = await new Query(name, query).exec();
        return docs[0] || null;
      }

      static async findOneAndUpdate(query = {}, update = {}, options = {}) {
        const docs = readCollection(name);
        const docIndex = docs.findIndex(d => {
          for (const key in query) {
            if (d[key] !== query[key]) return false;
          }
          return true;
        });

        if (docIndex >= 0) {
          const doc = docs[docIndex];
          const appliedUpdate = update.$set || update;
          docs[docIndex] = { ...doc, ...appliedUpdate, updatedAt: new Date().toISOString() };
          writeCollection(name, docs);
          return new Model(docs[docIndex]);
        }
        
        if (options.upsert) {
          const newDoc = { ...query, ...update, _id: 'mock_' + Math.random().toString(36).substring(2, 11) };
          const now = new Date().toISOString();
          newDoc.createdAt = now;
          newDoc.updatedAt = now;
          docs.push(newDoc);
          writeCollection(name, docs);
          return new Model(newDoc);
        }
        
        return null;
      }

      static async findByIdAndUpdate(id, update = {}, options = {}) {
        return Model.findOneAndUpdate({ _id: id }, update, options);
      }

      static async findOneAndDelete(query = {}) {
        const docs = readCollection(name);
        const docIndex = docs.findIndex(d => {
          for (const key in query) {
            if (d[key] !== query[key]) return false;
          }
          return true;
        });

        if (docIndex >= 0) {
          const deleted = docs.splice(docIndex, 1)[0];
          writeCollection(name, docs);
          return new Model(deleted);
        }
        return null;
      }

      static async deleteMany(query = {}) {
        const docs = readCollection(name);
        const filteredDocs = docs.filter(d => {
          for (const key in query) {
            if (d[key] !== query[key]) return false;
          }
          return true;
        });
        const remainingDocs = docs.filter(d => !filteredDocs.includes(d));
        writeCollection(name, remainingDocs);
        return { deletedCount: filteredDocs.length };
      }

      static async insertMany(arr) {
        const docs = readCollection(name);
        const newDocs = arr.map(item => {
          const doc = { ...item };
          if (!doc._id) {
            doc._id = 'mock_' + Math.random().toString(36).substring(2, 11);
          }
          const now = new Date().toISOString();
          doc.createdAt = now;
          doc.updatedAt = now;
          return doc;
        });
        docs.push(...newDocs);
        writeCollection(name, docs);
        return newDocs.map(d => new Model(d));
      }
    }

    mongoose.models[name] = Model;
    return Model;
  }
};

mongoose.Schema.Types = {
  ObjectId: String
};

module.exports = mongoose;
