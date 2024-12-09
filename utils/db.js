import mongodb from 'mongodb';

import Collection from 'mongodb/lib/collection';
import envLoader from './env_loader';

/**
 * MongoDB client.
 */
class DBClient {
  /**
   * Creates a new DBClient instance.
   */
  constructor() {
    envLoader();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const dbURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(dbURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  /**
   * Checks if connection is active
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * Gets the number of users
   */
  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  /**
   * Gets the number of files
   */
  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  /**
   * Gets a reference
   */
  async usersCollection() {
    return this.client.db().collection('users');
  }

  /**
   * Gets a reference
   */
  async filesCollection() {
    return this.client.db().collection('files');
  }
}

export const dbClient = new DBClient();
export default dbClient;
